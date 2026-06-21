<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $positionIds = DB::table('department_positions')
            ->where('is_active', false)
            ->where('approved_headcount', '>', 0)
            ->whereNotNull('position_id')
            ->pluck('position_id');

        DB::table('department_positions')
            ->where('is_active', false)
            ->where('approved_headcount', '>', 0)
            ->update(['approved_headcount' => 0]);

        if ($positionIds->isNotEmpty()) {
            DB::table('positions')
                ->whereIn('id', $positionIds)
                ->update(['required_headcount' => 0]);
        }
    }

    public function down(): void
    {
        // Existing inactive headcounts were stale operational data; do not restore them.
    }
};
