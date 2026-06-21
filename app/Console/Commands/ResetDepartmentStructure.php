<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDepartmentStructure extends Command
{
    protected $signature = 'departments:reset-structure
        {--force : Run without interactive confirmation}
        {--seed-top-management : Create the top management department after reset}';

    protected $description = 'Clear dynamic department, position, and department-dependent HR structure data while keeping users.';

    public function handle(): int
    {
        $departments = DB::table('departments')->count();
        $positions = DB::table('positions')->count();
        $employees = User::query()->whereNotNull('department_id')->orWhereNotNull('position_id')->count();
        $protectedCounts = $this->protectedStructureRecordCounts();

        if (array_sum($protectedCounts) > 0) {
            $this->error('Department structure reset was blocked because protected history/workflow records still reference the old structure.');

            foreach ($protectedCounts as $table => $count) {
                if ($count > 0) {
                    $this->line("- {$table}: {$count}");
                }
            }

            $this->warn('Resolve or archive these records first. Users, payroll, reviews, and career history were not changed.');

            return self::FAILURE;
        }

        if (! $this->option('force')) {
            $this->warn("This will clear {$departments} department(s), {$positions} position(s), and detach {$employees} employee(s) from departments/positions.");
            $this->warn('It will not delete users, payroll, employee reviews, or protected career/workflow records.');

            if (! $this->confirm('Continue resetting the department structure?')) {
                return self::FAILURE;
            }
        }

        DB::transaction(function (): void {
            User::query()->update([
                'department_id' => null,
                'position_id' => null,
                'manager_id' => null,
            ]);

            if (Schema::hasTable('employee_manager')) {
                DB::table('employee_manager')->delete();
            }

            foreach ([
                'department_positions',
                'department_units',
                'positions',
                'job_titles',
                'departments',
            ] as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                }
            }

            if ($this->option('seed-top-management')) {
                $departmentId = DB::table('departments')->insertGetId([
                    'name' => 'الإدارة العليا',
                    'name_ar' => 'الإدارة العليا',
                    'name_en' => 'Top Management',
                    'code' => 'top_management',
                    'department_type' => 'administrative',
                    'cost_nature' => 'indirect',
                    'active' => true,
                    'status' => 'active',
                    'linked_modules' => json_encode([
                        'accounting',
                        'cost_accounting',
                        'sales',
                        'customers',
                        'purchasing',
                        'suppliers',
                        'inventory',
                        'stock_counts',
                        'production',
                        'quality',
                        'hr',
                        'payroll',
                        'reports',
                    ]),
                    'created_by' => null,
                    'direct_manager_id' => null,
                    'required_headcount' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('department_units')->insert([
                    'department_id' => $departmentId,
                    'name' => 'الإدارة العليا',
                    'code' => 'main',
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        $this->info('Department structure reset completed. Users were kept and detached from departments/positions.');

        if ($this->option('seed-top-management')) {
            $this->info('Top Management department was created as the first active main department.');
        }

        return self::SUCCESS;
    }

    private function protectedStructureRecordCounts(): array
    {
        return collect([
            'recruitment_requests',
            'employee_transfer_requests',
            'employee_promotion_requests',
            'succession_plans',
        ])
            ->filter(fn ($table) => Schema::hasTable($table))
            ->mapWithKeys(fn ($table) => [$table => DB::table($table)->count()])
            ->all();
    }
}
