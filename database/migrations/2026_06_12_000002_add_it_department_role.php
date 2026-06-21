<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')->updateOrInsert(
            ['slug' => 'it'],
            [
                'name' => 'IT',
                'name_ar' => 'تكنولوجيا المعلومات',
                'name_en' => 'IT',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $roleId = DB::table('roles')->where('slug', 'it')->value('id');

        if (! $roleId) {
            return;
        }

        DB::table('permissions')
            ->whereIn('slug', ['view_users', 'view_departments', 'view_audit_logs'])
            ->pluck('id')
            ->each(fn ($permissionId) => DB::table('role_permission')->updateOrInsert([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ]));

        DB::table('departments')
            ->where(function ($query): void {
                $query
                    ->whereIn('code', ['it', 'information_technology', 'technology'])
                    ->orWhere('name', 'like', '%IT%')
                    ->orWhere('name', 'like', '%تكنولوجيا%')
                    ->orWhere('name_ar', 'like', '%تكنولوجيا%')
                    ->orWhere('name_en', 'like', '%IT%')
                    ->orWhere('name_en', 'like', '%Information Technology%')
                    ->orWhereJsonContains('linked_modules', 'it');
            })
            ->update([
                'system_role_id' => $roleId,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('slug', 'it')->value('id');

        if (! $roleId) {
            return;
        }

        DB::table('departments')
            ->where('system_role_id', $roleId)
            ->update([
                'system_role_id' => null,
                'updated_at' => now(),
            ]);

        DB::table('role_permission')->where('role_id', $roleId)->delete();
        DB::table('roles')->where('id', $roleId)->delete();
    }
};
