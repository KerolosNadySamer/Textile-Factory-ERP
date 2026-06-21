<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\InventoryLedgerEntry;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\SalesOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    public function __invoke(Request $request, string $type)
    {
        $language = $this->language($request);

        if ($type === 'customers') {
            abort_unless($this->canExportCustomerData($request->user()), 403);
        }

        if ($type === 'suppliers') {
            abort_unless($this->canExportSupplierData($request->user()), 403);
        }

        [$fileName, $title, $headings, $rows] = match ($type) {
            'customers' => [
                $this->fileName('customers', $language),
                $this->title('customers', $language),
                $this->headings('customers', $language),
                Customer::query()
                    ->with('salesRep:id,name')
                    ->orderByRaw($this->numericCodeOrderExpression('code', 999999999))
                    ->orderBy('code')
                    ->get()
                    ->map(fn ($row) => [
                        $row->code,
                        $row->name_ar ?? $row->name,
                        $row->salesRep?->name,
                        $row->mobile,
                        $row->phone,
                        $row->email,
                        $row->city,
                        $row->credit_limit,
                        $row->payment_terms,
                        $row->tax_number,
                        $this->translateStatus($row->status, $language),
                        $this->translateStatus($row->data_status, $language),
                        $row->notes,
                    ]),
            ],
            'suppliers' => [
                $this->fileName('suppliers', $language),
                $this->title('suppliers', $language),
                $this->headings('suppliers', $language),
                Supplier::query()
                    ->orderByRaw($this->numericCodeOrderExpression('code', 999999999))
                    ->orderBy('code')
                    ->get()
                    ->map(fn ($row) => [$row->code, $row->name, $row->mobile, $row->email, $this->translateStatus($row->status, $language)]),
            ],
            'products' => [
                $this->fileName('products', $language),
                $this->title('products', $language),
                $this->headings('products', $language),
                Product::query()->latest()->get()->map(fn ($row) => [$row->code, $row->name, $this->translateStatus($row->type, $language), $this->translateStatus($row->unit, $language), $row->price, $this->yesNo((bool) $row->active, $language)]),
            ],
            'inventory-ledger' => [
                $this->fileName('inventory-ledger', $language),
                $this->title('inventory-ledger', $language),
                $this->headings('inventory-ledger', $language),
                InventoryLedgerEntry::query()
                    ->with(['lot:id,lot_number', 'product:id,code,name'])
                    ->latest()
                    ->get()
                    ->map(fn ($row) => [$row->entry_date?->format('Y-m-d'), $this->translateStatus($row->document_type, $language), $row->document_number, $row->lot?->lot_number, $row->product?->code, $row->in_qty, $row->out_qty, $row->balance, $row->unit_cost, $row->total_cost]),
            ],
            'lots' => [
                $this->fileName('lots', $language),
                $this->title('lots', $language),
                $this->headings('lots', $language),
                Lot::query()->with('product:id,code,name')->latest()->get()->map(fn ($row) => [$row->display_number, $this->translateStatus($row->lot_type, $language), $row->product?->code, $row->quantity, $this->translateStatus($row->unit, $language), $this->translateStatus($row->status, $language), $row->supplier]),
            ],
            'sales-orders' => [
                $this->fileName('sales-orders', $language),
                $this->title('sales-orders', $language),
                $this->headings('sales-orders', $language),
                SalesOrder::query()->with('customer:id,name,name_ar')->latest()->get()->map(fn ($row) => [$row->so_number, $row->customer?->name_ar ?? $row->customer?->name, $row->order_date?->format('Y-m-d'), $this->translateStatus($row->priority, $language), $this->translateStatus($row->status, $language)]),
            ],
            'production-orders' => [
                $this->fileName('production-orders', $language),
                $this->title('production-orders', $language),
                $this->headings('production-orders', $language),
                ProductionOrder::query()->with(['salesOrder:id,so_number', 'customer:id,name,name_ar'])->latest()->get()->map(fn ($row) => [$row->production_number, $row->salesOrder?->so_number, $row->customer?->name_ar ?? $row->customer?->name, $row->planned_quantity, $this->translateStatus($row->status, $language)]),
            ],
            'employees' => [
                $this->fileName('employees', $language),
                $this->title('employees', $language),
                $this->headings('employees', $language),
                User::query()
                    ->with(['department:id,name', 'position:id,name', 'manager:id,name', 'role:id,slug'])
                    ->when($request->filled('department_id'), fn ($query) => $query->where('department_id', $request->integer('department_id')))
                    ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))
                    ->orderBy('employee_code')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($row) => [
                        $row->employee_code,
                        $row->name,
                        $row->department?->name,
                        $row->position?->name,
                        $row->manager?->name,
                        $row->phone,
                        $row->email,
                        $row->national_id,
                        $row->education_qualification,
                        $row->hired_at?->format('Y-m-d'),
                        $this->translateStatus($row->status, $language),
                        $this->yesNo((bool) $row->login_enabled, $language),
                        $row->basic_salary,
                        $row->address,
                    ]),
            ],
            default => abort(404),
        };

        if ($request->input('format') === 'pdf') {
            abort_unless(in_array($type, ['customers', 'suppliers'], true), 404);

            return view('print.document', [
                'title' => $title,
                'number' => now()->format('Y-m-d H:i'),
                'summary' => [
                    $language === 'ar' ? 'عدد السجلات' : 'Rows' => $rows->count(),
                    $language === 'ar' ? 'وقت الطباعة' : 'Printed At' => now()->format('Y-m-d H:i'),
                ],
                'rows' => $rows,
                'headings' => $headings,
            ]);
        }

        $html = view('exports.excel', [
            'language' => $language,
            'headings' => $headings,
            'rows' => $rows,
        ])->render();

        return response($html, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    private function canExportCustomerData($user): bool
    {
        return $user?->hasRole(['admin', 'general_manager']) === true
            || (
                $user?->hasPermission(['export_own_customers', 'export_partial_data']) === true
                && $user?->department?->code === 'sales'
                && in_array($user?->position?->code, ['sales_manager', 'sales_officer'], true)
            );
    }

    private function canExportSupplierData($user): bool
    {
        return $user?->hasRole(['admin', 'general_manager']) === true
            || (
                $user?->hasPermission(['export_assigned_suppliers', 'export_partial_data']) === true
                && $user?->department?->code === 'purchasing'
                && in_array($user?->position?->code, ['purchasing_manager', 'purchasing_officer'], true)
            );
    }

    private function language(Request $request): string
    {
        return $request->query('lang') === 'en' ? 'en' : 'ar';
    }

    private function fileName(string $type, string $language): string
    {
        return str_replace('-', '_', $type).'_'.$language.'.xls';
    }

    private function title(string $type, string $language): string
    {
        return $this->titles()[$type][$language] ?? $this->titles()[$type]['en'] ?? $type;
    }

    private function headings(string $type, string $language): array
    {
        return $this->headingSets()[$type][$language] ?? $this->headingSets()[$type]['en'] ?? [];
    }

    private function yesNo(bool $value, string $language): string
    {
        return $value
            ? ($language === 'ar' ? 'نعم' : 'Yes')
            : ($language === 'ar' ? 'لا' : 'No');
    }

    private function translateStatus(?string $value, string $language): ?string
    {
        if ($value === null || $language !== 'ar') {
            return $value;
        }

        return [
            'active' => 'نشط',
            'inactive' => 'غير نشط',
            'enabled' => 'مفعل',
            'disabled' => 'غير مفعل',
            'pending_review' => 'بانتظار المراجعة',
            'pending_sales_officer' => 'بانتظار مسؤول المبيعات',
            'pending_sales_manager' => 'بانتظار مدير المبيعات',
            'approved' => 'معتمد',
            'rejected' => 'مرفوض',
            'draft' => 'مسودة',
            'submitted' => 'مرسل',
            'planning_review' => 'بانتظار المدير العام',
            'sales_officer_review' => 'بانتظار مسؤول المبيعات',
            'in_production' => 'تحت الإنتاج',
            'completed' => 'مكتمل',
            'delivered' => 'تم التسليم',
            'cancelled' => 'ملغي',
            'normal' => 'عادي',
            'urgent' => 'عاجل',
            'very_urgent' => 'عاجل جدا',
            'yarn' => 'غزل',
            'raw_fabric' => 'قماش خام',
            'dyed_fabric' => 'قماش مصبوغ',
            'chemical' => 'كيماويات',
            'packing' => 'تعبئة',
            'kg' => 'كجم',
            'meter' => 'متر',
            'piece' => 'قطعة',
            'roll' => 'رول',
            'carton' => 'كرتونة',
            'open' => 'مفتوح',
            'closed' => 'مغلق',
            'yarn_purchase' => 'شراء غزل',
            'issue_to_production' => 'صرف للإنتاج',
            'raw_fabric_receipt' => 'استلام قماش خام',
            'send_to_dyeing' => 'إرسال للصباغة',
            'dyed_fabric_receipt' => 'استلام قماش مصبوغ',
            'customer_issue' => 'صادر للعميل',
            'customer_return' => 'مرتجع من العميل',
            'adjustment' => 'تسوية',
        ][$value] ?? $value;
    }

    private function titles(): array
    {
        return [
            'customers' => ['ar' => 'العملاء', 'en' => 'Customers'],
            'suppliers' => ['ar' => 'الموردون', 'en' => 'Suppliers'],
            'products' => ['ar' => 'الأصناف', 'en' => 'Products'],
            'inventory-ledger' => ['ar' => 'دفتر حركة المخزون', 'en' => 'Inventory Ledger'],
            'lots' => ['ar' => 'اللوطات', 'en' => 'Lots'],
            'sales-orders' => ['ar' => 'طلبيات العملاء', 'en' => 'Customer Orders'],
            'production-orders' => ['ar' => 'أوامر الإنتاج', 'en' => 'Production Orders'],
            'employees' => ['ar' => 'الموظفون', 'en' => 'Employees'],
        ];
    }

    private function headingSets(): array
    {
        return [
            'customers' => [
                'ar' => ['الكود', 'اسم العميل', 'مندوب المبيعات', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'المدينة', 'حد الائتمان', 'شروط الدفع', 'الرقم الضريبي', 'الحالة', 'حالة البيانات', 'ملاحظات'],
                'en' => ['Code', 'Customer Name', 'Sales Rep', 'Mobile', 'Phone', 'Email', 'City', 'Credit Limit', 'Payment Terms', 'Tax Number', 'Status', 'Data Status', 'Notes'],
            ],
            'suppliers' => [
                'ar' => ['الكود', 'اسم المورد', 'الموبايل', 'البريد الإلكتروني', 'الحالة'],
                'en' => ['Code', 'Name', 'Mobile', 'Email', 'Status'],
            ],
            'products' => [
                'ar' => ['الكود', 'اسم الصنف', 'النوع', 'الوحدة', 'السعر', 'نشط'],
                'en' => ['Code', 'Name', 'Type', 'Unit', 'Price', 'Active'],
            ],
            'inventory-ledger' => [
                'ar' => ['التاريخ', 'نوع المستند', 'رقم المستند', 'اللوط', 'الصنف', 'وارد', 'صادر', 'الرصيد', 'تكلفة الوحدة', 'إجمالي التكلفة'],
                'en' => ['Date', 'Document Type', 'Document Number', 'Lot', 'Product', 'In', 'Out', 'Balance', 'Unit Cost', 'Total Cost'],
            ],
            'lots' => [
                'ar' => ['اللوط', 'النوع', 'الصنف', 'الكمية', 'الوحدة', 'الحالة', 'المورد'],
                'en' => ['Lot', 'Type', 'Product', 'Quantity', 'Unit', 'Status', 'Supplier'],
            ],
            'sales-orders' => [
                'ar' => ['رقم الطلبية', 'العميل', 'التاريخ', 'الأولوية', 'الحالة'],
                'en' => ['Number', 'Customer', 'Date', 'Priority', 'Status'],
            ],
            'production-orders' => [
                'ar' => ['رقم أمر الإنتاج', 'طلبية العميل', 'العميل', 'الكمية المخططة', 'الحالة'],
                'en' => ['Number', 'Sales Order', 'Customer', 'Planned Qty', 'Status'],
            ],
            'employees' => [
                'ar' => ['كود الموظف', 'الاسم', 'القسم', 'الوظيفة', 'المدير', 'الهاتف', 'البريد الإلكتروني', 'الرقم القومي', 'المؤهل', 'تاريخ التعيين', 'الحالة', 'حساب الدخول مفعل', 'الراتب الأساسي', 'العنوان'],
                'en' => ['Employee Code', 'Name', 'Department', 'Position', 'Manager', 'Phone', 'Email', 'National ID', 'Qualification', 'Hire Date', 'Status', 'Login Enabled', 'Basic Salary', 'Address'],
            ],
        ];
    }

    private function numericCodeOrderExpression(string $column, int $fallback): string
    {
        if (DB::getDriverName() === 'sqlite') {
            return "CASE WHEN {$column} GLOB '[0-9]*' THEN CAST({$column} AS INTEGER) ELSE {$fallback} END";
        }

        return "CASE WHEN {$column} REGEXP '^[0-9]+$' THEN CAST({$column} AS UNSIGNED) ELSE {$fallback} END";
    }
}
