<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_ar');
            $table->string('mobile')->nullable()->after('name_en');
            $table->string('commercial_register')->nullable()->after('tax_number');
            $table->decimal('credit_limit', 14, 2)->default(0)->after('commercial_register');
            $table->string('payment_terms')->nullable()->after('credit_limit');
            $table->string('status')->default('active')->after('payment_terms');
            $table->text('notes')->nullable()->after('address');
            $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
        });

        DB::table('customers')->whereNull('name_ar')->update([
            'name_ar' => DB::raw('name'),
            'status' => DB::raw("CASE WHEN active = 1 THEN 'active' ELSE 'inactive' END"),
        ]);
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('updated_by');
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn([
                'name_ar',
                'name_en',
                'mobile',
                'commercial_register',
                'credit_limit',
                'payment_terms',
                'status',
                'notes',
            ]);
        });
    }
};
