<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $departmentId = DB::table('departments')->where('code', 'production_planning')->value('id');

        if (! $departmentId) {
            return;
        }

        $unitId = DB::table('department_units')
            ->where('department_id', $departmentId)
            ->where('code', 'main')
            ->value('id');

        if (! $unitId) {
            return;
        }

        DB::table('department_positions')
            ->where('department_unit_id', $unitId)
            ->update([
                'department_unit_id' => null,
                'is_active' => true,
                'updated_at' => now(),
            ]);

        DB::table('department_units')
            ->where('id', $unitId)
            ->delete();
    }

    public function down(): void
    {
        //
    }
};
