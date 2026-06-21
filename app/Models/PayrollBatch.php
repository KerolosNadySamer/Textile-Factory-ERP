<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollBatch extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'batch_number',
        'payroll_month',
        'status',
        'notes',
        'uploaded_by',
        'uploaded_at',
        'hr_reviewed_by',
        'hr_reviewed_at',
        'hr_approved_by',
        'hr_approved_at',
        'general_manager_approved_by',
        'general_manager_approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'executed_at',
    ];

    protected $casts = [
        'payroll_month' => 'date',
        'uploaded_at' => 'datetime',
        'hr_reviewed_at' => 'datetime',
        'hr_approved_at' => 'datetime',
        'general_manager_approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'executed_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
