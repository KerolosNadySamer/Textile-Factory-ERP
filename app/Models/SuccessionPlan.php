<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuccessionPlan extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'department_id',
        'position_id',
        'incumbent_id',
        'successor_id',
        'candidate_order',
        'readiness',
        'readiness_percent',
        'risk_level',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'candidate_order' => 'integer',
        'readiness_percent' => 'integer',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function incumbent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'incumbent_id');
    }

    public function successor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'successor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
