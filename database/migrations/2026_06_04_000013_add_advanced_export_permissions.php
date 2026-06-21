<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
            ['slug' => 'export_partial_data', 'name' => 'Export partial data', 'name_ar' => 'تصدير بيانات جزئية', 'name_en' => 'Export partial data'],
            ['slug' => 'export_own_customers', 'name' => 'Export own customers', 'name_ar' => 'تصدير العملاء المخصصين', 'name_en' => 'Export own customers'],
            ['slug' => 'export_assigned_suppliers', 'name' => 'Export assigned suppliers', 'name_ar' => 'تصدير الموردين المخصصين', 'name_en' => 'Export assigned suppliers'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => now(), 'updated_at' => now()],
            );
        }

        $allPermissionIds = DB::table('permissions')->whereIn('slug', array_column($permissions, 'slug'))->pluck('id');
        $customerPermissionIds = DB::table('permissions')->whereIn('slug', ['export_reports', 'export_partial_data', 'export_own_customers'])->pluck('id');
        $supplierPermissionIds = DB::table('permissions')->whereIn('slug', ['export_reports', 'export_partial_data', 'export_assigned_suppliers'])->pluck('id');

        $this->attachToRoles(['admin', 'general_manager'], $allPermissionIds);
        $this->attachToRoles(['sales_manager', 'sales_officer'], $customerPermissionIds);
        $this->attachToRoles(['purchasing_manager', 'purchasing_officer'], $supplierPermissionIds);
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['export_partial_data', 'export_own_customers', 'export_assigned_suppliers'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }

    private function attachToRoles(array $roleSlugs, $permissionIds): void
    {
        DB::table('roles')->whereIn('slug', $roleSlugs)->pluck('id')->each(function ($roleId) use ($permissionIds): void {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionId]);
            }
        });
    }
};
