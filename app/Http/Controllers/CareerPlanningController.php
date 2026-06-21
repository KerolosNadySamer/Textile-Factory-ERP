<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\EmployeePromotionRequest;
use App\Models\Position;
use App\Models\RecruitmentRequest;
use App\Models\SuccessionPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CareerPlanningController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($this->canView($request->user()), 403);

        return Inertia::render('CareerPlanning/Index', [
            'employees' => $this->employeeQuery()
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->orderBy('name')
                ->get(['id', 'employee_code', 'name', 'department_id', 'position_id']),
            'departments' => Department::query()
                ->officialActive()
                ->with(['positions' => fn ($positions) => $positions
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->select('id', 'department_id', 'name', 'code', 'required_headcount')])
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'leadershipPositions' => Position::query()
                ->with('department:id,name,code')
                ->where(function ($query) {
                    $query
                        ->where('code', 'like', '%\_manager')
                        ->orWhere('code', 'like', '%\_officer')
                        ->orWhere('name', 'like', '%مدير%')
                        ->orWhere('name', 'like', '%مسؤول%');
                })
                ->orderBy('name')
                ->get(['id', 'department_id', 'name', 'code']),
            'promotionRequests' => EmployeePromotionRequest::query()
                ->with(['employee:id,employee_code,name', 'fromDepartment:id,name', 'fromPosition:id,name', 'toDepartment:id,name', 'toPosition:id,name', 'requester:id,name'])
                ->latest()
                ->limit(80)
                ->get()
                ->map(fn (EmployeePromotionRequest $request) => $this->promotionRequestRow($request)),
            'successionPlans' => SuccessionPlan::query()
                ->with(['department:id,name', 'position:id,name', 'incumbent:id,employee_code,name', 'successor:id,employee_code,name', 'creator:id,name'])
                ->orderBy('position_id')
                ->orderBy('candidate_order')
                ->orderByDesc('readiness_percent')
                ->limit(80)
                ->get(),
            'successionSuggestions' => $this->successionSuggestions(),
            'metrics' => [
                'openPromotions' => EmployeePromotionRequest::query()->whereNotIn('status', ['executed', 'rejected'])->count(),
                'activeSuccessionPlans' => SuccessionPlan::query()->where('status', 'active')->count(),
                'readyNowSuccessors' => SuccessionPlan::query()
                    ->where('status', 'active')
                    ->where(function ($query) {
                        $query->where('readiness', 'ready_now')->orWhere('readiness_percent', '>=', 90);
                    })
                    ->count(),
            ],
        ]);
    }

    public function storePromotion(Request $request): RedirectResponse
    {
        abort_unless($this->canView($request->user()), 403);

        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'to_position_id' => ['required', 'integer', 'exists:positions,id'],
            'promotion_type' => ['required', Rule::in(['same_department', 'other_department', 'higher_position'])],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $employee = $this->employeeQuery()->findOrFail($data['employee_id']);
        $targetPosition = Position::query()->with('department')->findOrFail($data['to_position_id']);

        if ($this->availableVacancies($targetPosition->id) < 1) {
            return back()->withErrors(['to_position_id' => 'No approved vacancy is available for the target position.']);
        }

        EmployeePromotionRequest::create([
            'request_number' => $this->nextPromotionNumber(),
            'employee_id' => $employee->id,
            'from_department_id' => $employee->department_id,
            'from_position_id' => $employee->position_id,
            'to_department_id' => $targetPosition->department_id,
            'to_position_id' => $targetPosition->id,
            'requested_by' => $request->user()->id,
            'promotion_type' => $data['promotion_type'],
            'status' => 'pending_hr',
            'reason' => $data['reason'] ?? null,
        ]);

        return back()->with('success', 'Promotion request created.');
    }

    public function approvePromotion(Request $request, EmployeePromotionRequest $promotionRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);
        abort_unless($this->canApprovePromotion($user, $promotionRequest), 403);

        if ($promotionRequest->status === 'pending_hr') {
            $promotionRequest->update([
                'status' => 'pending_general_manager',
                'hr_approved_by' => $user->id,
                'hr_approved_at' => now(),
            ]);

            return back()->with('success', 'HR approval recorded.');
        }

        $fromDepartmentId = $promotionRequest->from_department_id;
        $fromPositionId = $promotionRequest->from_position_id;

        $promotionRequest->employee()->update([
            'department_id' => $promotionRequest->to_department_id,
            'position_id' => $promotionRequest->to_position_id,
        ]);

        $this->ensureVacancyRecruitmentRequest(
            departmentId: $fromDepartmentId,
            positionId: $fromPositionId,
            requestedBy: $user->id,
            reason: "Auto-created after promotion {$promotionRequest->request_number} left a vacant position.",
        );

        $promotionRequest->update([
            'status' => 'executed',
            'general_manager_approved_by' => $user->id,
            'general_manager_approved_at' => now(),
            'executed_by' => $user->id,
            'executed_at' => now(),
        ]);

        return back()->with('success', 'Promotion executed.');
    }

    public function rejectPromotion(Request $request, EmployeePromotionRequest $promotionRequest): RedirectResponse
    {
        abort_unless($this->canView($request->user()), 403);

        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $promotionRequest->update([
            'status' => 'rejected',
            'rejected_by' => $request->user()->id,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return back()->with('success', 'Promotion request rejected.');
    }

    public function storeSuccession(Request $request): RedirectResponse
    {
        abort_unless($this->canView($request->user()), 403);

        $data = $request->validate([
            'position_id' => ['required', 'integer', 'exists:positions,id'],
            'incumbent_id' => ['nullable', 'integer', 'exists:users,id'],
            'successor_id' => ['required', 'integer', 'exists:users,id'],
            'candidate_order' => ['required', 'integer', Rule::in([1, 2, 3])],
            'readiness' => ['required', Rule::in(['ready_now', 'ready_3_months', 'ready_6_months', 'needs_development'])],
            'readiness_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'risk_level' => ['required', Rule::in(['low', 'medium', 'high'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $position = Position::query()->findOrFail($data['position_id']);

        SuccessionPlan::updateOrCreate(
            [
                'position_id' => $position->id,
                'successor_id' => $data['successor_id'],
            ],
            [
                'department_id' => $position->department_id,
                'incumbent_id' => $data['incumbent_id'] ?? null,
                'candidate_order' => $data['candidate_order'],
                'readiness' => $data['readiness'],
                'readiness_percent' => $data['readiness_percent'],
                'risk_level' => $data['risk_level'],
                'status' => 'active',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ],
        );

        return back()->with('success', 'Succession plan saved.');
    }

    public function updateSuccession(Request $request, SuccessionPlan $successionPlan): RedirectResponse
    {
        abort_unless($this->canView($request->user()), 403);

        $data = $request->validate([
            'candidate_order' => ['required', 'integer', Rule::in([1, 2, 3])],
            'readiness' => ['required', Rule::in(['ready_now', 'ready_3_months', 'ready_6_months', 'needs_development'])],
            'readiness_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'risk_level' => ['required', Rule::in(['low', 'medium', 'high'])],
            'status' => ['required', Rule::in(['active', 'inactive', 'used'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $successionPlan->update($data);

        return back()->with('success', 'Succession plan updated.');
    }

    private function canView(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission('view_users')
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function canApprovePromotion(User $user, EmployeePromotionRequest $promotionRequest): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return match ($promotionRequest->status) {
            'pending_hr' => $this->isHrUser($user),
            'pending_general_manager' => $user->hasRole('general_manager'),
            default => false,
        };
    }

    private function isHrUser(User $user): bool
    {
        return $user->department?->code === 'hr'
            || $user->hasRole('hr')
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function employeeQuery()
    {
        return User::query()->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'));
    }

    private function promotionRequestRow(EmployeePromotionRequest $request): array
    {
        $row = $request->toArray();
        $row['source_impact'] = $this->positionImpact($request->from_position_id);
        $row['suggested_successor'] = $this->bestSuccessorFor($request->from_position_id);

        return $row;
    }

    private function successionSuggestions()
    {
        return Position::query()
            ->with([
                'department:id,name,code',
                'users' => fn ($users) => $users
                    ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                    ->select('id', 'employee_code', 'name', 'department_id', 'position_id'),
                'users.department:id,name,code',
                'users.position:id,name,code',
                'successionPlans' => fn ($query) => $query
                    ->with(['successor:id,employee_code,name,department_id,position_id', 'successor.department:id,name,code', 'successor.position:id,name,code'])
                    ->where('status', 'active')
                    ->orderBy('candidate_order')
                    ->orderByDesc('readiness_percent'),
            ])
            ->where(function ($query) {
                $query
                    ->where('code', 'like', '%\_manager')
                    ->orWhere('code', 'like', '%\_officer')
                    ->orWhere('name', 'like', '%مدير%')
                    ->orWhere('name', 'like', '%مسؤول%');
            })
            ->orderBy('name')
            ->get(['id', 'department_id', 'name', 'code'])
            ->map(fn (Position $position) => [
                'id' => $position->id,
                'name' => $position->name,
                'code' => $position->code,
                'department' => $position->department,
                'incumbent' => $position->users->first(),
                'candidates' => $position->successionPlans->take(3)->values(),
            ])
            ->values();
    }

    private function positionImpact(?int $positionId): ?array
    {
        if (! $positionId) {
            return null;
        }

        $position = Position::query()
            ->withCount(['users as users_count' => fn ($users) => $users->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))])
            ->find($positionId);

        if (! $position) {
            return null;
        }

        $required = max(0, (int) ($position->required_headcount ?? 0));
        $occupied = (int) $position->users_count;

        return [
            'required' => $required,
            'occupied' => $occupied,
            'vacant' => max(0, $required - $occupied),
        ];
    }

    private function bestSuccessorFor(?int $positionId): ?array
    {
        if (! $positionId) {
            return null;
        }

        $plan = SuccessionPlan::query()
            ->with(['successor:id,employee_code,name'])
            ->where('position_id', $positionId)
            ->where('status', 'active')
            ->orderBy('candidate_order')
            ->orderByDesc('readiness_percent')
            ->first();

        return $plan ? [
            'name' => $plan->successor?->name,
            'employee_code' => $plan->successor?->employee_code,
            'readiness_percent' => $plan->readiness_percent,
            'candidate_order' => $plan->candidate_order,
        ] : null;
    }

    private function ensureVacancyRecruitmentRequest(?int $departmentId, ?int $positionId, int $requestedBy, string $reason): void
    {
        if (! $departmentId || ! $positionId) {
            return;
        }

        $impact = $this->positionImpact($positionId);

        if (! $impact || $impact['vacant'] <= 0) {
            return;
        }

        $hasOpenRequest = RecruitmentRequest::query()
            ->where('department_id', $departmentId)
            ->where('position_id', $positionId)
            ->whereNotIn('status', ['rejected', 'cancelled', 'hired'])
            ->exists();

        if ($hasOpenRequest) {
            return;
        }

        RecruitmentRequest::create([
            'request_number' => $this->nextRecruitmentNumber(),
            'candidate_name' => 'Pending Candidate',
            'department_id' => $departmentId,
            'position_id' => $positionId,
            'requested_by' => $requestedBy,
            'status' => 'pending_department_manager',
            'employment_type' => 'replacement',
            'reason' => $reason,
        ]);
    }

    private function nextRecruitmentNumber(): string
    {
        return 'REC-'.now()->format('Ymd').'-'.str_pad((string) (RecruitmentRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function nextPromotionNumber(): string
    {
        return 'PR-'.now()->format('Ymd').'-'.str_pad((string) (EmployeePromotionRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function availableVacancies(int $positionId): int
    {
        $position = Position::query()->find($positionId);

        if (! $position) {
            return 0;
        }

        $approved = max(0, (int) $position->required_headcount);
        $current = $this->employeeQuery()->where('position_id', $positionId)->count();
        $openRequests = RecruitmentRequest::query()
            ->where('position_id', $positionId)
            ->whereNotIn('status', ['rejected', 'cancelled', 'hired', 'employee_created'])
            ->count();

        return max(0, $approved - $current - $openRequests);
    }
}
