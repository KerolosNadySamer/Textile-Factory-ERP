<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class ErpController extends Controller
{
    public array $modules = [
        'users' => [
            'title' => 'Users',
            'table' => 'users',
            'fields' => ['name' => 'Name', 'email' => 'Email', 'password' => 'Password', 'role' => 'Role', 'employee_id' => 'Employee', 'status' => 'Status'],
            'required' => ['name', 'email', 'password', 'role'],
        ],
        'customers' => [
            'title' => 'العملاء',
            'table' => 'customers',
            'fields' => ['name' => 'اسم العميل', 'phone' => 'الهاتف', 'email' => 'البريد', 'city' => 'المدينة', 'credit_limit' => 'حد الائتمان', 'status' => 'الحالة'],
            'required' => ['name'],
        ],
        'orders' => [
            'title' => 'المبيعات والطلبيات',
            'table' => 'sales_orders',
            'fields' => ['order_no' => 'رقم الطلبية', 'customer_id' => 'العميل', 'product' => 'المنتج', 'required_quality' => 'الجودة', 'color' => 'اللون', 'width' => 'العرض', 'length' => 'الطول', 'quantity' => 'الكمية', 'price' => 'السعر', 'delivery_date' => 'موعد التسليم', 'status' => 'الحالة'],
            'required' => ['order_no', 'customer_id', 'product', 'required_quality', 'quantity'],
        ],
        'production-requests' => [
            'title' => 'طلبات الإنتاج',
            'table' => 'production_requests',
            'fields' => ['request_no' => 'رقم الطلب', 'sales_order_id' => 'الطلبية', 'product_type' => 'نوع المنتج', 'status' => 'الحالة', 'notes' => 'ملاحظات'],
            'required' => ['request_no', 'sales_order_id'],
        ],
        'plans' => [
            'title' => 'التخطيط',
            'table' => 'production_plans',
            'fields' => ['plan_no' => 'رقم الخطة', 'production_request_id' => 'طلب الإنتاج', 'start_date' => 'بداية', 'end_date' => 'نهاية', 'priority' => 'الأولوية', 'status' => 'الحالة', 'stages' => 'المراحل'],
            'required' => ['plan_no', 'production_request_id'],
        ],
        'warehouses' => [
            'title' => 'المخازن',
            'table' => 'warehouses',
            'fields' => ['name' => 'اسم المخزن', 'type' => 'النوع', 'keeper' => 'المسؤول', 'status' => 'الحالة'],
            'required' => ['name', 'type'],
        ],
        'inventory' => [
            'title' => 'الأصناف والمخزون',
            'table' => 'inventory_items',
            'fields' => ['warehouse_id' => 'المخزن', 'name' => 'الصنف', 'sku' => 'الكود', 'unit' => 'الوحدة', 'quantity' => 'الرصيد', 'reorder_level' => 'حد الطلب', 'status' => 'الحالة'],
            'required' => ['warehouse_id', 'name', 'sku'],
        ],
        'material-issues' => [
            'title' => 'أذون صرف الخامات',
            'table' => 'material_issues',
            'fields' => ['voucher_no' => 'رقم الإذن', 'production_plan_id' => 'خطة التشغيل', 'inventory_item_id' => 'الصنف', 'quantity' => 'الكمية', 'approved_by' => 'اعتمد بواسطة', 'status' => 'الحالة'],
            'required' => ['voucher_no', 'inventory_item_id', 'quantity'],
        ],
        'machines' => [
            'title' => 'الماكينات',
            'table' => 'machines',
            'fields' => ['name' => 'اسم الماكينة', 'code' => 'الكود', 'department' => 'القسم', 'status' => 'الحالة'],
            'required' => ['name', 'code', 'department'],
        ],
        'weaving' => [
            'title' => 'الإنتاج - النسج',
            'table' => 'weaving_batches',
            'fields' => ['batch_no' => 'رقم التشغيلة', 'production_plan_id' => 'الخطة', 'machine_id' => 'الماكينة', 'operator_id' => 'العامل', 'input_yarn_qty' => 'الغزل الداخل', 'output_fabric_qty' => 'القماش الناتج', 'waste_qty' => 'الهالك', 'status' => 'الحالة'],
            'required' => ['batch_no', 'production_plan_id'],
        ],
        'dyeing' => [
            'title' => 'المصبغة',
            'table' => 'dyeing_batches',
            'fields' => ['batch_no' => 'رقم التشغيلة', 'weaving_batch_id' => 'تشغيلة النسج', 'machine_id' => 'الماكينة', 'color' => 'اللون', 'temperature' => 'الحرارة', 'process_minutes' => 'زمن التشغيل', 'chemical_qty' => 'الكيماويات', 'waste_qty' => 'الهالك', 'status' => 'الحالة'],
            'required' => ['batch_no', 'weaving_batch_id', 'color'],
        ],
        'rolls' => [
            'title' => 'تتبع الرولات QR',
            'table' => 'fabric_rolls',
            'fields' => ['roll_no' => 'رقم الرول', 'qr_code' => 'QR', 'weaving_batch_id' => 'نسج', 'dyeing_batch_id' => 'صباغة', 'weight' => 'الوزن', 'length' => 'الطول', 'grade' => 'الدرجة', 'status' => 'الحالة'],
            'required' => ['roll_no', 'qr_code'],
        ],
        'quality' => [
            'title' => 'الجودة',
            'table' => 'quality_checks',
            'fields' => ['check_no' => 'رقم الفحص', 'fabric_roll_id' => 'الرول', 'inspector_id' => 'المفتش', 'color_result' => 'اللون', 'measurement_result' => 'المقاس', 'defects' => 'العيوب', 'grade' => 'الدرجة', 'status' => 'الحالة', 'notes' => 'ملاحظات'],
            'required' => ['check_no', 'fabric_roll_id'],
        ],
        'invoices' => [
            'title' => 'الفواتير',
            'table' => 'invoices',
            'fields' => ['invoice_no' => 'رقم الفاتورة', 'sales_order_id' => 'الطلبية', 'subtotal' => 'الإجمالي قبل الضريبة', 'tax' => 'الضريبة', 'total' => 'الإجمالي', 'payment_status' => 'حالة الدفع', 'due_date' => 'تاريخ الاستحقاق'],
            'required' => ['invoice_no', 'sales_order_id'],
        ],
        'payments' => [
            'title' => 'المدفوعات',
            'table' => 'payments',
            'fields' => ['invoice_id' => 'الفاتورة', 'amount' => 'المبلغ', 'method' => 'طريقة الدفع', 'bank' => 'البنك', 'transfer_no' => 'رقم التحويل', 'paid_at' => 'تاريخ الدفع', 'status' => 'الحالة'],
            'required' => ['invoice_id', 'amount'],
        ],
        'shipping' => [
            'title' => 'الشحن والتسليم',
            'table' => 'shipping_orders',
            'fields' => ['shipping_no' => 'رقم الشحن', 'sales_order_id' => 'الطلبية', 'company' => 'شركة الشحن', 'vehicle_no' => 'السيارة', 'driver' => 'السائق', 'departure_time' => 'وقت الخروج', 'quantity' => 'الكمية', 'rolls_count' => 'عدد الرولات', 'status' => 'الحالة'],
            'required' => ['shipping_no', 'sales_order_id'],
        ],
        'employees' => [
            'title' => 'الموظفون HR',
            'table' => 'employees',
            'fields' => ['name' => 'الاسم', 'employee_no' => 'الرقم الوظيفي', 'department_id' => 'القسم', 'job_title' => 'الوظيفة', 'salary' => 'الراتب', 'hire_date' => 'تاريخ التعيين', 'status' => 'الحالة'],
            'required' => ['name', 'employee_no', 'job_title'],
        ],
        'maintenance' => [
            'title' => 'الصيانة',
            'table' => 'maintenance_requests',
            'fields' => ['machine_id' => 'الماكينة', 'technician_id' => 'الفني', 'issue' => 'العطل', 'priority' => 'الأولوية', 'type' => 'النوع', 'status' => 'الحالة'],
            'required' => ['machine_id', 'issue'],
        ],
    ];

    public function dashboard(): View
    {
        $cards = [
            'الطلبيات' => DB::table('sales_orders')->count(),
            'طلبات متأخرة' => DB::table('sales_orders')->whereDate('delivery_date', '<', now())->whereNotIn('status', ['Delivered', 'Closed', 'Cancelled'])->count(),
            'تشغيلات النسج' => DB::table('weaving_batches')->count(),
            'تشغيلات الصباغة' => DB::table('dyeing_batches')->count(),
            'رولات تحت الجودة' => DB::table('fabric_rolls')->where('status', 'In Quality')->count(),
            'فواتير غير مدفوعة' => DB::table('invoices')->where('payment_status', '!=', 'Paid')->count(),
        ];

        $lowStock = DB::table('inventory_items')->whereColumn('quantity', '<=', 'reorder_level')->limit(8)->get();
        $orders = DB::table('sales_orders')->join('customers', 'customers.id', '=', 'sales_orders.customer_id')
            ->select('sales_orders.*', 'customers.name as customer_name')->latest('sales_orders.created_at')->limit(8)->get();
        $alerts = DB::table('notifications')->latest()->limit(6)->get();

        return view('erp.dashboard', compact('cards', 'lowStock', 'orders', 'alerts'));
    }

    public function index(string $module): View
    {
        $config = $this->config($module);
        $records = DB::table($config['table'])->latest('id')->paginate(10);

        return view('erp.module', [
            'module' => $module,
            'config' => $config,
            'records' => $records,
            'lookups' => $this->lookups(),
            'editing' => null,
        ]);
    }

    public function edit(string $module, int $id): View
    {
        $config = $this->config($module);
        if ($this->isProtectedSystemRecord($config['table'], $id)) {
            abort(403, 'This core admin account cannot be edited.');
        }

        $records = DB::table($config['table'])->latest('id')->paginate(10);
        $editing = DB::table($config['table'])->find($id);

        return view('erp.module', [
            'module' => $module,
            'config' => $config,
            'records' => $records,
            'lookups' => $this->lookups(),
            'editing' => $editing,
        ]);
    }

    public function store(Request $request, string $module): RedirectResponse
    {
        $config = $this->config($module);
        $data = $this->validatedData($request, $config);
        $data = $this->prepareData($config['table'], $data, false);
        $id = DB::table($config['table'])->insertGetId($data + ['created_at' => now(), 'updated_at' => now()]);
        $this->log('إنشاء', $config['title'], $id);

        return back()->with('success', 'تم حفظ البيانات بنجاح');
    }

    public function update(Request $request, string $module, int $id): RedirectResponse
    {
        $config = $this->config($module);
        if ($this->isProtectedSystemRecord($config['table'], $id)) {
            return redirect()->route('erp.module', $module)->with('success', 'Core admin account is protected and cannot be edited.');
        }

        $data = $this->validatedData($request, $config);
        $data = $this->prepareData($config['table'], $data, true);
        DB::table($config['table'])->where('id', $id)->update($data + ['updated_at' => now()]);
        $this->log('تعديل', $config['title'], $id);

        return redirect()->route('erp.module', $module)->with('success', 'تم تعديل البيانات بنجاح');
    }

    public function destroy(string $module, int $id): RedirectResponse
    {
        $config = $this->config($module);
        if ($this->isProtectedSystemRecord($config['table'], $id)) {
            return back()->with('success', 'Core admin account is protected and cannot be deleted.');
        }

        DB::table($config['table'])->where('id', $id)->delete();
        $this->log('حذف', $config['title'], $id);

        return back()->with('success', 'تم حذف السجل');
    }

    private function config(string $module): array
    {
        abort_unless(isset($this->modules[$module]), 404);

        return $this->modules[$module];
    }

    private function validatedData(Request $request, array $config): array
    {
        $rules = [];
        foreach ($config['fields'] as $field => $label) {
            $rules[$field] = in_array($field, $config['required'] ?? [], true) ? ['required'] : ['nullable'];
        }

        return array_intersect_key($request->validate($rules), $config['fields']);
    }

    private function prepareData(string $table, array $data, bool $isUpdate): array
    {
        if ($table === 'users') {
            if (($data['password'] ?? '') === '' && $isUpdate) {
                unset($data['password']);
            } elseif (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }
        }

        return $data;
    }

    private function isProtectedSystemRecord(string $table, int $id): bool
    {
        if ($table !== 'users' || !Schema::hasColumn('users', 'is_system')) {
            return false;
        }

        return DB::table('users')->where('id', $id)->where('is_system', true)->exists();
    }

    private function lookups(): array
    {
        $lookupTables = [
            'customer_id' => ['customers', 'name'],
            'sales_order_id' => ['sales_orders', 'order_no'],
            'production_request_id' => ['production_requests', 'request_no'],
            'production_plan_id' => ['production_plans', 'plan_no'],
            'warehouse_id' => ['warehouses', 'name'],
            'inventory_item_id' => ['inventory_items', 'name'],
            'machine_id' => ['machines', 'name'],
            'operator_id' => ['employees', 'name'],
            'technician_id' => ['employees', 'name'],
            'inspector_id' => ['employees', 'name'],
            'weaving_batch_id' => ['weaving_batches', 'batch_no'],
            'dyeing_batch_id' => ['dyeing_batches', 'batch_no'],
            'fabric_roll_id' => ['fabric_rolls', 'roll_no'],
            'invoice_id' => ['invoices', 'invoice_no'],
            'department_id' => ['departments', 'name'],
            'employee_id' => ['employees', 'name'],
        ];

        $lookups = [];
        foreach ($lookupTables as $field => [$table, $label]) {
            if (Schema::hasTable($table)) {
                $lookups[$field] = DB::table($table)->select('id', "$label as label")->orderBy('id')->limit(100)->get();
            }
        }

        return $lookups;
    }

    private function log(string $action, string $module, ?int $recordId = null): void
    {
        DB::table('activity_logs')->insert([
            'actor' => 'Admin',
            'action' => $action,
            'module' => $module,
            'record_id' => $recordId,
            'description' => "{$action} سجل في {$module}",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
