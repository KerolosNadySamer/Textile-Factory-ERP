<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table): void {
            if (! Schema::hasColumn('departments', 'system_role_id')) {
                $table->foreignId('system_role_id')->nullable()->after('linked_modules')->constrained('roles')->nullOnDelete();
            }
        });

        $roleIds = DB::table('roles')->pluck('id', 'slug');

        DB::table('departments')->orderBy('id')->get(['id', 'code', 'linked_modules'])->each(function ($department) use ($roleIds): void {
            $slug = $this->roleSlugForDepartment($department->code, $department->linked_modules);
            $roleId = $slug ? ($roleIds[$slug] ?? null) : null;

            if ($roleId) {
                DB::table('departments')->where('id', $department->id)->update([
                    'system_role_id' => $roleId,
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table): void {
            if (Schema::hasColumn('departments', 'system_role_id')) {
                $table->dropConstrainedForeignId('system_role_id');
            }
        });
    }

    private function roleSlugForDepartment(?string $code, mixed $linkedModules): ?string
    {
        if (in_array($code, ['top_management', 'management'], true)) {
            return 'general_manager';
        }

        $modules = collect(is_string($linkedModules) ? json_decode($linkedModules, true) : $linkedModules)
            ->filter()
            ->values();

        if ($modules->contains('hr')) {
            return 'hr';
        }

        if ($modules->contains('accounting')) {
            return 'accounting';
        }

        if ($modules->contains('cost_accounting')) {
            return 'cost_accountant';
        }

        if ($modules->contains('sales') || $modules->contains('customers')) {
            return 'sales';
        }

        if ($modules->contains('purchasing') || $modules->contains('suppliers')) {
            return 'purchasing';
        }

        if ($modules->contains('inventory') || $modules->contains('stock_counts')) {
            return 'warehouse';
        }

        if ($modules->contains('production')) {
            return 'production';
        }

        if ($modules->contains('quality')) {
            return 'quality';
        }

        return [
            'hr' => 'hr',
            'human_resources' => 'hr',
            'hr_department' => 'hr',
            'costing' => 'cost_accountant',
            'cost_accounting' => 'cost_accountant',
            'production_planning' => 'production',
            'finance' => 'accounting',
        ][$code] ?? null;
    }
};
