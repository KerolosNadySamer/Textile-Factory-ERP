<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentUnit;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentEmployeeCodingController extends Controller
{
    public function __invoke(Request $request, Department $department): Response
    {
        $selectedUnit = $this->selectedUnit($request, $department);
        $positions = $this->positionsQuery($department, $selectedUnit)
            ->withCount(['users as employees_count' => fn ($users) => $users->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))])
            ->orderBy('name')
            ->get();

        $positionIds = $positions->pluck('id')->all();
        $managers = $this->departmentManagers($department, $selectedUnit);
        $departmentRole = $this->roleForDepartment($department, $selectedUnit);
        $currentHeadcount = User::query()
            ->where('department_id', $department->id)
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
        $requiredHeadcount = max(0, (int) $department->required_headcount);

        return Inertia::render('EmployeeDepartmentCoding/Show', [
            'selectedUnit' => $selectedUnit ? [
                'id' => $selectedUnit->id,
                'name' => $selectedUnit->name,
                'code' => $selectedUnit->code,
            ] : null,
            'department' => [
                'id' => $department->id,
                'name' => $selectedUnit ? $selectedUnit->name : $department->name,
                'main_name' => $department->name,
                'code' => $department->code,
                'required_headcount' => $department->required_headcount,
                'current_headcount' => $currentHeadcount,
                'vacant_headcount' => max(0, $requiredHeadcount - $currentHeadcount),
                'coding_closed' => $requiredHeadcount > 0 && $currentHeadcount >= $requiredHeadcount,
                'positions' => $positions->map(fn ($position) => [
                    'id' => $position->id,
                    'name' => $position->name,
                    'code' => $position->code,
                    'required_headcount' => $position->required_headcount,
                    'employees_count' => $position->employees_count,
                    'vacant_headcount' => max(0, (int) ($position->required_headcount ?? 0) - (int) $position->employees_count),
                ])->values(),
            ],
            'autoManagers' => $managers->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'name_ar' => $user->name_ar,
                'name_en' => $user->name_en,
                'position' => $user->position?->name,
                'position_code' => $user->position?->code,
            ])->values(),
            'departmentRole' => $departmentRole ? [
                'id' => $departmentRole->id,
                'name' => $departmentRole->name,
                'slug' => $departmentRole->slug,
                'name_ar' => $departmentRole->name_ar,
                'name_en' => $departmentRole->name_en,
            ] : null,
            'roles' => Role::query()
                ->where('slug', '!=', 'admin')
                ->orderBy('id')
                ->get(['id', 'name', 'slug', 'name_ar', 'name_en']),
            'employees' => User::query()
                ->with(['role', 'position', 'manager:id,name,name_ar,name_en', 'managers:id,name,name_ar,name_en', 'warehouses:id,name,code'])
                ->where('department_id', $department->id)
                ->when($selectedUnit, fn ($query) => $query->whereIn('position_id', $positionIds))
                ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                ->orderBy('name')
                ->get([
                    'id',
                    'employee_code',
                    'name',
                    'name_ar',
                    'name_en',
                    'email',
                    'profile_photo_path',
                    'phone',
                    'status',
                    'login_enabled',
                    'role_id',
                    'position_id',
                    'manager_id',
                    'created_at',
                ]),
            'warehouses' => Warehouse::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }

    private function selectedUnit(Request $request, Department $department): ?DepartmentUnit
    {
        $unitCode = $request->query('unit');

        if (! $unitCode) {
            return null;
        }

        return DepartmentUnit::query()
            ->where('department_id', $department->id)
            ->where('code', $unitCode)
            ->whereNull('parent_id')
            ->first();
    }

    private function positionsQuery(Department $department, ?DepartmentUnit $selectedUnit)
    {
        return Position::query()
            ->where('department_id', $department->id)
            ->whereHas('departmentPosition', function ($departmentPosition) use ($selectedUnit) {
                $departmentPosition->where('is_active', true);

                if ($selectedUnit) {
                    $departmentPosition->where('department_unit_id', $selectedUnit->id);
                }
            });
    }

    private function departmentManagers(Department $department, ?DepartmentUnit $selectedUnit = null)
    {
        $managerPositionIds = $selectedUnit
            ? $this->positionsQuery($department, $selectedUnit)
                ->where(function ($query) {
                    $query
                        ->where('code', 'like', '%manager%')
                        ->orWhere('code', 'like', '%officer%')
                        ->orWhere('name', 'like', '%مدير%')
                        ->orWhere('name', 'like', '%مسؤول%');
                })
                ->pluck('id')
                ->all()
            : [];

        $managers = User::query()
            ->with('position:id,name,code')
            ->where('department_id', $department->id)
            ->where('login_enabled', true)
            ->where('status', 'active')
            ->whereHas('position', fn ($query) => $query
                ->where('code', 'like', '%\_manager')
                ->orWhere('code', 'like', '%\_officer')
                ->orWhereIn('code', ['section_head', 'assistant_section_head'])
                ->when($managerPositionIds, fn ($positions) => $positions->orWhereIn('id', $managerPositionIds)))
            ->orderBy('name')
            ->get(['id', 'name', 'name_ar', 'name_en', 'department_id', 'position_id'])
            ->sortBy(fn (User $user) => str_ends_with((string) $user->position?->code, '_manager') || $user->position?->code === 'section_head' ? 0 : 1)
            ->values();

        $higherManagers = $this->higherManagerCandidates($department);

        return $managers
            ->concat($higherManagers)
            ->unique('id')
            ->values();
    }

    private function higherManagerCandidates(Department $department)
    {
        $parentManagerId = $department->parent?->direct_manager_id;

        return User::query()
            ->with('position:id,name,code')
            ->where('login_enabled', true)
            ->where('status', 'active')
            ->where(function ($query) use ($parentManagerId) {
                $query
                    ->when($parentManagerId, fn ($manager) => $manager->where('id', $parentManagerId))
                    ->orWhereHas('role', fn ($role) => $role->whereIn('slug', ['admin', 'general_manager']))
                    ->orWhereHas('position', fn ($position) => $position->where('code', 'general_manager'));
            })
            ->orderByRaw('CASE WHEN id = ? THEN 0 ELSE 1 END', [$parentManagerId ?: 0])
            ->orderBy('name')
            ->limit(3)
            ->get(['id', 'name', 'name_ar', 'name_en', 'department_id', 'position_id']);
    }

    private function roleForDepartment(Department $department, ?DepartmentUnit $selectedUnit = null): ?Role
    {
        if ($department->system_role_id) {
            $role = Role::query()
                ->whereKey($department->system_role_id)
                ->where('slug', '!=', 'admin')
                ->first(['id', 'name', 'slug', 'name_ar', 'name_en']);

            if ($role) {
                return $role;
            }
        }

        $roleSlug = $this->roleSlugForDepartment($department, $selectedUnit?->code);

        return Role::query()
            ->where('slug', $roleSlug)
            ->where('slug', '!=', 'admin')
            ->first(['id', 'name', 'slug', 'name_ar', 'name_en']);
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
            'top_management' => 'general_manager',
            'management' => 'general_manager',
            'hr' => 'hr',
            'human_resources' => 'hr',
            'hr_department' => 'hr',
            'it' => 'it',
            'information_technology' => 'it',
            'technology' => 'it',
            'costing' => 'cost_accountant',
            'cost_accounting' => 'cost_accountant',
            'production_planning' => $unitCode ?: 'production',
            'finance' => 'accounting',
        ][$department->code] ?? $department->code;
    }
}
