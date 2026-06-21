<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierAccountReportController extends Controller
{
    public function __construct(private readonly TimelineService $timeline)
    {
    }

    public function index(Request $request): Response
    {
        $supplierId = $request->query('supplier_id');
        $supplier = $supplierId ? Supplier::query()->find($supplierId) : null;

        $orders = collect();
        $payments = collect();

        if ($supplier) {
            $orders = PurchaseOrder::query()
                ->where('supplier_id', $supplier->id)
                ->with('supplierPayments:id,purchase_order_id,amount,status')
                ->latest('order_date')
                ->get();

            $payments = SupplierPayment::query()
                ->where('supplier_id', $supplier->id)
                ->with(['purchaseOrder:id,po_number', 'creator:id,name'])
                ->latest('payment_date')
                ->latest('id')
                ->get();
        }

        $statement = $orders
            ->map(fn (PurchaseOrder $order) => [
                'id' => 'order-'.$order->id,
                'date' => $order->order_date?->format('Y-m-d'),
                'type' => 'purchase',
                'number' => $order->po_number,
                'description' => 'Purchase order',
                'debit' => (float) $order->subtotal,
                'credit' => 0,
                'status' => $order->status,
            ])
            ->merge($payments->map(fn (SupplierPayment $payment) => [
                'id' => 'payment-'.$payment->id,
                'date' => $payment->payment_date?->format('Y-m-d'),
                'type' => 'payment',
                'number' => $payment->payment_number,
                'description' => $payment->purchaseOrder?->po_number ? "Payment for {$payment->purchaseOrder->po_number}" : 'Supplier payment',
                'debit' => 0,
                'credit' => (float) $payment->amount,
                'method' => $payment->method,
                'status' => $payment->status,
            ]))
            ->sortBy(fn ($row) => [$row['date'] ?? '', $row['id']])
            ->values();

        return Inertia::render('SupplierAccountReports/Index', [
            'suppliers' => Supplier::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'selectedSupplier' => $supplier,
            'purchaseOrders' => $orders,
            'payments' => $payments,
            'statement' => $statement,
            'filters' => [
                'supplier_id' => $supplierId,
            ],
            'totals' => [
                'debit' => round($statement->sum('debit'), 2),
                'credit' => round($statement->sum('credit'), 2),
                'balance' => round($statement->sum('debit') - $statement->sum('credit'), 2),
            ],
        ]);
    }

    public function storePayment(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('edit_finance'), 403);

        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_order_id' => [
                'nullable',
                Rule::exists('purchase_orders', 'id')->where(fn ($query) => $query->where('supplier_id', $request->input('supplier_id'))),
            ],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::in(['cash', 'check'])],
            'check_number' => ['nullable', 'required_if:method,check', 'string', 'max:100'],
            'check_due_date' => ['nullable', 'required_if:method,check', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $payment = SupplierPayment::create([
            ...$data,
            'payment_number' => $this->nextPaymentNumber(),
            'check_number' => $data['method'] === 'check' ? $data['check_number'] : null,
            'check_due_date' => $data['method'] === 'check' ? $data['check_due_date'] : null,
            'status' => 'paid',
            'created_by' => $request->user()->id,
        ]);

        $this->timeline->record($payment, 'Supplier Payment Recorded', "Supplier payment {$payment->payment_number} was recorded.", $request->user());

        return back()->with('success', 'Supplier payment recorded.');
    }

    private function nextPaymentNumber(): string
    {
        $lastNumber = SupplierPayment::query()
            ->whereRaw('payment_number REGEXP "^SP-[0-9]+$"')
            ->max(DB::raw('CAST(SUBSTRING(payment_number, 4) AS UNSIGNED)'));

        return 'SP-'.str_pad((string) (((int) $lastNumber) + 1), 6, '0', STR_PAD_LEFT);
    }
}
