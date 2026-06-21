<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LotSample extends Model
{
    use HasFactory;

    protected $fillable = [
        'lot_id',
        'sample_number',
        'color',
        'recipe',
        'notes',
        'approved',
        'created_by',
    ];

    protected $casts = [
        'approved' => 'boolean',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
