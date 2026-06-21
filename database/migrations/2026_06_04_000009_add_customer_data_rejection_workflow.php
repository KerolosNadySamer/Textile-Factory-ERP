<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('data_rejected_by')->nullable()->after('sales_manager_approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('data_rejected_at')->nullable()->after('data_rejected_by');
            $table->string('data_rejection_stage')->nullable()->after('data_rejected_at');
            $table->text('data_rejection_reason')->nullable()->after('data_rejection_stage');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('data_rejected_by');
            $table->dropColumn(['data_rejected_at', 'data_rejection_stage', 'data_rejection_reason']);
        });
    }
};
