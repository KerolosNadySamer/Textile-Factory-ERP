<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SalesOrder extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'so_number',
        'customer_id',
        'order_date',
        'required_delivery_date',
        'status',
        'source',
        'customer_submitted_at',
        'customer_visible_at',
        'sample_required',
        'sample_number',
        'customer_sample_sent',
        'customer_sample_lot_no',
        'approved_dye_sample_id',
        'priority',
        'order_total',
        'down_payment_amount',
        'down_payment_collected_amount',
        'customer_credit_used',
        'down_payment_method',
        'down_payment_status',
        'down_payment_received_by',
        'down_payment_collected_by',
        'down_payment_treasury_received_by',
        'down_payment_collection_notes',
        'down_payment_treasury_notes',
        'down_payment_received_at',
        'down_payment_treasury_received_at',
        'down_payment_check_number',
        'down_payment_bank_name',
        'down_payment_check_due_date',
        'notes',
        'production_notes',
        'invoice_number',
        'invoice_status',
        'invoiced_at',
        'shipping_number',
        'shipping_status',
        'shipping_company',
        'vehicle_number',
        'driver_name',
        'shipped_quantity',
        'rolls_count',
        'delivered_at',
        'closed_at',
        'closed_by',
        'closure_notes',
        'created_by',
        'updated_by',
        'reviewed_by',
        'reviewed_at',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'order_date' => 'date',
        'required_delivery_date' => 'date',
        'sample_required' => 'boolean',
        'customer_sample_sent' => 'boolean',
        'order_total' => 'decimal:2',
        'down_payment_amount' => 'decimal:2',
        'down_payment_collected_amount' => 'decimal:2',
        'customer_credit_used' => 'decimal:2',
        'down_payment_received_at' => 'datetime',
        'down_payment_treasury_received_at' => 'datetime',
        'down_payment_check_due_date' => 'date',
        'invoiced_at' => 'datetime',
        'shipped_quantity' => 'decimal:2',
        'delivered_at' => 'datetime',
        'closed_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'customer_submitted_at' => 'datetime',
        'customer_visible_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function productionOrders(): HasMany
    {
        return $this->hasMany(ProductionOrder::class);
    }

    public function approvedDyeSample(): BelongsTo
    {
        return $this->belongsTo(DyeSample::class, 'approved_dye_sample_id');
    }

    public function customerPayments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CustomerOrderMessage::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'down_payment_collected_by');
    }

    public function treasuryReceiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'down_payment_treasury_received_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }
}
