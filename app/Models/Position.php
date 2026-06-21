<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'name',
        'name_ar',
        'name_en',
        'code',
        'required_headcount',
    ];

    protected $casts = [
        'required_headcount' => 'integer',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function successionPlans()
    {
        return $this->hasMany(SuccessionPlan::class);
    }

    public function departmentPosition()
    {
        return $this->hasOne(DepartmentPosition::class);
    }
}
