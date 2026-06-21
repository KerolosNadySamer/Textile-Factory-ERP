<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOrderItem extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'production_order_id',
        'sales_order_item_id',
        'product_id',
        'color',
        'quality',
        'width',
        'weight',
        'quantity',
    ];

    protected $casts = [
        'width' => 'decimal:2',
        'weight' => 'decimal:2',
        'quantity' => 'decimal:2',
    ];

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class);
    }

    public function salesOrderItem(): BelongsTo
    {
        return $this->belongsTo(SalesOrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
