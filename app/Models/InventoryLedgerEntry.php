<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLedgerEntry extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'entry_date',
        'document_type',
        'document_number',
        'lot_id',
        'product_id',
        'in_qty',
        'out_qty',
        'balance',
        'unit_cost',
        'total_cost',
        'department_id',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'in_qty' => 'decimal:2',
        'out_qty' => 'decimal:2',
        'balance' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
