<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::updateOrCreate(
            ['slug' => 'manage_warehouses'],
            [
                'name' => 'Manage warehouses',
                'name_ar' => 'إدارة المخازن',
                'name_en' => 'Manage warehouses',
            ]
        );

        Role::whereIn('slug', ['admin'])->get()->each(
            fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permission->id])
        );
    }

    public function down(): void
    {
        $permission = Permission::where('slug', 'manage_warehouses')->first();

        if (! $permission) {
            return;
        }

        Role::query()->each(fn (Role $role) => $role->permissions()->detach($permission->id));
        $permission->delete();
    }
};
