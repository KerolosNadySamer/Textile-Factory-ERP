<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('name');
            }

            if (! Schema::hasColumn('departments', 'name_en')) {
                $table->string('name_en')->nullable()->after('name_ar');
            }

            if (! Schema::hasColumn('departments', 'status')) {
                $table->string('status')->default('active')->after('active');
            }

            if (! Schema::hasColumn('departments', 'linked_modules')) {
                $table->json('linked_modules')->nullable()->after('status');
            }

            if (! Schema::hasColumn('departments', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('linked_modules')->constrained('users')->nullOnDelete();
            }
        });

        DB::table('departments')
            ->whereNull('name_ar')
            ->update(['name_ar' => DB::raw('name')]);
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }

            foreach (['linked_modules', 'status', 'name_en', 'name_ar'] as $column) {
                if (Schema::hasColumn('departments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
