<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_backups', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('disk_path');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('restored_at')->nullable();
            $table->foreignId('restored_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('stock_counts', function (Blueprint $table) {
            $table->id();
            $table->string('count_number')->unique();
            $table->date('count_date');
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_count_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lot_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->decimal('system_qty', 12, 2)->default(0);
            $table->decimal('counted_qty', 12, 2)->default(0);
            $table->decimal('variance_qty', 12, 2)->default(0);
            $table->string('unit')->default('kg');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        $now = now();
        $permissions = [
            ['name' => 'Manage system backups', 'slug' => 'manage_system_backups'],
            ['name' => 'Export reports', 'slug' => 'export_reports'],
            ['name' => 'Print documents', 'slug' => 'print_documents'],
            ['name' => 'View physical inventory', 'slug' => 'view_physical_inventory'],
            ['name' => 'Create stock count', 'slug' => 'create_stock_count'],
            ['name' => 'Approve stock count', 'slug' => 'approve_stock_count'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        $rolePermissions = [
            'admin' => array_column($permissions, 'slug'),
            'general_manager' => array_column($permissions, 'slug'),
            'warehouse' => ['export_reports', 'print_documents', 'view_physical_inventory', 'create_stock_count'],
            'accounting' => ['export_reports', 'print_documents', 'view_physical_inventory'],
            'purchasing' => ['export_reports', 'print_documents'],
            'planning' => ['export_reports', 'print_documents'],
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
        Schema::dropIfExists('stock_count_items');
        Schema::dropIfExists('stock_counts');
        Schema::dropIfExists('system_backups');

        $slugs = [
            'manage_system_backups',
            'export_reports',
            'print_documents',
            'view_physical_inventory',
            'create_stock_count',
            'approve_stock_count',
        ];
        $permissionIds = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id');
        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
