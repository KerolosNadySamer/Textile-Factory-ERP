<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Permission;
use App\Models\Position;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = collect([
            ['name' => 'Admin', 'slug' => 'admin'],
            ['name' => "\u{0645}\u{062F}\u{064A}\u{0631} \u{0639}\u{0627}\u{0645}", 'slug' => 'general_manager'],
            ['name' => "\u{0625}\u{0646}\u{062A}\u{0627}\u{062C}", 'slug' => 'production'],
            ['name' => "\u{0645}\u{0628}\u{064A}\u{0639}\u{0627}\u{062A}", 'slug' => 'sales'],
            ['name' => "\u{062A}\u{062E}\u{0637}\u{064A}\u{0637}", 'slug' => 'planning'],
            ['name' => "\u{0645}\u{062E}\u{0627}\u{0632}\u{0646}", 'slug' => 'warehouse'],
            ['name' => "\u{0635}\u{0628}\u{0627}\u{063A}\u{0629}", 'slug' => 'dyeing'],
            ['name' => "\u{0646}\u{0633}\u{062C}", 'slug' => 'weaving'],
            ['name' => "\u{062D}\u{0633}\u{0627}\u{0628}\u{0627}\u{062A}", 'slug' => 'accounting'],
            ['name' => "\u{0645}\u{0634}\u{062A}\u{0631}\u{064A}\u{0627}\u{062A}", 'slug' => 'purchasing'],
            ['name' => "\u{0645}\u{062D}\u{0627}\u{0633}\u{0628} \u{062A}\u{0643}\u{0627}\u{0644}\u{064A}\u{0641}", 'slug' => 'cost_accountant'],
            ['name' => "\u{062C}\u{0648}\u{062F}\u{0629}", 'slug' => 'quality'],
            ['name' => 'HR', 'slug' => 'hr'],
            ['name' => 'IT', 'slug' => 'it'],
        ])->mapWithKeys(fn (array $role) => [$role['slug'] => Role::updateOrCreate(
            ['slug' => $role['slug']],
            ['name' => $role['name']]
        )]);

        $permissions = collect([
            ['name' => 'View users', 'slug' => 'view_users'],
            ['name' => 'Create user', 'slug' => 'create_user'],
            ['name' => 'Edit user', 'slug' => 'edit_user'],
            ['name' => 'Delete user', 'slug' => 'delete_user'],
            ['name' => 'Assign role', 'slug' => 'assign_role'],
            ['name' => 'View audit logs', 'slug' => 'view_audit_logs'],
            ['name' => 'Create order', 'slug' => 'create_order'],
            ['name' => 'View orders', 'slug' => 'view_orders'],
            ['name' => 'Approve order', 'slug' => 'approve_order'],
            ['name' => 'View stock', 'slug' => 'view_stock'],
            ['name' => 'Issue stock', 'slug' => 'issue_stock'],
            ['name' => 'View production', 'slug' => 'view_production'],
            ['name' => 'Edit production', 'slug' => 'edit_production'],
            ['name' => 'View finance', 'slug' => 'view_finance'],
            ['name' => 'Edit finance', 'slug' => 'edit_finance'],
            ['name' => 'View customers', 'slug' => 'view_customers'],
            ['name' => 'Create customer', 'slug' => 'create_customer'],
            ['name' => 'Edit customer', 'slug' => 'edit_customer'],
            ['name' => 'Delete customer', 'slug' => 'delete_customer'],
            ['name' => 'View sales orders', 'slug' => 'view_sales_orders'],
            ['name' => 'Create sales order', 'slug' => 'create_sales_order'],
            ['name' => 'Edit sales order', 'slug' => 'edit_sales_order'],
            ['name' => 'Review sales order', 'slug' => 'review_sales_order'],
            ['name' => 'Approve sales order', 'slug' => 'approve_sales_order'],
            ['name' => 'View products', 'slug' => 'view_products'],
            ['name' => 'View production orders', 'slug' => 'view_production_orders'],
            ['name' => 'Create production order', 'slug' => 'create_production_order'],
            ['name' => 'Plan production order', 'slug' => 'plan_production_order'],
            ['name' => 'Release production order', 'slug' => 'release_production_order'],
            ['name' => 'Run production order', 'slug' => 'run_production_order'],
            ['name' => 'Close production order', 'slug' => 'close_production_order'],
            ['name' => 'Create product', 'slug' => 'create_product'],
            ['name' => 'Edit product', 'slug' => 'edit_product'],
            ['name' => 'Delete product', 'slug' => 'delete_product'],
            ['name' => 'View warehouses', 'slug' => 'view_warehouses'],
            ['name' => 'Manage warehouses', 'slug' => 'manage_warehouses'],
            ['name' => 'View departments', 'slug' => 'view_departments'],
            ['name' => 'Delete department', 'slug' => 'delete_department'],
            ['name' => 'View units', 'slug' => 'view_units'],
            ['name' => 'View dye samples', 'slug' => 'view_dye_samples'],
            ['name' => 'Create dye sample', 'slug' => 'create_dye_sample'],
            ['name' => 'Review dye sample', 'slug' => 'review_dye_sample'],
            ['name' => 'Approve dye sample', 'slug' => 'approve_dye_sample'],
            ['name' => 'Delete dye sample', 'slug' => 'delete_dye_sample'],
            ['name' => 'View issue orders', 'slug' => 'view_issue_orders'],
            ['name' => 'Create issue order', 'slug' => 'create_issue_order'],
            ['name' => 'Edit issue order', 'slug' => 'edit_issue_order'],
            ['name' => 'Delete issue order', 'slug' => 'delete_issue_order'],
            ['name' => 'Reject goods receipt', 'slug' => 'reject_goods_receipt'],
        ])->mapWithKeys(fn (array $permission) => [$permission['slug'] => Permission::updateOrCreate(
            ['slug' => $permission['slug']],
            ['name' => $permission['name']]
        )]);

        $permissions = Permission::query()->get()->keyBy('slug');

        $rolePermissions = [
            'admin' => [
                'view_users',
                'create_user',
                'edit_user',
                'delete_user',
                'assign_role',
                'view_audit_logs',
                'view_departments',
                'delete_department',
                'manage_warehouses',
            ],
            'general_manager' => [
                'view_users',
                'create_user',
                'edit_user',
                'delete_user',
                'assign_role',
                'view_audit_logs',
                'view_orders',
                'view_sales_orders',
                'approve_sales_order',
                'approve_order',
                'view_stock',
                'view_production',
                'view_production_orders',
                'view_finance',
                'view_customers',
                'view_products',
                'view_warehouses',
                'view_departments',
                'view_units',
                'view_dye_samples',
                'review_dye_sample',
                'approve_dye_sample',
                'view_issue_orders',
                'view_lots',
                'approve_lot_sample',
                'view_inventory_ledger',
                'view_physical_inventory',
                'approve_stock_count',
                'view_purchasing',
                'approve_purchase_order',
                'approve_goods_receipt',
                'reject_goods_receipt',
                'view_cost_accounting',
                'approve_cost_summary',
                'export_reports',
                'print_documents',
                'global_search',
            ],
            'hr' => ['view_users', 'create_user', 'edit_user', 'assign_role', 'view_departments'],
            'sales' => ['create_order', 'view_orders', 'view_sales_orders', 'create_sales_order', 'edit_sales_order', 'view_customers', 'create_customer', 'edit_customer', 'view_stock', 'view_products', 'view_dye_samples', 'view_issue_orders'],
            'planning' => ['view_orders', 'view_sales_orders', 'review_sales_order', 'approve_order', 'view_production', 'view_production_orders', 'create_production_order', 'plan_production_order', 'release_production_order', 'view_products', 'view_stock', 'view_dye_samples', 'review_dye_sample', 'view_issue_orders'],
            'warehouse' => ['view_stock', 'issue_stock', 'view_warehouses', 'manage_warehouses', 'view_products', 'view_units', 'view_issue_orders', 'create_issue_order', 'edit_issue_order', 'view_purchasing', 'create_goods_receipt', 'reject_goods_receipt'],
            'production' => ['view_production', 'view_production_orders', 'edit_production', 'run_production_order', 'view_products', 'view_units'],
            'dyeing' => ['view_production', 'edit_production', 'view_products', 'view_units', 'view_dye_samples', 'create_dye_sample', 'delete_dye_sample', 'view_issue_orders'],
            'weaving' => ['view_production', 'edit_production', 'view_products', 'view_units'],
            'accounting' => ['view_finance', 'edit_finance', 'view_orders', 'view_customers', 'create_customer', 'edit_customer'],
            'purchasing' => ['view_stock', 'view_products', 'view_warehouses', 'view_purchasing', 'manage_suppliers', 'create_purchase_request', 'create_purchase_order'],
            'cost_accountant' => ['view_finance', 'edit_finance', 'view_orders', 'view_products', 'view_production'],
            'quality' => ['view_production', 'view_production_orders', 'close_production_order', 'view_products', 'view_dye_samples'],
            'it' => ['view_users', 'view_departments', 'view_audit_logs'],
        ];

        foreach ($rolePermissions as $roleSlug => $permissionSlugs) {
            $roles[$roleSlug]->permissions()->sync(
                $permissions->whereIn('slug', $permissionSlugs)->pluck('id')->all()
            );
        }

        $roles['admin']->permissions()->sync(Permission::query()->pluck('id')->all());

        $adminEmail = (string) env('ADMIN_EMAIL', '');
        $adminPassword = (string) env('ADMIN_PASSWORD', '');

        if (($adminEmail === '') !== ($adminPassword === '')) {
            throw new \RuntimeException('ADMIN_EMAIL and ADMIN_PASSWORD must be configured together.');
        }

        if ($adminEmail !== '') {
            $adminUser = User::firstOrNew(['email' => $adminEmail]);
            $adminUser->fill([
                'name' => env('ADMIN_NAME', 'System Administrator'),
                'employee_code' => env('ADMIN_EMPLOYEE_CODE', '0001'),
                'phone' => env('ADMIN_PHONE'),
                'status' => 'active',
                'role_id' => $roles['admin']->id,
            ]);

            if (! $adminUser->exists) {
                $adminUser->password = Hash::make($adminPassword);
            }

            $adminUser->save();
        }

        $departments = collect([
            ['name' => "\u{0627}\u{0644}\u{0625}\u{062F}\u{0627}\u{0631}\u{0629} \u{0627}\u{0644}\u{0639}\u{0644}\u{064A}\u{0627}", 'code' => 'top_management'],
            ['name' => "\u{0627}\u{0644}\u{0645}\u{0628}\u{064A}\u{0639}\u{0627}\u{062A}", 'code' => 'sales'],
            ['name' => "\u{0627}\u{0644}\u{062A}\u{062E}\u{0635}\u{064A}\u{0637}", 'code' => 'planning'],
            ['name' => "\u{0627}\u{0644}\u{0625}\u{0646}\u{062A}\u{0627}\u{062C}", 'code' => 'production'],
            ['name' => "\u{0627}\u{0644}\u{0645}\u{062E}\u{0627}\u{0632}\u{0646}", 'code' => 'warehouse'],
            ['name' => "\u{0627}\u{0644}\u{0635}\u{0628}\u{0627}\u{063A}\u{0629}", 'code' => 'dyeing'],
            ['name' => "\u{0627}\u{0644}\u{062D}\u{0633}\u{0627}\u{0628}\u{0627}\u{062A}", 'code' => 'accounting'],
            ['name' => "\u{0627}\u{0644}\u{0645}\u{0634}\u{062A}\u{0631}\u{064A}\u{0627}\u{062A}", 'code' => 'purchasing'],
            ['name' => 'HR', 'code' => 'hr'],
        ])->mapWithKeys(fn (array $department) => [$department['code'] => Department::updateOrCreate(
            ['code' => $department['code']],
            ['name' => $department['name']]
        )]);

        $positions = [
            'top_management' => [
                ['name' => "\u{0645}\u{062F}\u{064A}\u{0631} \u{0639}\u{0627}\u{0645}", 'code' => 'general_manager'],
                ['name' => "\u{0645}\u{0633}\u{0627}\u{0639}\u{062F} \u{0625}\u{062F}\u{0627}\u{0631}\u{064A}", 'code' => 'admin_assistant'],
            ],
            'sales' => [
                ['name' => "\u{0645}\u{062F}\u{064A}\u{0631} \u{0627}\u{0644}\u{0645}\u{0628}\u{064A}\u{0639}\u{0627}\u{062A}", 'code' => 'sales_manager'],
                ['name' => "\u{0645}\u{0646}\u{062F}\u{0648}\u{0628} \u{0645}\u{0628}\u{064A}\u{0639}\u{0627}\u{062A}", 'code' => 'sales_rep'],
                ['name' => "\u{0645}\u{0633}\u{0624}\u{0648}\u{0644} \u{0645}\u{0628}\u{064A}\u{0639}\u{0627}\u{062A}", 'code' => 'sales_officer'],
            ],
            'planning' => [
                ['name' => "\u{0645}\u{062F}\u{064A}\u{0631}\u{0629} \u{0627}\u{0644}\u{062A}\u{062E}\u{0637}\u{064A}\u{0637}", 'code' => 'planning_manager'],
                ['name' => "\u{0645}\u{0648}\u{0638}\u{0641} \u{062A}\u{062E}\u{0637}\u{064A}\u{0637}", 'code' => 'planning_officer'],
            ],
            'production' => [
                ['name' => "\u{0631}\u{0626}\u{064A}\u{0633} \u{0642}\u{0633}\u{0645}", 'code' => 'section_head'],
                ['name' => "\u{0645}\u{0647}\u{0646}\u{062F}\u{0633}", 'code' => 'engineer'],
                ['name' => "\u{0645}\u{0633}\u{0627}\u{0639}\u{062F} \u{0631}\u{0626}\u{064A}\u{0633} \u{0642}\u{0633}\u{0645}", 'code' => 'assistant_section_head'],
                ['name' => "\u{0639}\u{0627}\u{0645}\u{0644}", 'code' => 'worker'],
                ['name' => "\u{0645}\u{0648}\u{0638}\u{0641}", 'code' => 'employee'],
            ],
            'warehouse' => [
                ['name' => "\u{0623}\u{0645}\u{064A}\u{0646} \u{0645}\u{062E}\u{0632}\u{0646}", 'code' => 'storekeeper'],
                ['name' => "\u{0639}\u{0627}\u{0645}\u{0644} \u{0645}\u{062E}\u{0632}\u{0646}", 'code' => 'warehouse_worker'],
            ],
            'dyeing' => [
                ['name' => "\u{0631}\u{0626}\u{064A}\u{0633} \u{0642}\u{0633}\u{0645}", 'code' => 'section_head'],
                ['name' => "\u{0645}\u{0647}\u{0646}\u{062F}\u{0633}", 'code' => 'engineer'],
                ['name' => "\u{0645}\u{0633}\u{0627}\u{0639}\u{062F} \u{0631}\u{0626}\u{064A}\u{0633} \u{0642}\u{0633}\u{0645}", 'code' => 'assistant_section_head'],
                ['name' => "\u{0639}\u{0627}\u{0645}\u{0644}", 'code' => 'worker'],
                ['name' => "\u{0645}\u{0648}\u{0638}\u{0641}", 'code' => 'employee'],
            ],
            'accounting' => [
                ['name' => "\u{0645}\u{062F}\u{064A}\u{0631} \u{062D}\u{0633}\u{0627}\u{0628}\u{0627}\u{062A}", 'code' => 'accounting_manager'],
                ['name' => "\u{0645}\u{062D}\u{0627}\u{0633}\u{0628}", 'code' => 'accountant'],
            ],
            'purchasing' => [
                ['name' => "\u{0645}\u{062F}\u{064A}\u{0631} \u{0645}\u{0634}\u{062A}\u{0631}\u{064A}\u{0627}\u{062A}", 'code' => 'purchasing_manager'],
                ['name' => "\u{0645}\u{0633}\u{0624}\u{0648}\u{0644} \u{0645}\u{0634}\u{062A}\u{0631}\u{064A}\u{0627}\u{062A}", 'code' => 'purchasing_officer'],
                ['name' => "\u{0645}\u{0646}\u{062F}\u{0648}\u{0628} \u{0645}\u{0634}\u{062A}\u{0631}\u{064A}\u{0627}\u{062A}", 'code' => 'purchasing_rep'],
            ],
            'hr' => [
                ['name' => "\u{0645}\u{062F}\u{064A}\u{0631} HR", 'code' => 'hr_manager'],
                ['name' => "\u{0645}\u{0648}\u{0638}\u{0641} HR", 'code' => 'hr_officer'],
            ],
        ];

        foreach ($positions as $departmentCode => $departmentPositions) {
            foreach ($departmentPositions as $position) {
                Position::updateOrCreate(
                    [
                        'department_id' => $departments[$departmentCode]->id,
                        'code' => $position['code'],
                    ],
                    ['name' => $position['name']]
                );
            }

            if (in_array($departmentCode, ['sales', 'planning', 'production', 'warehouse', 'dyeing'], true)) {
                $allowedCodes = collect($departmentPositions)->pluck('code')->all();
                $fallbackCode = $departmentCode === 'warehouse' ? 'storekeeper' : $allowedCodes[0];
                $fallback = Position::where('department_id', $departments[$departmentCode]->id)->where('code', $fallbackCode)->first();

                Position::where('department_id', $departments[$departmentCode]->id)
                    ->whereNotIn('code', $allowedCodes)
                    ->get()
                    ->each(function (Position $position) use ($fallback): void {
                        if ($fallback && $position->users()->exists()) {
                            $position->users()->update(['position_id' => $fallback->id]);
                        }

                        $position->delete();
                    });
            }
        }

        $warehouses = [
            ['code' => 'yarn', 'name' => 'مخزن غزل', 'location' => 'المبنى الرئيسي', 'active' => true],
            ['code' => 'raw', 'name' => 'مخزن خام', 'location' => 'المستودع الشمالي', 'active' => true],
            ['code' => 'chemical', 'name' => 'مخزن كيماويات', 'location' => 'المستودع الشرقي', 'active' => true],
            ['code' => 'dyed', 'name' => 'مخزن مصبوغ', 'location' => 'المستودع الجنوبي', 'active' => true],
        ];

        foreach ($warehouses as $warehouse) {
            Warehouse::updateOrCreate(
                ['code' => $warehouse['code']],
                $warehouse
            );
        }

        $units = [
            ['code' => 'kg', 'name' => 'كيلو', 'description' => 'وحدة الوزن بالكيلوغرام', 'active' => true],
            ['code' => 'meter', 'name' => 'متر', 'description' => 'وحدة الطول بالمتر', 'active' => true],
            ['code' => 'piece', 'name' => 'قطعة', 'description' => 'وحدة القطعة', 'active' => true],
            ['code' => 'roll', 'name' => 'لفة', 'description' => 'وحدة الرول', 'active' => true],
            ['code' => 'carton', 'name' => 'كرتون', 'description' => 'وحدة الكرتون', 'active' => true],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(
                ['code' => $unit['code']],
                $unit
            );
        }
    }
}
