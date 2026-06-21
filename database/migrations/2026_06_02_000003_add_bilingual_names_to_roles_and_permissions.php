<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_ar');
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_ar');
        });

        foreach ($this->roleTranslations() as $slug => $translation) {
            DB::table('roles')->where('slug', $slug)->update($translation);
        }

        foreach ($this->permissionTranslations() as $slug => $translation) {
            DB::table('permissions')->where('slug', $slug)->update($translation);
        }
    }

    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'name_en']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'name_en']);
        });
    }

    private function roleTranslations(): array
    {
        return [
            'admin' => ['name_ar' => 'مدير النظام', 'name_en' => 'Admin'],
            'general_manager' => ['name_ar' => 'مدير عام', 'name_en' => 'General Manager'],
            'production' => ['name_ar' => 'إنتاج', 'name_en' => 'Production'],
            'sales' => ['name_ar' => 'مبيعات', 'name_en' => 'Sales'],
            'planning' => ['name_ar' => 'تخطيط', 'name_en' => 'Planning'],
            'warehouse' => ['name_ar' => 'مخازن', 'name_en' => 'Warehouse'],
            'dyeing' => ['name_ar' => 'صباغة', 'name_en' => 'Dyeing'],
            'weaving' => ['name_ar' => 'نسيج', 'name_en' => 'Weaving'],
            'accounting' => ['name_ar' => 'حسابات', 'name_en' => 'Accounting'],
            'purchasing' => ['name_ar' => 'مشتريات', 'name_en' => 'Purchasing'],
            'cost_accountant' => ['name_ar' => 'محاسب تكاليف', 'name_en' => 'Cost Accountant'],
            'quality' => ['name_ar' => 'جودة', 'name_en' => 'Quality'],
            'hr' => ['name_ar' => 'الموارد البشرية', 'name_en' => 'HR'],
        ];
    }

    private function permissionTranslations(): array
    {
        return [
            'view_users' => ['name_ar' => 'عرض المستخدمين', 'name_en' => 'View users'],
            'create_user' => ['name_ar' => 'إنشاء مستخدم', 'name_en' => 'Create user'],
            'edit_user' => ['name_ar' => 'تعديل مستخدم', 'name_en' => 'Edit user'],
            'delete_user' => ['name_ar' => 'حذف مستخدم', 'name_en' => 'Delete user'],
            'assign_role' => ['name_ar' => 'تعيين دور', 'name_en' => 'Assign role'],
            'view_audit_logs' => ['name_ar' => 'عرض سجل التدقيق', 'name_en' => 'View audit logs'],
            'create_order' => ['name_ar' => 'إنشاء أمر', 'name_en' => 'Create order'],
            'view_orders' => ['name_ar' => 'عرض الأوامر', 'name_en' => 'View orders'],
            'approve_order' => ['name_ar' => 'اعتماد أمر', 'name_en' => 'Approve order'],
            'view_stock' => ['name_ar' => 'عرض المخزون', 'name_en' => 'View stock'],
            'issue_stock' => ['name_ar' => 'صرف مخزون', 'name_en' => 'Issue stock'],
            'view_production' => ['name_ar' => 'عرض الإنتاج', 'name_en' => 'View production'],
            'edit_production' => ['name_ar' => 'تعديل الإنتاج', 'name_en' => 'Edit production'],
            'view_finance' => ['name_ar' => 'عرض المالية', 'name_en' => 'View finance'],
            'edit_finance' => ['name_ar' => 'تعديل المالية', 'name_en' => 'Edit finance'],
            'view_customers' => ['name_ar' => 'عرض العملاء', 'name_en' => 'View customers'],
            'create_customer' => ['name_ar' => 'إنشاء عميل', 'name_en' => 'Create customer'],
            'edit_customer' => ['name_ar' => 'تعديل عميل', 'name_en' => 'Edit customer'],
            'delete_customer' => ['name_ar' => 'حذف عميل', 'name_en' => 'Delete customer'],
            'view_sales_orders' => ['name_ar' => 'عرض طلبات البيع', 'name_en' => 'View sales orders'],
            'create_sales_order' => ['name_ar' => 'إنشاء طلب بيع', 'name_en' => 'Create sales order'],
            'edit_sales_order' => ['name_ar' => 'تعديل طلب بيع', 'name_en' => 'Edit sales order'],
            'review_sales_order' => ['name_ar' => 'مراجعة طلب بيع', 'name_en' => 'Review sales order'],
            'approve_sales_order' => ['name_ar' => 'اعتماد طلب بيع', 'name_en' => 'Approve sales order'],
            'view_products' => ['name_ar' => 'عرض الأصناف', 'name_en' => 'View products'],
            'create_product' => ['name_ar' => 'إنشاء صنف', 'name_en' => 'Create product'],
            'edit_product' => ['name_ar' => 'تعديل صنف', 'name_en' => 'Edit product'],
            'delete_product' => ['name_ar' => 'حذف صنف', 'name_en' => 'Delete product'],
            'view_production_orders' => ['name_ar' => 'عرض أوامر الإنتاج', 'name_en' => 'View production orders'],
            'create_production_order' => ['name_ar' => 'إنشاء أمر إنتاج', 'name_en' => 'Create production order'],
            'plan_production_order' => ['name_ar' => 'تخطيط أمر إنتاج', 'name_en' => 'Plan production order'],
            'release_production_order' => ['name_ar' => 'إطلاق أمر إنتاج', 'name_en' => 'Release production order'],
            'run_production_order' => ['name_ar' => 'تشغيل أمر إنتاج', 'name_en' => 'Run production order'],
            'close_production_order' => ['name_ar' => 'إغلاق أمر إنتاج', 'name_en' => 'Close production order'],
            'view_warehouses' => ['name_ar' => 'عرض المخازن', 'name_en' => 'View warehouses'],
            'view_departments' => ['name_ar' => 'عرض الأقسام', 'name_en' => 'View departments'],
            'view_units' => ['name_ar' => 'عرض الوحدات', 'name_en' => 'View units'],
            'view_dye_samples' => ['name_ar' => 'عرض عينات الصباغة', 'name_en' => 'View dye samples'],
            'create_dye_sample' => ['name_ar' => 'إنشاء عينة صباغة', 'name_en' => 'Create dye sample'],
            'review_dye_sample' => ['name_ar' => 'مراجعة عينة صباغة', 'name_en' => 'Review dye sample'],
            'approve_dye_sample' => ['name_ar' => 'اعتماد عينة صباغة', 'name_en' => 'Approve dye sample'],
            'delete_dye_sample' => ['name_ar' => 'حذف عينة صباغة', 'name_en' => 'Delete dye sample'],
            'view_issue_orders' => ['name_ar' => 'عرض أذون الصرف', 'name_en' => 'View issue orders'],
            'create_issue_order' => ['name_ar' => 'إنشاء إذن صرف', 'name_en' => 'Create issue order'],
            'edit_issue_order' => ['name_ar' => 'تعديل إذن صرف', 'name_en' => 'Edit issue order'],
            'delete_issue_order' => ['name_ar' => 'حذف إذن صرف', 'name_en' => 'Delete issue order'],
            'view_lots' => ['name_ar' => 'عرض اللوطات', 'name_en' => 'View lots'],
            'create_lot' => ['name_ar' => 'إنشاء لوط', 'name_en' => 'Create lot'],
            'edit_lot' => ['name_ar' => 'تعديل لوط', 'name_en' => 'Edit lot'],
            'delete_lot' => ['name_ar' => 'حذف لوط', 'name_en' => 'Delete lot'],
            'edit_closed_lot' => ['name_ar' => 'تعديل لوط مغلق', 'name_en' => 'Edit closed lot'],
            'approve_lot_sample' => ['name_ar' => 'اعتماد عينة لوط', 'name_en' => 'Approve lot sample'],
            'view_inventory_ledger' => ['name_ar' => 'عرض دفتر المخزون', 'name_en' => 'View inventory ledger'],
            'create_inventory_ledger_entry' => ['name_ar' => 'إنشاء حركة دفتر مخزون', 'name_en' => 'Create inventory ledger entry'],
            'view_purchasing' => ['name_ar' => 'عرض المشتريات', 'name_en' => 'View purchasing'],
            'manage_suppliers' => ['name_ar' => 'إدارة الموردين', 'name_en' => 'Manage suppliers'],
            'create_purchase_request' => ['name_ar' => 'إنشاء طلب شراء', 'name_en' => 'Create purchase request'],
            'create_purchase_order' => ['name_ar' => 'إنشاء أمر شراء', 'name_en' => 'Create purchase order'],
            'approve_purchase_order' => ['name_ar' => 'اعتماد أمر شراء', 'name_en' => 'Approve purchase order'],
            'create_goods_receipt' => ['name_ar' => 'إنشاء استلام بضاعة', 'name_en' => 'Create goods receipt'],
            'approve_goods_receipt' => ['name_ar' => 'اعتماد استلام بضاعة', 'name_en' => 'Approve goods receipt'],
            'view_cost_accounting' => ['name_ar' => 'عرض محاسبة التكاليف', 'name_en' => 'View cost accounting'],
            'create_cost_entry' => ['name_ar' => 'إنشاء قيد تكلفة', 'name_en' => 'Create cost entry'],
            'review_cost_summary' => ['name_ar' => 'مراجعة ملخص تكلفة', 'name_en' => 'Review cost summary'],
            'approve_cost_summary' => ['name_ar' => 'اعتماد ملخص تكلفة', 'name_en' => 'Approve cost summary'],
        ];
    }
};
