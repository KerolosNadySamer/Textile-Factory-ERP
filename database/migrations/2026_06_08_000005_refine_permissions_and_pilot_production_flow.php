<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->syncPermissions();
        $this->extendSalesOrders();
        $this->extendDyeSamples();
        $this->createPilotProductionTables();
    }

    public function down(): void
    {
        Schema::dropIfExists('dyeing_orders');
        Schema::dropIfExists('weaving_productions');
    }

    private function syncPermissions(): void
    {
        $permissions = [
            ['name' => 'View weaving production', 'slug' => 'view_weaving_production'],
            ['name' => 'Create weaving production', 'slug' => 'create_weaving_production'],
            ['name' => 'Edit weaving production', 'slug' => 'edit_weaving_production'],
            ['name' => 'View dyeing orders', 'slug' => 'view_dyeing_orders'],
            ['name' => 'Create dyeing order', 'slug' => 'create_dyeing_order'],
            ['name' => 'Edit dyeing order', 'slug' => 'edit_dyeing_order'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['updated_at' => now(), 'created_at' => now()],
            );
        }

        $rolePermissions = [
            'general_manager' => [
                'view_users',
                'view_audit_logs',
                'view_orders',
                'view_sales_orders',
                'approve_sales_order',
                'approve_order',
                'view_stock',
                'view_production',
                'view_production_orders',
                'view_weaving_production',
                'view_dyeing_orders',
                'view_finance',
                'view_customers',
                'view_products',
                'view_warehouses',
                'view_departments',
                'view_units',
                'view_dye_samples',
                'approve_dye_sample',
                'view_issue_orders',
                'view_lots',
                'view_inventory_ledger',
                'view_physical_inventory',
                'view_purchasing',
                'view_cost_accounting',
                'view_governance_center',
                'view_data_analysis',
                'view_change_requests',
                'export_reports',
                'print_documents',
                'global_search',
            ],
            'hr' => [
                'view_users',
                'create_user',
                'edit_user',
                'assign_role',
                'view_departments',
                'view_change_requests',
                'view_recruitment_onboarding',
                'create_recruitment_request',
                'manage_recruitment_requests',
            ],
            'production' => [
                'view_production',
                'view_production_orders',
                'edit_production',
                'run_production_order',
                'view_weaving_production',
                'create_weaving_production',
                'edit_weaving_production',
                'view_products',
                'view_units',
            ],
            'weaving' => [
                'view_production',
                'edit_production',
                'view_weaving_production',
                'create_weaving_production',
                'edit_weaving_production',
                'view_products',
                'view_units',
            ],
            'dyeing' => [
                'view_production',
                'edit_production',
                'view_dyeing_orders',
                'create_dyeing_order',
                'edit_dyeing_order',
                'view_dye_samples',
                'create_dye_sample',
                'review_dye_sample',
                'delete_dye_sample',
                'view_issue_orders',
                'view_products',
                'view_units',
            ],
            'sales' => [
                'create_order',
                'view_orders',
                'view_sales_orders',
                'create_sales_order',
                'edit_sales_order',
                'review_sales_order',
                'view_customers',
                'create_customer',
                'edit_customer',
                'view_stock',
                'view_products',
                'view_dye_samples',
                'approve_dye_sample',
                'view_issue_orders',
            ],
            'planning' => [
                'view_orders',
                'view_sales_orders',
                'approve_order',
                'view_production',
                'view_production_orders',
                'create_production_order',
                'plan_production_order',
                'release_production_order',
                'view_weaving_production',
                'view_dyeing_orders',
                'view_products',
                'view_stock',
                'view_dye_samples',
                'view_issue_orders',
            ],
            'purchasing' => [
                'view_stock',
                'view_products',
                'view_warehouses',
                'view_purchasing',
                'manage_suppliers',
                'create_purchase_request',
                'create_purchase_order',
                'approve_purchase_order',
            ],
        ];

        foreach ($rolePermissions as $roleSlug => $slugs) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if (! $roleId) {
                continue;
            }

            $permissionIds = DB::table('permissions')->whereIn('slug', $slugs)->pluck('id')->all();
            DB::table('role_permission')->where('role_id', $roleId)->delete();
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permission')->insertOrIgnore([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }

    private function extendSalesOrders(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'customer_sample_sent')) {
                $table->boolean('customer_sample_sent')->default(false)->after('sample_number');
            }
            if (! Schema::hasColumn('sales_orders', 'customer_sample_lot_no')) {
                $table->string('customer_sample_lot_no')->nullable()->after('customer_sample_sent');
            }
            if (! Schema::hasColumn('sales_orders', 'approved_dye_sample_id')) {
                $table->foreignId('approved_dye_sample_id')->nullable()->after('customer_sample_lot_no')->constrained('dye_samples')->nullOnDelete();
            }
        });
    }

    private function extendDyeSamples(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE dye_samples MODIFY status VARCHAR(80) NOT NULL DEFAULT "draft"');
        }

        Schema::table('dye_samples', function (Blueprint $table): void {
            if (! Schema::hasColumn('dye_samples', 'sales_order_id')) {
                $table->foreignId('sales_order_id')->nullable()->after('issue_no')->constrained('sales_orders')->nullOnDelete();
            }
            if (! Schema::hasColumn('dye_samples', 'raw_lot_no')) {
                $table->string('raw_lot_no')->nullable()->after('sales_order_id');
            }
            if (! Schema::hasColumn('dye_samples', 'sample_sequence')) {
                $table->unsignedSmallInteger('sample_sequence')->default(1)->after('sample_no');
            }
            foreach ([
                'dyeing_manager_approved',
                'sales_officer_approved',
                'sales_manager_approved',
                'general_manager_approved',
            ] as $prefix) {
                $by = "{$prefix}_by";
                $at = "{$prefix}_at";
                if (! Schema::hasColumn('dye_samples', $by)) {
                    $table->foreignId($by)->nullable()->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('dye_samples', $at)) {
                    $table->timestamp($at)->nullable();
                }
            }
        });
    }

    private function createPilotProductionTables(): void
    {
        if (! Schema::hasTable('weaving_productions')) {
            Schema::create('weaving_productions', function (Blueprint $table): void {
                $table->id();
                $table->string('weaving_number')->unique();
                $table->date('production_date');
                $table->string('yarn_lot_no');
                $table->decimal('yarn_quantity', 12, 2);
                $table->string('raw_lot_no');
                $table->decimal('raw_quantity', 12, 2);
                $table->string('inspection_status')->default('pending_inspection');
                $table->timestamp('sent_to_raw_warehouse_at')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('dyeing_orders')) {
            Schema::create('dyeing_orders', function (Blueprint $table): void {
                $table->id();
                $table->string('dyeing_number')->unique();
                $table->foreignId('sales_order_id')->nullable()->constrained('sales_orders')->nullOnDelete();
                $table->foreignId('dye_sample_id')->nullable()->constrained('dye_samples')->nullOnDelete();
                $table->string('raw_lot_no');
                $table->string('dyeing_entry_no');
                $table->unsignedSmallInteger('drop_number')->default(1);
                $table->unsignedSmallInteger('finish_year');
                $table->string('final_lot_no');
                $table->string('status')->default('draft');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }
};
