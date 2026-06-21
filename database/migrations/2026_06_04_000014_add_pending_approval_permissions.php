<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')->updateOrInsert(
            ['slug' => 'view_change_requests'],
            ['name' => 'View change requests', 'name_ar' => 'عرض طلبات التغيير', 'name_en' => 'View change requests', 'created_at' => now(), 'updated_at' => now()],
        );

        $permissionId = DB::table('permissions')->where('slug', 'view_change_requests')->value('id');

        DB::table('roles')
            ->whereIn('slug', ['admin', 'general_manager', 'sales', 'purchasing', 'planning', 'accounting', 'warehouse', 'production', 'quality', 'hr'])
            ->pluck('id')
            ->each(function ($roleId) use ($permissionId): void {
                DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionId]);
            });
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('slug', 'view_change_requests')->value('id');

        if ($permissionId) {
            DB::table('roles')
                ->whereIn('slug', ['sales', 'purchasing', 'planning', 'accounting', 'warehouse', 'production', 'quality', 'hr'])
                ->pluck('id')
                ->each(fn ($roleId) => DB::table('role_permission')->where(['role_id' => $roleId, 'permission_id' => $permissionId])->delete());
        }
    }
};
