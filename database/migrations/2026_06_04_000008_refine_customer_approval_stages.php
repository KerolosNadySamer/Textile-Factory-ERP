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
            $table->foreignId('sales_officer_approved_by')->nullable()->after('data_reviewed_at')->constrained('users')->nullOnDelete();
            $table->timestamp('sales_officer_approved_at')->nullable()->after('sales_officer_approved_by');
            $table->foreignId('sales_manager_approved_by')->nullable()->after('sales_officer_approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('sales_manager_approved_at')->nullable()->after('sales_manager_approved_by');
        });

        DB::table('customers')
            ->where('data_status', 'pending_review')
            ->update(['data_status' => 'pending_sales_officer']);
    }

    public function down(): void
    {
        DB::table('customers')
            ->where('data_status', 'pending_sales_officer')
            ->update(['data_status' => 'pending_review']);

        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sales_officer_approved_by');
            $table->dropColumn('sales_officer_approved_at');
            $table->dropConstrainedForeignId('sales_manager_approved_by');
            $table->dropColumn('sales_manager_approved_at');
        });
    }
};
