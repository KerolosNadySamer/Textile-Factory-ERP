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

        DB::table('department_units')
            ->where('department_id', $departmentId)
            ->where('code', 'main')
            ->update([
                'name' => 'قسم الإنتاج والتخطيط',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        //
    }
};
