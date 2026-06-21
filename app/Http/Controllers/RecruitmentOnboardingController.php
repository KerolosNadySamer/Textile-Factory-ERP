<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\EmployeePromotionRequest;
use App\Models\Position;
use App\Models\RecruitmentRequest;
use App\Models\User;
use App\Services\ContractExpiryNotificationService;
use App\Services\SequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RecruitmentOnboardingController extends Controller
{
    public function __construct(
        private readonly SequenceService $sequences,
        private readonly ContractExpiryNotificationService $contractNotifications,
    ) {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $canSeeSensitive = $this->canSeeSensitive($user);

        $promotionQuery = $this->visiblePromotionRequestsQuery($user, $canSeeSensitive)
            ->with(['employee:id,employee_code,name,department_id,position_id', 'fromDepartment:id,name,code', 'fromPosition:id,name,code', 'toDepartment:id,name,code', 'toPosition:id,name,code', 'requester:id,name'])
            ->latest();
        $metricQuery = $this->visiblePromotionRequestsQuery($user, $canSeeSensitive);
        $departments = Department::query()
            ->officialActive()
            ->with([
                'positions' => fn ($positions) => $positions
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->select('id', 'department_id', 'name', 'code', 'required_headcount'),
                'users' => fn ($employees) => $employees
                    ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                    ->with('position:id,name,code')
                    ->orderBy('name')
                    ->select('id', 'employee_code', 'name', 'department_id', 'position_id', 'status', 'login_enabled'),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'required_headcount'])
            ->map(function (Department $department) {
                $department->positions->transform(function (Position $position) {
                    $position->available_vacancies = $this->availableVacancies($position->id);

                    return $position;
                });

                return $department;
            });

        return Inertia::render('RecruitmentOnboarding/Index', [
            'promotionRequests' => $promotionQuery->get()->map(fn (EmployeePromotionRequest $item) => $this->promotionRequestRow($item)),
            'metrics' => [
                'openPromotions' => (clone $metricQuery)->whereNotIn('status', ['executed', 'rejected'])->count(),
                'pendingHr' => (clone $metricQuery)->where('status', 'pending_hr')->count(),
                'pendingGeneralManager' => (clone $metricQuery)->where('status', 'pending_general_manager')->count(),
                'executed' => (clone $metricQuery)->where('status', 'executed')->count(),
                'rejected' => (clone $metricQuery)->where('status', 'rejected')->count(),
            ],
            'departments' => $departments,
            'targetPositions' => $departments
                ->flatMap(fn (Department $department) => $department->positions->map(fn (Position $position) => [
                    'id' => $position->id,
                    'department_id' => $department->id,
                    'department_name' => $department->name,
                    'name' => $position->name,
                    'code' => $position->code,
                    'available_vacancies' => $position->available_vacancies,
                ]))
                ->values(),
        ]);
    }

    private function visiblePromotionRequestsQuery(User $user, bool $canSeeSensitive)
    {
        return EmployeePromotionRequest::query()
            ->when(! $canSeeSensitive, function ($query) use ($user): void {
                $query->where(function ($scope) use ($user): void {
                    $scope
                        ->where('requested_by', $user->id)
                        ->orWhere('from_department_id', $user->department_id)
                        ->orWhere('to_department_id', $user->department_id);
                });
            });
    }

    private function promotionRequestRow(EmployeePromotionRequest $request): array
    {
        $row = $request->toArray();
        $row['source_impact'] = $this->positionImpact($request->from_position_id);

        return $row;
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

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'to_position_id' => ['required', 'integer', 'exists:positions,id'],
            'promotion_type' => ['required', Rule::in(['same_department', 'other_department', 'higher_position'])],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $employee = User::query()
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->findOrFail($data['employee_id']);
        $targetPosition = Position::query()->with('department')->findOrFail($data['to_position_id']);

        if (! $this->canSeeSensitive($request->user()) && (int) $employee->department_id !== (int) $request->user()->department_id) {
            abort(403);
        }

        if ($this->availableVacancies($targetPosition->id) < 1) {
            return back()->withErrors(['to_position_id' => 'No approved vacancy is available for the target position.']);
        }

        if ((int) $employee->position_id === (int) $targetPosition->id) {
            return back()->withErrors(['to_position_id' => 'The employee already holds this position.']);
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

        return back()->with('success', 'Promotion nomination submitted.');
    }

    public function approve(Request $request, RecruitmentRequest $recruitmentRequest): RedirectResponse
    {
        $user = $request->user();

        abort_unless($this->canApprove($user, $recruitmentRequest), 403);

        if ($recruitmentRequest->status === 'pending_department_manager') {
            $recruitmentRequest->update([
                'status' => 'pending_hr_manager',
                'department_manager_approved_by' => $user->id,
                'department_manager_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_department_officer') {
            $recruitmentRequest->update([
                'status' => 'pending_department_manager',
                'department_officer_approved_by' => $user->id,
                'department_officer_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_hr_manager') {
            $recruitmentRequest->update([
                'status' => 'pending_general_manager',
                'hr_approved_by' => $user->id,
                'hr_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_general_manager') {
            $recruitmentRequest->update([
                'status' => 'pending_hr_nomination',
                'general_manager_approved_by' => $user->id,
                'general_manager_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_hr_nomination') {
            $recruitmentRequest->update([
                'status' => 'pending_department_candidate_approval',
                'hr_nominated_by' => $user->id,
                'hr_nominated_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_department_candidate_approval') {
            $recruitmentRequest->update([
                'status' => 'pending_hr_candidate_approval',
                'candidate_department_approved_by' => $user->id,
                'candidate_department_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_hr_candidate_approval') {
            $recruitmentRequest->update([
                'status' => 'pending_general_manager_candidate_approval',
                'candidate_hr_approved_by' => $user->id,
                'candidate_hr_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_general_manager_candidate_approval') {
            $recruitmentRequest->update([
                'status' => 'pending_hr_final_activation',
                'candidate_general_manager_approved_by' => $user->id,
                'candidate_general_manager_approved_at' => now(),
            ]);
        } elseif ($recruitmentRequest->status === 'pending_hr_final_activation') {
            $recruitmentRequest->update([
                'status' => 'ready_for_employee_creation',
                'hr_final_approved_by' => $user->id,
                'hr_final_approved_at' => now(),
            ]);
        }

        return back()->with('success', 'Recruitment request approved.');
    }

    public function reject(Request $request, RecruitmentRequest $recruitmentRequest): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        abort_unless($this->canApprove($request->user(), $recruitmentRequest), 403);

        $recruitmentRequest->update([
            'status' => 'rejected',
            'rejected_by' => $request->user()->id,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'],
        ]);

        return back()->with('success', 'Recruitment request rejected.');
    }

    public function createEmployee(Request $request, RecruitmentRequest $recruitmentRequest): RedirectResponse
    {
        abort_unless($this->canCreateEmployee($request->user()), 403);
        abort_unless($recruitmentRequest->status === 'ready_for_employee_creation' && ! $recruitmentRequest->employee_id, 422);

        if ($recruitmentRequest->position_id && $this->availableVacancies((int) $recruitmentRequest->position_id, $recruitmentRequest->id) < 1) {
            return back()->withErrors(['position_id' => 'No approved vacancy is available for this position.']);
        }

        if ($this->availableDepartmentVacancies((int) $recruitmentRequest->department_id, $recruitmentRequest->id) < 1) {
            return back()->withErrors(['department_id' => 'This department reached its approved headcount. Employee creation is closed until a vacancy is available.']);
        }

        DB::transaction(function () use ($request, $recruitmentRequest): void {
            $employee = User::create([
                'employee_code' => $this->sequences->next('employees')['code'],
                'name' => $recruitmentRequest->candidate_name,
                'email' => null,
                'phone' => $recruitmentRequest->candidate_phone,
                'national_id' => $recruitmentRequest->national_id,
                'address' => null,
                'hired_at' => $recruitmentRequest->planned_start_date,
                'employment_type' => $recruitmentRequest->employment_type ?: 'permanent',
                'contract_start_date' => $recruitmentRequest->contract_start_date,
                'contract_end_date' => $recruitmentRequest->contract_end_date,
                'contract_duration_months' => $recruitmentRequest->contract_duration_months ?: 6,
                'contract_expiry_notice_days' => $recruitmentRequest->contract_expiry_notice_days ?: 180,
                'contract_expiry_notified_at' => null,
                'basic_salary' => $recruitmentRequest->proposed_salary,
                'status' => 'active',
                'login_enabled' => false,
                'password' => null,
                'role_id' => null,
                'department_id' => $recruitmentRequest->department_id,
                'position_id' => $recruitmentRequest->position_id,
                'manager_id' => $recruitmentRequest->manager_id,
            ]);

            if ($recruitmentRequest->manager_id) {
                $employee->managers()->sync([$recruitmentRequest->manager_id]);
            }

            $recruitmentRequest->update([
                'employee_id' => $employee->id,
                'status' => 'employee_created',
            ]);
        });

        return back()->with('success', 'Employee file created and coded.');
    }

    private function serializeRequest(RecruitmentRequest $item, bool $canSeeSensitive): array
    {
        $data = $item->toArray();

        if (! $canSeeSensitive) {
            unset($data['proposed_salary'], $data['national_id'], $data['qualifications']);
        }

        return $data;
    }

    private function normalizeContractData(array $data): array
    {
        $durationMonths = (int) ($data['contract_duration_months'] ?? 6);
        $data['contract_duration_months'] = max(1, min(60, $durationMonths ?: 6));
        $data['contract_expiry_notice_days'] = max(1, min(365, (int) ($data['contract_expiry_notice_days'] ?? 180) ?: 180));

        if (blank($data['contract_start_date'] ?? null) && filled($data['planned_start_date'] ?? null)) {
            $data['contract_start_date'] = $data['planned_start_date'];
        }

        if (filled($data['contract_start_date'] ?? null) && blank($data['contract_end_date'] ?? null)) {
            $data['contract_end_date'] = Carbon::parse($data['contract_start_date'])
                ->addMonthsNoOverflow($data['contract_duration_months'])
                ->toDateString();
        }

        return $data;
    }

    private function visibleRequestsQuery(User $user, bool $canSeeSensitive)
    {
        return RecruitmentRequest::query()
            ->when(! $canSeeSensitive, function ($query) use ($user): void {
                $query->where(function ($scope) use ($user): void {
                    $scope
                        ->where('department_id', $user->department_id)
                        ->orWhere('requested_by', $user->id)
                        ->orWhere('manager_id', $user->id);
                });
            });
    }

    private function nextRequestNumber(): string
    {
        return 'REC-'.now()->format('Ymd').'-'.str_pad((string) (RecruitmentRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function nextPromotionNumber(): string
    {
        return 'PR-'.now()->format('Ymd').'-'.str_pad((string) (EmployeePromotionRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function initialStatusFor(User $user): string
    {
        if ($this->isHrUser($user)) {
            return 'pending_general_manager';
        }

        if ($this->isDepartmentManager($user)) {
            return 'pending_hr_manager';
        }

        if ($this->isDepartmentOfficer($user)) {
            return 'pending_department_manager';
        }

        return 'pending_department_officer';
    }

    private function canApprove(User $user, RecruitmentRequest $request): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return match ($request->status) {
            'pending_department_officer' => $this->isDepartmentOfficer($user) && (int) $user->department_id === (int) $request->department_id,
            'pending_department_manager' => $this->isDepartmentManager($user) && (int) $user->department_id === (int) $request->department_id,
            'pending_hr_manager' => $this->isHrUser($user),
            'pending_general_manager' => $user->hasRole('general_manager'),
            'pending_hr_nomination' => $this->isHrUser($user),
            'pending_department_candidate_approval' => $this->isDepartmentManager($user) && (int) $user->department_id === (int) $request->department_id,
            'pending_hr_candidate_approval' => $this->isHrUser($user),
            'pending_general_manager_candidate_approval' => $user->hasRole('general_manager'),
            'pending_hr_final_activation' => $this->isHrUser($user),
            default => false,
        };
    }

    private function canCreateEmployee(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr']) || $this->isHrUser($user);
    }

    private function canSeeSensitive(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr']) || $this->isHrUser($user);
    }

    private function isHrUser(User $user): bool
    {
        return $user->department?->code === 'hr' || $user->hasRole('hr');
    }

    private function isDepartmentManager(User $user): bool
    {
        return in_array($user->position?->code, $this->departmentManagerPositionCodes(), true)
            || $user->hasRole(['admin', 'general_manager']);
    }

    private function isDepartmentOfficer(User $user): bool
    {
        return in_array($user->position?->code, $this->departmentOfficerPositionCodes(), true)
            || $user->hasRole(['admin', 'general_manager']);
    }

    private function departmentManagerPositionCodes(): array
    {
        return [
            'general_manager',
            'department_manager',
            'sales_manager',
            'planning_manager',
            'section_head',
            'accounting_manager',
            'purchasing_manager',
            'hr_manager',
        ];
    }

    private function departmentOfficerPositionCodes(): array
    {
        return [
            'sales_officer',
            'department_officer',
            'planning_officer',
            'assistant_section_head',
            'purchasing_officer',
            'hr_officer',
            'admin_assistant',
        ];
    }

    private function managerPositionCodes(): array
    {
        return [
            'general_manager',
            'admin_assistant',
            'department_manager',
            'department_officer',
            'sales_manager',
            'sales_officer',
            'planning_manager',
            'planning_officer',
            'section_head',
            'assistant_section_head',
            'accounting_manager',
            'purchasing_manager',
            'purchasing_officer',
            'hr_manager',
            'hr_officer',
        ];
    }

    private function availableVacancies(int $positionId, ?int $exceptRecruitmentRequestId = null): int
    {
        $position = \App\Models\Position::query()->find($positionId);

        if (! $position) {
            return 0;
        }

        $approved = max(0, (int) $position->required_headcount);
        $current = User::query()
            ->where('position_id', $positionId)
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
        $openRequests = RecruitmentRequest::query()
            ->where('position_id', $positionId)
            ->when($exceptRecruitmentRequestId, fn ($query) => $query->whereKeyNot($exceptRecruitmentRequestId))
            ->whereNotIn('status', ['rejected', 'cancelled', 'hired', 'employee_created'])
            ->count();
        $openPromotions = EmployeePromotionRequest::query()
            ->where('to_position_id', $positionId)
            ->whereNotIn('status', ['rejected', 'executed'])
            ->count();

        return max(0, $approved - $current - $openRequests - $openPromotions);
    }

    private function availableDepartmentVacancies(int $departmentId, ?int $exceptRecruitmentRequestId = null): int
    {
        $department = Department::query()->find($departmentId);

        if (! $department) {
            return 0;
        }

        $approved = max(0, (int) $department->required_headcount);

        if ($approved === 0) {
            return 0;
        }

        $current = User::query()
            ->where('department_id', $departmentId)
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
        $openRequests = RecruitmentRequest::query()
            ->where('department_id', $departmentId)
            ->when($exceptRecruitmentRequestId, fn ($query) => $query->whereKeyNot($exceptRecruitmentRequestId))
            ->whereNotIn('status', ['rejected', 'cancelled', 'hired', 'employee_created'])
            ->count();

        return max(0, $approved - $current - $openRequests);
    }
}
