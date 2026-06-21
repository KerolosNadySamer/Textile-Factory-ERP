<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecruitmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'candidate_name',
        'candidate_phone',
        'candidate_email',
        'department_id',
        'position_id',
        'manager_id',
        'requested_by',
        'status',
        'request_kind',
        'requested_headcount',
        'hired_headcount',
        'employment_type',
        'planned_start_date',
        'contract_start_date',
        'contract_end_date',
        'contract_duration_months',
        'contract_expiry_notice_days',
        'contract_expiry_notified_at',
        'proposed_salary',
        'national_id',
        'reason',
        'qualifications',
        'department_officer_approved_at',
        'department_officer_approved_by',
        'department_manager_approved_at',
        'department_manager_approved_by',
        'hr_approved_at',
        'hr_approved_by',
        'general_manager_approved_at',
        'general_manager_approved_by',
        'hr_nominated_at',
        'hr_nominated_by',
        'candidate_department_approved_at',
        'candidate_department_approved_by',
        'candidate_hr_approved_at',
        'candidate_hr_approved_by',
        'candidate_general_manager_approved_at',
        'candidate_general_manager_approved_by',
        'hr_final_approved_at',
        'hr_final_approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
        'employee_id',
    ];

    protected $casts = [
        'planned_start_date' => 'date',
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'contract_expiry_notified_at' => 'datetime',
        'proposed_salary' => 'decimal:2',
        'qualifications' => 'array',
        'requested_headcount' => 'integer',
        'hired_headcount' => 'integer',
        'department_officer_approved_at' => 'datetime',
        'department_manager_approved_at' => 'datetime',
        'hr_approved_at' => 'datetime',
        'general_manager_approved_at' => 'datetime',
        'hr_nominated_at' => 'datetime',
        'candidate_department_approved_at' => 'datetime',
        'candidate_hr_approved_at' => 'datetime',
        'candidate_general_manager_approved_at' => 'datetime',
        'hr_final_approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
