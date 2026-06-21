<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Department;
use App\Models\EmployeeMonthlyReview;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeCvController extends Controller
{
    public function __invoke(User $user): Response
    {
        $user->load(['role', 'department', 'position', 'manager', 'managers', 'warehouses']);

        $logs = ActivityLog::query()
            ->with('user:id,name')
            ->where('model_type', User::class)
            ->where('model_id', $user->id)
            ->oldest()
            ->get();

        $departmentIds = $this->collectIds($logs, 'department_id')->push($user->department_id)->filter()->unique();
        $positionIds = $this->collectIds($logs, 'position_id')->push($user->position_id)->filter()->unique();
        $roleIds = $this->collectIds($logs, 'role_id')->push($user->role_id)->filter()->unique();
        $managerIds = $this->collectIds($logs, 'manager_id')->push($user->manager_id)->filter()->unique();

        $departments = Department::whereIn('id', $departmentIds)->pluck('name', 'id');
        $positions = Position::whereIn('id', $positionIds)->pluck('name', 'id');
        $roles = Role::whereIn('id', $roleIds)->get()->mapWithKeys(
            fn (Role $role) => [$role->id => $role->name_ar ?? $role->name_en ?? $role->name ?? $role->slug]
        );
        $managers = User::whereIn('id', $managerIds)->pluck('name', 'id');

        return Inertia::render('EmployeeCv/Show', [
            'employee' => [
                'id' => $user->id,
                'employee_code' => $user->employee_code,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'national_id' => $user->national_id,
                'education_qualification' => $user->education_qualification,
                'address' => $user->address,
                'hired_at' => optional($user->hired_at)->toDateString(),
                'basic_salary' => $user->basic_salary,
                'status' => $user->status,
                'login_enabled' => $user->login_enabled,
                'created_at' => optional($user->created_at)->toDateTimeString(),
                'role' => $user->role,
                'department' => $user->department,
                'position' => $user->position,
                'manager' => $user->manager,
                'managers' => $user->managers,
                'warehouses' => $user->warehouses,
                'profile_photo_url' => $user->profile_photo_url,
            ],
            'salaryHistory' => $this->historyFor($logs, 'basic_salary', $user->basic_salary),
            'departmentHistory' => $this->historyFor($logs, 'department_id', $user->department_id, $departments),
            'positionHistory' => $this->historyFor($logs, 'position_id', $user->position_id, $positions),
            'statusHistory' => $this->historyFor($logs, 'status', $user->status),
            'accountHistory' => [
                'login' => $this->historyFor($logs, 'login_enabled', $user->login_enabled),
                'role' => $this->historyFor($logs, 'role_id', $user->role_id, $roles),
                'manager' => $this->historyFor($logs, 'manager_id', $user->manager_id, $managers),
            ],
            'monthlyReviews' => EmployeeMonthlyReview::query()
                ->with('reviewer:id,name')
                ->where('user_id', $user->id)
                ->latest('review_month')
                ->get(),
            'activityTimeline' => $this->activityTimeline($logs, [
                'department_id' => $departments,
                'position_id' => $positions,
                'role_id' => $roles,
                'manager_id' => $managers,
            ]),
        ]);
    }

    private function collectIds(Collection $logs, string $field): Collection
    {
        return $logs->flatMap(function (ActivityLog $log) use ($field) {
            return [
                $log->old_values[$field] ?? null,
                $log->new_values[$field] ?? null,
            ];
        });
    }

    private function historyFor(Collection $logs, string $field, mixed $currentValue, ?Collection $labels = null): array
    {
        $history = $logs
            ->filter(fn (ActivityLog $log) => $this->hasValue($log->old_values, $field) || $this->hasValue($log->new_values, $field))
            ->filter(function (ActivityLog $log) use ($field) {
                $oldValue = $log->old_values[$field] ?? null;
                $newValue = $log->new_values[$field] ?? null;

                return $log->action === 'created' || (string) $oldValue !== (string) $newValue;
            })
            ->map(fn (ActivityLog $log) => $this->historyRow($log, $field, $labels))
            ->values()
            ->all();

        if ($history === [] && $currentValue !== null && $currentValue !== '') {
            $history[] = [
                'date' => null,
                'action' => 'current',
                'actor' => null,
                'old_value' => null,
                'new_value' => $currentValue,
                'old_label' => null,
                'new_label' => $this->labelValue($currentValue, $labels),
                'delta' => null,
            ];
        }

        return $history;
    }

    private function historyRow(ActivityLog $log, string $field, ?Collection $labels = null): array
    {
        $oldValue = $log->old_values[$field] ?? null;
        $newValue = $log->new_values[$field] ?? null;

        return [
            'date' => optional($log->created_at)->toDateTimeString(),
            'action' => $log->action,
            'actor' => $log->user?->name,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'old_label' => $this->labelValue($oldValue, $labels),
            'new_label' => $this->labelValue($newValue, $labels),
            'delta' => is_numeric($oldValue) && is_numeric($newValue) ? round((float) $newValue - (float) $oldValue, 2) : null,
        ];
    }

    private function activityTimeline(Collection $logs, array $lookups): array
    {
        $trackedFields = [
            'basic_salary',
            'education_qualification',
            'department_id',
            'position_id',
            'status',
            'login_enabled',
            'role_id',
            'manager_id',
            'hired_at',
        ];

        return $logs
            ->reverse()
            ->map(function (ActivityLog $log) use ($trackedFields, $lookups) {
                $changes = collect($trackedFields)
                    ->filter(fn (string $field) => $this->hasValue($log->old_values, $field) || $this->hasValue($log->new_values, $field))
                    ->filter(fn (string $field) => $log->action === 'created' || (string) ($log->old_values[$field] ?? null) !== (string) ($log->new_values[$field] ?? null))
                    ->map(function (string $field) use ($log, $lookups) {
                        $lookup = $lookups[$field] ?? null;

                        return [
                            'field' => $field,
                            'old_value' => $log->old_values[$field] ?? null,
                            'new_value' => $log->new_values[$field] ?? null,
                            'old_label' => $this->labelValue($log->old_values[$field] ?? null, $lookup),
                            'new_label' => $this->labelValue($log->new_values[$field] ?? null, $lookup),
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'id' => $log->id,
                    'date' => optional($log->created_at)->toDateTimeString(),
                    'action' => $log->action,
                    'actor' => $log->user?->name,
                    'changes' => $changes,
                ];
            })
            ->filter(fn (array $row) => count($row['changes']) > 0)
            ->values()
            ->all();
    }

    private function hasValue(?array $values, string $field): bool
    {
        return is_array($values) && array_key_exists($field, $values);
    }

    private function labelValue(mixed $value, ?Collection $labels = null): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $labels?->get($value) ?? $value;
    }
}
