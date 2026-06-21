<?php

namespace App\Services;

use App\Models\ActivityTimeline;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class TimelineService
{
    public function record(Model $subject, string $event, ?string $description = null, ?User $user = null): ActivityTimeline
    {
        return ActivityTimeline::create([
            'model_type' => $subject::class,
            'model_id' => $subject->getKey(),
            'event' => $event,
            'description' => $description,
            'user_id' => $user?->id,
            'department_id' => $user?->department_id,
        ]);
    }
}
