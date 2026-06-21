<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerOrderMessage;
use App\Models\CustomerPayment;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\SalesOrderWorkflowService;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SalesOrderController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly TimelineService $timeline,
        private readonly SalesOrderWorkflowService $workflow,
    ) {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $salesOrders = SalesOrder::query()
            ->with([
                'customer:id,code,name,name_ar,name_en,sales_rep_id',
                'customer.salesRep:id,name',
                'items.product:id,code,name,type,unit',
                'customerPayments:id,sales_order_id,payment_number,amount,method,status,payment_date,check_number,bank_name,check_due_date,received_by,treasury_received_by,received_at,treasury_received_at',
                'approvedDyeSample:id,sample_no,sample_color,requested_color',
                'creator:id,name',
                'reviewer:id,name',
                'collector:id,name',
                'treasuryReceiver:id,name',
                'approver:id,name',
                'closer:id,name',
                'timeline' => fn ($query) => $query->with(['user:id,name', 'department:id,name,code'])->oldest(),
                'messages' => fn ($query) => $query->with(['sender:id,name', 'recipient:id,name'])->oldest(),
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $like = "%{$search}%";
                $query->where(function ($inner) use ($like): void {
                    $inner->where('so_number', 'like', $like)
                        ->orWhereHas('customer', fn ($customer) => $customer
                            ->where('code', 'like', $like)
                            ->orWhere('name', 'like', $like)
                            ->orWhere('name_ar', 'like', $like)
                            ->orWhere('name_en', 'like', $like));
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($search === '' && $status === '', fn ($query) => $query->whereIn('status', ['draft', 'sales_officer_review', 'submitted', 'planning_review', 'approved', 'in_production', 'completed', 'delivered', 'rejected']))
            ->latest()
            ->limit(30)
            ->get()
            ->each(function (SalesOrder $salesOrder): void {
                $salesOrder->setAttribute('workflow', $this->workflow->snapshot($salesOrder));
            });

        return Inertia::render('SalesOrders/Index', [
            'salesOrders' => $salesOrders,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'metrics' => [
                'pendingSalesOfficer' => SalesOrder::query()->where('status', 'sales_officer_review')->count(),
                'pendingSalesManager' => SalesOrder::query()->where('status', 'submitted')->count(),
                'pendingGeneralManager' => SalesOrder::query()->where('status', 'planning_review')->count(),
                'readyForPlanning' => SalesOrder::query()->where('status', 'approved')->count(),
                'inProduction' => SalesOrder::query()->where('status', 'in_production')->count(),
                'readyForInvoice' => SalesOrder::query()->where('status', 'completed')->where('invoice_status', '!=', 'invoiced')->count(),
                'readyForDelivery' => SalesOrder::query()->whereIn('status', ['completed', 'delivered'])->where('invoice_status', 'invoiced')->where('shipping_status', '!=', 'delivered')->count(),
            ],
            'customers' => Customer::query()
                ->with('salesRep:id,name')
                ->where('status', 'active')
                ->orderBy('name_ar')
                ->get(['id', 'code', 'name', 'name_ar', 'name_en', 'sales_rep_id'])
                ->map(fn (Customer $customer) => [
                    ...$customer->toArray(),
                    'credit_balance' => $this->customerCreditBalance($customer->id),
                ])
                ->values(),
            'products' => Product::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'quality', 'width', 'weight', 'price', 'unit']),
            'collectors' => User::query()
                ->where('status', 'active')
                ->where(function ($query): void {
                    $query
                        ->whereHas('department', fn ($department) => $department->where('code', 'sales'))
                        ->orWhereHas('position', fn ($position) => $position->whereIn('code', ['sales_rep', 'sales_officer', 'sales_manager']));
                })
                ->orderBy('name')
                ->get(['id', 'name', 'department_id', 'position_id']),
            'treasuryEmployees' => User::query()
                ->where('status', 'active')
                ->where(function ($query): void {
                    $query
                        ->whereHas('department', fn ($department) => $department->whereIn('code', ['finance', 'accounting']))
                        ->orWhereHas('position', fn ($position) => $position->whereIn('code', ['cashier', 'accountant', 'accounting_manager']));
                })
                ->orderBy('name')
                ->get(['id', 'name', 'department_id', 'position_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateSalesOrder($request);

        DB::transaction(function () use ($request, $data): void {
            $orderTotal = $this->orderTotal($data['items']);
            $grossDownPayment = round($orderTotal * 0.5, 2);
            $creditUsed = $this->automaticCreditUsed((int) $data['customer_id'], $grossDownPayment);
            $downPaymentAmount = round($grossDownPayment - $creditUsed, 2);
            $collectedAmount = $this->validatedCollectionAmount($data, $downPaymentAmount);

            $salesOrder = SalesOrder::create([
                ...collect($data)->except(['items', 'sample_number', 'customer_credit_used'])->all(),
                'so_number' => $this->nextSalesOrderNumber(),
                'sample_number' => null,
                'order_total' => $orderTotal,
                'down_payment_amount' => $downPaymentAmount,
                'down_payment_collected_amount' => $collectedAmount,
                'down_payment_collected_by' => $collectedAmount > 0 ? (int) $data['down_payment_collected_by'] : null,
                'down_payment_treasury_received_by' => $collectedAmount > 0 ? (int) $data['down_payment_treasury_received_by'] : null,
                'customer_credit_used' => $creditUsed,
                'down_payment_status' => $downPaymentAmount > 0 && $collectedAmount <= 0 ? 'pending_accounting' : 'received',
                'down_payment_received_by' => $collectedAmount > 0 ? (int) $data['down_payment_collected_by'] : null,
                'down_payment_received_at' => $collectedAmount > 0 || $downPaymentAmount <= 0 ? now() : null,
                'down_payment_treasury_received_at' => $collectedAmount > 0 ? now() : null,
                'status' => 'draft',
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            $this->syncItems($salesOrder, $data['items']);
            $this->createOrUpdateDownPayment($salesOrder, $request->user()->id);
            $this->createOrUpdateCreditUsage($salesOrder, $request->user()->id);
            $this->timeline->record($salesOrder, 'Sales Order Created', "تم إنشاء طلب البيع {$salesOrder->so_number}.", $request->user());
        });

        return back()->with('success', 'Sales order created.');
    }

    public function update(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        abort_unless(in_array($salesOrder->status, ['draft', 'rejected'], true), 403);

        $data = $this->validateSalesOrder($request, $salesOrder);

        DB::transaction(function () use ($request, $salesOrder, $data): void {
            $orderTotal = $this->orderTotal($data['items']);
            $grossDownPayment = round($orderTotal * 0.5, 2);
            $creditUsed = $this->automaticCreditUsed((int) $data['customer_id'], $grossDownPayment, $salesOrder);
            $downPaymentAmount = round($grossDownPayment - $creditUsed, 2);
            $collectedAmount = $this->validatedCollectionAmount($data, $downPaymentAmount);

            $salesOrder->update([
                ...collect($data)->except(['items', 'so_number', 'sample_number', 'customer_credit_used'])->all(),
                'order_total' => $orderTotal,
                'down_payment_amount' => $downPaymentAmount,
                'down_payment_collected_amount' => $collectedAmount,
                'down_payment_collected_by' => $collectedAmount > 0 ? (int) $data['down_payment_collected_by'] : null,
                'down_payment_treasury_received_by' => $collectedAmount > 0 ? (int) $data['down_payment_treasury_received_by'] : null,
                'customer_credit_used' => $creditUsed,
                'down_payment_status' => $downPaymentAmount <= 0 || $collectedAmount > 0 || $salesOrder->down_payment_status === 'received' ? 'received' : 'pending_accounting',
                'down_payment_received_by' => $collectedAmount > 0 ? (int) $data['down_payment_collected_by'] : $salesOrder->down_payment_received_by,
                'down_payment_received_at' => $collectedAmount > 0 || $downPaymentAmount <= 0 ? now() : $salesOrder->down_payment_received_at,
                'down_payment_treasury_received_at' => $collectedAmount > 0 ? now() : $salesOrder->down_payment_treasury_received_at,
                'updated_by' => $request->user()->id,
            ]);

            $this->syncItems($salesOrder, $data['items']);
            $this->createOrUpdateDownPayment($salesOrder->fresh(), $request->user()->id);
            $this->createOrUpdateCreditUsage($salesOrder->fresh(), $request->user()->id);
            $this->timeline->record($salesOrder, 'Sales Order Updated', "تم تعديل طلب البيع {$salesOrder->so_number}.", $request->user());
        });

        return back()->with('success', 'Sales order updated.');
    }

    public function updateStatus(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['sales_officer_review', 'submitted', 'planning_review', 'approved', 'rejected', 'cancelled'])],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string'],
        ]);

        $this->authorizeStatusMove($request, $salesOrder, $data['status']);

        $now = Carbon::now();
        $updates = ['status' => $data['status'], 'updated_by' => $request->user()->id];

        if ($data['status'] === 'planning_review') {
            $updates += ['reviewed_by' => $request->user()->id, 'reviewed_at' => $now];
        }

        if ($data['status'] === 'approved') {
            $updates += ['approved_by' => $request->user()->id, 'approved_at' => $now];
        }

        if ($data['status'] === 'rejected') {
            $updates += ['rejected_by' => $request->user()->id, 'rejected_at' => $now, 'rejection_reason' => $data['rejection_reason']];
        }

        $salesOrder->update($updates);

        $this->timeline->record(
            $salesOrder,
            $this->timelineEventForStatus($data['status']),
            $this->timelineDescriptionForStatus($salesOrder, $data['status']),
            $request->user(),
        );

        if ($data['status'] === 'sales_officer_review') {
            $this->notifications->sendToRoles(['sales'], "طلبية عميل تحتاج اعتماد مسؤول المبيعات {$salesOrder->so_number}", 'طلبية عميل جديدة بانتظار مراجعة مسؤول المبيعات.', route('sales-orders.index', ['search' => $salesOrder->so_number]), $request->user());
        }

        if ($data['status'] === 'submitted') {
            $this->notifications->sendToRoles(['sales'], "طلبية عميل تحتاج اعتماد مدير المبيعات {$salesOrder->so_number}", 'طلبية عميل جديدة بانتظار مراجعة مدير المبيعات.', route('sales-orders.index', ['search' => $salesOrder->so_number]), $request->user());
        }

        if ($data['status'] === 'planning_review') {
            $this->notifications->sendToRoles(['general_manager'], "طلبية عميل تحتاج اعتماد المدير العام {$salesOrder->so_number}", 'تم اعتماد مدير المبيعات وتحتاج اعتماد المدير العام.', route('sales-orders.index', ['search' => $salesOrder->so_number]), $request->user());
        }

        if ($data['status'] === 'approved') {
            $this->notifications->sendToRoles(['planning', 'production'], "طلبية عميل معتمدة {$salesOrder->so_number}", 'تم اعتماد المدير العام والطلبية جاهزة للتخطيط والإنتاج.', route('production-orders.index'), $request->user());
        }

        return back()->with('success', 'Sales order status updated.');
    }

    public function invoice(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $data = $request->validate([
            'invoice_number' => ['nullable', 'string', 'max:100'],
        ]);

        $this->workflow->assertCanInvoice($salesOrder->load('items', 'productionOrders', 'customerPayments'));

        $invoiceNumber = $data['invoice_number'] ?: 'INV-'.$salesOrder->so_number;

        $salesOrder->update([
            'invoice_number' => $invoiceNumber,
            'invoice_status' => 'invoiced',
            'invoiced_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($salesOrder, 'Invoice Created', "Invoice {$invoiceNumber} created for sales order {$salesOrder->so_number}.", $request->user());

        $this->notifications->sendToRoles(['sales'], "Invoice ready for {$salesOrder->so_number}", 'Accounting created the invoice. The order is ready for shipping preparation.', route('sales-orders.index', ['search' => $salesOrder->so_number]), $request->user());

        return back()->with('success', 'Invoice created.');
    }

    public function prepareShipping(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $data = $request->validate([
            'shipping_number' => ['nullable', 'string', 'max:100'],
            'shipping_company' => ['nullable', 'string', 'max:150'],
            'vehicle_number' => ['nullable', 'string', 'max:100'],
            'driver_name' => ['nullable', 'string', 'max:150'],
            'shipped_quantity' => ['nullable', 'numeric', 'min:0'],
            'rolls_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $this->workflow->assertCanPrepareDelivery($salesOrder->load('items', 'productionOrders', 'customerPayments'));

        $shippingNumber = $data['shipping_number'] ?: 'SHIP-'.$salesOrder->so_number;

        $salesOrder->update([
            ...$data,
            'shipping_number' => $shippingNumber,
            'shipping_status' => 'ready',
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($salesOrder, 'Shipping Order Prepared', "Shipping order {$shippingNumber} prepared for sales order {$salesOrder->so_number}.", $request->user());

        return back()->with('success', 'Shipping order prepared.');
    }

    public function deliver(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $this->workflow->assertCanDeliver($salesOrder->load('items', 'productionOrders', 'customerPayments'));

        $salesOrder->update([
            'status' => 'delivered',
            'shipping_status' => 'delivered',
            'delivered_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($salesOrder, 'Delivered To Customer', "Sales order {$salesOrder->so_number} delivered to customer.", $request->user());

        return back()->with('success', 'Order delivered.');
    }

    public function close(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $data = $request->validate([
            'closure_notes' => ['nullable', 'string', 'max:3000'],
        ]);

        $this->workflow->assertCanClose($salesOrder->load('items', 'productionOrders', 'customerPayments'));

        $salesOrder->update([
            'status' => 'closed',
            'closed_at' => now(),
            'closed_by' => $request->user()->id,
            'closure_notes' => $data['closure_notes'] ?? null,
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($salesOrder, 'Order Closed', "Sales order {$salesOrder->so_number} was closed after delivery, invoicing, and settlement review.", $request->user());

        return back()->with('success', 'Order closed.');
    }

    public function storeMessage(Request $request, SalesOrder $salesOrder): RedirectResponse
    {
        $salesOrder->load('customer');

        abort_unless(
            $request->user()?->hasRole(['admin', 'general_manager', 'sales'])
            || (int) $salesOrder->customer?->sales_rep_id === (int) $request->user()->id,
            403,
        );

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $recipientId = User::query()
            ->where('customer_id', $salesOrder->customer_id)
            ->whereHas('role', fn ($query) => $query->where('slug', 'customer'))
            ->value('id');

        CustomerOrderMessage::create([
            'customer_id' => $salesOrder->customer_id,
            'sales_order_id' => $salesOrder->id,
            'sender_user_id' => $request->user()->id,
            'recipient_user_id' => $recipientId,
            'message' => $data['message'],
        ]);

        if ($recipientId) {
            $this->notifications->sendToUsers(
                User::query()->whereKey($recipientId)->get(),
                "رسالة على الطلبية {$salesOrder->so_number}",
                $data['message'],
                route('customer-portal.index'),
                $request->user(),
            );
        }

        return back()->with('success', 'تم إرسال الرسالة للعميل.');
    }

    private function validateSalesOrder(Request $request, ?SalesOrder $salesOrder = null): array
    {
        return $request->validate([
            'so_number' => ['nullable', 'digits_between:1,100', Rule::unique('sales_orders', 'so_number')->ignore($salesOrder)],
            'customer_id' => ['required', 'exists:customers,id'],
            'order_date' => ['required', 'date'],
            'required_delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'sample_required' => ['boolean'],
            'customer_sample_sent' => ['boolean'],
            'customer_sample_lot_no' => ['nullable', 'string', 'max:100'],
            'priority' => ['required', Rule::in(['normal', 'urgent', 'very_urgent'])],
            'down_payment_method' => ['required', Rule::in(['cash', 'check'])],
            'down_payment_collected_amount' => ['nullable', 'numeric', 'min:0'],
            'down_payment_collected_by' => ['nullable', 'exists:users,id'],
            'down_payment_treasury_received_by' => ['nullable', 'exists:users,id'],
            'down_payment_collection_notes' => ['nullable', 'string', 'max:2000'],
            'down_payment_treasury_notes' => ['nullable', 'string', 'max:2000'],
            'down_payment_check_number' => ['nullable', 'required_if:down_payment_method,check', 'string', 'max:100'],
            'down_payment_bank_name' => ['nullable', 'required_if:down_payment_method,check', 'string', 'max:150'],
            'down_payment_check_due_date' => ['nullable', 'required_if:down_payment_method,check', 'date'],
            'notes' => ['nullable', 'string'],
            'production_notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.color' => ['required', 'string', 'max:100'],
            'items.*.quality' => ['nullable', 'string', 'max:100'],
            'items.*.width' => ['nullable', 'numeric', 'min:0'],
            'items.*.weight' => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);
    }

    private function syncItems(SalesOrder $salesOrder, array $items): void
    {
        $salesOrder->items()->delete();

        foreach ($items as $item) {
            $quantity = (float) $item['quantity'];
            $unitPrice = (float) $item['unit_price'];
            $salesOrder->items()->create([
                ...$item,
                'total_price' => round($quantity * $unitPrice, 2),
            ]);
        }
    }

    private function orderTotal(array $items): float
    {
        return round(collect($items)->sum(fn ($item) => (float) $item['quantity'] * (float) $item['unit_price']), 2);
    }

    private function createOrUpdateDownPayment(SalesOrder $salesOrder, int $userId): void
    {
        $collectedAmount = (float) $salesOrder->down_payment_collected_amount;

        if ((float) $salesOrder->down_payment_amount <= 0 && $collectedAmount <= 0) {
            CustomerPayment::query()
                ->where('sales_order_id', $salesOrder->id)
                ->where('transaction_type', 'payment')
                ->where('status', 'pending_accounting')
                ->delete();

            return;
        }

        $isCollected = $collectedAmount > 0;
        $paymentAmount = $isCollected ? $collectedAmount : (float) $salesOrder->down_payment_amount;

        CustomerPayment::updateOrCreate(
            [
                'sales_order_id' => $salesOrder->id,
                'transaction_type' => 'payment',
            ],
            [
                'customer_id' => $salesOrder->customer_id,
                'payment_number' => $this->paymentNumberFor($salesOrder),
                'amount' => $paymentAmount,
                'method' => $salesOrder->down_payment_method,
                'status' => $isCollected ? 'received' : 'pending_accounting',
                'payment_date' => $salesOrder->order_date,
                'check_number' => $salesOrder->down_payment_check_number,
                'bank_name' => $salesOrder->down_payment_bank_name,
                'check_due_date' => $salesOrder->down_payment_check_due_date,
                'notes' => $this->downPaymentNotes($salesOrder),
                'created_by' => $userId,
                'received_by' => $isCollected ? $salesOrder->down_payment_collected_by : null,
                'treasury_received_by' => $isCollected ? $salesOrder->down_payment_treasury_received_by : null,
                'received_at' => $isCollected ? now() : null,
                'treasury_received_at' => $isCollected ? now() : null,
            ],
        );

        if ($isCollected) {
            return;
        }

        $this->notifications->sendToRoles(
            ['accounting'],
            "دفعة مقدمة تحت حساب الطلبية {$salesOrder->so_number}",
            "يوجد وارد مطلوب تسجيله بقيمة {$salesOrder->down_payment_amount} بطريقة {$salesOrder->down_payment_method}.",
            route('customer-account-reports.index', ['customer_id' => $salesOrder->customer_id]),
        );
    }

    private function createOrUpdateCreditUsage(SalesOrder $salesOrder, int $userId): void
    {
        $amount = (float) $salesOrder->customer_credit_used;

        if ($amount <= 0) {
            CustomerPayment::query()
                ->where('sales_order_id', $salesOrder->id)
                ->where('transaction_type', 'credit_usage')
                ->delete();

            return;
        }

        CustomerPayment::updateOrCreate(
            [
                'sales_order_id' => $salesOrder->id,
                'transaction_type' => 'credit_usage',
            ],
            [
                'customer_id' => $salesOrder->customer_id,
                'payment_number' => 'CU-'.$salesOrder->so_number,
                'amount' => $amount,
                'method' => 'customer_credit',
                'status' => 'received',
                'payment_date' => $salesOrder->order_date,
                'check_number' => null,
                'check_due_date' => null,
                'notes' => "Customer credit used against down payment for customer order {$salesOrder->so_number}.",
                'created_by' => $userId,
                'received_by' => $userId,
                'received_at' => now(),
            ],
        );
    }

    private function validatedCollectionAmount(array $data, float $downPaymentAmount): float
    {
        $collectedAmount = round((float) ($data['down_payment_collected_amount'] ?? 0), 2);

        if ($downPaymentAmount <= 0) {
            return 0;
        }

        $errors = [];

        if ($collectedAmount <= 0) {
            $errors['down_payment_collected_amount'] = 'يجب تسجيل قيمة الدفعة المستلمة قبل حفظ الطلبية.';
        } elseif ($collectedAmount < $downPaymentAmount) {
            $errors['down_payment_collected_amount'] = "قيمة الدفعة المستلمة لا تقل عن {$downPaymentAmount}.";
        }

        if (empty($data['down_payment_collected_by'])) {
            $errors['down_payment_collected_by'] = 'يجب تحديد المحصل.';
        }

        if (empty($data['down_payment_treasury_received_by'])) {
            $errors['down_payment_treasury_received_by'] = 'يجب تحديد اسم المستلم في الخزنة.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $collectedAmount;
    }

    private function automaticCreditUsed(int $customerId, float $grossDownPayment, ?SalesOrder $salesOrder = null): float
    {
        $availableCredit = $this->customerCreditBalance($customerId, $salesOrder);

        return round(min($grossDownPayment, max($availableCredit, 0)), 2);
    }

    private function customerCreditBalance(int $customerId, ?SalesOrder $excludeSalesOrder = null): float
    {
        $credits = (float) CustomerPayment::query()
            ->where('customer_id', $customerId)
            ->where('transaction_type', 'payment')
            ->where('status', 'received')
            ->sum('amount');

        $debits = (float) SalesOrder::query()
            ->where('customer_id', $customerId)
            ->when($excludeSalesOrder, fn ($query) => $query->where('id', '!=', $excludeSalesOrder->id))
            ->sum('order_total');

        return round(max($credits - $debits, 0), 2);
    }

    private function paymentNumberFor(SalesOrder $salesOrder): string
    {
        return 'CP-'.$salesOrder->so_number.'-DP';
    }

    private function downPaymentNotes(SalesOrder $salesOrder): string
    {
        $notes = ["50% down payment for customer order {$salesOrder->so_number}."];

        if ($salesOrder->down_payment_collection_notes) {
            $notes[] = "Collector note: {$salesOrder->down_payment_collection_notes}";
        }

        if ($salesOrder->down_payment_treasury_notes) {
            $notes[] = "Treasury handover note: {$salesOrder->down_payment_treasury_notes}";
        }

        return implode(' ', $notes);
    }

    private function authorizeStatusMove(Request $request, SalesOrder $salesOrder, string $status): void
    {
        $allowed = match ($status) {
            'sales_officer_review' => in_array($salesOrder->status, ['draft', 'rejected'], true) && $request->user()->hasPermission('create_sales_order'),
            'submitted' => $salesOrder->status === 'sales_officer_review' && $this->canActAsSalesOfficer($request),
            'planning_review' => $salesOrder->status === 'submitted' && $this->canActAsSalesManager($request),
            'approved' => $salesOrder->status === 'planning_review' && $request->user()->hasPermission('approve_sales_order'),
            'rejected' => ($salesOrder->status === 'sales_officer_review' && $this->canActAsSalesOfficer($request))
                || ($salesOrder->status === 'submitted' && $this->canActAsSalesManager($request))
                || ($salesOrder->status === 'planning_review' && $request->user()->hasPermission('approve_sales_order')),
            'cancelled' => in_array($salesOrder->status, ['draft', 'sales_officer_review', 'submitted'], true) && $request->user()->hasPermission('create_sales_order'),
            default => false,
        };

        abort_unless($allowed, 403);
    }

    private function nextSalesOrderNumber(): string
    {
        $lastNumber = SalesOrder::query()
            ->whereRaw('so_number REGEXP "^[0-9]+$"')
            ->max(DB::raw('CAST(so_number AS UNSIGNED)'));

        return str_pad((string) (((int) $lastNumber) + 1), 6, '0', STR_PAD_LEFT);
    }

    private function canActAsSalesManager(Request $request): bool
    {
        $user = $request->user();

        return $user->hasRole(['admin'])
            || $user->position?->code === 'sales_manager';
    }

    private function canActAsSalesOfficer(Request $request): bool
    {
        $user = $request->user();

        return $user->hasRole(['admin'])
            || ($user->department?->code === 'sales' && in_array($user->position?->code, ['sales_officer', 'sales_manager'], true));
    }

    private function timelineEventForStatus(string $status): string
    {
        return match ($status) {
            'sales_officer_review' => 'Customer Order Sent To Sales Officer',
            'submitted' => 'Sales Officer Approved Customer Order',
            'planning_review' => 'Sales Manager Approved Customer Order',
            'approved' => 'General Manager Approved',
            'rejected' => 'Customer Order Rejected',
            'cancelled' => 'Customer Order Cancelled',
            default => 'Status Updated',
        };
    }

    private function timelineDescriptionForStatus(SalesOrder $salesOrder, string $status): string
    {
        return match ($status) {
            'submitted' => "تم إرسال طلب البيع {$salesOrder->so_number} إلى التخطيط.",
            'planning_review' => "تمت مراجعة التخطيط لطلب البيع {$salesOrder->so_number}.",
            'approved' => "تم اعتماد المدير العام لطلب البيع {$salesOrder->so_number}.",
            'rejected' => "تم رفض طلب البيع {$salesOrder->so_number}.",
            'cancelled' => "تم إلغاء طلب البيع {$salesOrder->so_number}.",
            default => "تم تحديث حالة طلب البيع {$salesOrder->so_number}.",
        };
    }
}
