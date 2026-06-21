<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\EmployeeTransferRequest;
use App\Models\Position;
use App\Models\RecruitmentRequest;
use App\Models\SuccessionPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeCodingCoverageController extends Controller
{
    private const NON_WORKER_DEPARTMENT_CODES = ['top_management', 'management', 'hr', 'accounting', 'finance', 'sales', 'purchasing'];
    public function __invoke(Request $request): Response
    {
        abort_unless($this->canView($request->user()), 403);

        $departments = Department::query()
            ->officialActive()
            ->with([
                'positions' => fn ($query) => $query
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->withCount(['users as employees_count' => fn ($users) => $this->employeeUsers($users)])
                    ->orderBy('name'),
                'users' => fn ($query) => $this->employeeUsers($query)
                    ->select('id', 'employee_code', 'name', 'status', 'login_enabled', 'department_id', 'position_id', 'manager_id'),
                'users.position:id,name,code',
                'users.manager:id,name',
            ])
            ->orderBy('id')
            ->get()
            ->map(fn (Department $department) => $this->departmentCoverage($department))
            ->values();

        $transferRequests = $this->transferRequestsQuery()
            ->with(['employee:id,employee_code,name', 'fromDepartment:id,name,code', 'toDepartment:id,name,code', 'fromPosition:id,name', 'toPosition:id,name', 'requester:id,name'])
            ->latest()
            ->limit(80)
            ->get()
            ->map(fn (EmployeeTransferRequest $request) => $this->transferRequestRow($request));

        return Inertia::render('EmployeeCodingCoverage/Index', [
            'metrics' => [
                'departments' => $departments->count(),
                'emptyDepartments' => $departments->where('totalEmployees', 0)->count(),
                'totalEmployees' => $this->employeeQuery()->count(),
                'requiredHeadcount' => $departments->sum('requiredHeadcount'),
                'occupiedHeadcount' => $departments->sum('occupiedHeadcount'),
                'vacantHeadcount' => $departments->sum('vacantHeadcount'),
                'surplusHeadcount' => $departments->sum('surplusHeadcount'),
                'codedEmployees' => $this->employeeQuery()->whereNotNull('employee_code')->where('employee_code', '!=', '')->count(),
                'uncodedEmployees' => $this->employeeQuery()->where(fn ($query) => $query->whereNull('employee_code')->orWhere('employee_code', ''))->count(),
                'withoutDepartment' => $this->employeeQuery()->whereNull('department_id')->count(),
                'withoutPosition' => $this->employeeQuery()->whereNull('position_id')->count(),
                'invalidWorkerCoding' => $departments->sum('invalidWorkerCodingCount'),
                'openTransferRequests' => $transferRequests->whereNotIn('status', ['executed', 'rejected'])->count(),
            ],
            'departments' => $departments,
            'emptyDepartments' => $departments->where('totalEmployees', 0)->values(),
            'allDepartments' => Department::query()
                ->officialActive()
                ->with(['positions' => fn ($positions) => $positions
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->select('id', 'department_id', 'name', 'code', 'required_headcount')])
                ->orderBy('id')
                ->get(['id', 'name', 'code', 'required_headcount'])
                ->map(function (Department $department) {
                    $department->positions->transform(function (Position $position) {
                        $position->available_vacancies = $this->availableVacancies($position->id);

                        return $position;
                    });

                    return $department;
                }),
            'transferEmployees' => $this->employeeQuery()
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->orderBy('name')
                ->get(['id', 'employee_code', 'name', 'department_id', 'position_id']),
            'transferRequests' => $transferRequests,
            'employeesNeedingCoding' => $this->employeesNeedingCoding(),
        ]);
    }

    public function transfer(Request $request): RedirectResponse
    {
        abort_unless($this->canView($request->user()), 403);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'position_id' => ['nullable', 'integer', 'exists:positions,id'],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $employee = $this->employeeQuery()->findOrFail($data['user_id']);
        $department = Department::findOrFail($data['department_id']);
        $position = filled($data['position_id']) ? Position::findOrFail($data['position_id']) : null;

        if ($position && (int) $position->department_id !== (int) $department->id) {
            return back()->withErrors(['position_id' => 'Selected position does not belong to the target department.']);
        }

        if ($position && $this->availableVacancies($position->id) < 1) {
            return back()->withErrors(['position_id' => 'No approved vacancy is available for the target position.']);
        }

        if (in_array($department->code, self::NON_WORKER_DEPARTMENT_CODES, true) && $position && $this->isWorkerPosition($position)) {
            return back()->withErrors(['position_id' => 'هذا القسم إداري ولا يستخدم عمال. اختر وظيفة إدارية أو موظف مناسب.']);
        }

        EmployeeTransferRequest::create([
            'request_number' => $this->nextTransferNumber(),
            'employee_id' => $employee->id,
            'from_department_id' => $employee->department_id,
            'from_position_id' => $employee->position_id,
            'to_department_id' => $department->id,
            'to_position_id' => $position?->id,
            'requested_by' => $request->user()->id,
            'status' => 'pending_current_manager',
            'reason' => $data['reason'] ?? null,
        ]);

        return back()->with('success', 'Employee transfer request sent for approval.');
    }

    public function approveTransfer(Request $request, EmployeeTransferRequest $transferRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);
        abort_unless($this->canApproveTransfer($user, $transferRequest), 403);

        if ($transferRequest->status === 'pending_current_manager') {
            $transferRequest->update([
                'status' => 'pending_new_manager',
                'current_manager_approved_by' => $user->id,
                'current_manager_approved_at' => now(),
            ]);

            return back()->with('success', 'Current department approval recorded.');
        }

        if ($transferRequest->status === 'pending_new_manager') {
            $transferRequest->update([
                'status' => 'pending_hr',
                'new_manager_approved_by' => $user->id,
                'new_manager_approved_at' => now(),
            ]);

            return back()->with('success', 'New department approval recorded.');
        }

        $fromDepartmentId = $transferRequest->from_department_id;
        $fromPositionId = $transferRequest->from_position_id;

        $transferRequest->employee()->update([
            'department_id' => $transferRequest->to_department_id,
            'position_id' => $transferRequest->to_position_id,
        ]);

        $this->ensureVacancyRecruitmentRequest(
            departmentId: $fromDepartmentId,
            positionId: $fromPositionId,
            requestedBy: $user->id,
            reason: "Auto-created after transfer {$transferRequest->request_number} left a vacant position.",
        );

        $transferRequest->update([
            'status' => 'executed',
            'hr_approved_by' => $user->id,
            'hr_approved_at' => now(),
            'executed_by' => $user->id,
            'executed_at' => now(),
        ]);

        return back()->with('success', 'Employee transfer executed.');
    }

    public function rejectTransfer(Request $request, EmployeeTransferRequest $transferRequest): RedirectResponse
    {
        $user = $request->user()->load(['department', 'position', 'role']);
        abort_unless($this->canApproveTransfer($user, $transferRequest), 403);

        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $transferRequest->update([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return back()->with('success', 'Employee transfer request rejected.');
    }

    private function departmentCoverage(Department $department): array
    {
        $users = $department->users;
        $workerPolicy = $this->workerPolicyFor($department);
        $workerCount = $users->filter(fn (User $user) => $this->isWorker($user))->count();
        $positions = $department->positions->map(fn (Position $position) => $this->positionCoverage($position, $workerPolicy));
        $positionsRequiredHeadcount = $positions->where('optional', false)->sum('requiredHeadcount');
        $departmentRequiredHeadcount = max(0, (int) ($department->required_headcount ?? 0));
        $generalRequiredHeadcount = max(0, $departmentRequiredHeadcount - $positionsRequiredHeadcount);
        $generalOccupiedHeadcount = max(0, $users->count() - $positions->sum('occupiedHeadcount'));

        if ($generalRequiredHeadcount > 0) {
            $positions->push([
                'id' => 'department-general-'.$department->id,
                'name' => 'احتياج عام للقسم',
                'code' => 'department_general',
                'requiredHeadcount' => $generalRequiredHeadcount,
                'occupiedHeadcount' => min($generalOccupiedHeadcount, $generalRequiredHeadcount),
                'vacantHeadcount' => max(0, $generalRequiredHeadcount - $generalOccupiedHeadcount),
                'surplusHeadcount' => max(0, $generalOccupiedHeadcount - $generalRequiredHeadcount),
                'coveragePercent' => $generalRequiredHeadcount > 0 ? round(min($generalOccupiedHeadcount, $generalRequiredHeadcount) / $generalRequiredHeadcount * 100) : 0,
                'optional' => false,
            ]);
        }

        $missingPositions = $positions->filter(fn (array $position) => $position['vacantHeadcount'] > 0 && ! $position['optional'])->values();
        $invalidWorkerCoding = $workerPolicy === 'none'
            ? $users->filter(fn (User $user) => $this->isWorker($user))->values()
            : collect();
        $requiredHeadcount = max($departmentRequiredHeadcount, $positions->where('optional', false)->sum('requiredHeadcount'));
        $occupiedHeadcount = min($users->count(), $requiredHeadcount);
        $vacantHeadcount = max(0, $requiredHeadcount - $occupiedHeadcount);
        $surplusHeadcount = max(0, $users->count() - $requiredHeadcount);

        return [
            'id' => $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'departmentRequiredHeadcount' => $department->required_headcount,
            'workerPolicy' => $workerPolicy,
            'totalEmployees' => $users->count(),
            'activeEmployees' => $users->where('status', 'active')->count(),
            'workers' => $workerCount,
            'staff' => $users->count() - $workerCount,
            'codedEmployees' => $users->filter(fn (User $user) => filled($user->employee_code))->count(),
            'uncodedEmployees' => $users->filter(fn (User $user) => blank($user->employee_code))->count(),
            'systemAccounts' => $users->where('login_enabled', true)->count(),
            'withoutAccounts' => $users->where('login_enabled', false)->count(),
            'requiredHeadcount' => $requiredHeadcount,
            'occupiedHeadcount' => min($occupiedHeadcount, $requiredHeadcount),
            'vacantHeadcount' => $vacantHeadcount,
            'surplusHeadcount' => $surplusHeadcount,
            'coveragePercent' => $requiredHeadcount > 0 ? round(min($occupiedHeadcount, $requiredHeadcount) / $requiredHeadcount * 100) : 0,
            'positionsCount' => $positions->count(),
            'coveredPositions' => $positions->filter(fn (array $position) => $position['occupiedHeadcount'] > 0)->count(),
            'emptyPositionsCount' => $missingPositions->count(),
            'invalidWorkerCodingCount' => $invalidWorkerCoding->count(),
            'invalidWorkerCoding' => $this->invalidWorkerRows($invalidWorkerCoding),
            'positions' => $positions->values(),
            'missingPositions' => $missingPositions,
            'employees' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'employee_code' => $user->employee_code,
                'name' => $user->name,
                'status' => $user->status,
                'login_enabled' => $user->login_enabled,
                'position' => $user->position?->name,
                'manager' => $user->manager?->name,
            ])->values(),
            'openRecruitmentRequests' => RecruitmentRequest::query()
                ->where('department_id', $department->id)
                ->whereNotIn('status', ['rejected', 'cancelled', 'hired'])
                ->count(),
            'openTransferRequests' => EmployeeTransferRequest::query()
                ->where('to_department_id', $department->id)
                ->whereNotIn('status', ['executed', 'rejected'])
                ->count(),
        ];
    }

    private function positionCoverage(Position $position, string $workerPolicy): array
    {
        $isOptional = in_array($workerPolicy, ['none', 'optional'], true) && $this->isWorkerPosition($position);
        $required = $isOptional ? 0 : max(0, (int) ($position->required_headcount ?? 0));
        $occupied = (int) $position->employees_count;
        $coverage = $required > 0 ? round(min($occupied, $required) / $required * 100) : 0;

        return [
            'id' => $position->id,
            'name' => $position->name,
            'code' => $position->code,
            'requiredHeadcount' => $required,
            'occupiedHeadcount' => $occupied,
            'vacantHeadcount' => max(0, $required - $occupied),
            'surplusHeadcount' => max(0, $occupied - $required),
            'coveragePercent' => $coverage,
            'optional' => $isOptional,
        ];
    }

    private function employeesNeedingCoding(): Collection
    {
        return $this->employeeQuery()
            ->with(['department:id,name,code', 'position:id,name,code'])
            ->where(function ($query) {
                $query
                    ->whereNull('employee_code')
                    ->orWhere('employee_code', '')
                    ->orWhereNull('department_id')
                    ->orWhereNull('position_id')
                    ->orWhere(function ($invalidWorker) {
                        $invalidWorker
                            ->whereHas('department', fn ($department) => $department->whereIn('code', ['hr', 'accounting']))
                            ->whereHas('position', fn ($position) => $position
                                ->whereIn('code', ['worker', 'warehouse_worker'])
                                ->orWhere('name', 'like', '%عامل%'));
                    });
            })
            ->orderBy('name')
            ->get(['id', 'employee_code', 'name', 'status', 'login_enabled', 'department_id', 'position_id']);
    }

    private function transferRequestsQuery()
    {
        return EmployeeTransferRequest::query();
    }

    private function transferRequestRow(EmployeeTransferRequest $request): array
    {
        $row = $request->toArray();
        $row['source_impact'] = $this->positionImpact($request->from_position_id);
        $row['target_impact'] = $this->positionImpact($request->to_position_id);
        $row['suggested_successor'] = $this->bestSuccessorFor($request->from_position_id);

        return $row;
    }

    private function canApproveTransfer(User $user, EmployeeTransferRequest $transferRequest): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return match ($transferRequest->status) {
            'pending_current_manager' => $this->isDepartmentManagerFor($user, $transferRequest->from_department_id),
            'pending_new_manager' => $this->isDepartmentManagerFor($user, $transferRequest->to_department_id),
            'pending_hr' => $this->isHrUser($user),
            default => false,
        };
    }

    private function isDepartmentManagerFor(User $user, ?int $departmentId): bool
    {
        return $user->hasRole('general_manager')
            || ((int) $user->department_id === (int) $departmentId && in_array($user->position?->code, $this->managerPositionCodes(), true));
    }

    private function managerPositionCodes(): array
    {
        return [
            'general_manager',
            'department_manager',
            'department_officer',
            'sales_manager',
            'planning_manager',
            'section_head',
            'accounting_manager',
            'purchasing_manager',
            'hr_manager',
        ];
    }

    private function invalidWorkerRows(Collection $users): Collection
    {
        return $users->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'employee_code' => $user->employee_code,
            'position' => $user->position?->name,
        ])->values();
    }

    private function isWorker(User $user): bool
    {
        return $this->isWorkerPosition($user->position);
    }

    private function isWorkerPosition($position): bool
    {
        $positionCode = $position?->code;
        $positionName = $position?->name ?? '';

        return in_array($positionCode, ['worker', 'warehouse_worker'], true)
            || str_contains($positionName, 'عامل');
    }

    private function workerPolicyFor(Department $department): string
    {
        return match (true) {
            in_array($department->code, self::NON_WORKER_DEPARTMENT_CODES, true) => 'none',
            default => 'standard',
        };
    }

    private function employeeQuery()
    {
        return $this->employeeUsers(User::query());
    }

    private function employeeUsers($query)
    {
        return $query->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'));
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

    private function canView(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission('view_users')
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function isHrUser(User $user): bool
    {
        return $user->department?->code === 'hr'
            || $user->hasRole('hr')
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function nextTransferNumber(): string
    {
        return 'TR-'.now()->format('Ymd').'-'.str_pad((string) (EmployeeTransferRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function nextRecruitmentNumber(): string
    {
        return 'REC-'.now()->format('Ymd').'-'.str_pad((string) (RecruitmentRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
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
