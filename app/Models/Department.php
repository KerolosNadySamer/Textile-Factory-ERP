<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'name_en',
        'code',
        'parent_id',
        'department_type',
        'cost_nature',
        'active',
        'status',
        'linked_modules',
        'system_role_id',
        'created_by',
        'direct_manager_id',
        'required_headcount',
    ];

    protected $casts = [
        'required_headcount' => 'integer',
        'active' => 'boolean',
        'linked_modules' => 'array',
        'status' => 'string',
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_PENDING_GENERAL_MANAGER = 'pending_general_manager';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_ARCHIVED = 'archived';
    public const STATUS_CANCELLED = 'cancelled';

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('name');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function directManager()
    {
        return $this->belongsTo(User::class, 'direct_manager_id');
    }

    public function systemRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'system_role_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function positions()
    {
        return $this->hasMany(Position::class);
    }

    public function units()
    {
        return $this->hasMany(DepartmentUnit::class)->orderBy('sort_order')->orderBy('name');
    }

    public function departmentPositions()
    {
        return $this->hasMany(DepartmentPosition::class)->orderBy('sort_order');
    }

    public function warehouses()
    {
        return $this->hasMany(\App\Models\Warehouse::class)->orderBy('name');
    }

    public function scopeOfficialActive($query)
    {
        return $query->where('active', true)->where('status', self::STATUS_ACTIVE);
    }

    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function deactivateRecursive(): void
    {
        $this->update(['active' => false, 'status' => self::STATUS_INACTIVE]);

        foreach ($this->children as $child) {
            $child->deactivateRecursive();
        }
    }

    public function archiveRecursive(): void
    {
        $this->update(['active' => false, 'status' => self::STATUS_ARCHIVED]);

        foreach ($this->children as $child) {
            $child->archiveRecursive();
        }
    }

    public function canBePermanentlyDeleted(): bool
    {
        // check no users, no positions, no children
        return $this->users()->count() === 0
            && $this->departmentPositions()->count() === 0
            && $this->children()->count() === 0;
    }
}
