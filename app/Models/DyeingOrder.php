<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class DyeingOrder extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'dyeing_number',
        'sales_order_id',
        'dye_sample_id',
        'raw_lot_no',
        'dyeing_entry_no',
        'drop_number',
        'finish_year',
        'final_lot_no',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'drop_number' => 'integer',
        'finish_year' => 'integer',
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function dyeSample(): BelongsTo
    {
        return $this->belongsTo(DyeSample::class);
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
