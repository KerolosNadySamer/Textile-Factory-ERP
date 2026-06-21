<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\Department;
use App\Models\DepartmentPosition;
use App\Models\DepartmentUnit;
use App\Models\JobTitle;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentStaffingController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {
    }

    private const OFFICIAL_ORDER = ['top_management', 'management', 'hr', 'finance', 'sales', 'purchasing', 'production_planning'];
    private const NON_WORKER_DEPARTMENT_CODES = ['top_management', 'management', 'hr', 'accounting', 'finance', 'sales', 'purchasing'];
    private const DEPARTMENT_TYPES = ['administrative', 'productive', 'service', 'technical', 'custom'];
    private const DEPARTMENT_STATUSES = ['draft', 'pending_general_manager', 'active', 'paused', 'cancelled', 'archived'];
    private const MODULE_OPTIONS = [
        'accounting',
        'cost_accounting',
        'sales',
        'customers',
        'purchasing',
        'suppliers',
        'inventory',
        'stock_counts',
        'production',
        'quality',
        'hr',
        'it',
        'payroll',
        'reports',
    ];

    public function index(Request $request): Response
    {
        abort_unless($this->canManage($request->user()), 403);

        $allDepartments = $this->managedDepartmentsQuery()
            ->with([
                'directManager:id,name,employee_code',
                'systemRole:id,name,slug,name_ar,name_en',
                'creator:id,name',
                'parent:id,name,code',
                'children' => fn ($query) => $query
                    ->with([
                        'directManager:id,name,employee_code',
                        'systemRole:id,name,slug,name_ar,name_en',
                        'creator:id,name',
                        'departmentPositions' => fn ($positions) => $positions
                            ->where('is_active', true)
                            ->with(['position.users' => fn ($users) => $users
                                ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                                ->select('users.id', 'users.name', 'users.employee_code', 'users.department_id', 'users.position_id', 'users.manager_id')])
                            ->with(['position', 'departmentUnit']),
                    ]),
                'units.children',
                'departmentPositions' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['position.users' => fn ($users) => $users
                        ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                        ->select('users.id', 'users.name', 'users.employee_code', 'users.department_id', 'users.position_id', 'users.manager_id')])
                    ->with(['position', 'departmentUnit']),
            ])
            ->get()
            ->sortBy(fn (Department $department) => array_search($department->code, self::OFFICIAL_ORDER, true) !== false
                ? array_search($department->code, self::OFFICIAL_ORDER, true)
                : 100 + $department->id)
            ->values()
            ->map(fn (Department $department) => $this->departmentRow($department));

        return Inertia::render('DepartmentStaffing/Index', [
            'departments' => $allDepartments
                ->filter(fn (array $department) => $department['parent'] === null)
                ->values(),
            'mainDepartments' => $allDepartments->map(fn ($department) => [
                'id' => $department['id'],
                'name' => $department['name'],
                'name_ar' => $department['name_ar'],
                'name_en' => $department['name_en'],
                'code' => $department['code'],
                'parent_id' => $department['parent']['id'] ?? null,
            ]),
            'moduleOptions' => self::MODULE_OPTIONS,
            'roleOptions' => Role::query()
                ->where('slug', '!=', 'admin')
                ->orderBy('id')
                ->get(['id', 'name', 'slug', 'name_ar', 'name_en']),
        ]);
    }

    public function storeDepartment(Request $request): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);
        abort_unless($this->canCodeDepartmentStructure($request->user()), 403);

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'department_type' => ['required', Rule::in(self::DEPARTMENT_TYPES)],
            'cost_nature' => ['required', Rule::in(['direct', 'indirect'])],
            'required_headcount' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'linked_modules' => ['array'],
            'linked_modules.*' => [Rule::in(self::MODULE_OPTIONS)],
            'system_role_id' => ['nullable', Rule::exists('roles', 'id')->where(fn ($query) => $query->where('slug', '!=', 'admin'))],
            'positions' => ['array'],
            'positions.*.name_ar' => ['nullable', 'string', 'max:255'],
            'positions.*.name_en' => ['nullable', 'string', 'max:255'],
            'positions.*.approved_headcount' => ['nullable', 'integer', 'min:0', 'max:999'],
            'positions.*.allow_system_login' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $request): void {
            $department = Department::create([
                'name' => $data['name_ar'],
                'name_ar' => $data['name_ar'],
                'name_en' => $data['name_en'],
                'code' => $this->nextDepartmentCode($data['name_en']),
                'department_type' => $data['department_type'],
                'cost_nature' => $data['cost_nature'],
                'active' => false,
                'status' => 'pending_general_manager',
                'direct_manager_id' => null,
                'linked_modules' => $data['linked_modules'] ?? $this->suggestModules($data['name_en'], $data['name_ar']),
                'system_role_id' => $data['system_role_id'] ?? null,
                'created_by' => $request->user()->id,
                'required_headcount' => max(0, (int) ($data['required_headcount'] ?? 0)),
            ]);

            $unit = DepartmentUnit::create([
                'department_id' => $department->id,
                'name' => $department->name,
                'code' => 'main',
                'sort_order' => 1,
            ]);

            foreach ($this->validPositionRows($data['positions'] ?? []) as $position) {
                if ($this->departmentDoesNotUseWorkers($department) && $this->isWorkerPositionName($position['name_ar'], $position['name_en'] ?? null)) {
                    continue;
                }

                $this->createPosition(
                    department: $department,
                    unit: $unit,
                    nameAr: $position['name_ar'],
                    nameEn: $position['name_en'],
                    approved: (int) $position['approved_headcount'],
                    allowSystemLogin: (bool) $position['allow_system_login'],
                );
            }

            $this->syncDepartmentHeadcount($department);
        });

        return back()->with('success', 'تم تكويد القسم الجديد.');
    }

    public function storeUnit(Request $request): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);
        abort_unless($this->canCodeDepartmentStructure($request->user()), 403);

        $data = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'department_type' => ['required', Rule::in(self::DEPARTMENT_TYPES)],
            'cost_nature' => ['required', Rule::in(['direct', 'indirect'])],
            'required_headcount' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'linked_modules' => ['array'],
            'linked_modules.*' => [Rule::in(self::MODULE_OPTIONS)],
            'system_role_id' => ['nullable', Rule::exists('roles', 'id')->where(fn ($query) => $query->where('slug', '!=', 'admin'))],
            'positions' => ['array'],
            'positions.*.name_ar' => ['nullable', 'string', 'max:255'],
            'positions.*.name_en' => ['nullable', 'string', 'max:255'],
            'positions.*.approved_headcount' => ['nullable', 'integer', 'min:0', 'max:999'],
            'positions.*.allow_system_login' => ['nullable', 'boolean'],
        ]);

        DB::transaction(function () use ($data, $request): void {
            $department = $this->managedDepartmentsQuery()->findOrFail($data['department_id']);

            $childDepartment = Department::create([
                'parent_id' => $department->id,
                'name' => $data['name_ar'],
                'name_ar' => $data['name_ar'],
                'name_en' => $data['name_en'],
                'code' => $this->nextDepartmentCode($data['name_en']),
                'department_type' => $data['department_type'],
                'cost_nature' => $data['cost_nature'],
                'active' => false,
                'status' => 'pending_general_manager',
                'direct_manager_id' => null,
                'linked_modules' => $data['linked_modules'] ?? $this->suggestModules($data['name_en'], $data['name_ar']),
                'system_role_id' => $data['system_role_id'] ?? null,
                'created_by' => $request->user()->id,
                'required_headcount' => max(0, (int) ($data['required_headcount'] ?? 0)),
            ]);

            $unit = DepartmentUnit::create([
                'department_id' => $childDepartment->id,
                'name' => $childDepartment->name,
                'code' => 'main',
                'sort_order' => 1,
            ]);

            foreach ($this->validPositionRows($data['positions'] ?? []) as $position) {
                if ($this->departmentDoesNotUseWorkers($childDepartment) && $this->isWorkerPositionName($position['name_ar'], $position['name_en'] ?? null)) {
                    continue;
                }

                $this->createPosition(
                    department: $childDepartment,
                    unit: $unit,
                    nameAr: $position['name_ar'],
                    nameEn: $position['name_en'],
                    approved: (int) $position['approved_headcount'],
                    allowSystemLogin: (bool) $position['allow_system_login'],
                );
            }

            $this->syncDepartmentHeadcount($childDepartment);
            $this->syncDepartmentHeadcount($department);
        });

        return back()->with('success', 'تم تكويد القسم الفرعي الجديد.');
    }

    public function updateDepartment(Request $request, Department $department): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);
        abort_unless($this->isManagedDepartment($department), 404);

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:departments,id'],
            'department_type' => ['required', Rule::in(self::DEPARTMENT_TYPES)],
            'cost_nature' => ['required', Rule::in(['direct', 'indirect'])],
            'required_headcount' => ['required', 'integer', 'min:0', 'max:9999'],
            'status' => ['required', Rule::in(self::DEPARTMENT_STATUSES)],
            'linked_modules' => ['array'],
            'linked_modules.*' => [Rule::in(self::MODULE_OPTIONS)],
            'system_role_id' => ['nullable', Rule::exists('roles', 'id')->where(fn ($query) => $query->where('slug', '!=', 'admin'))],
        ]);

        if (filled($data['parent_id'] ?? null)) {
            $parent = $this->managedDepartmentsQuery()->findOrFail($data['parent_id']);

            if ((int) $parent->id === (int) $department->id || $this->isDescendant($parent, $department)) {
                return back()->withErrors(['parent_id' => 'لا يمكن جعل القسم تابعًا لنفسه أو لقسم فرعي منه.']);
            }
        }

        $nextStatus = $department->status === 'pending_general_manager'
            ? 'pending_general_manager'
            : $data['status'];
        $positionsRequired = (int) $department->departmentPositions()
            ->where('is_active', true)
            ->sum('approved_headcount');
        $attributes = [
            'name' => $data['name_ar'],
            'name_ar' => $data['name_ar'],
            'name_en' => $data['name_en'],
            'parent_id' => $data['parent_id'] ?? null,
            'department_type' => $data['department_type'],
            'cost_nature' => $data['cost_nature'],
            'active' => $nextStatus === 'active',
            'status' => $nextStatus,
            'linked_modules' => $data['linked_modules'] ?? [],
            'system_role_id' => $data['system_role_id'] ?? null,
            'required_headcount' => max((int) $data['required_headcount'], $positionsRequired),
        ];

        if (! $this->canApproveDepartment($request->user())) {
            abort_unless($this->canRequestDepartmentChange($request->user(), $department), 403);

            $this->createHrDepartmentChangeRequest(
                requester: $request->user(),
                subject: $department,
                attributes: $attributes,
                oldValues: $department->only(array_keys($attributes)),
                reason: 'طلب تعديل بيانات القسم أو عدد الموظفين المعتمد بواسطة مدير القسم.',
                payloadExtras: ['old_parent_id' => $department->parent_id],
            );

            return back()->with('success', 'تم إرسال تعديل القسم إلى HR ثم المدير العام للاعتماد. لن تظهر البيانات الجديدة إلا بعد اكتمال الاعتماد.');
        }

        $department->update($attributes);

        $this->syncDepartmentHeadcount($department);

        if ($department->parent) {
            $this->syncDepartmentHeadcount($department->parent);
        }

        return back()->with('success', 'تم تعديل بيانات القسم.');
    }

    public function approveDepartment(Request $request, Department $department): RedirectResponse
    {
        abort_unless($this->canApproveDepartment($request->user()), 403);
        abort_unless($this->isManagedDepartment($department), 404);
        abort_unless($department->status === 'pending_general_manager', 422);

        $department->update([
            'active' => true,
            'status' => 'active',
        ]);

        return back()->with('success', 'تم اعتماد القسم.');
    }

    public function rejectDepartment(Request $request, Department $department): RedirectResponse
    {
        abort_unless($this->canApproveDepartment($request->user()), 403);
        abort_unless($this->isManagedDepartment($department), 404);
        abort_unless($department->status === 'pending_general_manager', 422);

        $blockers = $this->hardDeleteBlockers($department);

        if ($blockers !== []) {
            $department->update([
                'active' => false,
                'status' => 'cancelled',
                'required_headcount' => 0,
            ]);

            return back()->with('success', 'تم رفض القسم وإلغاؤه لوجود سجلات مرتبطة.');
        }

        DB::transaction(function () use ($department): void {
            $parent = $department->parent;

            $department->units()->delete();
            $department->delete();

            if ($parent) {
                $this->syncDepartmentHeadcount($parent);
            }
        });

        return back()->with('success', 'تم رفض القسم وحذفه.');
    }

    public function storeDepartmentPosition(Request $request, Department $department): RedirectResponse
    {
        abort_unless($this->canCodeDepartmentPositions($request->user()), 403);
        abort_unless($this->isManagedDepartment($department), 404);
        abort_unless(! in_array($department->status, ['cancelled', 'archived'], true), 422);
        abort_unless($department->status !== 'active' || $request->user()?->hasRole('admin'), 403);

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'approved_headcount' => ['required', 'integer', 'min:0', 'max:999'],
            'allow_system_login' => ['nullable', 'boolean'],
            'department_unit_id' => ['nullable', 'integer', 'exists:department_units,id'],
        ]);

        if ($this->departmentDoesNotUseWorkers($department) && $this->isWorkerPositionName($data['name_ar'], $data['name_en'] ?? null)) {
            return back()->withErrors([
                'name_ar' => 'هذا القسم إداري ولا يستخدم وظيفة عامل. اختر وظيفة إدارية مثل مدير، مسؤول، مدخل بيانات، محاسب، مندوب، أو أخصائي.',
            ]);
        }

        $unit = filled($data['department_unit_id'] ?? null)
            ? DepartmentUnit::query()->where('department_id', $department->id)->findOrFail($data['department_unit_id'])
            : DepartmentUnit::query()->firstOrCreate(
                ['department_id' => $department->id, 'code' => 'main'],
                ['name' => $department->name, 'sort_order' => 1],
            );

        DB::transaction(function () use ($department, $unit, $data): void {
            $this->createPosition(
                department: $department,
                unit: $unit,
                nameAr: $data['name_ar'],
                nameEn: $data['name_en'] ?? null,
                approved: (int) $data['approved_headcount'],
                allowSystemLogin: filter_var($data['allow_system_login'] ?? true, FILTER_VALIDATE_BOOLEAN),
            );

            $this->syncDepartmentHeadcount($department);
        });

        return back()->with('success', 'تم تكويد الوظيفة بواسطة الموارد البشرية.');
    }

    public function cancelDepartmentTree(Request $request, Department $department): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);
        abort_unless($this->isManagedDepartment($department), 404);

        DB::transaction(function () use ($department): void {
            $parent = $department->parent;

            $this->cancelDepartmentBranch($department);

            if ($parent) {
                $this->syncDepartmentHeadcount($parent);
            }
        });

        return back()->with('success', 'تم إلغاء القسم وكل التفرعات المرتبطة به دون حذف البيانات التاريخية.');
    }

    public function destroyDepartment(Request $request, Department $department): RedirectResponse
    {
        abort_unless($this->canHardDeleteDepartment($request->user()), 403);
        abort_unless($this->isManagedDepartment($department), 404);

        $blockers = $this->hardDeleteBlockers($department);

        if ($blockers !== []) {
            return back()->with('error', 'لا يمكن الحذف النهائي إلا إذا كان القسم فارغًا تمامًا. عناصر مرتبطة: '.implode('، ', $blockers).'. استخدم إلغاء القسم للحفاظ على السجل التاريخي.');
        }

        if ($department->children()->exists()) {
            return back()->with('error', 'لا يمكن حذف قسم يحتوي على أقسام فرعية. انقل أو احذف الأقسام الفرعية أولًا.');
        }

        if ($department->users()->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))->exists()) {
            return back()->with('error', 'لا يمكن حذف قسم عليه موظفون. انقل الموظفين أو احذفهم أولًا.');
        }

        DB::transaction(function () use ($department): void {
            $parent = $department->parent;

            $department->departmentPositions()->delete();
            $department->units()->delete();
            $department->positions()->delete();
            $department->delete();

            if ($parent) {
                $this->syncDepartmentHeadcount($parent);
            }
        });

        return back()->with('success', 'تم حذف القسم.');
    }
    public function updateHeadcount(Request $request, DepartmentPosition $departmentPosition): RedirectResponse
    {
        abort_unless($this->canManage($request->user()), 403);

        $data = $request->validate([
            'approved_headcount' => ['required', 'integer', 'min:0', 'max:999'],
            'allow_system_login' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);

        if (
            (int) $data['approved_headcount'] > 0
            && $departmentPosition->department
            && $this->departmentDoesNotUseWorkers($departmentPosition->department)
            && $this->isWorkerPosition($departmentPosition->position)
        ) {
            return back()->withErrors([
                'approved_headcount' => 'هذا القسم إداري ولا يستخدم عمال. اجعل العدد 0 أو استخدم وظيفة إدارية مناسبة.',
            ]);
        }

        $attributes = [
            'approved_headcount' => $data['approved_headcount'],
            'allow_system_login' => filter_var($data['allow_system_login'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'sort_order' => (int) ($data['sort_order'] ?? $departmentPosition->sort_order),
        ];

        if ($departmentPosition->department?->status === 'active' && ! $request->user()?->hasRole('admin') && ! $this->canApproveDepartment($request->user())) {
            abort_unless($this->canRequestDepartmentChange($request->user(), $departmentPosition->department), 403);

            $this->createHrDepartmentChangeRequest(
                requester: $request->user(),
                subject: $departmentPosition,
                attributes: $attributes,
                oldValues: $departmentPosition->only(array_keys($attributes)),
                reason: 'طلب تعديل اعتماد عدد وظيفة داخل القسم بواسطة مدير القسم.',
                payloadExtras: ['department_id_to_sync' => $departmentPosition->department_id],
            );

            return back()->with('success', 'تم إرسال تعديل اعتماد الوظيفة إلى HR ثم المدير العام للاعتماد. لن يظهر العدد الجديد إلا بعد اكتمال الاعتماد.');
        }

        DB::transaction(function () use ($departmentPosition, $data): void {
            $departmentPosition->update([
                'approved_headcount' => $data['approved_headcount'],
                'allow_system_login' => filter_var($data['allow_system_login'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'sort_order' => (int) ($data['sort_order'] ?? $departmentPosition->sort_order),
            ]);

            if ($departmentPosition->position) {
                $departmentPosition->position->update([
                    'required_headcount' => $data['approved_headcount'],
                ]);
            }

            $this->syncDepartmentHeadcount($departmentPosition->department);
        });

        return back()->with('success', 'تم تحديث العدد المعتمد.');
    }

    private function departmentRow(Department $department): array
    {
        $positions = $department->departmentPositions
            ->filter(fn (DepartmentPosition $departmentPosition) => $departmentPosition->position)
            ->map(fn (DepartmentPosition $departmentPosition) => $this->positionRow($departmentPosition))
            ->values();

        $units = $department->units
            ->whereNull('parent_id')
            ->map(function (DepartmentUnit $unit) use ($positions, $department) {
                $unitPositions = $positions
                    ->where('unit_id', $unit->id)
                    ->values();

                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'code' => $unit->code,
                    'department_id' => $department->id,
                    'positions' => $unitPositions,
                    'children' => $unit->children->map(fn (DepartmentUnit $child) => [
                        'id' => $child->id,
                        'name' => $child->name,
                        'code' => $child->code,
                    ])->values(),
                    'required' => $unitPositions->sum('approved'),
                    'current' => $unitPositions->sum('current'),
                    'vacant' => $unitPositions->sum('vacant'),
                    'surplus' => $unitPositions->sum('surplus'),
                    'coverage' => $unitPositions->sum('approved') > 0
                        ? round(min($unitPositions->sum('current'), $unitPositions->sum('approved')) / $unitPositions->sum('approved') * 100)
                        : 0,
                ];
            })
            ->values();

        $rootPositions = $positions->whereNull('unit_id')->values();
        $childDepartments = $department->children
            ->map(fn (Department $child) => $this->departmentRow($child))
            ->values();
        $positionsRequired = $positions->sum('approved');
        $manualRequired = max(0, (int) ($department->required_headcount ?? 0));
        $ownRequired = max($manualRequired, $positionsRequired);
        $required = $ownRequired + $childDepartments->sum('required');
        $directEmployees = $department->users()
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
        $ownCurrent = max($positions->sum('current'), $directEmployees);
        $current = $ownCurrent + $childDepartments->sum('current');

        return [
            'id' => $department->id,
            'name' => $department->name,
            'name_ar' => $department->name_ar ?? $department->name,
            'name_en' => $department->name_en,
            'code' => $department->code,
            'type' => $department->department_type,
            'cost_nature' => $department->cost_nature ?? 'indirect',
            'active' => (bool) ($department->active ?? true),
            'status' => $department->status ?? (($department->active ?? true) ? 'active' : 'paused'),
            'linked_modules' => $department->linked_modules ?? [],
            'system_role' => $department->systemRole ? [
                'id' => $department->systemRole->id,
                'name' => $department->systemRole->name,
                'slug' => $department->systemRole->slug,
                'name_ar' => $department->systemRole->name_ar,
                'name_en' => $department->systemRole->name_en,
            ] : null,
            'system_role_id' => $department->system_role_id,
            'created_at' => $department->created_at?->format('Y-m-d H:i'),
            'creator' => $department->creator ? [
                'id' => $department->creator->id,
                'name' => $department->creator->name,
            ] : null,
            'parent' => $department->parent ? [
                'id' => $department->parent->id,
                'name' => $department->parent->name,
                'name_ar' => $department->parent->name_ar ?? $department->parent->name,
                'name_en' => $department->parent->name_en,
                'code' => $department->parent->code,
            ] : null,
            'direct_manager' => $department->directManager ? [
                'id' => $department->directManager->id,
                'name' => $department->directManager->name,
                'employee_code' => $department->directManager->employee_code,
            ] : null,
            'child_departments' => $childDepartments,
            'positions' => $rootPositions,
            'units' => $units,
            'own_required' => $ownRequired,
            'required' => $required,
            'current' => $current,
            'vacant' => max(0, $required - $current),
            'surplus' => max(0, $current - $required),
            'coverage' => $required > 0 ? round(min($current, $required) / $required * 100) : 0,
        ];
    }

    private function positionRow(DepartmentPosition $departmentPosition): array
    {
        $position = $departmentPosition->position;
        $current = $position->users->count();
        $approved = max(0, (int) $departmentPosition->approved_headcount);

        return [
            'department_position_id' => $departmentPosition->id,
            'id' => $position->id,
            'name' => $position->name,
            'name_ar' => $position->name_ar ?? $position->name,
            'name_en' => $position->name_en,
            'code' => $position->code,
            'unit_id' => $departmentPosition->department_unit_id,
            'unit_name' => $departmentPosition->departmentUnit?->name,
            'unit_code' => $departmentPosition->departmentUnit?->code,
            'approved' => $approved,
            'allow_system_login' => (bool) $departmentPosition->allow_system_login,
            'approved_locked' => $departmentPosition->department?->status === 'active',
            'sort_order' => (int) $departmentPosition->sort_order,
            'current' => $current,
            'vacant' => max(0, $approved - $current),
            'surplus' => max(0, $current - $approved),
            'is_worker' => $this->isWorkerPosition($position),
        ];
    }

    private function managedDepartmentsQuery()
    {
        return Department::query();
    }

    private function isManagedDepartment(Department $department): bool
    {
        return true;
    }

    private function isDescendant(Department $candidate, Department $root): bool
    {
        $current = $candidate;

        while ($current->parent_id) {
            if ((int) $current->parent_id === (int) $root->id) {
                return true;
            }

            $current = Department::query()->find($current->parent_id);

            if (! $current) {
                return false;
            }
        }

        return false;
    }

    private function createPosition(Department $department, DepartmentUnit $unit, string $nameAr, ?string $nameEn, int $approved, bool $allowSystemLogin = true, ?int $sortOrder = null): void
    {
        $displayName = $nameAr ?: ($nameEn ?? '');
        $codeName = $nameEn ?: $displayName;

        $jobTitle = JobTitle::firstOrCreate(
            ['name' => $displayName],
            [
                'name_ar' => $nameAr,
                'name_en' => $nameEn,
                'code' => $this->uniqueCode('job_titles', $codeName, 'job'),
            ],
        );

        $jobTitle->update([
            'name_ar' => $jobTitle->name_ar ?: $nameAr,
            'name_en' => $jobTitle->name_en ?: $nameEn,
        ]);

        $position = Position::create([
            'department_id' => $department->id,
            'name' => $displayName,
            'name_ar' => $nameAr,
            'name_en' => $nameEn,
            'code' => $this->uniqueCode('positions', "{$department->code}_{$unit->code}_{$codeName}", 'pos'),
            'required_headcount' => $approved,
        ]);

        DepartmentPosition::create([
            'department_id' => $department->id,
            'department_unit_id' => $unit->id,
            'job_title_id' => $jobTitle->id,
            'position_id' => $position->id,
            'approved_headcount' => $approved,
            'allow_system_login' => $allowSystemLogin,
            'is_active' => true,
            'sort_order' => $sortOrder ?? (((int) DepartmentPosition::where('department_id', $department->id)->max('sort_order')) + 1),
        ]);
    }

    private function syncDepartmentHeadcount(Department $department): void
    {
        DepartmentPosition::query()
            ->where('department_id', $department->id)
            ->where('is_active', false)
            ->where('approved_headcount', '>', 0)
            ->get(['id', 'position_id'])
            ->each(function (DepartmentPosition $departmentPosition): void {
                $departmentPosition->update(['approved_headcount' => 0]);

                if ($departmentPosition->position_id) {
                    Position::query()
                        ->whereKey($departmentPosition->position_id)
                        ->update(['required_headcount' => 0]);
                }
            });

        $positionHeadcount = (int) DepartmentPosition::query()
            ->where('department_id', $department->id)
            ->where('is_active', true)
            ->sum('approved_headcount');

        $department->update([
            'required_headcount' => max((int) ($department->required_headcount ?? 0), $positionHeadcount),
        ]);
    }

    private function uniqueUnitCode(Department $department, string $name): string
    {
        $base = Str::slug($name, '_') ?: 'unit_'.substr(md5($name), 0, 8);
        $code = $base;
        $counter = 2;

        while (DepartmentUnit::where('department_id', $department->id)->where('code', $code)->exists()) {
            $code = "{$base}_{$counter}";
            $counter++;
        }

        return $code;
    }

    private function validPositionRows(array $rows): array
    {
        return collect($rows)
            ->map(fn ($row) => [
                'name_ar' => trim((string) ($row['name_ar'] ?? $row['name'] ?? '')),
                'name_en' => trim((string) ($row['name_en'] ?? '')),
                'approved_headcount' => max(0, (int) ($row['approved_headcount'] ?? 0)),
                'allow_system_login' => filter_var($row['allow_system_login'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ])
            ->filter(fn ($row) => filled($row['name_ar']) || filled($row['name_en']))
            ->map(fn ($row) => [
                ...$row,
                'name_ar' => $row['name_ar'] ?: $row['name_en'],
                'name_en' => $row['name_en'] ?: null,
            ])
            ->values()
            ->all();
    }

    private function departmentDoesNotUseWorkers(Department $department): bool
    {
        return in_array($department->code, self::NON_WORKER_DEPARTMENT_CODES, true);
    }

    private function isWorkerPosition(?Position $position): bool
    {
        if (! $position) {
            return false;
        }

        return $this->isWorkerPositionName($position->name_ar ?? $position->name, $position->name_en ?? $position->code);
    }

    private function isWorkerPositionName(?string $nameAr, ?string $nameEn = null): bool
    {
        $value = Str::lower(trim(($nameAr ?? '').' '.($nameEn ?? '')));

        return str_contains($value, 'عامل')
            || str_contains($value, 'عمال')
            || str_contains($value, 'worker')
            || str_contains($value, 'labor')
            || str_contains($value, 'labour');
    }

    private function nextDepartmentCode(string $englishName): string
    {
        $base = Str::slug($englishName, '_') ?: 'department';
        $code = $base;
        $counter = 2;

        while (Department::query()->where('code', $code)->exists()) {
            $code = "{$base}_{$counter}";
            $counter++;
        }

        return $code;
    }

    private function suggestModules(string $englishName, string $arabicName): array
    {
        $value = Str::lower($englishName.' '.$arabicName);
        $map = [
            'accounting' => ['accounting', 'finance', 'حساب', 'مالي'],
            'cost_accounting' => ['cost', 'تكاليف'],
            'sales' => ['sales', 'sale', 'مبيعات'],
            'customers' => ['customer', 'client', 'عميل'],
            'purchasing' => ['purchase', 'purchasing', 'مشتريات'],
            'suppliers' => ['supplier', 'vendor', 'مورد'],
            'inventory' => ['warehouse', 'store', 'inventory', 'مخزن', 'مخازن'],
            'stock_counts' => ['stock', 'جرد'],
            'production' => ['production', 'planning', 'انتاج', 'إنتاج', 'تخطيط'],
            'quality' => ['quality', 'lab', 'جودة', 'معمل'],
            'hr' => ['hr', 'human', 'موارد', 'بشرية'],
            'it' => ['it', 'information technology', 'technology', 'systems', 'support', 'software', 'network', 'نظم', 'تكنولوجيا', 'معلومات'],
            'payroll' => ['payroll', 'salary', 'رواتب'],
            'reports' => ['report', 'analysis', 'تقرير', 'تحليل'],
        ];

        return collect($map)
            ->filter(fn ($keywords) => collect($keywords)->contains(fn ($keyword) => str_contains($value, Str::lower($keyword))))
            ->keys()
            ->values()
            ->all();
    }

    private function uniqueCode(string $table, string $name, string $fallbackPrefix): string
    {
        $base = Str::slug($name, '_') ?: $fallbackPrefix.'_'.substr(md5($name), 0, 8);
        $code = $base;
        $counter = 2;

        while (DB::table($table)->where('code', $code)->exists()) {
            $code = "{$base}_{$counter}";
            $counter++;
        }

        return $code;
    }

    private function cancelDepartmentBranch(Department $department): void
    {
        $department->children()->get()->each(fn (Department $child) => $this->cancelDepartmentBranch($child));

        DepartmentPosition::query()
            ->where('department_id', $department->id)
            ->update([
                'is_active' => false,
                'approved_headcount' => 0,
            ]);

        Position::query()
            ->where('department_id', $department->id)
            ->update(['required_headcount' => 0]);

        $department->update([
            'active' => false,
            'status' => 'cancelled',
            'required_headcount' => 0,
        ]);
    }

    private function hardDeleteBlockers(Department $department): array
    {
        $blockers = [];

        if ($department->children()->exists()) {
            $blockers[] = 'أقسام فرعية';
        }

        if ($department->users()->exists()) {
            $blockers[] = 'موظفون';
        }

        if ($department->positions()->exists()) {
            $blockers[] = 'وظائف';
        }

        if ($department->departmentPositions()->exists()) {
            $blockers[] = 'اعتمادات وظائف';
        }

        if ($department->direct_manager_id) {
            $blockers[] = 'مدير مباشر مرتبط';
        }

        return $blockers;
    }

    private function createHrDepartmentChangeRequest(User $requester, Model $subject, array $attributes, array $oldValues, string $reason, array $payloadExtras = []): ChangeRequest
    {
        $hrDepartment = Department::query()
            ->whereIn('code', ['hr', 'human_resources'])
            ->first();

        $approvalDepartmentId = $hrDepartment?->id ?? $requester->department_id;

        $changeRequest = ChangeRequest::query()->create([
            'request_number' => $this->nextChangeRequestNumber(),
            'type' => Str::snake(class_basename($subject)).'_update',
            'subject_type' => $subject::class,
            'subject_id' => $subject->getKey(),
            'department_id' => $approvalDepartmentId,
            'requested_by' => $requester->id,
            'risk_level' => 'high',
            'status' => 'pending_department_manager',
            'reason' => $reason,
            'old_values' => $oldValues,
            'new_values' => $attributes,
            'payload' => [
                'action' => 'update',
                'model_class' => $subject::class,
                'attributes' => $attributes,
                'approval_flow' => 'hr_then_general_manager',
                'target_department_id' => $subject instanceof Department ? $subject->id : ($subject->department_id ?? null),
            ] + $payloadExtras,
        ]);

        $this->notifications->sendToUsers(
            $this->hrManagerRecipients(),
            "طلب تعديل قسم يحتاج اعتماد HR {$changeRequest->request_number}",
            "{$requester->name} أرسل طلب تعديل لا يتم تنفيذه إلا بعد اعتماد HR والمدير العام.",
            route('change-requests.index', ['focus' => $changeRequest->id]),
            $requester,
        );

        return $changeRequest;
    }

    private function nextChangeRequestNumber(): string
    {
        return 'CR-'.now()->format('Ymd').'-'.str_pad((string) (ChangeRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function hrManagerRecipients()
    {
        return User::query()
            ->where('status', 'active')
            ->whereHas('department', fn ($department) => $department->whereIn('code', ['hr', 'human_resources']))
            ->where(function ($query): void {
                $query
                    ->whereHas('role', fn ($role) => $role->whereIn('slug', ['hr', 'admin']))
                    ->orWhereHas('position', fn ($position) => $position->where('code', 'like', '%\_manager'));
            })
            ->get();
    }

    private function canManage(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission('view_users')
            || $user->hasPermission('view_departments')
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function canHardDeleteDepartment(?User $user): bool
    {
        return (bool) ($user?->hasRole('admin') || $user?->hasPermission('delete_department'));
    }

    private function canApproveDepartment(?User $user): bool
    {
        return (bool) ($user?->hasRole(['admin', 'general_manager']) || $user?->position?->code === 'general_manager');
    }

    private function canRequestDepartmentChange(?User $user, Department $department): bool
    {
        if (! $user) {
            return false;
        }

        if ((int) $department->direct_manager_id === (int) $user->id) {
            return true;
        }

        $positionCode = strtolower((string) $user->position?->code);
        $positionName = strtolower((string) $user->position?->name);

        return (int) $user->department_id === (int) $department->id
            && (str_ends_with($positionCode, '_manager')
                || $positionCode === 'department_manager'
                || str_contains($positionName, 'manager')
                || str_contains((string) $user->position?->name, 'مدير'));
    }

    private function canCodeDepartmentPositions(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $this->canCodeDepartmentStructure($user);
    }

    private function canCodeDepartmentStructure(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || in_array($user->position?->code, ['general_manager', 'hr_manager', 'hr_officer'], true);
    }

    private function canDeleteDepartment(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole('admin')
            || $user->hasPermission('delete_department');
    }
}
