<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $departmentId = DB::table('departments')->where('code', 'it')->value('id');

        if (! $departmentId) {
            return;
        }

        DB::table('department_positions')
            ->where('department_id', $departmentId)
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);

        DB::table('departments')
            ->where('id', $departmentId)
            ->update([
                'required_headcount' => 0,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        //
    }
};
