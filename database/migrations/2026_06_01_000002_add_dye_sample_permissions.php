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
            ['name' => 'View dye samples', 'slug' => 'view_dye_samples'],
            ['name' => 'Create dye sample', 'slug' => 'create_dye_sample'],
            ['name' => 'Review dye sample', 'slug' => 'review_dye_sample'],
            ['name' => 'Approve dye sample', 'slug' => 'approve_dye_sample'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['updated_at' => $now, 'created_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => ['view_dye_samples', 'create_dye_sample', 'review_dye_sample', 'approve_dye_sample'],
            'general_manager' => ['view_dye_samples', 'review_dye_sample', 'approve_dye_sample'],
            'dyeing' => ['view_dye_samples', 'create_dye_sample'],
            'planning' => ['view_dye_samples', 'review_dye_sample'],
            'sales' => ['view_dye_samples', 'approve_dye_sample'],
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
            ->whereIn('slug', ['view_dye_samples', 'create_dye_sample', 'review_dye_sample', 'approve_dye_sample'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
