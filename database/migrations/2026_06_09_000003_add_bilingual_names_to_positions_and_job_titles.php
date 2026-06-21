<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            if (! Schema::hasColumn('positions', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('name');
            }

            if (! Schema::hasColumn('positions', 'name_en')) {
                $table->string('name_en')->nullable()->after('name_ar');
            }
        });

        Schema::table('job_titles', function (Blueprint $table) {
            if (! Schema::hasColumn('job_titles', 'name_ar')) {
                $table->string('name_ar')->nullable()->after('name');
            }

            if (! Schema::hasColumn('job_titles', 'name_en')) {
                $table->string('name_en')->nullable()->after('name_ar');
            }
        });

        DB::table('positions')
            ->whereNull('name_ar')
            ->update(['name_ar' => DB::raw('name')]);

        DB::table('job_titles')
            ->whereNull('name_ar')
            ->update(['name_ar' => DB::raw('name')]);
    }

    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            if (Schema::hasColumn('positions', 'name_en')) {
                $table->dropColumn('name_en');
            }

            if (Schema::hasColumn('positions', 'name_ar')) {
                $table->dropColumn('name_ar');
            }
        });

        Schema::table('job_titles', function (Blueprint $table) {
            if (Schema::hasColumn('job_titles', 'name_en')) {
                $table->dropColumn('name_en');
            }

            if (Schema::hasColumn('job_titles', 'name_ar')) {
                $table->dropColumn('name_ar');
            }
        });
    }
};
