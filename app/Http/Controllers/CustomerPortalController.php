<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerOrderMessage;
use App\Models\CustomerPayment;
use App\Models\Product;
use App\Models\Role;
use App\Models\SalesOrder;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\SequenceService;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class CustomerPortalController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly SequenceService $sequences,
        private readonly TimelineService $timeline,
    ) {
    }

    public function register(): Response
    {
        return Inertia::render('CustomerPortal/Register');
    }

    public function login(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]);
    }

    public function storeRegistration(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'mobile' => ['required', 'string', 'max:50'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email', 'unique:customers,email'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:1000'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        DB::transaction(function () use ($request, $data): void {
            $sequence = $this->sequences->next('customers');

            $customer = Customer::create([
                'code' => $sequence['code'],
                'internal_sequence' => $sequence['number'],
                'barcode' => $sequence['code'],
                'name' => $data['name_ar'],
                'name_ar' => $data['name_ar'],
                'name_en' => $data['name_en'] ?? null,
                'mobile' => $data['mobile'],
                'email' => $data['email'],
                'city' => $data['city'] ?? null,
                'address' => $data['address'] ?? null,
                'status' => 'active',
                'data_status' => 'pending_sales_officer',
                'verification_tier' => 'none',
                'active' => true,
                'notes' => 'Customer self registration pending sales data review.',
            ]);

            User::create([
                'name' => $data['name_ar'],
                'name_ar' => $data['name_ar'],
                'name_en' => $data['name_en'] ?? null,
                'email' => $data['email'],
                'phone' => $data['mobile'],
                'status' => 'active',
                'login_enabled' => true,
                'role_id' => Role::query()->where('slug', 'customer')->value('id'),
                'customer_id' => $customer->id,
                'password' => Hash::make($data['password']),
            ]);

            $this->notifications->sendToRoles(
                ['sales', 'admin'],
                "Customer data review needed {$customer->code}",
                'A customer registered through the portal. Sales should assign a representative, review the national ID, complete data, and approve it.',
                route('master-data.customers', ['focus' => $customer->id]),
            );
        });

        return redirect()->route('login')->with('status', 'تم إنشاء الحساب. يمكنك تسجيل الدخول الآن والاطلاع على قائمة الأسعار، وسيتم فتح الطلبات بعد مراجعة واعتماد بياناتك من المبيعات.');
    }

    public function index(Request $request): Response
    {
        $customer = $this->portalCustomer($request);
        $canViewFinancials = $customer->data_status === 'approved' && $customer->active && ! $customer->archived_at;

        $orders = SalesOrder::query()
            ->with([
                'items.product:id,code,name,quality,width,weight,price,unit',
                'customerPayments:id,customer_id,sales_order_id,payment_number,transaction_type,amount,method,reference_number,proof_path,status,payment_date,received_at,treasury_received_at',
                'productionOrders:id,sales_order_id,po_number,status,planned_start,planned_end,actual_start,actual_end',
                'timeline' => fn ($query) => $query->with(['user:id,name', 'department:id,name,code'])->oldest(),
            ])
            ->where('customer_id', $customer->id)
            ->when(! $canViewFinancials, fn ($query) => $query->whereRaw('1 = 0'))
            ->latest()
            ->get();
        $purchases = $canViewFinancials
            ? $orders->flatMap(fn (SalesOrder $order) => $order->items->map(fn ($item) => [
                'id' => "{$order->id}-{$item->id}",
                'order_number' => $order->so_number,
                'order_date' => $order->order_date?->toDateString(),
                'product_code' => $item->product?->code,
                'product_name' => $item->product?->name,
                'color' => $item->color,
                'quantity' => (float) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->total_price,
            ]))->values()
            : collect();

        $messages = CustomerOrderMessage::query()
            ->with(['sender:id,name,customer_id', 'recipient:id,name'])
            ->where('customer_id', $customer->id)
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return Inertia::render('CustomerPortal/Dashboard', [
            'customer' => $customer->load('salesRep:id,name,email,phone'),
            'canViewFinancials' => $canViewFinancials,
            'orders' => $orders,
            'purchases' => $purchases,
            'products' => Product::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'quality', 'width', 'weight', 'price', 'unit']),
            'payments' => CustomerPayment::query()
                ->where('customer_id', $customer->id)
                ->when(! $canViewFinancials, fn ($query) => $query->whereRaw('1 = 0'))
                ->latest()
                ->get(),
            'messages' => $messages,
            'statement' => $canViewFinancials ? $this->statement($customer) : [],
            'totals' => $canViewFinancials ? $this->statementTotals($customer) : ['debit' => 0, 'credit' => 0, 'balance' => 0, 'wallet_balance' => 0],
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $customer = $this->portalCustomer($request);

        $data = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'mobile' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['required', 'string', 'max:50', Rule::unique('customers', 'national_id')->ignore($customer)],
            'national_id_image' => [$customer->national_id_image_path ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'city' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:1000'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'commercial_register' => ['nullable', 'string', 'max:100'],
        ]);

        if ($request->hasFile('national_id_image')) {
            if ($customer->national_id_image_path) {
                Storage::disk('public')->delete($customer->national_id_image_path);
            }

            $data['national_id_image_path'] = $request->file('national_id_image')->store('customer-national-ids', 'public');
        }

        unset($data['national_id_image']);

        $customer->update([
            ...$data,
            'name' => $data['name_ar'],
            'data_status' => 'pending_sales_officer',
            'verification_tier' => 'none',
            'sales_officer_approved_by' => null,
            'sales_officer_approved_at' => null,
            'sales_manager_approved_by' => null,
            'sales_manager_approved_at' => null,
            'data_reviewed_by' => null,
            'data_reviewed_at' => null,
            'data_rejected_by' => null,
            'data_rejected_at' => null,
            'data_rejection_stage' => null,
            'data_rejection_reason' => null,
            'archived_at' => null,
            'archived_by' => null,
            'archived_reason' => null,
            'updated_by' => $request->user()->id,
        ]);

        $this->notifications->sendToRoles(
            ['sales', 'admin'],
            "Customer profile updated {$customer->code}",
            'A customer updated profile data. Sales should review it before enabling new orders.',
            route('master-data.customers', ['focus' => $customer->id]),
            $request->user(),
        );

        return back()->with('success', 'تم إرسال بياناتك للمراجعة. سيتم فتح الطلبات بعد اعتماد المبيعات.');
    }

    public function storeWalletPayment(Request $request): RedirectResponse
    {
        $customer = $this->portalCustomer($request);

        abort_unless($customer->data_status === 'approved' && $customer->active && ! $customer->archived_at, 403);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'method' => ['required', Rule::in(['vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'])],
            'reference_number' => ['nullable', 'string', 'max:150'],
            'proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $payment = CustomerPayment::create([
            'customer_id' => $customer->id,
            'sales_order_id' => null,
            'payment_number' => 'CW-'.$customer->code.'-'.now()->format('YmdHis'),
            'transaction_type' => 'wallet_deposit',
            'amount' => $data['amount'],
            'method' => $data['method'],
            'reference_number' => $data['reference_number'] ?? null,
            'proof_path' => $request->file('proof')->store('customer-payment-proofs', 'public'),
            'status' => 'pending_accounting',
            'payment_date' => now()->toDateString(),
            'created_by' => $request->user()->id,
            'notes' => $data['notes'] ?? 'Customer wallet deposit proof uploaded from portal.',
        ]);

        $this->notifications->sendToRoles(
            ['sales', 'accounting'],
            "Customer wallet deposit {$payment->payment_number}",
            'A customer uploaded wallet payment proof. Sales and accounting should review it.',
            route('customer-account-reports.index', ['customer_id' => $customer->id]),
            $request->user(),
        );

        return back()->with('success', 'تم إرسال إثبات الدفع للمحفظة، وفي انتظار مراجعة المبيعات والحسابات.');
    }

    public function storeOrder(Request $request): RedirectResponse
    {
        $customer = $this->portalCustomer($request);

        abort_unless($customer->data_status === 'approved' && $customer->active && ! $customer->archived_at, 403);

        $data = $request->validate([
            'required_delivery_date' => ['nullable', 'date', 'after_or_equal:today'],
            'priority' => ['required', Rule::in(['normal', 'urgent', 'very_urgent'])],
            'notes' => ['nullable', 'string', 'max:3000'],
            'payment_method' => ['required', Rule::in(['vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'])],
            'payment_reference' => ['nullable', 'string', 'max:150'],
            'payment_proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.color' => ['required', 'string', 'max:100'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
        ]);

        DB::transaction(function () use ($request, $customer, $data): void {
            $products = Product::query()
                ->whereIn('id', collect($data['items'])->pluck('product_id')->all())
                ->get()
                ->keyBy('id');

            $items = collect($data['items'])->map(function (array $item) use ($products): array {
                $product = $products[(int) $item['product_id']];

                return [
                    'product_id' => $product->id,
                    'color' => $item['color'],
                    'quality' => $product->quality,
                    'width' => $product->width,
                    'weight' => $product->weight,
                    'quantity' => (float) $item['quantity'],
                    'unit_price' => (float) $product->price,
                ];
            })->all();

            $orderTotal = round(collect($items)->sum(fn ($item) => $item['quantity'] * $item['unit_price']), 2);
            $downPayment = round($orderTotal * 0.5, 2);

            $salesOrder = SalesOrder::create([
                'so_number' => $this->nextSalesOrderNumber(),
                'customer_id' => $customer->id,
                'order_date' => now()->toDateString(),
                'required_delivery_date' => $data['required_delivery_date'] ?? null,
                'status' => 'sales_officer_review',
                'source' => 'customer_portal',
                'customer_submitted_at' => now(),
                'priority' => $data['priority'],
                'order_total' => $orderTotal,
                'down_payment_amount' => $downPayment,
                'down_payment_method' => $data['payment_method'],
                'down_payment_status' => 'pending_accounting',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            foreach ($items as $item) {
                $salesOrder->items()->create([
                    ...$item,
                    'total_price' => round($item['quantity'] * $item['unit_price'], 2),
                ]);
            }

            CustomerPayment::create([
                'customer_id' => $customer->id,
                'sales_order_id' => $salesOrder->id,
                'payment_number' => 'CP-'.$salesOrder->so_number.'-PORTAL',
                'transaction_type' => 'payment',
                'amount' => $downPayment,
                'method' => $data['payment_method'],
                'reference_number' => $data['payment_reference'] ?? null,
                'proof_path' => $request->file('payment_proof')->store('customer-payment-proofs', 'public'),
                'status' => 'pending_accounting',
                'payment_date' => now()->toDateString(),
                'created_by' => $request->user()->id,
                'notes' => 'Portal down payment proof uploaded by customer.',
            ]);

            $this->timeline->record($salesOrder, 'Customer Portal Order Submitted', "Customer {$customer->code} submitted order {$salesOrder->so_number}.", $request->user());

            $this->notifications->sendToRoles(
                ['sales', 'accounting'],
                "Customer portal order {$salesOrder->so_number}",
                'A customer submitted an order with payment proof. Sales and accounting should review it.',
                route('sales-orders.index', ['search' => $salesOrder->so_number]),
                $request->user(),
            );
        });

        return back()->with('success', 'تم إرسال الطلبية للمبيعات ومراجعة الدفع.');
    }

    public function storeMessage(Request $request): RedirectResponse
    {
        $customer = $this->portalCustomer($request);

        $data = $request->validate([
            'sales_order_id' => ['nullable', 'exists:sales_orders,id'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        if (! empty($data['sales_order_id'])) {
            abort_unless(SalesOrder::query()->whereKey($data['sales_order_id'])->where('customer_id', $customer->id)->exists(), 404);
        }

        CustomerOrderMessage::create([
            'customer_id' => $customer->id,
            'sales_order_id' => $data['sales_order_id'] ?? null,
            'sender_user_id' => $request->user()->id,
            'recipient_user_id' => $customer->sales_rep_id,
            'message' => $data['message'],
        ]);

        if ($customer->sales_rep_id) {
            $this->notifications->sendToUsers(
                User::query()->whereKey($customer->sales_rep_id)->get(),
                "Customer message {$customer->code}",
                $data['message'],
                route('customer-portal.index'),
                $request->user(),
            );
        }

        return back()->with('success', 'تم إرسال الرسالة.');
    }

    private function portalCustomer(Request $request): Customer
    {
        abort_unless($request->user()?->hasRole('customer'), 403);
        abort_unless($request->user()->customer_id, 403);

        return Customer::query()->findOrFail($request->user()->customer_id);
    }

    private function nextSalesOrderNumber(): string
    {
        $lastNumber = SalesOrder::query()
            ->whereRaw('so_number REGEXP "^[0-9]+$"')
            ->max(DB::raw('CAST(so_number AS UNSIGNED)'));

        return str_pad((string) (((int) $lastNumber) + 1), 6, '0', STR_PAD_LEFT);
    }

    private function statement(Customer $customer): array
    {
        $orders = $customer->salesOrders()
            ->latest('order_date')
            ->get(['id', 'so_number', 'order_date', 'order_total', 'status'])
            ->map(fn (SalesOrder $order) => [
                'date' => $order->order_date?->toDateString(),
                'type' => 'order',
                'number' => $order->so_number,
                'status' => $order->status,
                'debit' => (float) $order->order_total,
                'credit' => 0,
            ]);

        $payments = $customer->customerPayments()
            ->latest('payment_date')
            ->get(['payment_number', 'payment_date', 'amount', 'status', 'transaction_type'])
            ->map(fn (CustomerPayment $payment) => [
                'date' => $payment->payment_date?->toDateString(),
                'type' => $payment->transaction_type,
                'number' => $payment->payment_number,
                'status' => $payment->status,
                'debit' => 0,
                'credit' => (float) $payment->amount,
            ]);

        return $orders->merge($payments)
            ->sortByDesc('date')
            ->values()
            ->all();
    }

    private function statementTotals(Customer $customer): array
    {
        $debit = (float) $customer->salesOrders()->sum('order_total');
        $credit = (float) $customer->customerPayments()->where('status', 'received')->sum('amount');

        return [
            'debit' => round($debit, 2),
            'credit' => round($credit, 2),
            'balance' => round($debit - $credit, 2),
            'wallet_balance' => round((float) $customer->wallet_balance, 2),
        ];
    }
}
