<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('data_status')->default('approved')->after('status');
            $table->foreignId('data_reviewed_by')->nullable()->after('data_status')->constrained('users')->nullOnDelete();
            $table->timestamp('data_reviewed_at')->nullable()->after('data_reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('data_reviewed_by');
            $table->dropColumn(['data_status', 'data_reviewed_at']);
        });
    }
};
