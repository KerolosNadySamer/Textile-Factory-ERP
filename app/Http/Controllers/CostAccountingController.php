<?php

namespace App\Http\Controllers;

use App\Models\CostEntry;
use App\Models\CostSummary;
use App\Models\Department;
use App\Models\InventoryLedgerEntry;
use App\Models\Lot;
use App\Services\GovernanceChangeRequestService;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CostAccountingController extends Controller
{
    public function __construct(
        private readonly TimelineService $timeline,
        private readonly GovernanceChangeRequestService $governanceChanges,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('CostAccounting/Index', [
            'lots' => Lot::query()
                ->with([
                    'product:id,code,name,unit,type',
                    'parentLot:id,lot_number,lot_type',
                    'costEntries.department:id,name,code',
                    'costEntries.creator:id,name',
                    'costSummary',
                ])
                ->latest()
                ->get(['id', 'lot_number', 'lot_type', 'drop_number', 'finish_year', 'parent_lot_id', 'product_id', 'quantity', 'unit', 'status']),
            'summaries' => CostSummary::query()
                ->with(['lot:id,lot_number,lot_type,drop_number,finish_year,product_id,quantity,unit', 'lot.product:id,code,name,unit'])
                ->latest()
                ->get(),
            'departments' => Department::query()->officialActive()->orderBy('name')->get(['id', 'name', 'code']),
            'costTypes' => $this->costTypes(),
        ]);
    }

    public function storeEntry(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'lot_id' => ['required', 'exists:lots,id'],
            'cost_type' => ['required', Rule::in(array_keys($this->costTypes()))],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        $lot = Lot::findOrFail($data['lot_id']);
        $summary = $lot->costSummary;
        abort_if($summary?->status === 'approved', 422, 'Approved costs cannot be changed.');

        CostEntry::create($data + [
            'created_by' => $request->user()->id,
            'department_id' => $data['department_id'] ?? $request->user()->department_id,
        ]);

        $this->recalculate($lot, $request->user()->id);
        $this->timeline->record($lot, 'Cost Entry Added', "{$data['cost_type']} cost {$data['amount']} was added.", $request->user());

        return back()->with('success', 'Cost entry saved.');
    }

    public function recalculateSummary(Request $request, Lot $lot): RedirectResponse
    {
        abort_if($lot->costSummary?->status === 'approved', 422, 'Approved costs cannot be recalculated.');

        $this->recalculate($lot, $request->user()->id);
        $this->timeline->record($lot, 'Cost Recalculated', "Cost summary for lot {$lot->display_number} was recalculated.", $request->user());

        return back()->with('success', 'Cost summary recalculated.');
    }

    public function reviewSummary(Request $request, Lot $lot): RedirectResponse
    {
        $summary = $this->recalculate($lot, $request->user()->id);

        abort_unless(in_array($summary->status, ['draft', 'rejected'], true), 422);

        $summary->update([
            'status' => 'reviewed',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => Carbon::now(),
        ]);

        $this->timeline->record($lot, 'Cost Reviewed', "Cost summary for lot {$lot->display_number} was reviewed.", $request->user());

        return back()->with('success', 'Cost summary reviewed.');
    }

    public function approveSummary(Request $request, Lot $lot): RedirectResponse
    {
        $summary = $lot->costSummary()->firstOrFail();
        abort_unless($summary->status === 'reviewed', 422);

        $this->governanceChanges->requestUpdate($request->user(), $summary, [
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => Carbon::now(),
        ], 'Final cost approval requires governance approval.');

        return back()->with('success', 'Cost approval request sent for governance approval.');
    }

    private function recalculate(Lot $lot, int $userId): CostSummary
    {
        $lot->load(['parentLot.costSummary', 'costEntries', 'ledgerEntries']);

        $ledgerMaterial = (float) InventoryLedgerEntry::query()
            ->where('lot_id', $lot->id)
            ->where('in_qty', '>', 0)
            ->sum('total_cost');

        $parentMaterial = (float) ($lot->parentLot?->costSummary?->total_cost ?? 0);
        $manualMaterial = (float) $lot->costEntries->where('cost_type', 'material')->sum('amount');
        $materialCost = $ledgerMaterial + $parentMaterial + $manualMaterial;
        $productionCost = (float) $lot->costEntries->where('cost_type', 'production')->sum('amount');
        $dyeingCost = (float) $lot->costEntries->where('cost_type', 'dyeing')->sum('amount');
        $overheadCost = (float) $lot->costEntries->where('cost_type', 'overhead')->sum('amount');
        $totalCost = $materialCost + $productionCost + $dyeingCost + $overheadCost;
        $quantity = max((float) $lot->quantity, 0.0001);

        return CostSummary::updateOrCreate(
            ['lot_id' => $lot->id],
            [
                'material_cost' => $materialCost,
                'production_cost' => $productionCost,
                'dyeing_cost' => $dyeingCost,
                'overhead_cost' => $overheadCost,
                'total_cost' => $totalCost,
                'unit_cost' => $totalCost / $quantity,
                'status' => $lot->costSummary?->status === 'approved' ? 'approved' : 'draft',
                'calculated_by' => $userId,
            ]
        );
    }

    private function costTypes(): array
    {
        return [
            'material' => 'Material Adjustment',
            'production' => 'Production Cost',
            'dyeing' => 'Dyeing Cost',
            'overhead' => 'Overhead Cost',
        ];
    }
}
