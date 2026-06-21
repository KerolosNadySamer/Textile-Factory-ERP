<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->string('cost_type');
            $table->string('description');
            $table->decimal('amount', 14, 2);
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lot_id', 'cost_type']);
        });

        Schema::create('cost_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->unique()->constrained('lots')->cascadeOnDelete();
            $table->decimal('material_cost', 14, 2)->default(0);
            $table->decimal('production_cost', 14, 2)->default(0);
            $table->decimal('dyeing_cost', 14, 2)->default(0);
            $table->decimal('overhead_cost', 14, 2)->default(0);
            $table->decimal('total_cost', 14, 2)->default(0);
            $table->decimal('unit_cost', 14, 4)->default(0);
            $table->string('status')->default('draft');
            $table->foreignId('calculated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        $now = now();
        $permissions = [
            ['name' => 'View cost accounting', 'slug' => 'view_cost_accounting'],
            ['name' => 'Create cost entry', 'slug' => 'create_cost_entry'],
            ['name' => 'Review cost summary', 'slug' => 'review_cost_summary'],
            ['name' => 'Approve cost summary', 'slug' => 'approve_cost_summary'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => array_column($permissions, 'slug'),
            'general_manager' => ['view_cost_accounting', 'approve_cost_summary'],
            'cost_accountant' => ['view_cost_accounting', 'create_cost_entry', 'review_cost_summary'],
            'warehouse' => ['view_cost_accounting', 'create_cost_entry'],
            'production' => ['view_cost_accounting', 'create_cost_entry'],
            'dyeing' => ['view_cost_accounting', 'create_cost_entry'],
            'planning' => ['view_cost_accounting'],
            'sales' => ['view_cost_accounting'],
        ];

        foreach ($rolePermissions as $roleSlug => $permissionSlugs) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');

            if (! $roleId) {
                continue;
            }

            $permissionIds = DB::table('permissions')->whereIn('slug', $permissionSlugs)->pluck('id');

            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->updateOrInsert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_summaries');
        Schema::dropIfExists('cost_entries');

        $slugs = ['view_cost_accounting', 'create_cost_entry', 'review_cost_summary', 'approve_cost_summary'];
        $permissionIds = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
