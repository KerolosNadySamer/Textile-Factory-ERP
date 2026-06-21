<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\RecruitmentRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationStructureController extends Controller
{
    public function tree(Request $request): Response
    {
        abort_unless($this->canView($request->user()), 403);

        return Inertia::render('OrganizationStructure/Index', [
            'tree' => [
                'name' => "\u{0627}\u{0644}\u{0625}\u{062F}\u{0627}\u{0631}\u{0629} \u{0627}\u{0644}\u{0639}\u{0644}\u{064A}\u{0627}",
                'children' => $this->departmentsTree(),
            ],
            'metrics' => $this->metrics(),
        ]);
    }

    public function approvedPositions(Request $request): Response
    {
        abort_unless($this->canView($request->user()), 403);

        return Inertia::render('ApprovedPositions/Index', [
            'positions' => $this->positionRows(),
            'metrics' => $this->metrics(),
        ]);
    }

    private function departmentsTree()
    {
        return Department::query()
            ->officialActive()
            ->whereNull('parent_id')
            ->with([
                'children',
                'units.children',
                'departmentPositions' => fn ($positions) => $positions
                    ->where('is_active', true)
                    ->with(['position:id,name,code', 'departmentUnit:id,name,code,parent_id']),
            ])
            ->orderBy('id')
            ->get()
            ->map(fn (Department $department) => $this->departmentTreeNode($department))
            ->values();
    }

    private function departmentTreeNode(Department $department): array
    {
        $department->loadMissing([
            'children' => fn ($children) => $children->where('active', true)->orderBy('name'),
            'units.children',
            'departmentPositions' => fn ($positions) => $positions
                ->where('is_active', true)
                ->with(['position:id,name,code', 'departmentUnit:id,name,code,parent_id']),
        ]);

        $rootPositions = $department->departmentPositions
            ->whereNull('department_unit_id')
            ->filter(fn ($departmentPosition) => $departmentPosition->position)
            ->map(fn ($departmentPosition) => [
                'id' => 'department-position-'.$departmentPosition->id,
                'name' => $departmentPosition->position->name,
                'type' => 'position',
                'approvedHeadcount' => (int) $departmentPosition->approved_headcount,
            ])
            ->values();

        $unitNodes = $department->units
            ->whereNull('parent_id')
            ->map(function ($unit) use ($department) {
                $unitPositions = $department->departmentPositions
                    ->where('department_unit_id', $unit->id)
                    ->filter(fn ($departmentPosition) => $departmentPosition->position)
                    ->map(fn ($departmentPosition) => [
                        'id' => 'position-'.$departmentPosition->id,
                        'name' => $departmentPosition->position->name,
                        'type' => 'position',
                        'approvedHeadcount' => (int) $departmentPosition->approved_headcount,
                    ])
                    ->values()
                    ->all();

                return [
                    'id' => 'unit-'.$unit->id,
                    'name' => $unit->name,
                    'code' => $unit->code,
                    'type' => 'unit',
                    'children' => [
                        ...$unit->children->map(fn ($child) => [
                            'id' => 'unit-'.$child->id,
                            'name' => $child->name,
                            'code' => $child->code,
                            'type' => 'unit',
                            'children' => [],
                        ])->all(),
                        ...$unitPositions,
                    ],
                ];
            })
            ->values();

        return [
            'id' => 'department-'.$department->id,
            'name' => $department->name,
            'code' => $department->code,
            'type' => 'department',
            'positions' => $rootPositions,
            'children' => [
                ...$unitNodes->all(),
                ...$department->children
                    ->where('active', true)
                    ->map(fn (Department $child) => $this->departmentTreeNode($child))
                    ->all(),
            ],
        ];
    }

    private function positionRows()
    {
        return Department::query()
            ->officialActive()
            ->with(['departmentPositions' => fn ($positions) => $positions
                ->where('is_active', true)
                ->with(['position:id,name,code,required_headcount', 'departmentUnit:id,name'])])
            ->orderBy('id')
            ->get()
            ->flatMap(fn (Department $department) => $department->departmentPositions
                ->filter(fn ($departmentPosition) => $departmentPosition->position)
                ->map(fn ($departmentPosition) => $this->departmentPositionRow($department, $departmentPosition)))
            ->values();
    }

    private function departmentPositionRow(Department $department, $departmentPosition): array
    {
        $position = $departmentPosition->position;
        $approved = (int) $departmentPosition->approved_headcount;
        $current = $this->currentEmployees($position->id);
        $openRequests = $this->openRecruitmentRequests($position->id);

        return [
            'id' => $departmentPosition->id,
            'department' => $department->name,
            'unit' => $departmentPosition->departmentUnit?->name ?? "\u{0642}\u{064A}\u{0627}\u{062F}\u{0629} \u{0627}\u{0644}\u{0642}\u{0633}\u{0645}",
            'jobTitle' => $position->name,
            'approved' => $approved,
            'current' => $current,
            'shortage' => max(0, $approved - $current),
            'surplus' => max(0, $current - $approved),
            'openRequests' => $openRequests,
            'availableForRecruitment' => max(0, $approved - $current - $openRequests),
            'coveragePercent' => $approved > 0 ? round(min($current, $approved) / $approved * 100) : 0,
        ];
    }

    private function metrics(): array
    {
        $rows = $this->positionRows();

        return [
            'approved' => $rows->sum('approved'),
            'current' => $rows->sum('current'),
            'shortage' => $rows->sum('shortage'),
            'surplus' => $rows->sum('surplus'),
            'openRequests' => $rows->sum('openRequests'),
            'availableForRecruitment' => $rows->sum('availableForRecruitment'),
        ];
    }

    private function currentEmployees(int $positionId): int
    {
        return User::query()
            ->where('position_id', $positionId)
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->count();
    }

    private function openRecruitmentRequests(int $positionId): int
    {
        return RecruitmentRequest::query()
            ->where('position_id', $positionId)
            ->whereNotIn('status', ['rejected', 'cancelled', 'hired', 'employee_created'])
            ->count();
    }

    private function canView(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission('view_users')
            || $user->hasPermission('view_departments');
    }
}
