<?php

namespace App\Models\Concerns;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model): void {
            $model->writeActivityLog('created', null, $model->activityValues($model->getAttributes()));
        });

        static::updated(function (Model $model): void {
            $changes = array_keys($model->getChanges());
            $changes = array_values(array_diff($changes, ['updated_at']));

            if ($changes === []) {
                return;
            }

            $oldValues = [];
            $newValues = [];

            foreach ($changes as $field) {
                $oldValues[$field] = $model->getOriginal($field);
                $newValues[$field] = $model->getAttribute($field);
            }

            $model->writeActivityLog(
                'updated',
                $model->activityValues($oldValues),
                $model->activityValues($newValues),
            );
        });

        static::deleted(function (Model $model): void {
            $model->writeActivityLog('deleted', $model->activityValues($model->getOriginal()), null);
        });
    }

    protected function writeActivityLog(string $action, ?array $oldValues, ?array $newValues): void
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => static::class,
            'model_id' => $this->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }

    protected function activityValues(array $values): array
    {
        $hidden = array_merge(
            ['password', 'remember_token'],
            property_exists($this, 'activityHidden') ? $this->activityHidden : [],
        );

        foreach ($hidden as $field) {
            unset($values[$field]);
        }

        return $values;
    }
}
