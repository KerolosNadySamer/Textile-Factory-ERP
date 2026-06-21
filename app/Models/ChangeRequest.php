<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'type',
        'subject_type',
        'subject_id',
        'department_id',
        'requested_by',
        'risk_level',
        'status',
        'reason',
        'old_values',
        'new_values',
        'payload',
        'department_officer_approved_by',
        'department_officer_approved_at',
        'department_manager_approved_by',
        'department_manager_approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'executed_by',
        'executed_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'payload' => 'array',
        'department_officer_approved_at' => 'datetime',
        'department_manager_approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'executed_at' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function officerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'department_officer_approved_by');
    }

    public function managerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'department_manager_approved_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executed_by');
    }
}
