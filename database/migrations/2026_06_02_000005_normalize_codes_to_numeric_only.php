<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->renumber('users', 'employee_code', 4);
        $this->renumber('customers', 'code', 6);
        $this->copyColumn('customers', 'code', 'barcode');
        $this->renumber('products', 'code', 6);
        $this->renumber('suppliers', 'code', 6);
        $this->renumber('departments', 'code', 3);
        $this->renumber('warehouses', 'code', 3);
        $this->renumber('units', 'code', 3);
        $this->renumber('purchase_requests', 'pr_number', 6);
        $this->renumber('purchase_orders', 'po_number', 6);
        $this->renumber('goods_receipts', 'grn_number', 6);

        if (Schema::hasTable('number_sequences')) {
            DB::table('number_sequences')->update([
                'prefix' => null,
                'yearly' => false,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Historical numeric codes are intentionally preserved.
    }

    private function renumber(string $table, string $column, int $padding): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $rows = DB::table($table)
            ->orderBy('id')
            ->get(['id']);

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
