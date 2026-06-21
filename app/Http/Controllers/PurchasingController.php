<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceipt;
use App\Models\InventoryLedgerEntry;
use App\Models\Lot;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\Supplier;
use App\Services\GovernanceChangeRequestService;
use App\Services\SequenceService;
use App\Services\SpreadsheetImportService;
use App\Services\TimelineService;
use App\Services\XlsxTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PurchasingController extends Controller
{
    public function __construct(
        private readonly TimelineService $timeline,
        private readonly SpreadsheetImportService $spreadsheets,
        private readonly SequenceService $sequences,
        private readonly XlsxTemplateService $xlsxTemplates,
        private readonly GovernanceChangeRequestService $governanceChanges,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('Purchasing/Index', [
            'suppliers' => Supplier::query()->with('creator:id,name')->latest()->get(),
            'purchaseRequests' => PurchaseRequest::query()
                ->with(['requester:id,name', 'items.product:id,code,name,unit,type', 'timeline' => fn ($query) => $query->with('user:id,name')->oldest()])
                ->latest()
                ->get(),
            'purchaseOrders' => PurchaseOrder::query()
                ->with(['supplier:id,code,name', 'purchaseRequest:id,pr_number', 'items.product:id,code,name,unit,type', 'timeline' => fn ($query) => $query->with('user:id,name')->oldest()])
                ->latest()
                ->get(),
            'goodsReceipts' => GoodsReceipt::query()
                ->with(['supplier:id,code,name', 'purchaseOrder:id,po_number', 'items.product:id,code,name,unit,type', 'items.lot:id,lot_number,lot_type,quantity,unit', 'timeline' => fn ($query) => $query->with('user:id,name')->oldest()])
                ->latest()
                ->get(),
            'products' => Product::query()
                ->where('active', true)
                ->where('type', '!=', 'dyed_fabric')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type', 'unit']),
            'approvedPurchaseOrders' => PurchaseOrder::query()
                ->with(['supplier:id,code,name', 'items.product:id,code,name,unit,type'])
                ->whereIn('status', ['approved', 'partially_received'])
                ->latest()
                ->get(),
        ]);
    }

    public function storeSupplier(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'digits_between:1,100', 'unique:suppliers,code'],
            'name' => ['required', 'string', 'max:255', Rule::notIn(['اسم المورد', 'المورد', 'supplier name', 'supplier_name', 'name'])],
            'mobile' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'commercial_register' => ['nullable', 'string', 'max:100'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string'],
        ]);

        $this->governanceChanges->requestCreate($request->user(), Supplier::class, $data + [
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Supplier change request sent for approval.');
    }

    public function importSuppliers(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required_without:import_decision', 'file', 'mimes:csv,xlsx', 'max:5120'],
            'import_decision' => ['nullable', Rule::in(['accept_duplicates', 'unique_only'])],
        ]);

        $rows = $request->input('import_decision')
            ? $request->session()->pull('pending_supplier_import_rows', [])
            : $this->spreadsheets->rows($request->file('file'));

        if ($rows === []) {
            return back()->with('error', 'No pending supplier import was found. Please upload the file again.');
        }

        $duplicateInfo = $this->duplicateSupplierImportNames($rows);

        if (! $request->input('import_decision') && $duplicateInfo['duplicate_rows'] > 0) {
            $request->session()->put('pending_supplier_import_rows', $rows);

            return back()->with('duplicate_supplier_import', [
                'duplicate_names' => $duplicateInfo['duplicate_names'],
                'duplicate_rows' => $duplicateInfo['duplicate_rows'],
                'message' => "Found {$duplicateInfo['duplicate_rows']} repeated supplier name rows across {$duplicateInfo['duplicate_names']} names.",
            ]);
        }

        $uniqueOnly = $request->input('import_decision') === 'unique_only';
        $created = 0;
        $skipped = 0;
        $errors = [];
        $seenNames = [];

        DB::transaction(function () use ($request, $rows, $uniqueOnly, &$created, &$skipped, &$errors, &$seenNames): void {
            foreach ($rows as $index => $row) {
                $line = $index + 2;
                $name = $this->rowValue($row, ['supplier_name', 'name', 'اسم_المورد', 'اسم', 'الاسم', 'المورد', 'column_1']);

                if ($name === '' || $this->isSupplierHeadingName($name)) {
                    $skipped++;
                    continue;
                }

                $normalizedName = $this->normalizeName($name);

                if ($uniqueOnly && isset($seenNames[$normalizedName])) {
                    $skipped++;
                    continue;
                }

                $seenNames[$normalizedName] = true;

                $code = $this->rowValue($row, ['supplier_code', 'code', 'كود_المورد', 'كود']);

                if ($code !== '' && Supplier::query()->where('code', $code)->exists()) {
                    $errors[] = "Line {$line}: duplicate supplier code {$code}.";
                    continue;
                }

                if (Supplier::query()->where('name', $name)->exists()) {
                    $skipped++;
                    continue;
                }

                $sequence = $this->sequences->next('suppliers');
                $supplierCode = $code === '' ? $sequence['code'] : $code;

                Supplier::create([
                    'code' => $supplierCode,
                    'name' => $name,
                    'mobile' => $this->rowValue($row, ['mobile', 'موبايل', 'الموبايل']),
                    'phone' => $this->rowValue($row, ['phone', 'هاتف', 'الهاتف', 'تليفون']),
                    'email' => $this->rowValue($row, ['email', 'البريد', 'البريد_الإلكتروني']) ?: null,
                    'address' => $this->rowValue($row, ['address', 'عنوان', 'العنوان']),
                    'tax_number' => $this->rowValue($row, ['tax_number', 'الرقم_الضريبي']),
                    'commercial_register' => $this->rowValue($row, ['commercial_register', 'السجل_التجاري']),
                    'payment_terms' => $this->rowValue($row, ['payment_terms', 'شروط_الدفع']),
                    'status' => $this->rowValue($row, ['status', 'الحالة']) ?: 'active',
                    'notes' => $this->rowValue($row, ['notes', 'ملاحظات']),
                    'created_by' => $request->user()->id,
                    'updated_by' => $request->user()->id,
                ]);

                $created++;
            }
        });

        $message = "Imported {$created} suppliers.";

        if ($skipped > 0) {
            $message .= " Skipped {$skipped} heading/duplicate rows.";
        }

        if (count($errors) > 0) {
            $message .= ' Skipped: '.implode(' | ', array_slice($errors, 0, 5));
        }

        return back()->with('success', $message);
    }

    public function supplierTemplate(Request $request)
    {
        $language = $this->templateLanguage($request);

        if ($language === 'ar') {
            return $this->xlsxTemplates->download(
                'suppliers_import_template_ar.xlsx',
                [
                    ['كود المورد', 'اسم المورد', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'شروط الدفع', 'العنوان', 'الحالة', 'ملاحظات'],
                    ['', 'شركة مثال للتوريدات', '01000000000', '0220000000', 'supplier@example.com', '123456789', 'CR-001', '30 days', 'عنوان المورد', 'active', 'اكتب active أو inactive في الحالة'],
                ],
                true,
            );
        }

        $rows = $language === 'ar'
            ? [
                ['كود المورد', 'اسم المورد', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'شروط الدفع', 'العنوان', 'الحالة', 'ملاحظات'],
                ['', 'شركة مثال للتوريدات', '01000000000', '0220000000', 'supplier@example.com', '123456789', 'CR-001', '30 days', 'عنوان المورد', 'active', 'اكتب active أو inactive في الحالة'],
            ]
            : [
                ['supplier_code', 'supplier_name', 'mobile', 'phone', 'email', 'tax_number', 'commercial_register', 'payment_terms', 'address', 'status', 'notes'],
                ['', 'Example Supplier Co.', '01000000000', '0220000000', 'supplier@example.com', '123456789', 'CR-001', '30 days', 'Supplier address', 'active', 'Use active or inactive for status'],
            ];

        return $this->xlsxTemplates->download(
            "suppliers_import_template_{$language}.xlsx",
            $rows,
            $language === 'ar',
        );

        return $this->xlsxTemplates->download('suppliers_import_template.xlsx', [
            ['كود المورد', 'اسم المورد', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'شروط الدفع', 'العنوان', 'الحالة', 'ملاحظات'],
            ['', 'شركة مثال للتوريدات', '01000000000', '0220000000', 'supplier@example.com', '123456789', 'CR-001', '30 days', 'عنوان المورد', 'active', 'اكتب active أو inactive في الحالة'],
        ]);

        $rows = [
            ['كود المورد', 'اسم المورد', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'شروط الدفع', 'العنوان', 'الحالة', 'ملاحظات'],
            ['', 'شركة مثال للتوريدات', '01000000000', '0220000000', 'supplier@example.com', '123456789', 'CR-001', '30 days', 'عنوان المورد', 'active', 'اكتب active أو inactive في الحالة'],
        ];

        $handle = fopen('php://temp', 'r+');

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $content = "\xEF\xBB\xBF".stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="suppliers_import_template.csv"',
        ]);
    }

    public function storePurchaseRequest(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'request_date' => ['required', 'date'],
            'priority' => ['required', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.required_qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        $this->validatePurchasableItems($data['items'], 'items');

        DB::transaction(function () use ($request, $data): void {
            $purchaseRequest = PurchaseRequest::create([
                'pr_number' => $this->nextNumber(PurchaseRequest::class),
                'request_date' => $data['request_date'],
                'requested_by' => $request->user()->id,
                'priority' => $data['priority'],
                'status' => 'submitted',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            foreach ($data['items'] as $item) {
                $purchaseRequest->items()->create($item);
            }

            $this->timeline->record($purchaseRequest, 'Purchase Request Created', "Purchase request {$purchaseRequest->pr_number} was submitted.", $request->user());
        });

        return back()->with('success', 'Purchase request created.');
    }

    public function storePurchaseOrder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_request_id' => ['nullable', 'exists:purchase_requests,id'],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $this->validatePurchasableItems($data['items'], 'items');

        DB::transaction(function () use ($request, $data): void {
            $purchaseOrder = PurchaseOrder::create([
                'po_number' => $this->nextNumber(PurchaseOrder::class),
                'supplier_id' => $data['supplier_id'],
                'purchase_request_id' => $data['purchase_request_id'] ?? null,
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $total = (float) $item['qty'] * (float) $item['unit_price'];
                $subtotal += $total;
                $purchaseOrder->items()->create($item + ['total' => $total]);
            }

            $purchaseOrder->update(['subtotal' => $subtotal]);
            $this->timeline->record($purchaseOrder, 'Purchase Order Created', "Purchase order {$purchaseOrder->po_number} was created.", $request->user());
        });

        return back()->with('success', 'Purchase order created.');
    }

    public function approvePurchaseOrder(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        abort_unless($purchaseOrder->status === 'draft', 422);

        $purchaseOrder->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => Carbon::now(),
        ]);

        $this->timeline->record($purchaseOrder, 'Purchase Order Approved', "Purchase order {$purchaseOrder->po_number} was approved.", $request->user());

        return back()->with('success', 'Purchase order approved.');
    }

    public function storeGoodsReceipt(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_order_id' => ['required', 'exists:purchase_orders,id'],
            'receipt_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_order_item_id' => ['required', 'exists:purchase_order_items,id'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.batch_number' => ['nullable', 'string', 'max:100'],
            'items.*.lot_number' => ['required', 'string', 'max:100', 'unique:lots,lot_number'],
            'items.*.received_qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $this->validateGoodsReceiptAgainstPurchaseOrder($data);

        DB::transaction(function () use ($request, $data): void {
            $receipt = GoodsReceipt::create([
                'grn_number' => $this->nextNumber(GoodsReceipt::class),
                'supplier_id' => $data['supplier_id'],
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'receipt_date' => $data['receipt_date'],
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['items'] as $item) {
                $receipt->items()->create($item);
            }

            $this->timeline->record($receipt, 'Goods Receipt Created', "Goods receipt {$receipt->grn_number} was created.", $request->user());
        });

        return back()->with('success', 'Goods receipt created.');
    }

    public function approveGoodsReceipt(Request $request, GoodsReceipt $goodsReceipt): RedirectResponse
    {
        abort_unless($goodsReceipt->status === 'draft', 422);

        $goodsReceipt->load(['supplier', 'purchaseOrder', 'items.product']);

        $this->validateGoodsReceiptAgainstPurchaseOrder([
            'supplier_id' => $goodsReceipt->supplier_id,
            'purchase_order_id' => $goodsReceipt->purchase_order_id,
            'items' => $goodsReceipt->items->map(fn ($item) => [
                'purchase_order_item_id' => $item->purchase_order_item_id,
                'product_id' => $item->product_id,
                'received_qty' => $item->received_qty,
                'unit' => $item->unit,
                'unit_price' => $item->unit_price,
            ])->all(),
        ]);

        DB::transaction(function () use ($request, $goodsReceipt): void {
            foreach ($goodsReceipt->items as $item) {
                $product = $item->product;
                $lotType = $this->lotTypeForProduct($product->type);

                $lot = Lot::create([
                    'lot_number' => $item->lot_number,
                    'lot_type' => $lotType,
                    'product_id' => $product->id,
                    'unit' => $item->unit,
                    'quantity' => $item->received_qty,
                    'lot_date' => $goodsReceipt->receipt_date,
                    'status' => 'open',
                    'supplier' => $goodsReceipt->supplier->name,
                    'purchase_order' => $goodsReceipt->purchaseOrder?->po_number,
                    'purchase_price' => $item->unit_price,
                    'received_quantity' => $item->received_qty,
                    'notes' => $item->batch_number ? "Batch: {$item->batch_number}" : null,
                    'created_by' => $request->user()->id,
                ]);

                $item->update(['lot_id' => $lot->id]);

                InventoryLedgerEntry::create([
                    'entry_date' => $goodsReceipt->receipt_date,
                    'document_type' => $this->inventoryDocumentTypeForProduct($product->type),
                    'document_number' => $goodsReceipt->grn_number,
                    'lot_id' => $lot->id,
                    'product_id' => $product->id,
                    'in_qty' => $item->received_qty,
                    'out_qty' => 0,
                    'balance' => $item->received_qty,
                    'unit_cost' => $item->unit_price,
                    'total_cost' => (float) $item->received_qty * (float) $item->unit_price,
                    'department_id' => $request->user()->department_id,
                    'user_id' => $request->user()->id,
                    'notes' => "Auto posted from goods receipt {$goodsReceipt->grn_number}.",
                ]);

                $this->timeline->record($lot, 'Lot Received From Purchasing', "Lot {$lot->display_number} was created from {$goodsReceipt->grn_number}.", $request->user());
            }

            $goodsReceipt->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => Carbon::now(),
            ]);

            $this->updatePurchaseOrderReceiptStatus($goodsReceipt->purchaseOrder);

            $this->timeline->record($goodsReceipt, 'Goods Receipt Approved', "Goods receipt {$goodsReceipt->grn_number} posted lots and inventory ledger entries.", $request->user());
        });

        return back()->with('success', 'Goods receipt approved.');
    }

    public function rejectGoodsReceipt(Request $request, GoodsReceipt $goodsReceipt): RedirectResponse
    {
        abort_unless($goodsReceipt->status === 'draft', 422);

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $goodsReceipt->update([
            'status' => 'rejected',
            'rejected_by' => $request->user()->id,
            'rejected_at' => Carbon::now(),
            'rejection_reason' => $data['rejection_reason'],
        ]);

        $this->timeline->record($goodsReceipt, 'Goods Receipt Rejected', "Goods receipt {$goodsReceipt->grn_number} was rejected: {$data['rejection_reason']}", $request->user());

        return back()->with('success', 'Goods receipt rejected.');
    }

    private function nextNumber(string $model): string
    {
        return str_pad((string) (((int) $model::query()->max('id')) + 1), 6, '0', STR_PAD_LEFT);
    }

    private function rowValue(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            $value = trim((string) ($row[$key] ?? ''));

            if ($value !== '') {
                return $value;
            }
        }

        return '';
    }

    private function isSupplierHeadingName(string $name): bool
    {
        $normalized = $this->normalizeName($name);
        $headings = ['اسم المورد', 'المورد', 'supplier name', 'supplier_name', 'name'];

        return in_array($normalized, array_map(fn ($heading) => $this->normalizeName($heading), $headings), true);
    }

    private function duplicateSupplierImportNames(array $rows): array
    {
        $counts = [];

        foreach ($rows as $row) {
            $name = $this->rowValue($row, ['supplier_name', 'name', 'اسم_المورد', 'اسم', 'الاسم', 'المورد', 'column_1']);

            if ($name === '' || $this->isSupplierHeadingName($name)) {
                continue;
            }

            $normalizedName = $this->normalizeName($name);
            $counts[$normalizedName] = ($counts[$normalizedName] ?? 0) + 1;
        }

        $duplicateRows = collect($counts)
            ->filter(fn ($count) => $count > 1)
            ->sum(fn ($count) => $count - 1);

        return [
            'duplicate_names' => collect($counts)->filter(fn ($count) => $count > 1)->count(),
            'duplicate_rows' => $duplicateRows,
        ];
    }

    private function normalizeName(string $name): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim($name)));
    }

    private function lotTypeForProduct(string $productType): string
    {
        return match ($productType) {
            'yarn' => 'yarn',
            default => 'raw_fabric',
        };
    }

    private function inventoryDocumentTypeForProduct(string $productType): string
    {
        return match ($productType) {
            'yarn' => 'yarn_purchase',
            default => 'raw_fabric_receipt',
        };
    }

    private function validatePurchasableItems(array $items, string $fieldPrefix): void
    {
        $products = Product::query()
            ->whereIn('id', collect($items)->pluck('product_id')->filter()->all())
            ->get()
            ->keyBy('id');

        $errors = [];

        foreach ($items as $index => $item) {
            $product = $products->get((int) $item['product_id']);

            if ($product?->type === 'dyed_fabric') {
                $errors["{$fieldPrefix}.{$index}.product_id"] = 'القماش المصبوغ لا يدخل في دورة المشتريات. استلامه يتم من الإنتاج/الصباغة.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function validateGoodsReceiptAgainstPurchaseOrder(array $data): void
    {
        $purchaseOrder = PurchaseOrder::query()
            ->with(['items.product'])
            ->find($data['purchase_order_id'] ?? null);

        if (! $purchaseOrder || ! in_array($purchaseOrder->status, ['approved', 'partially_received'], true)) {
            throw ValidationException::withMessages([
                'purchase_order_id' => 'لا يمكن الاستلام إلا على أمر شراء معتمد أو مستلم جزئيًا.',
            ]);
        }

        if ((int) $purchaseOrder->supplier_id !== (int) $data['supplier_id']) {
            throw ValidationException::withMessages([
                'supplier_id' => 'المورد لا يطابق المورد المسجل في أمر الشراء.',
            ]);
        }

        $orderItems = $purchaseOrder->items->keyBy('id');
        $errors = [];

        foreach ($data['items'] as $index => $item) {
            $orderItem = $orderItems->get((int) ($item['purchase_order_item_id'] ?? 0));

            if (! $orderItem) {
                $errors["items.{$index}.purchase_order_item_id"] = 'بند الاستلام غير تابع لأمر الشراء المحدد.';
                continue;
            }

            if ($orderItem->product?->type === 'dyed_fabric') {
                $errors["items.{$index}.product_id"] = 'مخزن القماش المصبوغ غير خاضع لقسم المشتريات.';
            }

            if ((int) $orderItem->product_id !== (int) $item['product_id']) {
                $errors["items.{$index}.product_id"] = 'الصنف المستلم غير مطابق لبند أمر الشراء.';
            }

            if ($orderItem->unit !== $item['unit']) {
                $errors["items.{$index}.unit"] = 'وحدة الاستلام غير مطابقة لأمر الشراء.';
            }

            if (round((float) $orderItem->unit_price, 2) !== round((float) $item['unit_price'], 2)) {
                $errors["items.{$index}.unit_price"] = 'سعر الاستلام غير مطابق لأمر الشراء.';
            }

            $alreadyReceived = (float) $orderItem->goodsReceiptItems()
                ->whereHas('goodsReceipt', fn ($query) => $query->where('status', 'approved'))
                ->sum('received_qty');
            $remaining = (float) $orderItem->qty - $alreadyReceived;

            if ((float) $item['received_qty'] > $remaining) {
                $errors["items.{$index}.received_qty"] = "الكمية المستلمة أكبر من المتبقي في أمر الشراء ({$remaining}).";
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function updatePurchaseOrderReceiptStatus(?PurchaseOrder $purchaseOrder): void
    {
        if (! $purchaseOrder) {
            return;
        }

        $purchaseOrder->load('items.goodsReceiptItems.goodsReceipt');

        $orderedQty = (float) $purchaseOrder->items->sum(fn (PurchaseOrderItem $item) => (float) $item->qty);
        $receivedQty = (float) $purchaseOrder->items->sum(fn (PurchaseOrderItem $item) => (float) $item->goodsReceiptItems
            ->filter(fn ($receiptItem) => $receiptItem->goodsReceipt?->status === 'approved')
            ->sum(fn ($receiptItem) => (float) $receiptItem->received_qty));

        $purchaseOrder->update([
            'status' => $receivedQty >= $orderedQty ? 'received' : 'partially_received',
        ]);
    }

    private function templateLanguage(Request $request): string
    {
        return $request->query('lang') === 'en' ? 'en' : 'ar';
    }
}
