<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\GovernanceChangeRequestService;
use App\Services\SequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const NON_WORKER_DEPARTMENT_CODES = ['top_management', 'management', 'hr', 'accounting', 'finance', 'sales', 'purchasing'];
    public function __construct(
        private readonly SequenceService $sequences,
        private readonly GovernanceChangeRequestService $governanceChanges,
    )
    {
    }

    public function index(Request $request): Response
    {
        $canManageAdminRole = $request->user()?->hasRole('admin') ?? false;
        $codingDepartmentId = $request->integer('department_id') ?: null;

        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->with(['role', 'department', 'position', 'manager:id,name,name_ar,name_en', 'managers:id,name,name_ar,name_en', 'warehouses:id,name,code'])
                ->whereNull('customer_id')
                ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'customer'))
                ->latest()
                ->get([
                    'id',
                    'employee_code',
                    'name',
                    'name_ar',
                    'name_en',
                    'email',
                    'profile_photo_path',
                    'phone',
                    'national_id',
                    'education_qualification',
                    'status',
                    'login_enabled',
                    'archived_at',
                    'archived_by',
                    'archived_reason',
                    'role_id',
                    'department_id',
                    'position_id',
                    'manager_id',
                    'hired_at',
                    'address',
                    'basic_salary',
                    'employment_type',
                    'contract_start_date',
                    'contract_end_date',
                    'contract_duration_months',
                    'contract_expiry_notice_days',
                    'created_at',
                ]),
            'roles' => Role::query()
                ->where('slug', '!=', 'customer')
                ->when(! $canManageAdminRole, fn ($query) => $query->where('slug', '!=', 'admin'))
                ->orderBy('id')
                ->get(['id', 'name', 'slug', 'name_ar', 'name_en']),
            'departments' => Department::query()
                ->officialActive()
                ->with(['positions' => fn ($positions) => $positions
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->select('id', 'department_id', 'name', 'name_ar', 'name_en', 'code', 'required_headcount')])
                ->orderBy('id')
                ->get(['id', 'name', 'name_ar', 'name_en', 'code', 'required_headcount']),
            'managers' => $this->managerCandidatesQuery()
                ->orderBy('name')
                ->get(['id', 'name', 'name_ar', 'name_en', 'email', 'role_id', 'department_id', 'position_id']),
            'warehouses' => Warehouse::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'codingDepartmentId' => $codingDepartmentId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'employee_code' => ['nullable', 'digits_between:1,50', 'unique:users,employee_code'],
            'login_enabled' => ['required', 'boolean'],
            'email' => ['nullable', 'required_if:login_enabled,1,true', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:users,national_id'],
            'education_qualification' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'hired_at' => ['nullable', 'date'],
            'employment_type' => ['required', Rule::in(['permanent', 'part_time'])],
            'contract_start_date' => ['nullable', 'required_if:employment_type,part_time', 'date'],
            'contract_duration_months' => ['nullable', 'required_if:employment_type,part_time', 'integer', 'min:1', 'max:60'],
            'contract_end_date' => ['nullable', 'required_if:employment_type,part_time', 'date', 'after_or_equal:contract_start_date'],
            'contract_expiry_notice_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended', 'archived'])],
            'password' => ['nullable', 'required_if:login_enabled,1,true', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['nullable', 'required_if:login_enabled,1,true', 'exists:roles,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'coding_department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => [
                'nullable',
                Rule::exists('positions', 'id')->where(fn ($query) => $query->where('department_id', $request->input('department_id'))),
            ],
            'manager_ids' => ['array'],
            'manager_ids.*' => ['integer', 'exists:users,id'],
            'warehouse_ids' => ['array'],
            'warehouse_ids.*' => ['integer', 'exists:warehouses,id'],
        ]);

        $loginEnabled = filter_var($data['login_enabled'], FILTER_VALIDATE_BOOLEAN);
        $data = $this->normalizeEmployeeContractData($data);
        $managerIds = [];
        $warehouseIds = $data['warehouse_ids'] ?? [];

        if ($loginEnabled && blank($data['coding_department_id'] ?? null)) {
            return back()->with('error', 'System accounts must be requested from an approved, coded employee record.');
        }

        if ($loginEnabled && ! $this->positionAllowsSystemLogin(filled($data['position_id'] ?? null) ? (int) $data['position_id'] : null)) {
            return back()->withErrors(['position_id' => 'The selected position is not allowed to have a system login account.']);
        }

        if (filled($data['coding_department_id'] ?? null) && (int) $data['department_id'] !== (int) $data['coding_department_id']) {
            return back()->withErrors(['department_id' => 'Employee coding is locked to the selected department.']);
        }

        if ($loginEnabled && filled($data['coding_department_id'] ?? null)) {
            $automaticRoleId = $this->roleIdForDepartment((int) $data['coding_department_id'], filled($data['position_id'] ?? null) ? (int) $data['position_id'] : null);

            if (! $automaticRoleId) {
                return back()->withErrors(['role_id' => 'No system role is mapped to the selected department.']);
            }

            $data['role_id'] = $automaticRoleId;
        }

        $role = $loginEnabled ? Role::findOrFail($data['role_id']) : null;

        if ($role?->slug === 'admin' && ! $request->user()?->hasRole('admin')) {
            abort(403);
        }

        if ($message = $this->workerCodingRuleError($data['department_id'] ?? null, $data['position_id'] ?? null)) {
            return back()->withErrors(['position_id' => $message]);
        }

        if ($message = $this->headcountCapacityError($data['department_id'] ?? null, $data['position_id'] ?? null)) {
            return back()->withErrors(['position_id' => $message]);
        }

        $managerIds = $this->mandatoryDepartmentManagerIds(
            departmentId: $data['department_id'] ?? null,
            positionId: filled($data['position_id'] ?? null) ? (int) $data['position_id'] : null,
        );

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_path'] = $request->file('profile_photo')->store('profile-photos', 'public');
        }

        $attributes = [
            'employee_code' => $data['employee_code'] ?: $this->sequences->next('employees')['code'],
            'name' => $data['name_ar'],
            'name_ar' => $data['name_ar'],
            'name_en' => $data['name_en'] ?? null,
            'email' => $loginEnabled ? $data['email'] : null,
            'profile_photo_path' => $data['profile_photo_path'] ?? null,
            'phone' => $data['phone'] ?? null,
            'national_id' => $data['national_id'] ?? null,
            'education_qualification' => $data['education_qualification'] ?? null,
            'address' => $data['address'] ?? null,
            'hired_at' => $data['hired_at'] ?? null,
            'employment_type' => $data['employment_type'],
            'contract_start_date' => $data['contract_start_date'] ?? null,
            'contract_end_date' => $data['contract_end_date'] ?? null,
            'contract_duration_months' => $data['contract_duration_months'] ?? 6,
            'contract_expiry_notice_days' => $data['contract_expiry_notice_days'] ?? 180,
            'contract_expiry_notified_at' => null,
            'basic_salary' => $data['basic_salary'] ?? null,
            'status' => $data['status'],
            'login_enabled' => $loginEnabled,
            'password' => $loginEnabled ? Hash::make($data['password']) : null,
            'role_id' => $loginEnabled ? $data['role_id'] : null,
            'department_id' => $data['department_id'] ?? null,
            'position_id' => $data['position_id'] ?? null,
            'manager_id' => $managerIds[0] ?? null,
        ];

        $this->governanceChanges->requestCreate($request->user(), User::class, $attributes, '', [
            'manager_ids' => $managerIds,
            'warehouse_ids' => $warehouseIds,
        ]);

        return back()->with('success', 'User change request sent for approval.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'employee_code' => ['nullable', 'digits_between:1,50', Rule::unique('users', 'employee_code')->ignore($user)],
            'login_enabled' => ['required', 'boolean'],
            'email' => ['nullable', 'required_if:login_enabled,1,true', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:50', Rule::unique('users', 'national_id')->ignore($user)],
            'education_qualification' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'hired_at' => ['nullable', 'date'],
            'employment_type' => ['required', Rule::in(['permanent', 'part_time'])],
            'contract_start_date' => ['nullable', 'required_if:employment_type,part_time', 'date'],
            'contract_duration_months' => ['nullable', 'required_if:employment_type,part_time', 'integer', 'min:1', 'max:60'],
            'contract_end_date' => ['nullable', 'required_if:employment_type,part_time', 'date', 'after_or_equal:contract_start_date'],
            'contract_expiry_notice_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended', 'archived'])],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['nullable', 'required_if:login_enabled,1,true', 'exists:roles,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => [
                'nullable',
                Rule::exists('positions', 'id')->where(fn ($query) => $query->where('department_id', $request->input('department_id'))),
            ],
            'manager_ids' => ['array'],
            'manager_ids.*' => ['integer', 'exists:users,id'],
            'warehouse_ids' => ['array'],
            'warehouse_ids.*' => ['integer', 'exists:warehouses,id'],
        ]);

        $loginEnabled = filter_var($data['login_enabled'], FILTER_VALIDATE_BOOLEAN);
        $data = $this->normalizeEmployeeContractData($data, $user);
        $data['name'] = $data['name_ar'];
        $role = $loginEnabled ? Role::findOrFail($data['role_id']) : null;
        $managerIds = [];
        $warehouseIds = $data['warehouse_ids'] ?? [];

        if (! $user->login_enabled && $loginEnabled) {
            return back()->with('error', 'System account creation is disabled from the users screen. Code the employee first, then use the approved account provisioning flow.');
        }

        if ($user->hasRole('admin')) {
            if (! $request->user()?->is($user)) {
                return back()->with('error', 'Admin account edits are restricted to the same admin account owner.');
            }

            if (! $loginEnabled || $role?->slug !== 'admin' || ($data['status'] ?? null) !== 'active') {
                return back()->with('error', 'Admin accounts must stay active, login-enabled, and assigned to the Admin role.');
            }
        }

        if ($role?->slug === 'admin' && ! $request->user()?->hasRole('admin')) {
            abort(403);
        }

        if ($role?->slug === 'admin' && ! $request->user()?->is($user)) {
            return back()->with('error', 'Admin role cannot be assigned to another account from here.');
        }

        if ($loginEnabled && $role?->slug !== 'admin' && empty($user->employee_code)) {
            return back()->with('error', 'Employee must have an approved employee code before requesting a system account.');
        }

        if ($loginEnabled && $role?->slug !== 'admin' && ! $this->positionAllowsSystemLogin(filled($data['position_id'] ?? null) ? (int) $data['position_id'] : null)) {
            return back()->withErrors(['position_id' => 'The selected position is not allowed to have a system login account.']);
        }

        if ($loginEnabled && ! $user->login_enabled && $this->hasPendingAccountRequest($user)) {
            return back()->with('error', 'There is already a pending account creation request for this employee.');
        }

        if ($role?->slug !== 'admin') {
            if ($message = $this->workerCodingRuleError($data['department_id'] ?? null, $data['position_id'] ?? null)) {
                return back()->withErrors(['position_id' => $message]);
            }

            if ($message = $this->headcountCapacityError($data['department_id'] ?? null, $data['position_id'] ?? null, $user->id)) {
                return back()->withErrors(['position_id' => $message]);
            }
        }

        $managerIds = $this->mandatoryDepartmentManagerIds(
            departmentId: $data['department_id'] ?? null,
            positionId: filled($data['position_id'] ?? null) ? (int) $data['position_id'] : null,
            employeeId: $user->id,
        );

        if (empty($data['employee_code'])) {
            $data['employee_code'] = $user->employee_code ?: $this->sequences->next('employees')['code'];
        }

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_path'] = $request->file('profile_photo')->store('profile-photos', 'public');
        }

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } elseif (! $loginEnabled) {
            $data['password'] = null;
        } else {
            unset($data['password']);
        }

        if (! $loginEnabled) {
            $data['email'] = null;
            $data['role_id'] = null;
        }

        unset($data['profile_photo']);
        unset($data['manager_ids']);
        unset($data['warehouse_ids']);
        $data['manager_id'] = $managerIds[0] ?? null;

        $this->governanceChanges->requestUpdate($request->user(), $user, $data, '', [
            'manager_ids' => $managerIds,
            'warehouse_ids' => $warehouseIds,
        ]);

        return back()->with('success', 'User change request sent for approval.');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        if (! $user->login_enabled) {
            return back()->with('error', 'This employee does not have a system login account.');
        }

        $data = $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $role = Role::findOrFail($data['role_id']);

        if ($role->slug === 'admin' && ! $request->user()?->hasRole('admin')) {
            abort(403);
        }

        if ($user->hasRole('admin')) {
            if (! $request->user()?->is($user)) {
                return back()->with('error', 'Admin account edits are restricted to the same admin account owner.');
            }

            if ($role->slug !== 'admin') {
                return back()->with('error', 'Admin accounts must stay assigned to the Admin role.');
            }
        }

        if ($role->slug === 'admin' && ! $request->user()?->is($user)) {
            return back()->with('error', 'Admin role cannot be assigned to another account from here.');
        }

        $this->governanceChanges->requestUpdate($request->user(), $user, $data, 'Role change requires governance approval.');

        return back()->with('success', 'User role change request sent for approval.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->hasRole('admin')) {
            return back()->with('error', 'Admin accounts cannot be deleted. You can edit department and position only.');
        }

        $this->governanceChanges->requestDelete($request->user(), $user);

        return back()->with('success', 'User delete request sent for approval.');
    }

    public function archive(Request $request, User $user): RedirectResponse
    {
        abort_unless($this->canArchiveUsers($request->user()), 403);

        if ($user->hasRole('admin')) {
            return back()->with('error', 'Admin account cannot be archived.');
        }

        if ($user->status === 'active') {
            return back()->with('error', 'Archive is allowed only for inactive or suspended employees.');
        }

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->governanceChanges->requestUpdate($request->user(), $user, [
            'status' => 'archived',
            'login_enabled' => false,
            'archived_at' => now(),
            'archived_by' => $request->user()->id,
            'archived_reason' => $data['reason'] ?? 'Archived by HR/admin.',
        ]);

        return back()->with('success', 'Employee archive request sent for approval.');
    }

    public function restore(Request $request, User $user): RedirectResponse
    {
        abort_unless($this->canArchiveUsers($request->user()), 403);

        if ($user->hasRole('admin')) {
            return back()->with('error', 'Admin account restore is not needed.');
        }

        $this->governanceChanges->requestUpdate($request->user(), $user, [
            'status' => 'inactive',
            'archived_at' => null,
            'archived_by' => null,
            'archived_reason' => null,
        ]);

        return back()->with('success', 'Employee restore request sent for approval.');
    }

    private function normalizeEmployeeContractData(array $data, ?User $user = null): array
    {
        $data['employment_type'] = $data['employment_type'] ?? 'permanent';

        if ($data['employment_type'] === 'permanent') {
            $data['contract_start_date'] = null;
            $data['contract_end_date'] = null;
            $data['contract_duration_months'] = 6;
            $data['contract_expiry_notice_days'] = 180;
            $data['contract_expiry_notified_at'] = null;

            return $data;
        }

        $durationMonths = (int) ($data['contract_duration_months'] ?? 6);
        $data['contract_duration_months'] = max(1, min(60, $durationMonths ?: 6));
        $data['contract_expiry_notice_days'] = max(1, min(365, (int) ($data['contract_expiry_notice_days'] ?? 180) ?: 180));

        if (filled($data['contract_start_date'] ?? null) && blank($data['contract_end_date'] ?? null)) {
            $data['contract_end_date'] = Carbon::parse($data['contract_start_date'])
                ->addMonthsNoOverflow($data['contract_duration_months'])
                ->toDateString();
        }

        if (! $user || optional($user->contract_end_date)->toDateString() !== ($data['contract_end_date'] ?? null)) {
            $data['contract_expiry_notified_at'] = null;
        }

        return $data;
    }

    private function managerCandidatesQuery()
    {
        $managerPositionCodes = [
            'general_manager',
            'admin_assistant',
            'department_manager',
            'department_officer',
            'sales_manager',
            'sales_officer',
            'planning_manager',
            'section_head',
            'assistant_section_head',
            'accounting_manager',
            'purchasing_manager',
            'purchasing_officer',
            'hr_manager',
        ];

        return User::query()
            ->where('login_enabled', true)
            ->where('status', 'active')
            ->where(function ($query) use ($managerPositionCodes) {
                $query
                    ->whereHas('role', fn ($roleQuery) => $roleQuery->whereIn('slug', ['admin', 'general_manager']))
                    ->orWhereHas('position', fn ($positionQuery) => $positionQuery->whereIn('code', $managerPositionCodes));
            });
    }

    private function managerIdsFrom(array $data): array
    {
        return collect($data['manager_ids'] ?? [])
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    private function managerCandidatesExist(array $managerIds): bool
    {
        if ($managerIds === []) {
            return true;
        }

        return $this->managerCandidatesQuery()
            ->whereIn('id', $managerIds)
            ->count() === count($managerIds);
    }

    private function mandatoryDepartmentManagerIds(?int $departmentId, ?int $positionId = null, ?int $employeeId = null): array
    {
        if (! $departmentId) {
            return [];
        }

        $department = Department::query()->with('parent')->find($departmentId);

        if (! $department) {
            return [];
        }

        if ($department->direct_manager_id && (int) $department->direct_manager_id !== (int) $employeeId) {
            return [(int) $department->direct_manager_id];
        }

        $higherManagerId = $department->parent?->direct_manager_id
            ?: $this->generalManagerId($employeeId);

        return $higherManagerId ? [(int) $higherManagerId] : [];
    }

    private function canArchiveUsers(?User $user): bool
    {
        return $user?->hasRole('admin')
            || $user?->department?->code === 'hr'
            || $user?->role?->slug === 'hr';
    }

    private function generalManagerId(?int $exceptUserId = null): ?int
    {
        return User::query()
            ->whereNull('customer_id')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'customer'))
            ->where('login_enabled', true)
            ->where('status', 'active')
            ->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->where(function ($query) {
                $query
                    ->whereHas('role', fn ($role) => $role->whereIn('slug', ['admin', 'general_manager']))
                    ->orWhereHas('position', fn ($position) => $position->where('code', 'general_manager'));
            })
            ->orderByRaw("CASE WHEN role_id IS NOT NULL THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->value('id');
    }

    private function automaticDepartmentManagerIds(?int $departmentId, ?int $positionId = null): array
    {
        if (! $departmentId) {
            return [];
        }

        $unitId = $this->unitIdForPosition($positionId);

        return User::query()
            ->where('department_id', $departmentId)
            ->where('login_enabled', true)
            ->where('status', 'active')
            ->whereHas('position', fn ($query) => $query
                ->where('code', 'like', '%\_manager')
                ->orWhere('code', 'like', '%\_officer')
                ->orWhereIn('code', ['section_head', 'assistant_section_head']))
            ->when($unitId, fn ($query) => $query->whereHas('position.departmentPosition', fn ($departmentPosition) => $departmentPosition->where('department_unit_id', $unitId)))
            ->with('position:id,code')
            ->get(['id', 'department_id', 'position_id'])
            ->sortBy(fn (User $user) => str_ends_with((string) $user->position?->code, '_manager') || $user->position?->code === 'section_head' ? 0 : 1)
            ->pluck('id')
            ->values()
            ->all();
    }

    private function roleIdForDepartment(?int $departmentId, ?int $positionId = null): ?int
    {
        if (! $departmentId) {
            return null;
        }

        $department = Department::find($departmentId);

        if (! $department) {
            return null;
        }

        $unitCode = $this->unitCodeForPosition($positionId);

        if ($department->system_role_id && Role::query()->whereKey($department->system_role_id)->where('slug', '!=', 'admin')->exists()) {
            return $department->system_role_id;
        }

        $roleSlug = $this->roleSlugForDepartment($department, $unitCode);

        return Role::query()
            ->where('slug', $roleSlug)
            ->where('slug', '!=', 'admin')
            ->value('id');
    }

    private function roleSlugForDepartment(Department $department, ?string $unitCode = null): string
    {
        if (in_array($department->code, ['top_management', 'management'], true)) {
            return 'general_manager';
        }

        $modules = collect($department->linked_modules ?? []);

        if ($modules->contains('hr')) {
            return 'hr';
        }

        if ($modules->contains('it')) {
            return 'it';
        }

        if ($modules->contains('accounting')) {
            return 'accounting';
        }

        if ($modules->contains('cost_accounting')) {
            return 'cost_accountant';
        }

        if ($modules->contains('sales') || $modules->contains('customers')) {
            return 'sales';
        }

        if ($modules->contains('purchasing') || $modules->contains('suppliers')) {
            return 'purchasing';
        }

        if ($modules->contains('inventory') || $modules->contains('stock_counts')) {
            return 'warehouse';
        }

        if ($modules->contains('production')) {
            return $unitCode ?: 'production';
        }

        if ($modules->contains('quality')) {
            return 'quality';
        }

        return [
            'costing' => 'cost_accountant',
            'cost_accounting' => 'cost_accountant',
            'it' => 'it',
            'information_technology' => 'it',
            'technology' => 'it',
            'production_planning' => $unitCode ?: 'production',
            'finance' => 'accounting',
        ][$department->code] ?? $department->code;
    }

    private function positionAllowsSystemLogin(?int $positionId): bool
    {
        if (! $positionId) {
            return false;
        }

        $departmentPosition = Position::query()
            ->with('departmentPosition:id,position_id,allow_system_login')
            ->find($positionId)
            ?->departmentPosition;

        return $departmentPosition ? (bool) $departmentPosition->allow_system_login : true;
    }

    private function unitIdForPosition(?int $positionId): ?int
    {
        if (! $positionId) {
            return null;
        }

        return Position::query()
            ->with('departmentPosition:id,position_id,department_unit_id')
            ->find($positionId)
            ?->departmentPosition
            ?->department_unit_id;
    }

    private function unitCodeForPosition(?int $positionId): ?string
    {
        if (! $positionId) {
            return null;
        }

        return Position::query()
            ->with('departmentPosition.departmentUnit:id,code')
            ->find($positionId)
            ?->departmentPosition
            ?->departmentUnit
            ?->code;
    }

    private function hasPendingAccountRequest(User $user): bool
    {
        return ChangeRequest::query()
            ->where('subject_type', User::class)
            ->where('subject_id', $user->id)
            ->where('type', 'user_update')
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->get(['new_values', 'payload'])
            ->contains(function (ChangeRequest $changeRequest): bool {
                $newValues = $changeRequest->new_values ?? [];
                $attributes = $changeRequest->payload['attributes'] ?? [];

                return filter_var($newValues['login_enabled'] ?? $attributes['login_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
            });
    }

    private function workerCodingRuleError(?int $departmentId, ?int $positionId): ?string
    {
        if (! $departmentId || ! $positionId) {
            return null;
        }

        $department = Department::find($departmentId);
        $position = Position::find($positionId);

        if (! $department || ! $position) {
            return null;
        }

        if (in_array($department->code, self::NON_WORKER_DEPARTMENT_CODES, true) && $this->isWorkerPosition($position)) {
            return 'هذا القسم إداري ولا يستخدم عمال. اختر وظيفة إدارية أو موظف مناسب.';
        }

        return null;
    }

    private function headcountCapacityError(?int $departmentId, ?int $positionId, ?int $exceptUserId = null): ?string
    {
        if (! $departmentId) {
            return null;
        }

        if ($positionId && $this->availablePositionSlots((int) $positionId, $exceptUserId) < 1) {
            return 'This position reached its approved headcount. Employee coding is closed until a vacancy is available.';
        }

        if ($this->availableDepartmentSlots((int) $departmentId, $exceptUserId) < 1) {
            return 'This department reached its approved headcount. Employee coding is closed until a vacancy is available.';
        }

        return null;
    }

    private function availablePositionSlots(int $positionId, ?int $exceptUserId = null): int
    {
        $position = Position::query()->find($positionId);

        if (! $position) {
            return 0;
        }

        $approved = max(0, (int) $position->required_headcount);

        if ($approved === 0) {
            return 0;
        }

        $current = User::query()
            ->where('position_id', $positionId)
            ->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->where('status', '!=', 'archived')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
        $pending = ChangeRequest::query()
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->where('subject_type', User::class)
            ->where(function ($query) use ($positionId): void {
                $query
                    ->where('new_values->position_id', $positionId)
                    ->orWhere('payload->attributes->position_id', $positionId);
            })
            ->count();

        return max(0, $approved - $current - $pending);
    }

    private function availableDepartmentSlots(int $departmentId, ?int $exceptUserId = null): int
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
            ->when($exceptUserId, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->where('status', '!=', 'archived')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
        $pending = ChangeRequest::query()
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->where('subject_type', User::class)
            ->where(function ($query) use ($departmentId): void {
                $query
                    ->where('new_values->department_id', $departmentId)
                    ->orWhere('payload->attributes->department_id', $departmentId);
            })
            ->count();

        return max(0, $approved - $current - $pending);
    }

    private function isWorkerPosition(Position $position): bool
    {
        return in_array($position->code, ['worker', 'warehouse_worker'], true)
            || str_contains($position->name, 'عامل');
    }

}
