<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name_ar',
        'company_name_en',
        'company_logo',
        'company_address',
        'company_phone',
        'company_email',
    ];
}
