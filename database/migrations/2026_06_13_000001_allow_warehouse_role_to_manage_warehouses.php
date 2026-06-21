<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleId = DB::table('roles')->where('slug', 'warehouse')->value('id');
        $permissionId = DB::table('permissions')->where('slug', 'manage_warehouses')->value('id');

        if (! $roleId || ! $permissionId) {
            return;
        }

        DB::table('role_permission')->updateOrInsert([
            'role_id' => $roleId,
            'permission_id' => $permissionId,
        ]);
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('slug', 'warehouse')->value('id');
        $permissionId = DB::table('permissions')->where('slug', 'manage_warehouses')->value('id');

        if ($roleId && $permissionId) {
            DB::table('role_permission')
                ->where('role_id', $roleId)
                ->where('permission_id', $permissionId)
                ->delete();
        }
    }
};
