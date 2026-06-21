<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeePromotionRequest extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'request_number',
        'employee_id',
        'from_department_id',
        'from_position_id',
        'to_department_id',
        'to_position_id',
        'requested_by',
        'promotion_type',
        'status',
        'reason',
        'hr_approved_by',
        'hr_approved_at',
        'general_manager_approved_by',
        'general_manager_approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'executed_by',
        'executed_at',
    ];

    protected $casts = [
        'hr_approved_at' => 'datetime',
        'general_manager_approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'executed_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function fromPosition(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'from_position_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function toPosition(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'to_position_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
