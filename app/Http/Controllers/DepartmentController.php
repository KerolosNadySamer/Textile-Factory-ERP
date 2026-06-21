<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ActivityTimeline;
use App\Models\AppNotification;
use App\Models\Department;
use App\Models\DepartmentPosition;
use App\Models\DepartmentUnit;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Warehouse;

class DepartmentController extends Controller
{
    private const DEPARTMENT_ORDER = ['top_management', 'management', 'hr', 'finance', 'sales', 'purchasing', 'production_planning'];

    public function index(): Response
    {
        try {
            $departments = Department::query()
                ->officialActive()
                ->with([
                    'directManager:id,name,employee_code',
                    'parent:id,name,code',
                    'warehouses:id,department_id,code,name,location,active',
                    'children' => fn ($children) => $children
                        ->officialActive()
                        ->with([
                            'directManager:id,name,employee_code',
                            'warehouses:id,department_id,code,name,location,active',
                            'units.children',
                            'departmentPositions' => fn ($positions) => $positions
                                ->where('is_active', true)
                                ->with([
                                    'jobTitle:id,name,name_ar,name_en',
                                    'departmentUnit:id,code,name,parent_id',
                                    'position.users' => fn ($users) => $users
                                        ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                                        ->select('users.id', 'users.department_id', 'users.position_id'),
                                ])
                                ->orderBy('sort_order'),
                        ]),
                    'units.children',
                    'departmentPositions' => fn ($positions) => $positions
                        ->where('is_active', true)
                        ->with([
                            'jobTitle:id,name,name_ar,name_en',
                            'departmentUnit:id,code,name,parent_id',
                            'position.users' => fn ($users) => $users
                                ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                                ->select('users.id', 'users.department_id', 'users.position_id'),
                        ])
                        ->orderBy('sort_order'),
                ])
                ->get();

            return Inertia::render('MasterData/Departments', [
                'generalManager' => $this->generalManagerNode(
                    $departments->firstWhere('code', 'top_management') ?? $departments->firstWhere('code', 'management')
                ),
                'departments' => $departments
                    ->whereNull('parent_id')
                    ->sortBy(fn (Department $department) => $this->departmentSortKey($department))
                    ->map(fn (Department $department) => $this->departmentNode($department))
                    ->values(),
            ]);
        } catch (\Throwable $e) {
            // Log for debugging and return safe UI response so frontend doesn't show a white screen
            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'department_index_error',
                'model_type' => Department::class,
                'model_id' => null,
                'new_values' => ['message' => $e->getMessage()],
            ]);

            session()->flash('error', 'Error loading departments: ' . ($e->getMessage() ?? 'Unexpected error'));

