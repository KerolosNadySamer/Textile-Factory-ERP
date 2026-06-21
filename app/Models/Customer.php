<?php

namespace App\Models;

use App\Models\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Customer extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'code',
        'internal_sequence',
        'barcode',
        'name',
        'name_ar',
        'name_en',
        'mobile',
        'phone',
        'email',
        'profile_photo_path',
        'tax_number',
        'commercial_register',
        'national_id',
        'national_id_image_path',
        'credit_limit',
        'wallet_balance',
        'payment_terms',
        'city',
        'address',
        'status',
        'data_status',
        'verification_tier',
        'data_reviewed_by',
        'data_reviewed_at',
        'sales_officer_approved_by',
        'sales_officer_approved_at',
        'sales_manager_approved_by',
        'sales_manager_approved_at',
        'data_rejected_by',
        'data_rejected_at',
        'data_rejection_stage',
        'data_rejection_reason',
        'notes',
        'active',
        'archived_at',
        'archived_by',
        'archived_reason',
        'accounting_statement_confirmed_at',
        'accounting_statement_confirmed_by',
        'created_by',
        'updated_by',
        'sales_rep_id',
    ];

    protected $casts = [
        'active' => 'boolean',
        'credit_limit' => 'decimal:2',
        'wallet_balance' => 'decimal:2',
        'data_reviewed_at' => 'datetime',
        'sales_officer_approved_at' => 'datetime',
        'sales_manager_approved_at' => 'datetime',
        'data_rejected_at' => 'datetime',
        'archived_at' => 'datetime',
        'accounting_statement_confirmed_at' => 'datetime',
    ];

    protected $appends = [
        'profile_photo_url',
        'national_id_image_url',
    ];

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? asset('storage/'.$this->profile_photo_path)
            : null;
    }

    public function getNationalIdImageUrlAttribute(): ?string
    {
        return $this->national_id_image_path
            ? asset('storage/'.$this->national_id_image_path)
            : null;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public function dataReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'data_reviewed_by');
    }

    public function salesOfficerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_officer_approved_by');
    }

    public function salesManagerApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_manager_approved_by');
    }

    public function dataRejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'data_rejected_by');
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }

    public function customerPayments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class);
    }

    public function portalUsers(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function orderMessages(): HasMany
    {
        return $this->hasMany(CustomerOrderMessage::class);
    }

    public function timeline(): MorphMany
    {
        return $this->morphMany(ActivityTimeline::class, 'subject', 'model_type', 'model_id');
    }
}
