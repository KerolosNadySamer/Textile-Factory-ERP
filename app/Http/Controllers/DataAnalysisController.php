<?php

namespace App\Http\Controllers;

use App\Models\CostSummary;
use App\Models\Customer;
use App\Models\InventoryLedgerEntry;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DataAnalysisController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('DataAnalysis/Index', [
            'sales' => [
                'byCustomer' => Customer::query()
                    ->withCount('salesOrders')
                    ->orderByDesc('sales_orders_count')
                    ->limit(10)
                    ->get(['id', 'code', 'name', 'name_ar'])
                    ->map(fn (Customer $customer) => [
                        'label' => ($customer->code ? "{$customer->code} - " : '').($customer->name_ar ?? $customer->name),
                        'value' => $customer->sales_orders_count,
                    ]),
                'byProduct' => SalesOrderItem::query()
                    ->select('product_id', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(total_price) as total'))
                    ->with('product:id,code,name')
                    ->groupBy('product_id')
                    ->orderByDesc('qty')
                    ->limit(10)
                    ->get()
                    ->map(fn (SalesOrderItem $item) => [
                        'label' => ($item->product?->code ? "{$item->product->code} - " : '').($item->product?->name ?? '-'),
                        'value' => (float) $item->qty,
                        'total' => (float) $item->total,
                    ]),
                'byColor' => SalesOrderItem::query()
                    ->select('color', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(total_price) as total'))
                    ->groupBy('color')
                    ->orderByDesc('qty')
                    ->limit(10)
                    ->get()
                    ->map(fn ($item) => ['label' => $item->color, 'value' => (float) $item->qty, 'total' => (float) $item->total]),
                'monthly' => SalesOrder::query()
                    ->selectRaw("DATE_FORMAT(order_date, '%Y-%m') as month, COUNT(*) as orders")
                    ->groupBy('month')
                    ->orderByDesc('month')
                    ->limit(12)
                    ->get(),
            ],
            'inventory' => [
                'fastMoving' => InventoryLedgerEntry::query()
                    ->select('product_id', DB::raw('SUM(out_qty) as qty'))
                    ->with('product:id,code,name')
                    ->where('out_qty', '>', 0)
                    ->groupBy('product_id')
                    ->orderByDesc('qty')
                    ->limit(10)
                    ->get()
                    ->map(fn (InventoryLedgerEntry $entry) => [
                        'label' => ($entry->product?->code ? "{$entry->product->code} - " : '').($entry->product?->name ?? '-'),
                        'value' => (float) $entry->qty,
                    ]),
                'slowMoving' => Product::query()
                    ->whereDoesntHave('inventoryLedgerEntries', fn ($query) => $query->where('out_qty', '>', 0)->where('entry_date', '>=', now()->subDays(90)))
                    ->limit(10)
                    ->get(['id', 'code', 'name'])
                    ->map(fn (Product $product) => ['label' => "{$product->code} - {$product->name}", 'value' => 0]),
            ],
            'suppliers' => [
                'topByPurchaseOrders' => Supplier::query()
                    ->withCount('purchaseOrders')
                    ->orderByDesc('purchase_orders_count')
                    ->limit(10)
                    ->get(['id', 'code', 'name'])
                    ->map(fn (Supplier $supplier) => [
                        'label' => "{$supplier->code} - {$supplier->name}",
                        'value' => $supplier->purchase_orders_count,
                    ]),
            ],
            'costs' => [
                'topUnitCost' => CostSummary::query()
                    ->with('lot:id,lot_number,lot_type,product_id')
                    ->orderByDesc('unit_cost')
                    ->limit(10)
                    ->get()
                    ->map(fn (CostSummary $summary) => [
                        'label' => $summary->lot?->lot_number ?? (string) $summary->lot_id,
                        'value' => (float) $summary->unit_cost,
                        'total' => (float) $summary->total_cost,
                    ]),
                'totals' => [
                    'material' => (float) CostSummary::query()->sum('material_cost'),
                    'production' => (float) CostSummary::query()->sum('production_cost'),
                    'dyeing' => (float) CostSummary::query()->sum('dyeing_cost'),
                    'overhead' => (float) CostSummary::query()->sum('overhead_cost'),
                ],
            ],
        ]);
    }
}
