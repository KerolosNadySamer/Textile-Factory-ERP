<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class IssueOrder extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'issue_no',
        'lot_no',
        'customer_id',
        'product_id',
        'fabric_type',
        'color',
        'quantity',
        'unit',
        'issue_date',
        'notes',
        'stock_deducted',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'issue_date' => 'date',
        'stock_deducted' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }
}
