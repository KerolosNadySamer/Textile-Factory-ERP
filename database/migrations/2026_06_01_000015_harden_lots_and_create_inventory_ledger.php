<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('lots')->whereIn('status', ['active', 'reserved'])->update(['status' => 'open']);
        DB::table('lots')->whereIn('status', ['consumed', 'finished', 'quarantined'])->update(['status' => 'closed']);

        Schema::create('inventory_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->date('entry_date');
            $table->string('document_type');
            $table->string('document_number');
            $table->foreignId('lot_id')->nullable()->constrained('lots')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('in_qty', 12, 2)->default(0);
            $table->decimal('out_qty', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->decimal('total_cost', 14, 2)->nullable();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['entry_date', 'document_type']);
            $table->index(['lot_id', 'product_id', 'entry_date']);
            $table->index(['document_type', 'document_number']);
        });

        $now = now();
        $permissions = [
            ['name' => 'Edit closed lot', 'slug' => 'edit_closed_lot'],
            ['name' => 'View inventory ledger', 'slug' => 'view_inventory_ledger'],
            ['name' => 'Create inventory ledger entry', 'slug' => 'create_inventory_ledger_entry'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => ['edit_closed_lot', 'view_inventory_ledger', 'create_inventory_ledger_entry'],
            'general_manager' => ['edit_closed_lot', 'view_inventory_ledger', 'create_inventory_ledger_entry'],
            'warehouse' => ['view_inventory_ledger', 'create_inventory_ledger_entry'],
            'production' => ['view_inventory_ledger', 'create_inventory_ledger_entry'],
            'planning' => ['view_inventory_ledger'],
            'dyeing' => ['view_inventory_ledger', 'create_inventory_ledger_entry'],
            'quality' => ['view_inventory_ledger'],
            'sales' => ['view_inventory_ledger'],
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

    public function down(): void
    {
        Schema::dropIfExists('inventory_ledger_entries');

        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['edit_closed_lot', 'view_inventory_ledger', 'create_inventory_ledger_entry'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
