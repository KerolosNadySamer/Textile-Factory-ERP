<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('User')->after('password');
            $table->string('status')->default('Active')->after('role');
            $table->boolean('is_system')->default(false)->after('status');
            $table->foreignId('employee_id')->nullable()->after('is_system')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('employee_id');
            $table->dropColumn(['role', 'status', 'is_system']);
        });
    }
};
