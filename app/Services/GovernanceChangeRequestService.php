<?php

namespace App\Services;

use App\Models\ChangeRequest;
use App\Models\Customer;
use App\Models\Department;
use App\Models\DepartmentPosition;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GovernanceChangeRequestService
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {
    }

    public function requestCreate(User $requester, string $modelClass, array $attributes, string $reason = '', array $payloadExtras = []): ChangeRequest
    {
        return $this->createRequest($requester, 'create', $modelClass, null, null, $attributes, $reason, $payloadExtras);
    }

    public function requestUpdate(User $requester, Model $model, array $attributes, string $reason = '', array $payloadExtras = []): ChangeRequest
    {
        return $this->createRequest($requester, 'update', $model::class, $model->getKey(), $model->only(array_keys($attributes)), $attributes, $reason, $payloadExtras);
    }

    public function requestDelete(User $requester, Model $model, string $reason = ''): ChangeRequest
    {
        return $this->createRequest($requester, 'delete', $model::class, $model->getKey(), $model->getAttributes(), null, $reason);
    }

    public function execute(ChangeRequest $changeRequest, User $executor): void
    {
        DB::transaction(function () use ($changeRequest, $executor): void {
            $payload = $changeRequest->payload ?? [];
            $modelClass = $payload['model_class'] ?? $changeRequest->subject_type;
            $action = $payload['action'] ?? null;
            $attributes = $payload['attributes'] ?? [];

            if (! is_string($modelClass) || ! class_exists($modelClass)) {
                return;
            }

            if ($action === 'create') {
                /** @var Model $model */
                $model = $modelClass::create($attributes);
                $this->syncModelRelations($model, $payload);
                $this->syncDepartmentManager($model);
                $changeRequest->subject_id = $model->getKey();
            }

            if ($action === 'update' && $changeRequest->subject_id) {
                /** @var Model|null $model */
                $model = $modelClass::query()->find($changeRequest->subject_id);

                if ($model) {
                    $model->update($attributes);
                    $this->syncModelRelations($model, $payload);
                    $this->syncDepartmentManager($model);
                    $this->syncDepartmentApprovalTotals($model, $payload);
                }
            }

            if ($action === 'delete' && $changeRequest->subject_id) {
                /** @var Model|null $model */
                $model = $modelClass::query()->find($changeRequest->subject_id);
                $this->cleanupBeforeDelete($model);
                $model?->delete();
            }

            $changeRequest->update([
                'subject_id' => $changeRequest->subject_id,
                'status' => 'executed',
                'department_manager_approved_by' => $changeRequest->department_manager_approved_by ?: $executor->id,
                'department_manager_approved_at' => $changeRequest->department_manager_approved_at ?: now(),
                'executed_by' => $executor->id,
                'executed_at' => now(),
            ]);
        });
    }

    private function createRequest(User $requester, string $action, string $modelClass, ?int $subjectId, ?array $oldValues, ?array $newValues, string $reason, array $payloadExtras = []): ChangeRequest
    {
        $type = $this->typeFor($modelClass, $action);
        $initialStatus = $this->initialStatusFor($requester);

        $changeRequest = ChangeRequest::create([
            'request_number' => $this->nextRequestNumber(),
            'type' => $type,
            'subject_type' => $modelClass,
            'subject_id' => $subjectId,
            'department_id' => $requester->department_id,
            'requested_by' => $requester->id,
            'risk_level' => $this->riskFor($modelClass, $action, $oldValues ?? [], $newValues ?? []),
            'status' => $initialStatus,
            'reason' => $reason !== '' ? $reason : $this->defaultReason($type),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'payload' => [
                'action' => $action,
                'model_class' => $modelClass,
                'attributes' => $newValues,
            ] + $payloadExtras,
        ]);

        if ($this->shouldExecuteImmediately($requester)) {
            $this->execute($changeRequest, $requester);

            return $changeRequest->fresh();
        }

        $recipients = $initialStatus === 'pending_department_manager'
            ? $this->departmentManagerRecipients($requester)
            : $this->departmentOfficerRecipients($requester);

        $this->notifications->sendToUsers(
            $recipients,
            "Change request needs approval {$changeRequest->request_number}",
            "A {$action} request on {$this->shortModelName($modelClass)} was created by {$requester->name}.",
            route('change-requests.index'),
            $requester,
        );

        return $changeRequest;
    }

    private function riskFor(string $modelClass, string $action, array $oldValues, array $newValues): string
    {
        if ($action === 'delete') {
            return 'critical';
        }

        $shortName = class_basename($modelClass);

        if (in_array($shortName, ['User', 'Role', 'Permission', 'CostSummary'], true)) {
            return 'critical';
        }

        if ($shortName === 'Product' && array_key_exists('price', $newValues) && (string) ($oldValues['price'] ?? '') !== (string) $newValues['price']) {
            return 'high';
        }

        if (array_intersect(array_keys($newValues), ['price', 'unit_price', 'total_cost', 'unit_cost'])) {
            return 'high';
        }

        if ($action === 'create') {
            return 'medium';
        }

        return 'low';
    }

    private function typeFor(string $modelClass, string $action): string
    {
        return Str::snake(class_basename($modelClass))."_{$action}";
    }

    private function defaultReason(string $type): string
    {
        return "Governance approval required for {$type}.";
    }

    private function nextRequestNumber(): string
    {
        return 'CR-'.now()->format('Ymd').'-'.str_pad((string) (ChangeRequest::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }

    private function departmentOfficerRecipients(User $requester): Collection
    {
        return User::query()
            ->where('status', 'active')
            ->where('department_id', $requester->department_id)
            ->whereHas('position', fn ($position) => $position->where('code', 'like', '%\_officer'))
            ->get();
    }

    private function departmentManagerRecipients(User $requester): Collection
    {
        return User::query()
            ->where('status', 'active')
            ->where('department_id', $requester->department_id)
            ->whereHas('position', fn ($position) => $position->where('code', 'like', '%\_manager'))
            ->get();
    }

    private function initialStatusFor(User $requester): string
    {
        return $this->isHrUser($requester)
            ? 'pending_department_manager'
            : 'pending_department_officer';
    }

    private function shouldExecuteImmediately(User $requester): bool
    {
        return $requester->hasRole(['admin', 'general_manager']);
    }

    private function isHrUser(User $requester): bool
    {
        if (! $requester->relationLoaded('department')) {
            $requester->load('department');
        }

        return $requester->department?->code === 'hr' || $requester->hasRole('hr');
    }

    private function syncModelRelations(Model $model, array $payload): void
    {
        if (method_exists($model, 'managers') && array_key_exists('manager_ids', $payload)) {
            $model->managers()->sync($payload['manager_ids'] ?? []);
        }

        if (method_exists($model, 'warehouses') && array_key_exists('warehouse_ids', $payload)) {
            $model->warehouses()->sync($payload['warehouse_ids'] ?? []);
        }
    }

    private function syncDepartmentManager(Model $model): void
    {
        if (! $model instanceof User) {
            return;
        }

        Department::query()
            ->where('direct_manager_id', $model->id)
            ->when($model->department_id, fn ($query) => $query->where('id', '<>', $model->department_id))
            ->update(['direct_manager_id' => null]);

        if (! $model->department_id) {
            return;
        }

        $model->loadMissing(['department', 'position.departmentPosition.departmentUnit']);
        $department = $model->department;

        if (! $department) {
            return;
        }

        if ($this->isDepartmentManagerEmployee($model)) {
            $department->update(['direct_manager_id' => $model->id]);
            $department->refresh();
        } elseif ((int) $department->direct_manager_id === (int) $model->id) {
            $department->update(['direct_manager_id' => null]);
            $department->refresh();
        }

        $managerId = (int) $department->direct_manager_id;

        if ($managerId && $managerId !== (int) $model->id) {
            $model->forceFill(['manager_id' => $managerId])->save();
            $model->managers()->sync([$managerId]);

            return;
        }

        if (! $managerId || $managerId !== (int) $model->id) {
            return;
        }

        $unitId = $model->position?->departmentPosition?->department_unit_id;

        User::query()
            ->where('department_id', $model->department_id)
            ->where('id', '<>', $model->id)
            ->where(function ($query) use ($model) {
                $query
                    ->whereNull('manager_id')
                    ->orWhere('manager_id', '<>', $model->id)
                    ->orWhereDoesntHave('managers');
            })
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
            ->when($unitId, fn ($query) => $query->whereHas('position.departmentPosition', fn ($departmentPosition) => $departmentPosition->where('department_unit_id', $unitId)))
            ->get()
            ->each(function (User $employee) use ($model): void {
                $employee->forceFill(['manager_id' => $model->id])->save();
                $employee->managers()->sync([$model->id]);
            });
    }

    private function syncDepartmentApprovalTotals(Model $model, array $payload): void
    {
        if ($model instanceof DepartmentPosition) {
            if ($model->position) {
                $model->position->update([
                    'required_headcount' => max(0, (int) $model->approved_headcount),
                ]);
            }

            if ($model->department) {
                $this->syncDepartmentHeadcount($model->department);
            }

            return;
        }

        if (! $model instanceof Department) {
            return;
        }

        $this->syncDepartmentHeadcount($model);

        $oldParentId = $payload['old_parent_id'] ?? null;

        if ($oldParentId) {
            $oldParent = Department::query()->find($oldParentId);

            if ($oldParent) {
                $this->syncDepartmentHeadcount($oldParent);
            }
        }

        if ($model->parent) {
            $this->syncDepartmentHeadcount($model->parent);
        }
    }

    private function syncDepartmentHeadcount(Department $department): void
    {
        $positionHeadcount = (int) DepartmentPosition::query()
            ->where('department_id', $department->id)
            ->where('is_active', true)
            ->sum('approved_headcount');

        $department->update([
            'required_headcount' => max((int) ($department->required_headcount ?? 0), $positionHeadcount),
        ]);
    }

    private function isDepartmentManagerEmployee(User $user): bool
    {
        $user->loadMissing('position');
        $code = strtolower((string) $user->position?->code);
        $name = (string) $user->position?->name;

        return str_ends_with($code, '_manager')
            || in_array($code, ['general_manager', 'department_manager', 'section_head'], true)
            || str_contains($name, "\u{0645}\u{062F}\u{064A}\u{0631}")
            || str_contains(strtolower($name), 'manager');
    }

    private function cleanupBeforeDelete(?Model $model): void
    {
        if (! $model instanceof Customer) {
            return;
        }

        User::query()
            ->where('customer_id', $model->id)
            ->whereHas('role', fn ($role) => $role->where('slug', 'customer'))
            ->delete();
    }

    private function shortModelName(string $modelClass): string
    {
        return class_basename($modelClass);
    }
}
