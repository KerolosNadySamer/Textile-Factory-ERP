<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeMonthlyReview extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id',
        'review_month',
        'salary_snapshot',
        'evaluation_score',
        'rating',
        'notes',
        'strengths',
        'improvements',
        'reviewed_by',
        'visible_to_employee',
    ];

    protected $casts = [
        'review_month' => 'date',
        'salary_snapshot' => 'decimal:2',
        'evaluation_score' => 'integer',
        'visible_to_employee' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
