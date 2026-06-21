<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NumberSequence extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'prefix',
        'next_number',
        'padding',
        'yearly',
        'current_year',
    ];

    protected $casts = [
        'yearly' => 'boolean',
    ];
}
