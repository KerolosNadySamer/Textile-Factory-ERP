<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentPosition extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'department_unit_id',
        'job_title_id',
        'position_id',
        'approved_headcount',
        'allow_system_login',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'approved_headcount' => 'integer',
        'allow_system_login' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function departmentUnit()
    {
        return $this->belongsTo(DepartmentUnit::class);
    }

    public function jobTitle()
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }
}