            return Inertia::render('MasterData/Departments', [
                'generalManager' => $this->generalManagerNode(null),
                'departments' => [],
            ]);
        }
    }

    private function generalManagerNode(?Department $department): array
    {
        return [
            'id' => $department?->id,
            'code' => 'general_manager',
            'name_ar' => 'المدير العام',
            'name_en' => 'General Manager',
            'name' => 'المدير العام',
        ];
    }

    private function departmentNode(Department $department): array
    {
        // make relations access null-safe to avoid runtime exceptions in the view
        $unitsCollection = collect($department->units ?? []);
        $rootUnits = $unitsCollection->whereNull('parent_id')->values();
        $leadership = collect($department->departmentPositions ?? [])
            ->whereNull('department_unit_id')
            ->map(fn ($position) => $this->positionNode($position))
            ->values();

        if ($rootUnits->count() === 1 && $rootUnits->first()->code === 'main') {
            $mainUnit = $rootUnits->first();

            return [
                'id' => $department->id,
                'code' => $department->code,
                'name' => $department->name,
                'name_ar' => $department->name_ar ?? $department->name,
                'name_en' => $department->name_en,
                ...$this->departmentMetrics($department),
                'direct_manager' => $this->managerNode($department),
                'child_departments' => collect($department->children ?? [])->sortBy(fn (Department $child) => $this->departmentSortKey($child))
                    ->map(fn (Department $child) => $this->departmentNode($child))
                    ->values(),
                'positions' => collect($department->departmentPositions ?? [])->where('department_unit_id', $mainUnit->id)
                    ->map(fn ($position) => $this->positionNode($position))
                    ->values(),
                'units' => [],
                'warehouses' => collect($department->warehouses ?? [])->map(fn($w) => [
                    'id' => $w->id,
                    'code' => $w->code,
                    'name' => $w->name,
                    'location' => $w->location,
                    'active' => (bool) ($w->active ?? false),
                ])->values(),
            ];
        }

        return [
            'id' => $department->id,
            'code' => $department->code,
            'name' => $department->name,
            'name_ar' => $department->name_ar ?? $department->name,
            'name_en' => $department->name_en,
            ...$this->departmentMetrics($department),
            'direct_manager' => $this->managerNode($department),
            'child_departments' => collect($department->children ?? [])->sortBy(fn (Department $child) => $this->departmentSortKey($child))
                ->map(fn (Department $child) => $this->departmentNode($child))
                ->values(),
            'positions' => $leadership,
            'units' => $rootUnits->map(fn ($unit) => [
                'id' => $unit->id,
                'department_id' => $department->id,
                'code' => $unit->code,
                'name' => $unit->name,
                'children' => collect($unit->children ?? [])->map(fn ($child) => ['id' => $child->id, 'code' => $child->code, 'name' => $child->name])
                    ->values(),
                'positions' => collect($department->departmentPositions ?? [])->where('department_unit_id', $unit->id)
                    ->map(fn ($position) => $this->positionNode($position))
                    ->values(),
            ])->values(),
            'warehouses' => collect($department->warehouses ?? [])->map(fn($w) => [
                'id' => $w->id,
                'code' => $w->code,
                'name' => $w->name,
                'location' => $w->location,
                'active' => (bool) ($w->active ?? false),
            ])->values(),
        ];
    }

    private function positionNode($departmentPosition): array
    {
        $approved = max(0, (int) $departmentPosition->approved_headcount);
        $current = $departmentPosition->position?->users?->count() ?? 0;

        return [
            'id' => $departmentPosition->id,
            'name' => $departmentPosition->jobTitle?->name ?? '-',
            'name_ar' => $departmentPosition->jobTitle?->name_ar ?? $departmentPosition->jobTitle?->name ?? '-',
            'name_en' => $departmentPosition->jobTitle?->name_en,
            'approved' => $approved,
            'current' => $current,
            'vacant' => max(0, $approved - $current),
            'surplus' => max(0, $current - $approved),
        ];
    }

    private function departmentMetrics(Department $department): array
    {
        $positionsRequired = $department->departmentPositions->sum(fn ($position) => max(0, (int) $position->approved_headcount));
        $required = max(max(0, (int) ($department->required_headcount ?? 0)), $positionsRequired);
        $current = $department->users()
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();

        return [
            'required' => $required,
            'current' => $current,
            'vacant' => max(0, $required - $current),
            'surplus' => max(0, $current - $required),
            'coverage' => $required > 0 ? round(min($current, $required) / $required * 100) : 0,
        ];
    }

    private function managerNode(Department $department): ?array
    {
        return $department->directManager ? [
            'id' => $department->directManager->id,
            'name' => $department->directManager->name,
            'employee_code' => $department->directManager->employee_code,
        ] : null;
    }

    private function departmentSortKey(Department $department): string
    {
        $officialIndex = array_search($department->code, self::DEPARTMENT_ORDER, true);

        return $officialIndex === false
            ? '99-'.str_pad((string) $department->id, 6, '0', STR_PAD_LEFT)
            : str_pad((string) $officialIndex, 2, '0', STR_PAD_LEFT);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'parent_id' => 'nullable|exists:departments,id',
        ]);

        $department = Department::create($data + ['created_by' => $request->user()->id]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'created_department',
            'model_type' => Department::class,
            'model_id' => $department->id,
            'new_values' => $department->toArray(),
        ]);

        return back()->with('success', 'Department created');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'code' => "required|string|max:50|unique:departments,code,{$department->id}",
            'parent_id' => 'nullable|exists:departments,id',
        ]);

        $old = $department->toArray();
        $department->update($data);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'updated_department',
            'model_type' => Department::class,
            'model_id' => $department->id,
            'old_values' => $old,
            'new_values' => $department->toArray(),
        ]);

        return back()->with('success', 'Department updated');
    }

    public function deactivate(Request $request, Department $department): RedirectResponse
    {
        $countChildren = $department->children()->count();
        $countUsers = $department->users()->count();

        // if user confirmed recursive, do it; otherwise show summary (handled client-side normally)
        if ($request->boolean('recursive')) {
            $department->deactivateRecursive();

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'deactivated_department_recursive',
                'model_type' => Department::class,
                'model_id' => $department->id,
                'old_values' => null,
                'new_values' => ['status' => Department::STATUS_INACTIVE],
            ]);

            return back()->with('success', 'Department and children deactivated');
        }

        return back()->with('warning', "Department has {$countChildren} sub-departments and {$countUsers} users. Confirm recursive deactivation.");
    }

    public function archive(Request $request, Department $department): RedirectResponse
    {
        $department->archiveRecursive();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'archived_department_recursive',
            'model_type' => Department::class,
            'model_id' => $department->id,
            'old_values' => null,
            'new_values' => ['status' => Department::STATUS_ARCHIVED],
        ]);

        return back()->with('success', 'Department archived');
    }

    private function collectSubtreeIds(Department $department): array
    {
        $ids = [$department->id];
        foreach ($department->children as $child) {
            $ids = array_merge($ids, $this->collectSubtreeIds($child));
        }

        return $ids;
    }

    public function transferChildren(Request $request, Department $department): RedirectResponse
    {
        $data = $request->validate([
            'target_department_id' => 'nullable|exists:departments,id',
            'move_recursive' => 'boolean',
        ]);

        $targetId = $data['target_department_id'] ?? null;

        $children = $department->children()->get();

        foreach ($children as $child) {
            $child->update(['parent_id' => $targetId]);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'transferred_department_children',
            'model_type' => Department::class,
            'model_id' => $department->id,
            'new_values' => ['target_department_id' => $targetId, 'moved_children_count' => $children->count()],
        ]);

        return back()->with('success', 'Children transferred');
    }

    public function destroy(Request $request, Department $department): RedirectResponse
    {
        // Force delete path: admin-only, can be recursive
        if ($request->boolean('force')) {
            // only allow if current user is admin role
            $currentUser = $request->user();
            if (! ($currentUser && ($currentUser->role?->slug ?? null) === 'admin')) {
                return back()->with('error', 'Force delete requires admin privileges.');
            }

            $ids = $request->boolean('recursive') ? $this->collectSubtreeIds($department) : [$department->id];

            try {
                DB::transaction(function () use ($ids, $currentUser) {
                    // detach warehouses (preserve warehouses but unlink from departments)
                    Warehouse::whereIn('department_id', $ids)->update(['department_id' => null]);

                    // delete notifications and timelines
                    AppNotification::whereIn('recipient_department_id', $ids)->orWhereIn('sender_department_id', $ids)->delete();
                    ActivityTimeline::whereIn('department_id', $ids)->delete();

                    // delete department positions and units
                    DepartmentPosition::whereIn('department_id', $ids)->delete();
                    DepartmentUnit::whereIn('department_id', $ids)->delete();

                    // delete non-admin users in those departments
                    User::whereIn('department_id', $ids)
                        ->whereDoesntHave('role', fn($q) => $q->where('slug', 'admin'))
                        ->delete();

                    // finally delete departments
                    Department::whereIn('id', $ids)->delete();

                    ActivityLog::create([
                        'user_id' => $currentUser->id,
                        'action' => 'force_deleted_department',
                        'model_type' => Department::class,
                        'model_id' => $ids[0] ?? null,
                        'old_values' => ['ids' => $ids],
                    ]);
                });

                return back()->with('success', 'Department(s) force-deleted successfully.');
            } catch (QueryException $e) {
                return back()->with('error', 'Unable to force-delete due to database error: ' . $e->getMessage());
            }
        }

        // existing behavior: allow recursive permanent delete if requested
        if ($request->boolean('recursive')) {
            $ids = $this->collectSubtreeIds($department);

            $counts = [
                'users' => User::whereIn('department_id', $ids)->count(),
                'positions' => DepartmentPosition::whereIn('department_id', $ids)->count(),
                'units' => DepartmentUnit::whereIn('department_id', $ids)->count(),
                'activity_timelines' => ActivityTimeline::whereIn('department_id', $ids)->count(),
                'notifications' => AppNotification::whereIn('recipient_department_id', $ids)->orWhereIn('sender_department_id', $ids)->count(),
            ];

            $nonZero = array_filter($counts, fn($c) => $c > 0);
            if (count($nonZero) > 0) {
                $parts = array_map(fn($k, $v) => "{$k}: {$v}", array_keys($nonZero), array_values($nonZero));
                return back()->with('error', 'Cannot recursively delete. Related data exists: '.implode(', ', $parts));
            }

            try {
                ActivityLog::create([
                    'user_id' => $request->user()->id,
                    'action' => 'deleted_department_recursive',
                    'model_type' => Department::class,
                    'model_id' => $department->id,
                    'old_values' => ['ids' => $ids],
                ]);

                Department::whereIn('id', $ids)->delete();

                return back()->with('success', 'Department and subtree permanently deleted');
            } catch (QueryException $e) {
                return back()->with('error', 'Unable to delete department due to database constraints: '.$e->getMessage());
            }
        }

        // check common dependent data
        $counts = [
            'users' => $department->users()->count(),
            'positions' => $department->departmentPositions()->count(),
            'units' => $department->units()->count(),
            'children' => $department->children()->count(),
            'activity_timelines' => ActivityTimeline::where('department_id', $department->id)->count(),
            'notifications' => AppNotification::where('recipient_department_id', $department->id)->orWhere('sender_department_id', $department->id)->count(),
        ];

        $nonZero = array_filter($counts, fn($c) => $c > 0);

        if (count($nonZero) > 0) {
            $parts = array_map(fn($k, $v) => "{$k}: {$v}", array_keys($nonZero), array_values($nonZero));
            return back()->with('error', 'Department cannot be deleted because related data exists: '.implode(', ', $parts).'. Consider deactivating or archiving instead or use force-delete (admin only).');
        }

        try {
            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'deleted_department',
                'model_type' => Department::class,
                'model_id' => $department->id,
                'old_values' => $department->toArray(),
            ]);

            $department->delete();

            return back()->with('success', 'Department permanently deleted');
        } catch (QueryException $e) {
            // return helpful message when DB foreign key prevents deletion
            return back()->with('error', 'Unable to delete department due to database constraints: '.$e->getMessage());
        }
    }
}
