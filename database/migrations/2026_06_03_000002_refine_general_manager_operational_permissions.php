<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $generalManager = Role::where('slug', 'general_manager')->first();

        if (! $generalManager) {
            return;
        }

        $operationalInputs = Permission::whereIn('slug', [
            'create_inventory_ledger_entry',
            'create_stock_count',
        ])->pluck('id');

        $generalManager->permissions()->detach($operationalInputs);
    }

    public function down(): void
    {
        $generalManager = Role::where('slug', 'general_manager')->first();

        if (! $generalManager) {
            return;
        }

        $permissions = Permission::whereIn('slug', [
            'create_inventory_ledger_entry',
            'create_stock_count',
        ])->pluck('id');

        $generalManager->permissions()->syncWithoutDetaching($permissions);
    }
};
