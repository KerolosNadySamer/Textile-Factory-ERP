<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $permissions = [
            ['name' => 'View lots', 'slug' => 'view_lots'],
            ['name' => 'Create lot', 'slug' => 'create_lot'],
            ['name' => 'Edit lot', 'slug' => 'edit_lot'],
            ['name' => 'Delete lot', 'slug' => 'delete_lot'],
            ['name' => 'Approve lot sample', 'slug' => 'approve_lot_sample'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => ['view_lots', 'create_lot', 'edit_lot', 'delete_lot', 'approve_lot_sample'],
            'general_manager' => ['view_lots', 'create_lot', 'edit_lot', 'approve_lot_sample'],
            'warehouse' => ['view_lots', 'create_lot', 'edit_lot'],
            'production' => ['view_lots', 'create_lot', 'edit_lot'],
            'planning' => ['view_lots', 'create_lot', 'edit_lot', 'approve_lot_sample'],
            'dyeing' => ['view_lots', 'create_lot', 'edit_lot', 'approve_lot_sample'],
            'quality' => ['view_lots', 'approve_lot_sample'],
            'sales' => ['view_lots'],
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
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['view_lots', 'create_lot', 'edit_lot', 'delete_lot', 'approve_lot_sample'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
