<?php

namespace App\Http\Controllers;

use App\Models\InventoryLedgerEntry;
use App\Models\Lot;
use App\Models\StockCount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PhysicalInventoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('PhysicalInventory/Index', [
            'stockCounts' => StockCount::query()
                ->with(['creator:id,name', 'approver:id,name', 'items.lot:id,lot_number,lot_type,unit', 'items.product:id,code,name'])
                ->latest()
                ->get(),
            'openLots' => Lot::query()
                ->with('product:id,code,name')
                ->where('status', 'open')
                ->orderBy('lot_number')
                ->get(['id', 'lot_number', 'lot_type', 'product_id', 'quantity', 'unit']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'count_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.lot_id' => ['required', 'exists:lots,id'],
            'items.*.counted_qty' => ['required', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $data): void {
            $stockCount = StockCount::create([
                'count_number' => $this->nextCountNumber(),
                'count_date' => $data['count_date'],
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['items'] as $item) {
                $lot = Lot::query()->with('product:id,code,name')->findOrFail($item['lot_id']);
                $systemQty = (float) $lot->quantity;
                $countedQty = (float) $item['counted_qty'];

                $stockCount->items()->create([
                    'lot_id' => $lot->id,
                    'product_id' => $lot->product_id,
                    'system_qty' => $systemQty,
                    'counted_qty' => $countedQty,
                    'variance_qty' => round($countedQty - $systemQty, 2),
                    'unit' => $lot->unit,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return back()->with('success', 'Stock count created.');
    }

    public function approve(Request $request, StockCount $stockCount): RedirectResponse
    {
        abort_unless($stockCount->status === 'draft', 422);

        DB::transaction(function () use ($request, $stockCount): void {
            $stockCount->load(['items.lot.product']);

            foreach ($stockCount->items as $item) {
                $lot = $item->lot;
                $variance = (float) $item->variance_qty;

                if ($variance != 0.0) {
                    InventoryLedgerEntry::create([
                        'entry_date' => $stockCount->count_date,
                        'document_type' => 'physical_inventory_adjustment',
                        'document_number' => $stockCount->count_number,
                        'lot_id' => $lot->id,
                        'product_id' => $item->product_id,
                        'in_qty' => $variance > 0 ? $variance : 0,
                        'out_qty' => $variance < 0 ? abs($variance) : 0,
                        'balance' => $item->counted_qty,
                        'unit_cost' => $lot->purchase_price ?? 0,
                        'total_cost' => abs($variance) * (float) ($lot->purchase_price ?? 0),
                        'department_id' => $request->user()->department_id,
                        'user_id' => $request->user()->id,
                        'notes' => "Adjustment from stock count {$stockCount->count_number}.",
                    ]);
                }

                $lot->update(['quantity' => $item->counted_qty]);
            }

            $stockCount->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => Carbon::now(),
            ]);
        });

        return back()->with('success', 'Stock count approved and adjustments posted.');
    }

    private function nextCountNumber(): string
    {
        return 'SC-'.str_pad((string) (((int) StockCount::query()->max('id')) + 1), 6, '0', STR_PAD_LEFT);
    }
}
