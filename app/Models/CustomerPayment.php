<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class CustomerPayment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'customer_id',
        'sales_order_id',
        'payment_number',
        'transaction_type',
        'amount',
        'method',
        'reference_number',
        'proof_path',
        'status',
        'payment_date',
        'check_number',
        'bank_name',
        'check_due_date',
        'notes',
        'created_by',
        'received_by',
        'treasury_received_by',
        'received_at',
        'treasury_received_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'check_due_date' => 'date',
        'received_at' => 'datetime',
        'treasury_received_at' => 'datetime',
    ];

    protected $appends = [
        'proof_url',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function treasuryReceiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'treasury_received_by');
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }

    public function getProofUrlAttribute(): ?string
    {
        return $this->proof_path ? asset('storage/'.$this->proof_path) : null;
    }
}
