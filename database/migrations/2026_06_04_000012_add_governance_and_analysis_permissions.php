<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['slug' => 'view_governance_center', 'name' => 'View governance center', 'name_ar' => 'عرض مركز الحوكمة', 'name_en' => 'View governance center'],
            ['slug' => 'view_data_analysis', 'name' => 'View data analysis', 'name_ar' => 'عرض تحليل البيانات', 'name_en' => 'View data analysis'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => now(), 'updated_at' => now()],
            );
        }

        $permissionIds = DB::table('permissions')->whereIn('slug', array_column($permissions, 'slug'))->pluck('id');

        DB::table('roles')->whereIn('slug', ['admin', 'general_manager'])->pluck('id')->each(function ($roleId) use ($permissionIds): void {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionId]);
            }
        });
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')->whereIn('slug', ['view_governance_center', 'view_data_analysis'])->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
