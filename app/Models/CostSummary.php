<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CostSummary extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'lot_id',
        'material_cost',
        'production_cost',
        'dyeing_cost',
        'overhead_cost',
        'total_cost',
        'unit_cost',
        'status',
        'calculated_by',
        'reviewed_by',
        'reviewed_at',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'material_cost' => 'decimal:2',
        'production_cost' => 'decimal:2',
        'dyeing_cost' => 'decimal:2',
        'overhead_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'unit_cost' => 'decimal:4',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }
}
