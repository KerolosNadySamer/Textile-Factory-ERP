<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TextileErpSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('departments')->insert([
            ['name' => 'المبيعات', 'code' => 'SALES', 'manager' => 'أحمد سمير', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'التخطيط', 'code' => 'PLAN', 'manager' => 'مينا عادل', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'النسج', 'code' => 'WEAVE', 'manager' => 'جرجس فوزي', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'المصبغة', 'code' => 'DYE', 'manager' => 'كريم نبيل', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'الجودة', 'code' => 'QC', 'manager' => 'سارة فؤاد', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('customers')->insert([
            ['name' => 'شركة النيل للمنسوجات', 'phone' => '01000000001', 'city' => 'القاهرة', 'credit_limit' => 250000, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'مصنع الدلتا للملابس', 'phone' => '01000000002', 'city' => 'المحلة', 'credit_limit' => 150000, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('warehouses')->insert([
            ['name' => 'مخزن الغزل', 'type' => 'Raw Yarn', 'keeper' => 'نبيل منصور', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'مخزن الخام', 'type' => 'Raw Fabric', 'keeper' => 'عادل كمال', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'مخزن الكيماويات', 'type' => 'Chemicals', 'keeper' => 'سعيد فهيم', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'مخزن المنتج النهائي', 'type' => 'Finished Goods', 'keeper' => 'ماركو يوسف', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('inventory_items')->insert([
            ['warehouse_id' => 1, 'name' => 'غزل قطن 30/1', 'sku' => 'YRN-30-1', 'unit' => 'kg', 'quantity' => 1800, 'reorder_level' => 500, 'created_at' => now(), 'updated_at' => now()],
            ['warehouse_id' => 3, 'name' => 'صبغة زرقاء', 'sku' => 'DYE-BLUE', 'unit' => 'kg', 'quantity' => 80, 'reorder_level' => 100, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('machines')->insert([
            ['name' => 'ماكينة نسج 01', 'code' => 'WV-01', 'department' => 'النسج', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'حوض صباغة 01', 'code' => 'DY-01', 'department' => 'المصبغة', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('employees')->insert([
            ['name' => 'محمود علي', 'employee_no' => 'EMP-001', 'department_id' => 3, 'job_title' => 'مشغل نسج', 'salary' => 8000, 'hire_date' => now()->subYear(), 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'هند نبيل', 'employee_no' => 'EMP-002', 'department_id' => 5, 'job_title' => 'مفتش جودة', 'salary' => 9000, 'hire_date' => now()->subMonths(8), 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('sales_orders')->insert([
            ['order_no' => 'SO-2026-001', 'customer_id' => 1, 'product' => 'قماش قطن مصبوغ', 'required_quality' => 'First Grade', 'color' => 'أزرق', 'width' => 160, 'length' => 5000, 'quantity' => 2500, 'price' => 75, 'delivery_date' => now()->addDays(10), 'status' => 'Approved', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('production_requests')->insert([
            ['sales_order_id' => 1, 'request_no' => 'PR-2026-001', 'product_type' => 'Dyed', 'status' => 'Pending', 'notes' => 'نسج + صباغة + فحص جودة', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('production_plans')->insert([
            ['production_request_id' => 1, 'plan_no' => 'PLAN-2026-001', 'start_date' => now(), 'end_date' => now()->addDays(7), 'priority' => 'High', 'status' => 'Planned', 'stages' => 'صرف غزل، نسج، صباغة، جودة، مخزن نهائي', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('weaving_batches')->insert([
            ['production_plan_id' => 1, 'machine_id' => 1, 'operator_id' => 1, 'batch_no' => 'WB-001', 'input_yarn_qty' => 1000, 'output_fabric_qty' => 920, 'waste_qty' => 80, 'status' => 'Completed', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('dyeing_batches')->insert([
            ['weaving_batch_id' => 1, 'machine_id' => 2, 'batch_no' => 'DB-001', 'color' => 'أزرق', 'temperature' => 80, 'process_minutes' => 120, 'chemical_qty' => 25, 'waste_qty' => 15, 'status' => 'Completed', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('fabric_rolls')->insert([
            ['dyeing_batch_id' => 1, 'weaving_batch_id' => 1, 'roll_no' => 'ROLL-001', 'qr_code' => 'QR-ROLL-001', 'weight' => 42, 'length' => 100, 'grade' => 'First Grade', 'status' => 'In Quality', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('quality_checks')->insert([
            ['fabric_roll_id' => 1, 'inspector_id' => 2, 'check_no' => 'QC-001', 'grade' => 'First Grade', 'status' => 'Approved', 'notes' => 'مطابق للمواصفات', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('invoices')->insert([
            ['sales_order_id' => 1, 'invoice_no' => 'INV-2026-001', 'subtotal' => 187500, 'tax' => 26250, 'total' => 213750, 'payment_status' => 'Partially Paid', 'due_date' => now()->addDays(20), 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('notifications')->insert([
            ['title' => 'نقص مخزون', 'type' => 'Inventory', 'message' => 'الصبغة الزرقاء أقل من حد الطلب.', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'طلبية قيد التخطيط', 'type' => 'Planning', 'message' => 'الطلبية SO-2026-001 تحتاج متابعة مراحل التشغيل.', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
