<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class DyeSample extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'sample_no',
        'sample_sequence',
        'issue_no',
        'sales_order_id',
        'raw_lot_no',
        'product_id',
        'requested_color',
        'sample_color',
        'recipe',
        'dyeing_notes',
        'status',
        'created_by',
        'planning_approved_by',
        'planning_approved_at',
        'dyeing_manager_approved_by',
        'dyeing_manager_approved_at',
        'sales_officer_approved_by',
        'sales_officer_approved_at',
        'sales_manager_approved_by',
        'sales_manager_approved_at',
        'general_manager_approved_by',
        'general_manager_approved_at',
        'sales_approved_by',
        'sales_approved_at',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'planning_approved_at' => 'datetime',
        'dyeing_manager_approved_at' => 'datetime',
        'sales_officer_approved_at' => 'datetime',
        'sales_manager_approved_at' => 'datetime',
        'general_manager_approved_at' => 'datetime',
        'sales_approved_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function planningApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'planning_approved_by');
    }

    public function dyeingManagerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dyeing_manager_approved_by');
    }

    public function salesOfficerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_officer_approved_by');
    }

    public function salesManagerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_manager_approved_by');
    }

    public function generalManagerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'general_manager_approved_by');
    }

    public function salesApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_approved_by');
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }
}
