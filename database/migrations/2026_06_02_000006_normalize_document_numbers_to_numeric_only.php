<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->renumber('sales_orders', 'so_number', 6);
        $this->renumber('production_orders', 'production_number', 6);
        $this->renumber('issue_orders', 'issue_no', 6);
        $this->copyColumn('issue_orders', 'issue_no', 'lot_no');
        $this->renumber('dye_samples', 'sample_no', 3);
        $this->renumber('lots', 'lot_number', 6);
        $this->renumber('lot_samples', 'sample_number', 2);
    }

    public function down(): void
    {
        // Numeric document numbers are intentionally preserved.
    }

    private function renumber(string $table, string $column, int $padding): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $rows = DB::table($table)->orderBy('id')->get(['id']);

        $rows->each(function ($row) use ($table, $column): void {
            DB::table($table)
                ->where('id', $row->id)
                ->update([$column => '__tmp_'.$row->id]);
        });

        $rows->each(function ($row, int $index) use ($table, $column, $padding): void {
            DB::table($table)
                ->where('id', $row->id)
                ->update([$column => str_pad((string) ($index + 1), $padding, '0', STR_PAD_LEFT)]);
        });
    }

    private function copyColumn(string $table, string $from, string $to): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $from) || ! Schema::hasColumn($table, $to)) {
            return;
        }

        DB::table($table)->update([$to => DB::raw($from)]);
    }
};
