<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('departments', 'required_headcount')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->unsignedSmallInteger('required_headcount')->default(0)->after('code');
            });
        }

        DB::table('departments')
            ->leftJoin('positions', 'departments.id', '=', 'positions.department_id')
            ->select('departments.id', DB::raw('COALESCE(SUM(positions.required_headcount), 0) as positions_headcount'))
            ->groupBy('departments.id')
            ->orderBy('departments.id')
            ->each(function ($department) {
                DB::table('departments')
                    ->where('id', $department->id)
                    ->update(['required_headcount' => (int) $department->positions_headcount]);
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('departments', 'required_headcount')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropColumn('required_headcount');
            });
        }
    }
};
