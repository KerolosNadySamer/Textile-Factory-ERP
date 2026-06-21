<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\User;
use App\Services\GovernanceChangeRequestService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ChangeRequestController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly GovernanceChangeRequestService $governanceChanges,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user()->load(['department', 'position', 'role']);

        return Inertia::render('ChangeRequests/Index', [
            'changeRequests' => ChangeRequest::query()
                ->with(['requester:id,name,department_id,position_id', 'requester.department:id,name,code', 'department:id,name,code', 'officerApprover:id,name', 'managerApprover:id,name', 'rejecter:id,name', 'executor:id,name'])
                ->where(function ($query) use ($user) {
                    $query
                        ->where('requested_by', $user->id)
                        ->orWhere(fn ($approvals) => $approvals
                            ->where('department_id', $user->department_id)
                            ->whereIn('status', ['pending_department_officer', 'pending_department_manager']))
                        ->orWhere(fn ($gm) => $gm
                            ->where('status', 'pending_general_manager')
                            ->whereRaw('1 = ?', [$user->hasRole(['admin', 'general_manager']) ? 1 : 0]))
                        ->orWhere(fn ($admin) => $admin->whereRaw('1 = ?', [$user->hasRole('admin') ? 1 : 0]));
                })
                ->latest()
                ->get(),
            'canApprove' => [
                'officer' => $this->canApproveAsDepartmentOfficer($user),
                'manager' => $this->canApproveAsDepartmentManager($user),
                'general_manager' => $this->canApproveAsGeneralManager($user),
            ],
        ]);
    }

    public function storePasswordRequest(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $user = $request->user()->load(['department', 'role']);

        $changeRequest = ChangeRequest::create([
            'request_number' => $this->nextRequestNumber(),
            'type' => 'password_reset',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'department_id' => $user->department_id,
            'requested_by' => $user->id,
            'risk_level' => 'high',
            'status' => $this->initialStatusFor($user),
            'reason' => $data['reason'],
            'old_values' => ['password' => 'hidden'],
            'new_values' => ['password' => 'hidden'],
            'payload' => ['password_hash' => Hash::make($data['password'])],
        ]);

        if ($this->shouldExecuteImmediately($user)) {
            $this->execute($changeRequest, $user);

            return back()->with('success', 'Password changed.');
        }

        $recipients = $changeRequest->status === 'pending_department_manager'
            ? $this->departmentManagerRecipients($user)
            : $this->departmentOfficerRecipients($user);

        $this->notifications->sendToUsers(
            $recipients,
            "Password change request needs approval {$changeRequest->request_number}",
            "{$user->name} requested a password change. Reason: {$data['reason']}",
            route('change-requests.index'),
            $user,
        );

        return back()->with('success', 'Password change request sent for approval.');
    }

    public function approve(Request $request, ChangeRequest $changeRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);

        if ($changeRequest->status === 'pending_department_officer') {
            abort_unless($this->canApproveAsDepartmentOfficer($user) && $this->canActOnDepartment($user, $changeRequest), 403);

            $changeRequest->update([
                'status' => 'pending_department_manager',
                'department_officer_approved_by' => $user->id,
                'department_officer_approved_at' => now(),
            ]);

            if ($changeRequest->risk_level === 'low' && ! $this->isHrRequest($changeRequest)) {
                $this->execute($changeRequest->fresh(), $user);

                return back()->with('success', 'Low risk request approved and executed.');
            }

            $changeRequest->load('requester');
            $this->notifications->sendToUsers(
                $this->departmentManagerRecipients($changeRequest->requester),
                "Change request needs department manager approval {$changeRequest->request_number}",
                "The request was approved by the department officer and is waiting for department manager approval.",
                route('change-requests.index'),
                $user,
            );

            return back()->with('success', 'Request approved by department officer.');
        }

        if ($changeRequest->status === 'pending_department_manager') {
            abort_unless($this->canApproveAsDepartmentManager($user) && $this->canActOnDepartment($user, $changeRequest), 403);

            if ($this->isHrRequest($changeRequest)) {
                $changeRequest->update([
                    'status' => 'pending_general_manager',
                    'department_manager_approved_by' => $user->id,
                    'department_manager_approved_at' => now(),
                ]);

                $this->notifications->sendToUsers(
                    $this->generalManagerRecipients(),
                    "HR change request needs general manager approval {$changeRequest->request_number}",
                    "The HR manager approved the request and it is waiting for general manager approval.",
                    route('change-requests.index'),
                    $user,
                );

                return back()->with('success', 'Request approved by HR manager and sent to general manager.');
            }

            $this->execute($changeRequest, $user);

            return back()->with('success', 'Request approved and executed.');
        }

        abort_unless($changeRequest->status === 'pending_general_manager' && $this->canApproveAsGeneralManager($user), 403);

        $this->execute($changeRequest, $user);

        return back()->with('success', 'Request approved by general manager and executed.');
    }

    public function reject(Request $request, ChangeRequest $changeRequest): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $user = $request->user()->load(['department', 'position', 'role']);
        $canReject = match ($changeRequest->status) {
            'pending_department_officer' => $this->canApproveAsDepartmentOfficer($user) && $this->canActOnDepartment($user, $changeRequest),
            'pending_department_manager' => $this->canApproveAsDepartmentManager($user) && $this->canActOnDepartment($user, $changeRequest),
            'pending_general_manager' => $this->canApproveAsGeneralManager($user),
            default => false,
        };

        abort_unless($canReject, 403);

        $changeRequest->update([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'],
        ]);

        $changeRequest->load('requester');
        $this->notifications->sendToUsers(
            new Collection([$changeRequest->requester]),
            "Change request rejected {$changeRequest->request_number}",
            "Rejection reason: {$data['rejection_reason']}",
            route('change-requests.index'),
            $user,
        );

        return back()->with('success', 'Request rejected.');
    }

    private function execute(ChangeRequest $changeRequest, User $user): void
    {
        if ($changeRequest->type === 'password_reset') {
            User::query()
                ->where('id', $changeRequest->subject_id)
                ->update(['password' => $changeRequest->payload['password_hash']]);

            $changeRequest->update([
                'status' => 'executed',
                'department_manager_approved_by' => $changeRequest->department_manager_approved_by ?: $user->id,
                'department_manager_approved_at' => $changeRequest->department_manager_approved_at ?: now(),
                'executed_by' => $user->id,
                'executed_at' => now(),
            ]);
        } else {
            $this->governanceChanges->execute($changeRequest, $user);
        }

        $changeRequest->load('requester');
        $this->notifications->sendToUsers(
            new Collection([$changeRequest->requester]),
            "Change request executed {$changeRequest->request_number}",
            "The request was approved and executed.",
            route('change-requests.index'),
            $user,
        );
    }

    private function nextRequestNumber(): string
    {
        return 'CR-'.now()->format('Ymd').'-'.str_pad((string) (ChangeRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function initialStatusFor(User $user): string
    {
        return $this->isHrUser($user)
            ? 'pending_department_manager'
            : 'pending_department_officer';
    }

    private function shouldExecuteImmediately(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager']);
    }

    private function canApproveAsDepartmentOfficer(User $user): bool
    {
        return $user->hasRole('admin') || str_ends_with((string) $user->position?->code, '_officer');
    }

    private function canApproveAsDepartmentManager(User $user): bool
    {
        return $user->hasRole('admin') || str_ends_with((string) $user->position?->code, '_manager');
    }

    private function canApproveAsGeneralManager(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager']);
    }

    private function canActOnDepartment(User $user, ChangeRequest $changeRequest): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return (int) $user->department_id === (int) $changeRequest->department_id;
    }

    private function isHrRequest(ChangeRequest $changeRequest): bool
    {
        $changeRequest->loadMissing('department');

        return $changeRequest->department?->code === 'hr';
    }

    private function isHrUser(User $user): bool
    {
        return $user->department?->code === 'hr' || $user->hasRole('hr');
    }

    private function departmentOfficerRecipients(User $requester): Collection
    {
        return User::query()
            ->where('status', 'active')
            ->where('department_id', $requester->department_id)
            ->whereHas('position', fn ($position) => $position->where('code', 'like', '%\_officer'))
            ->get();
    }

    private function departmentManagerRecipients(User $requester): Collection
    {
        return User::query()
            ->where('status', 'active')
            ->where('department_id', $requester->department_id)
            ->whereHas('position', fn ($position) => $position->where('code', 'like', '%\_manager'))
            ->get();
    }

    private function generalManagerRecipients(): Collection
    {
        return User::query()
            ->where('status', 'active')
            ->whereHas('role', fn ($role) => $role->where('slug', 'general_manager'))
            ->get();
    }
}
