<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->after('id')->constrained('departments')->nullOnDelete();
            }

            if (! Schema::hasColumn('departments', 'cost_nature')) {
                $table->string('cost_nature')->default('indirect')->after('department_type');
            }

            if (! Schema::hasColumn('departments', 'active')) {
                $table->boolean('active')->default(true)->after('cost_nature');
            }
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'parent_id')) {
                $table->dropConstrainedForeignId('parent_id');
            }

            if (Schema::hasColumn('departments', 'cost_nature')) {
                $table->dropColumn('cost_nature');
            }

            if (Schema::hasColumn('departments', 'active')) {
                $table->dropColumn('active');
            }
        });
    }
};
