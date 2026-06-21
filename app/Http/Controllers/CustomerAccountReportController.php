<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\SalesOrder;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAccountReportController extends Controller
{
    public function __construct(private readonly TimelineService $timeline)
    {
    }

    public function index(Request $request): Response
    {
        $customerId = $request->query('customer_id');
        $customer = $customerId ? Customer::query()->find($customerId) : null;

        $orders = collect();
        $payments = collect();

        if ($customer) {
            $orders = SalesOrder::query()
                ->where('customer_id', $customer->id)
                ->with('creator:id,name')
                ->latest('order_date')
                ->get();

            $payments = CustomerPayment::query()
                ->where('customer_id', $customer->id)
                ->with(['salesOrder:id,so_number', 'creator:id,name', 'receiver:id,name', 'treasuryReceiver:id,name'])
                ->latest('payment_date')
                ->latest('id')
                ->get();
        }

        $statement = $orders
            ->map(fn (SalesOrder $order) => [
                'id' => 'order-'.$order->id,
                'date' => $order->order_date?->format('Y-m-d'),
                'type' => 'withdrawal',
                'number' => $order->so_number,
                'description' => 'Customer order',
                'debit' => max((float) ($order->order_total ?: $order->items()->sum('total_price')) - (float) $order->customer_credit_used, 0),
                'credit' => 0,
                'status' => $order->status,
            ])
            ->merge($payments->map(fn (CustomerPayment $payment) => [
                'id' => 'payment-'.$payment->id,
                'date' => $payment->payment_date?->format('Y-m-d') ?? $payment->created_at?->format('Y-m-d'),
                'type' => $payment->transaction_type === 'credit_usage' ? 'credit_usage' : 'payment',
                'number' => $payment->payment_number,
                'description' => $payment->transaction_type === 'credit_usage'
                    ? "Customer credit used for {$payment->salesOrder?->so_number}"
                    : ($payment->salesOrder?->so_number ? "Down payment for {$payment->salesOrder->so_number}" : 'Customer payment'),
                'debit' => $payment->transaction_type === 'credit_usage' ? (float) $payment->amount : 0,
                'credit' => $payment->transaction_type === 'credit_usage' ? 0 : (float) $payment->amount,
                'method' => $payment->method,
                'status' => $payment->status,
            ]))
            ->sortBy(fn ($row) => [$row['date'] ?? '', $row['id']])
            ->values();

        return Inertia::render('CustomerAccountReports/Index', [
            'customers' => Customer::query()
                ->where('status', 'active')
                ->orderBy('name_ar')
                ->get(['id', 'code', 'name', 'name_ar', 'name_en']),
            'selectedCustomer' => $customer,
            'orders' => $orders,
            'payments' => $payments,
            'statement' => $statement,
            'filters' => [
                'customer_id' => $customerId,
            ],
            'totals' => [
                'debit' => round($statement->sum('debit'), 2),
                'credit' => round($statement->sum('credit'), 2),
                'balance' => round($statement->sum('debit') - $statement->sum('credit'), 2),
                'pendingPayments' => round($payments->whereIn('transaction_type', ['payment', 'wallet_deposit'])->where('status', 'pending_accounting')->sum('amount'), 2),
            ],
        ]);
    }

    public function receive(Request $request, CustomerPayment $payment): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('edit_finance'), 403);
        abort_unless($payment->status === 'pending_accounting', 422);

        $data = $request->validate([
            'payment_date' => ['required', 'date'],
            'method' => ['required', Rule::in(['cash', 'check', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'])],
            'check_number' => ['nullable', 'required_if:method,check', 'string', 'max:100'],
            'bank_name' => ['nullable', 'required_if:method,check', 'string', 'max:150'],
            'check_due_date' => ['nullable', 'required_if:method,check', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $payment->update([
            'method' => $data['method'],
            'payment_date' => $data['payment_date'],
            'check_number' => $data['method'] === 'check' ? $data['check_number'] : null,
            'bank_name' => $data['method'] === 'check' ? $data['bank_name'] : null,
            'check_due_date' => $data['method'] === 'check' ? $data['check_due_date'] : null,
            'notes' => $data['notes'] ?? $payment->notes,
            'status' => 'received',
            'received_by' => $request->user()->id,
            'treasury_received_by' => $request->user()->id,
            'received_at' => now(),
            'treasury_received_at' => now(),
        ]);

        if ($payment->salesOrder) {
            $payment->salesOrder->update([
                'down_payment_status' => 'received',
                'down_payment_received_by' => $request->user()->id,
                'down_payment_treasury_received_by' => $request->user()->id,
                'down_payment_received_at' => now(),
                'down_payment_treasury_received_at' => now(),
                'down_payment_method' => $data['method'],
                'down_payment_check_number' => $data['method'] === 'check' ? $data['check_number'] : null,
                'down_payment_bank_name' => $data['method'] === 'check' ? $data['bank_name'] : null,
                'down_payment_check_due_date' => $data['method'] === 'check' ? $data['check_due_date'] : null,
            ]);
        }

        if ($payment->transaction_type === 'wallet_deposit') {
            $payment->customer?->increment('wallet_balance', (float) $payment->amount);
        }

        $this->timeline->record($payment, 'Customer Payment Received', "Customer payment {$payment->payment_number} was received.", $request->user());

        return back()->with('success', 'Customer payment received.');
    }
}
