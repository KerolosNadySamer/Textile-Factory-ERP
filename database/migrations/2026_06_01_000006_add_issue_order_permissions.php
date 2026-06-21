<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();
        $permissions = [
            ['name' => 'View issue orders', 'slug' => 'view_issue_orders'],
            ['name' => 'Create issue order', 'slug' => 'create_issue_order'],
            ['name' => 'Edit issue order', 'slug' => 'edit_issue_order'],
            ['name' => 'Delete issue order', 'slug' => 'delete_issue_order'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => ['view_issue_orders', 'create_issue_order', 'edit_issue_order', 'delete_issue_order'],
            'general_manager' => ['view_issue_orders', 'create_issue_order', 'edit_issue_order', 'delete_issue_order'],
            'warehouse' => ['view_issue_orders', 'create_issue_order', 'edit_issue_order'],
            'dyeing' => ['view_issue_orders'],
            'planning' => ['view_issue_orders'],
            'sales' => ['view_issue_orders'],
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['view_issue_orders', 'create_issue_order', 'edit_issue_order', 'delete_issue_order'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
