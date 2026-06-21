<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Position;
use App\Models\RecruitmentRequest;
use App\Models\User;
use App\Services\SequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentHiringRequestController extends Controller
{
    public function __construct(private readonly SequenceService $sequences)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user()->load(['department', 'position', 'role']);
        abort_unless($this->canCreate($user), 403);

        $canSeeAll = $this->isHrUser($user)
            || $user->hasRole(['admin', 'general_manager'])
            || $user->hasPermission(['view_users', 'manage_recruitment_requests']);

        $requests = RecruitmentRequest::query()
            ->with(['department:id,name,code', 'position:id,name,code', 'manager:id,name', 'requester:id,name'])
            ->when(! $canSeeAll, fn ($query) => $query->where('department_id', $user->department_id))
            ->latest()
            ->get();

        return Inertia::render('DepartmentHiringRequests/Index', [
            'requests' => $requests,
            'metrics' => [
                'open' => $requests->whereNotIn('status', ['rejected', 'employee_created'])->count(),
                'pendingDepartmentManager' => $requests->where('status', 'pending_department_manager')->count(),
                'pendingHr' => $requests->where('status', 'pending_hr_manager')->count(),
                'pendingGeneralManager' => $requests->where('status', 'pending_general_manager')->count(),
                'readyForHiring' => $requests->where('status', 'ready_for_employee_creation')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
            ],
            'departments' => Department::query()
                ->officialActive()
                ->with(['positions' => fn ($positions) => $positions
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->select('id', 'department_id', 'name', 'code', 'required_headcount')])
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'required_headcount'])
                ->map(function (Department $department) {
                    $department->current_headcount = $this->currentDepartmentHeadcount($department->id);
                    $department->available_vacancies = $this->availableDepartmentVacancies($department->id);
                    $department->positions->transform(function (Position $position) {
                        $position->current_headcount = $this->currentPositionHeadcount($position->id);
                        $position->available_vacancies = $this->availablePositionVacancies($position->id);

                        return $position;
                    });

                    return $department;
                }),
            'canSeeAll' => $canSeeAll,
            'canHire' => $this->canHire($user),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);

        abort_unless($this->canCreate($user), 403);

        $data = $request->validate([
            'request_kind' => ['required', Rule::in(['new_employee', 'headcount_increase'])],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'position_id' => [
                'nullable',
                Rule::exists('positions', 'id')->where(fn ($query) => $query->where('department_id', $request->input('department_id'))),
            ],
            'requested_headcount' => ['required', 'integer', 'min:1', 'max:50'],
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        if (! ($this->isHrUser($user) || $user->hasRole(['admin', 'general_manager'])) && (int) $data['department_id'] !== (int) $user->department_id) {
            abort(403);
        }

        RecruitmentRequest::create([
            'request_number' => $this->nextRequestNumber(),
            'candidate_name' => 'Pending HR Assignment',
            'department_id' => $data['department_id'],
            'position_id' => $data['position_id'] ?? null,
            'manager_id' => $this->departmentManagerId((int) $data['department_id']),
            'requested_by' => $user->id,
            'status' => $this->initialStatusFor($user),
            'request_kind' => $data['request_kind'],
            'requested_headcount' => $data['requested_headcount'],
            'hired_headcount' => 0,
            'employment_type' => 'permanent',
            'reason' => $data['reason'],
        ]);

        return back()->with('success', 'Department hiring request submitted.');
    }

    public function approve(Request $request, RecruitmentRequest $hiringRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);

        abort_unless($this->canApprove($user, $hiringRequest), 403);

        if ($hiringRequest->status === 'pending_department_manager') {
            $hiringRequest->update([
                'status' => 'pending_hr_manager',
                'department_manager_approved_by' => $user->id,
                'department_manager_approved_at' => now(),
            ]);
        } elseif ($hiringRequest->status === 'pending_hr_manager') {
            $hiringRequest->update([
                'status' => 'pending_general_manager',
                'hr_approved_by' => $user->id,
                'hr_approved_at' => now(),
            ]);
        } elseif ($hiringRequest->status === 'pending_general_manager') {
            DB::transaction(function () use ($hiringRequest, $user): void {
                $hiringRequest->update([
                    'status' => 'ready_for_employee_creation',
                    'general_manager_approved_by' => $user->id,
                    'general_manager_approved_at' => now(),
                ]);

                if ($hiringRequest->request_kind === 'headcount_increase') {
                    $this->applyApprovedHeadcountIncrease($hiringRequest);
                }
            });
        }

        return back()->with('success', 'Hiring request approved.');
    }

    public function reject(Request $request, RecruitmentRequest $hiringRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);

        abort_unless($this->canReject($user, $hiringRequest), 403);

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        $hiringRequest->update([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'],
        ]);

        return back()->with('success', 'Hiring request rejected.');
    }

    public function hire(Request $request, RecruitmentRequest $hiringRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'role']);

        abort_unless($this->canHire($user), 403);
        abort_unless($hiringRequest->status === 'ready_for_employee_creation', 422);

        if ((int) $hiringRequest->hired_headcount >= (int) $hiringRequest->requested_headcount) {
            return back()->with('error', 'The approved headcount for this request is already fully hired.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:users,national_id'],
            'education_qualification' => ['nullable', 'string', 'max:255'],
            'hired_at' => ['nullable', 'date'],
            'employment_type' => ['required', Rule::in(['permanent', 'part_time'])],
            'contract_start_date' => ['nullable', 'required_if:employment_type,part_time', 'date'],
            'contract_duration_months' => ['nullable', 'required_if:employment_type,part_time', 'integer', 'min:1', 'max:60'],
            'contract_end_date' => ['nullable', 'required_if:employment_type,part_time', 'date', 'after_or_equal:contract_start_date'],
            'contract_expiry_notice_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
        ]);

        $data = $this->normalizeContractData($data);

        DB::transaction(function () use ($hiringRequest, $data): void {
            User::create([
                'employee_code' => $this->sequences->next('employees')['code'],
                'name' => $data['name'],
                'email' => null,
                'phone' => $data['phone'] ?? null,
                'national_id' => $data['national_id'] ?? null,
                'education_qualification' => $data['education_qualification'] ?? null,
                'hired_at' => $data['hired_at'] ?? null,
                'employment_type' => $data['employment_type'],
                'contract_start_date' => $data['contract_start_date'] ?? null,
                'contract_end_date' => $data['contract_end_date'] ?? null,
                'contract_duration_months' => $data['contract_duration_months'] ?? 6,
                'contract_expiry_notice_days' => $data['contract_expiry_notice_days'] ?? 180,
                'contract_expiry_notified_at' => null,
                'basic_salary' => $data['basic_salary'] ?? null,
                'status' => 'active',
                'login_enabled' => false,
                'password' => null,
                'role_id' => null,
                'department_id' => $hiringRequest->department_id,
                'position_id' => $hiringRequest->position_id,
                'manager_id' => $hiringRequest->manager_id,
            ]);

            $hiringRequest->increment('hired_headcount');

            if ((int) $hiringRequest->fresh()->hired_headcount >= (int) $hiringRequest->requested_headcount) {
                $hiringRequest->update(['status' => 'employee_created']);
            }
        });

        return back()->with('success', 'Employee hired and coded from the approved request.');
    }

    private function normalizeContractData(array $data): array
    {
        if (($data['employment_type'] ?? 'permanent') === 'permanent') {
            $data['contract_start_date'] = null;
            $data['contract_end_date'] = null;
            $data['contract_duration_months'] = 6;
            $data['contract_expiry_notice_days'] = 180;

            return $data;
        }

        $data['contract_duration_months'] = max(1, min(60, (int) ($data['contract_duration_months'] ?? 6) ?: 6));
        $data['contract_expiry_notice_days'] = max(1, min(365, (int) ($data['contract_expiry_notice_days'] ?? 180) ?: 180));

        if (filled($data['contract_start_date'] ?? null) && blank($data['contract_end_date'] ?? null)) {
            $data['contract_end_date'] = Carbon::parse($data['contract_start_date'])
                ->addMonthsNoOverflow($data['contract_duration_months'])
                ->toDateString();
        }

        return $data;
    }

    private function canCreate(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission(['view_recruitment_onboarding', 'create_recruitment_request', 'manage_recruitment_requests'])
            || $this->isHrUser($user)
            || $this->isDepartmentManager($user)
            || $this->isDepartmentOfficer($user);
    }

    private function canHire(User $user): bool
    {
        return $this->isHrUser($user)
            || $user->hasRole(['admin', 'general_manager'])
            || $user->hasPermission('create_user');
    }

    private function canApprove(User $user, RecruitmentRequest $request): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return match ($request->status) {
            'pending_department_manager' => $this->isDepartmentManager($user) && (int) $user->department_id === (int) $request->department_id,
            'pending_hr_manager' => $this->isHrUser($user),
            'pending_general_manager' => $user->hasRole('general_manager'),
            default => false,
        };
    }

    private function canReject(User $user, RecruitmentRequest $request): bool
    {
        return $this->canApprove($user, $request);
    }

    private function initialStatusFor(User $user): string
    {
        if ($this->isHrUser($user)) {
            return 'pending_general_manager';
        }

        if ($this->isDepartmentManager($user)) {
            return 'pending_hr_manager';
        }

        return 'pending_department_manager';
    }

    private function isHrUser(User $user): bool
    {
        return $user->department?->code === 'hr'
            || $user->hasRole('hr')
            || $user->hasPermission('manage_recruitment_requests')
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function isDepartmentManager(User $user): bool
    {
        return in_array($user->position?->code, [
            'general_manager',
            'department_manager',
            'sales_manager',
            'planning_manager',
            'section_head',
            'accounting_manager',
            'purchasing_manager',
            'hr_manager',
        ], true) || $user->hasRole(['admin', 'general_manager']);
    }

    private function isDepartmentOfficer(User $user): bool
    {
        return in_array($user->position?->code, [
            'sales_officer',
            'department_officer',
            'planning_officer',
            'assistant_section_head',
            'purchasing_officer',
            'hr_officer',
            'admin_assistant',
        ], true) || $user->hasRole(['admin', 'general_manager']);
    }

    private function currentDepartmentHeadcount(int $departmentId): int
    {
        return User::query()
            ->where('department_id', $departmentId)
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
    }

    private function currentPositionHeadcount(int $positionId): int
    {
        return User::query()
            ->where('position_id', $positionId)
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
    }

    private function availableDepartmentVacancies(int $departmentId): int
    {
        $department = Department::find($departmentId);

        if (! $department) {
            return 0;
        }

        return max(0, (int) $department->required_headcount - $this->currentDepartmentHeadcount($departmentId));
    }

    private function availablePositionVacancies(int $positionId): int
    {
        $position = Position::find($positionId);

        if (! $position) {
            return 0;
        }

        return max(0, (int) $position->required_headcount - $this->currentPositionHeadcount($positionId));
    }

    private function departmentManagerId(int $departmentId): ?int
    {
        return Department::query()->whereKey($departmentId)->value('direct_manager_id');
    }

    private function applyApprovedHeadcountIncrease(RecruitmentRequest $request): void
    {
        $increase = max(1, (int) ($request->requested_headcount ?? 1));

        Department::query()
            ->whereKey($request->department_id)
            ->increment('required_headcount', $increase);

        if (! $request->position_id) {
            return;
        }

        $position = Position::query()
            ->with('departmentPosition')
            ->whereKey($request->position_id)
            ->first();

        if (! $position) {
            return;
        }

        $position->increment('required_headcount', $increase);
        $position->departmentPosition?->increment('approved_headcount', $increase);
    }

    private function nextRequestNumber(): string
    {
        return 'REC-'.now()->format('Ymd').'-'.str_pad((string) (RecruitmentRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }
}
