<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('department_positions', function (Blueprint $table) {
            if (! Schema::hasColumn('department_positions', 'allow_system_login')) {
                $table->boolean('allow_system_login')->default(true)->after('approved_headcount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('department_positions', function (Blueprint $table) {
            if (Schema::hasColumn('department_positions', 'allow_system_login')) {
                $table->dropColumn('allow_system_login');
            }
        });
    }
};
