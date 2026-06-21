<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_code')->nullable()->unique()->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->string('national_id')->nullable()->unique()->after('phone');
            $table->text('address')->nullable()->after('national_id');
            $table->date('hired_at')->nullable()->after('address');
            $table->decimal('basic_salary', 12, 2)->nullable()->after('hired_at');
            $table->string('status')->default('active')->after('basic_salary');
            $table->foreignId('manager_id')->nullable()->after('position_id')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('manager_id');
            $table->dropColumn([
                'employee_code',
                'phone',
                'national_id',
                'address',
                'hired_at',
                'basic_salary',
                'status',
            ]);
        });
    }
};
