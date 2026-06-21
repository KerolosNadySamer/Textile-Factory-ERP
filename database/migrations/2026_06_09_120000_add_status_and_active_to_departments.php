<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'status')) {
                $table->string('status')->default('active')->after('active');
            }

            if (! Schema::hasColumn('departments', 'active')) {
                $table->boolean('active')->default(true)->after('code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'status')) {
                $table->dropColumn('status');
            }

            if (Schema::hasColumn('departments', 'active')) {
                $table->dropColumn('active');
            }
        });
    }
};
