<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, LogsActivity, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'name_ar',
        'name_en',
        'email',
        'profile_photo_path',
        'employee_code',
        'phone',
        'national_id',
        'education_qualification',
        'address',
        'hired_at',
        'employment_type',
        'contract_start_date',
        'contract_end_date',
        'contract_duration_months',
        'contract_expiry_notice_days',
        'contract_expiry_notified_at',
        'basic_salary',
        'status',
        'login_enabled',
        'archived_at',
        'archived_by',
        'archived_reason',
        'password',
        'role_id',
        'department_id',
        'position_id',
        'manager_id',
        'customer_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'hired_at' => 'date',
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'contract_expiry_notified_at' => 'datetime',
        'basic_salary' => 'decimal:2',
        'login_enabled' => 'boolean',
        'archived_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? asset('storage/'.$this->profile_photo_path)
            : null;
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function managers()
    {
        return $this->belongsToMany(User::class, 'employee_manager', 'user_id', 'manager_id')->withTimestamps();
    }

    public function reports()
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    public function managedEmployees()
    {
        return $this->belongsToMany(User::class, 'employee_manager', 'manager_id', 'user_id')->withTimestamps();
    }

    public function warehouses()
    {
        return $this->belongsToMany(Warehouse::class, 'user_warehouse')->withTimestamps();
    }

    public function receivedNotifications()
    {
        return $this->hasMany(AppNotification::class, 'recipient_user_id');
    }

    public function hasRole(string|array $roles): bool
    {
        $roles = (array) $roles;

        return $this->role !== null && in_array($this->role->slug, $roles, true);
    }

    public function hasPermission(string|array $permissions): bool
    {
        if ($this->role === null) {
            return false;
        }

        if ($this->relationLoaded('role') && $this->role->relationLoaded('permissions')) {
            return $this->role->hasPermission($permissions);
        }

        $permissions = (array) $permissions;

        return $this->role()
            ->whereHas('permissions', fn ($query) => $query->whereIn('slug', $permissions))
            ->exists();
    }
}
