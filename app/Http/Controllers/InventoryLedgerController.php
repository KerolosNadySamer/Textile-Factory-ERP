<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\InventoryLedgerEntry;
use App\Models\Lot;
use App\Models\Product;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryLedgerController extends Controller
{
    public function __construct(
        private readonly TimelineService $timeline,
    ) {
    }

    public function index(Request $request): Response
    {
        $lotId = $request->query('lot_id');
        $productId = $request->query('product_id');
        $documentType = $request->query('document_type');

        return Inertia::render('InventoryLedger/Index', [
            'entries' => InventoryLedgerEntry::query()
                ->with([
                    'lot:id,lot_number,lot_type,drop_number,finish_year,status',
                    'product:id,code,name,unit,type',
                    'department:id,name,code',
                    'user:id,name',
                ])
                ->when($lotId, fn ($query) => $query->where('lot_id', $lotId))
                ->when($productId, fn ($query) => $query->where('product_id', $productId))
                ->when($documentType, fn ($query) => $query->where('document_type', $documentType))
                ->latest('entry_date')
                ->latest('id')
                ->limit(50)
                ->get(),
            'lots' => Lot::query()
                ->with('product:id,code,name,unit')
                ->orderBy('lot_number')
                ->get(['id', 'lot_number', 'lot_type', 'drop_number', 'finish_year', 'product_id', 'status']),
            'products' => Product::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'unit', 'type']),
            'departments' => Department::query()
                ->officialActive()
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'filters' => [
                'lot_id' => $lotId,
                'product_id' => $productId,
                'document_type' => $documentType,
            ],
            'documentTypes' => $this->documentTypes(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'entry_date' => ['required', 'date'],
            'document_type' => ['required', Rule::in(array_keys($this->documentTypes()))],
            'document_number' => ['required', 'string', 'max:100'],
            'lot_id' => ['required', 'exists:lots,id'],
            'product_id' => ['required', 'exists:products,id'],
            'in_qty' => ['nullable', 'numeric', 'min:0'],
            'out_qty' => ['nullable', 'numeric', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $inQty = (float) ($data['in_qty'] ?? 0);
        $outQty = (float) ($data['out_qty'] ?? 0);
        $direction = $this->movementDirection($data['document_type']);

        if ($direction === 'in') {
            $outQty = 0;
            abort_if($inQty <= 0, 422, 'In quantity is required for this document type.');
        }

        if ($direction === 'out') {
            $inQty = 0;
            abort_if($outQty <= 0, 422, 'Out quantity is required for this document type.');
        }

        abort_if($inQty <= 0 && $outQty <= 0, 422, 'In Qty or Out Qty is required.');
        abort_if($inQty > 0 && $outQty > 0, 422, 'Only one side of the movement can be entered.');

        $lot = Lot::findOrFail($data['lot_id']);
        abort_if($lot->status === 'cancelled', 422, 'Cancelled lots cannot receive inventory movements.');
        abort_if($lot->isClosed() && ! $request->user()->hasPermission('edit_closed_lot'), 403, 'Closed lot movements require special permission.');

        $previousBalance = (float) InventoryLedgerEntry::query()
            ->where('lot_id', $data['lot_id'])
            ->where('product_id', $data['product_id'])
            ->latest('entry_date')
            ->latest('id')
            ->value('balance');

        $balance = $previousBalance + $inQty - $outQty;
        abort_if($balance < 0, 422, 'Movement would create a negative lot balance.');

        $movementQty = $inQty > 0 ? $inQty : $outQty;
        $unitCost = $data['unit_cost'] ?? null;

        $entry = InventoryLedgerEntry::create([
            'entry_date' => $data['entry_date'],
            'document_type' => $data['document_type'],
            'document_number' => $data['document_number'],
            'lot_id' => $data['lot_id'],
            'product_id' => $data['product_id'],
            'in_qty' => $inQty,
            'out_qty' => $outQty,
            'balance' => $balance,
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost !== null ? $movementQty * (float) $unitCost : null,
            'department_id' => $data['department_id'] ?? $request->user()->department_id,
            'user_id' => $request->user()->id,
            'notes' => $data['notes'] ?? null,
        ]);

        $lot->update(['quantity' => $balance]);

        $this->timeline->record(
            $lot,
            'Inventory Movement',
            "{$entry->document_type} {$entry->document_number}: +{$entry->in_qty} / -{$entry->out_qty}, balance {$entry->balance}.",
            $request->user(),
        );

        return back()->with('success', 'Inventory ledger entry recorded.');
    }

    private function documentTypes(): array
    {
        return [
            'yarn_purchase' => 'Yarn Purchase',
            'issue_to_production' => 'Issue To Production',
            'raw_fabric_receipt' => 'Raw Fabric Receipt',
            'send_to_dyeing' => 'Send To Dyeing',
            'dyed_fabric_receipt' => 'Dyed Fabric Receipt',
            'customer_issue' => 'Customer Issue',
            'customer_return' => 'Customer Return',
            'adjustment' => 'Adjustment',
        ];
    }

    private function movementDirection(string $documentType): string
    {
        return match ($documentType) {
            'yarn_purchase', 'raw_fabric_receipt', 'dyed_fabric_receipt', 'customer_return' => 'in',
            'issue_to_production', 'send_to_dyeing', 'customer_issue' => 'out',
            default => 'both',
        };
    }
}
