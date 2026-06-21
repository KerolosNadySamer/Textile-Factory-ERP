<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PilotFeedbackItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'page',
        'type',
        'finding_category',
        'priority',
        'status',
        'created_by',
        'assigned_department_id',
        'assigned_user_id',
        'reviewed_at',
        'closed_at',
        'resolution_notes',
        'ai_owner_suggestion',
        'ai_risk_suggestion',
        'ai_resolution_suggestion',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'closed_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignedDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'assigned_department_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
