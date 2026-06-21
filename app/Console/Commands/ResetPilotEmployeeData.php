<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetPilotEmployeeData extends Command
{
    protected $signature = 'pilot:reset-employee-data {--force : Run without confirmation}';

    protected $description = 'Clear old notifications and employee/admin operational data while keeping one admin account.';

    public function handle(): int
    {
        $admin = User::query()
            ->whereHas('role', fn ($role) => $role->where('slug', 'admin'))
            ->orderBy('id')
            ->first();

        if (! $admin) {
            $this->error('No admin account was found. Reset aborted.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm("This will delete employee records and notifications, keeping only admin #{$admin->id} ({$admin->email}). Continue?")) {
            $this->warn('Reset cancelled.');

            return self::SUCCESS;
        }

        $driver = DB::getDriverName();

        try {
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = OFF');
            }

            $this->truncateIfExists([
                'app_notifications',
                'employee_manager',
                'user_warehouse',
                'employee_monthly_reviews',
                'employee_transfer_requests',
                'employee_promotion_requests',
                'succession_plans',
                'payroll_items',
                'payroll_batches',
                'recruitment_requests',
                'change_requests',
            ]);

            $this->nullUserReferences([
                'departments' => ['direct_manager_id'],
                'customers' => ['sales_rep_id', 'created_by', 'updated_by', 'data_reviewed_by', 'sales_officer_approved_by', 'sales_manager_approved_by', 'data_rejected_by'],
                'suppliers' => ['created_by', 'updated_by'],
                'products' => ['created_by', 'updated_by'],
                'dye_samples' => ['created_by', 'planning_approved_by', 'sales_approved_by', 'rejected_by'],
                'issue_orders' => ['created_by'],
                'sales_orders' => ['created_by', 'updated_by', 'reviewed_by', 'approved_by', 'rejected_by'],
                'production_orders' => ['created_by', 'updated_by', 'released_by', 'closed_by'],
                'lots' => ['created_by'],
                'lot_samples' => ['created_by'],
                'inventory_ledger_entries' => ['user_id'],
                'purchase_requests' => ['requested_by', 'created_by', 'approved_by', 'rejected_by'],
                'purchase_orders' => ['created_by', 'approved_by', 'rejected_by'],
                'goods_receipts' => ['created_by', 'approved_by', 'rejected_by'],
                'stock_counts' => ['created_by', 'approved_by'],
                'cost_entries' => ['created_by'],
                'cost_summaries' => ['approved_by'],
                'activity_logs' => ['user_id'],
                'activity_timelines' => ['user_id'],
                'system_backups' => ['created_by'],
            ]);

            User::query()
                ->whereKeyNot($admin->id)
                ->delete();

            $admin->forceFill([
                'employee_code' => null,
                'department_id' => null,
                'position_id' => null,
                'manager_id' => null,
                'login_enabled' => true,
                'status' => 'active',
            ])->save();
        } finally {
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }
        }

        $this->info("Reset complete. Kept admin account #{$admin->id} ({$admin->email}).");

        return self::SUCCESS;
    }

    private function truncateIfExists(array $tables): void
    {
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }
    }

    private function nullUserReferences(array $tables): void
    {
        foreach ($tables as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (Schema::hasColumn($table, $column)) {
                    DB::table($table)->update([$column => null]);
                }
            }
        }
    }
}
