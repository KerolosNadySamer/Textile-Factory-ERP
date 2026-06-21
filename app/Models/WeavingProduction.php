<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class WeavingProduction extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'weaving_number',
        'production_date',
        'yarn_lot_no',
        'yarn_quantity',
        'raw_lot_no',
        'raw_quantity',
        'inspection_status',
        'sent_to_raw_warehouse_at',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'production_date' => 'date',
        'yarn_quantity' => 'decimal:2',
        'raw_quantity' => 'decimal:2',
        'sent_to_raw_warehouse_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }
}
