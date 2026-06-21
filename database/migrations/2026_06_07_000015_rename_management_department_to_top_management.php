<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('departments')
            ->where('code', 'management')
            ->update([
                'name' => 'الإدارة العليا',
                'department_type' => 'administrative',
                'cost_nature' => 'indirect',
                'active' => true,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('departments')
            ->where('code', 'management')
            ->update([
                'name' => 'المدير العام',
                'updated_at' => now(),
            ]);
    }
};
