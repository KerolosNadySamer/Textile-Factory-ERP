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
            ['name' => 'Create customer', 'slug' => 'create_customer'],
            ['name' => 'Edit customer', 'slug' => 'edit_customer'],
            ['name' => 'Delete customer', 'slug' => 'delete_customer'],
            ['name' => 'Edit product', 'slug' => 'edit_product'],
            ['name' => 'Delete product', 'slug' => 'delete_product'],
            ['name' => 'Delete dye sample', 'slug' => 'delete_dye_sample'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => ['create_customer', 'edit_customer', 'delete_customer', 'edit_product', 'delete_product', 'delete_dye_sample'],
            'general_manager' => ['create_customer', 'edit_customer', 'delete_customer', 'edit_product', 'delete_product', 'delete_dye_sample'],
            'sales' => ['create_customer', 'edit_customer'],
            'accounting' => ['create_customer', 'edit_customer'],
            'planning' => ['edit_product'],
            'warehouse' => ['edit_product'],
            'production' => ['edit_product'],
            'dyeing' => ['delete_dye_sample'],
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
            ->whereIn('slug', [
                'create_customer',
                'edit_customer',
                'delete_customer',
                'edit_product',
                'delete_product',
                'delete_dye_sample',
            ])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
