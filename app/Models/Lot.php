<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Lot extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'lot_number',
        'lot_type',
        'source_issue_order_id',
        'production_order_id',
        'parent_lot_id',
        'product_id',
        'color',
        'unit',
        'quantity',
        'lot_date',
        'status',
        'drop_number',
        'finish_year',
        'approved_sample_id',
        'supplier',
        'purchase_order',
        'purchase_price',
        'received_quantity',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'lot_date' => 'date',
        'purchase_price' => 'decimal:2',
        'received_quantity' => 'decimal:2',
    ];

    protected $appends = [
        'display_number',
    ];

    public function getDisplayNumberAttribute(): string
    {
        if ($this->lot_type === 'dyed_fabric' && $this->drop_number && $this->finish_year) {
            return "{$this->lot_number}/{$this->drop_number}/{$this->finish_year}";
        }

        return $this->lot_number;
    }

    public function sourceIssueOrder(): BelongsTo
    {
        return $this->belongsTo(IssueOrder::class, 'source_issue_order_id');
    }

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class);
    }

    public function parentLot(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_lot_id');
    }

    public function childLots(): HasMany
    {
        return $this->hasMany(self::class, 'parent_lot_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function samples(): HasMany
    {
        return $this->hasMany(LotSample::class);
    }

    public function approvedSample(): BelongsTo
    {
        return $this->belongsTo(LotSample::class, 'approved_sample_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(InventoryLedgerEntry::class);
    }

    public function costEntries(): HasMany
    {
        return $this->hasMany(CostEntry::class);
    }

    public function costSummary(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CostSummary::class);
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function isUsed(): bool
    {
        return $this->source_issue_order_id !== null
            || $this->production_order_id !== null
            || $this->samples()->exists()
            || $this->childLots()->exists()
            || $this->ledgerEntries()->exists();
    }
}
