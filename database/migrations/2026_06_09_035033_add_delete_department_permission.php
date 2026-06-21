<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')->updateOrInsert(
            ['slug' => 'delete_department'],
            [
                'name' => 'Delete department',
                'name_ar' => 'حذف قسم',
                'name_en' => 'Delete department',
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        $permissionId = DB::table('permissions')->where('slug', 'delete_department')->value('id');

        DB::table('roles')
            ->whereIn('slug', ['admin'])
            ->pluck('id')
            ->each(fn ($roleId) => DB::table('role_permission')->updateOrInsert([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ]));
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('slug', 'delete_department')->value('id');

        if ($permissionId) {
            DB::table('role_permission')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }
    }
};
