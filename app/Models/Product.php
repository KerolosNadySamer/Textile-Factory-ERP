<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'code',
        'name',
        'type',
        'quality',
        'unit',
        'width',
        'weight',
        'price',
        'tax',
        'active',
    ];

    protected $casts = [
        'width' => 'decimal:2',
        'weight' => 'decimal:2',
        'price' => 'decimal:2',
        'tax' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function salesOrderItems(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function inventoryLedgerEntries(): HasMany
    {
        return $this->hasMany(InventoryLedgerEntry::class);
    }
}
