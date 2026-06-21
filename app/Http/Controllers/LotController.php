<?php

namespace App\Http\Controllers;

use App\Models\IssueOrder;
use App\Models\Lot;
use App\Models\LotSample;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LotController extends Controller
{
    public function __construct(
        private readonly TimelineService $timeline,
    ) {
    }

    public function index(Request $request): Response
    {
        $type = $request->query('type');
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('Lots/Index', [
            'lots' => Lot::query()
                ->with([
                    'sourceIssueOrder:id,issue_no,lot_no,customer_id',
                    'sourceIssueOrder.customer:id,code,name,name_ar',
                    'productionOrder:id,production_number,sales_order_id,customer_id,status',
                    'productionOrder.salesOrder:id,so_number,customer_id,status',
                    'productionOrder.salesOrder.customer:id,code,name,name_ar',
                    'productionOrder.customer:id,code,name,name_ar',
                    'parentLot:id,lot_number,lot_type,parent_lot_id,supplier,purchase_order',
                    'parentLot.parentLot:id,lot_number,lot_type,parent_lot_id,supplier,purchase_order',
                    'parentLot.parentLot.parentLot:id,lot_number,lot_type,supplier,purchase_order',
                    'childLots:id,parent_lot_id,lot_number,lot_type,quantity,unit',
                    'product:id,code,name,type,unit',
                    'approvedSample:id,lot_id,sample_number,color',
                    'samples' => fn ($query) => $query->with('creator:id,name')->oldest(),
                    'creator:id,name',
                    'timeline' => fn ($query) => $query
                        ->with(['user:id,name,department_id', 'department:id,name,code'])
                        ->oldest(),
                ])
                ->when(in_array($type, ['yarn', 'raw_fabric', 'dyed_fabric'], true), fn ($query) => $query->where('lot_type', $type))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('lot_number', 'like', "%{$search}%")
                            ->orWhere('supplier', 'like', "%{$search}%")
                            ->orWhere('purchase_order', 'like', "%{$search}%")
                            ->orWhereHas('sourceIssueOrder', fn ($query) => $query->where('issue_no', 'like', "%{$search}%"))
                            ->orWhereHas('productionOrder', fn ($query) => $query->where('production_number', 'like', "%{$search}%"))
                            ->orWhereHas('product', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                    });
                })
                ->latest()
                ->get(),
            'issueOrders' => IssueOrder::query()
                ->with('customer:id,code,name,name_ar')
                ->latest()
                ->get(['id', 'issue_no', 'lot_no', 'customer_id']),
            'productionOrders' => ProductionOrder::query()
                ->with('customer:id,code,name,name_ar')
                ->latest()
                ->get(['id', 'production_number', 'customer_id', 'status']),
            'products' => Product::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type', 'unit']),
            'parentLots' => Lot::query()
                ->orderBy('lot_number')
                ->get(['id', 'lot_number', 'lot_type', 'supplier', 'purchase_order']),
            'filters' => [
                'type' => $type,
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateLot($request);
        $data['created_by'] = $request->user()->id;

        if ($data['lot_type'] === 'dyed_fabric') {
            $data['drop_number'] ??= $this->nextDropNumber((int) ($data['finish_year'] ?? now()->year));
            $data['finish_year'] ??= now()->year;
        } else {
            $data['drop_number'] = null;
            $data['finish_year'] = null;
        }

        $lot = Lot::create($data);

        $this->timeline->record(
            $lot,
            'Lot Created',
            "Lot {$lot->display_number} was created for {$this->lotTypeLabel($lot->lot_type)} tracking.",
            $request->user(),
        );

        return back()->with('success', 'Lot created.');
    }

    public function update(Request $request, Lot $lot): RedirectResponse
    {
        $this->guardClosedLotUpdate($request, $lot);

        $data = $this->validateLot($request, $lot);

        if ($data['lot_type'] === 'dyed_fabric') {
            $data['finish_year'] ??= now()->year;
        } else {
            $data['drop_number'] = null;
            $data['finish_year'] = null;
        }

        $lot->update($data);

        $this->timeline->record(
            $lot,
            'Lot Updated',
            "Lot {$lot->display_number} traceability data was updated.",
            $request->user(),
        );

        return back()->with('success', 'Lot updated.');
    }

    public function destroy(Request $request, Lot $lot): RedirectResponse
    {
        if ($lot->isUsed()) {
            $lot->update(['status' => 'cancelled']);

            $this->timeline->record(
                $lot,
                'Lot Cancelled',
                "Lot {$lot->display_number} is used in traceability records, so it was cancelled instead of deleted.",
                $request->user(),
            );

            return back()->with('success', 'Lot cancelled.');
        }

        $this->timeline->record($lot, 'Lot Deleted', "Lot {$lot->display_number} was deleted.", $request->user());
        $lot->delete();

        return back()->with('success', 'Lot deleted.');
    }

    public function updateStatus(Request $request, Lot $lot): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'closed', 'cancelled'])],
        ]);

        if ($lot->isClosed() && $data['status'] === 'open') {
            abort_unless($request->user()->hasPermission('edit_closed_lot'), 403);
        }

        $lot->update(['status' => $data['status']]);

        $this->timeline->record(
            $lot,
            'Lot Status Updated',
            "Lot {$lot->display_number} status changed to {$data['status']}.",
            $request->user(),
        );

        return back()->with('success', 'Lot status updated.');
    }

    public function storeSample(Request $request, Lot $lot): RedirectResponse
    {
        abort_unless($lot->lot_type === 'dyed_fabric', 422, 'Samples can only be added to dyed fabric lots.');
        abort_if($lot->isClosed() && ! $request->user()->hasPermission('edit_closed_lot'), 403, 'Closed lot samples cannot be changed.');

        $data = $request->validate([
            'sample_number' => ['nullable', 'digits_between:1,100', Rule::unique('lot_samples', 'sample_number')->where('lot_id', $lot->id)],
            'color' => ['nullable', 'string', 'max:255'],
            'recipe' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'approved' => ['boolean'],
        ]);

        DB::transaction(function () use ($request, $lot, $data): void {
            $sample = $lot->samples()->create([
                'sample_number' => $data['sample_number'] ?: $this->nextSampleNumber($lot),
                'color' => $data['color'] ?? null,
                'recipe' => $data['recipe'] ?? null,
                'notes' => $data['notes'] ?? null,
                'approved' => (bool) ($data['approved'] ?? false),
                'created_by' => $request->user()->id,
            ]);

            if ($sample->approved) {
                $this->markSampleApproved($lot, $sample);
            }

            $this->timeline->record(
                $lot,
                $sample->approved ? 'Approved Sample Added' : 'Dye Sample Added',
                "Sample {$sample->sample_number} was added to dyed lot {$lot->display_number}.",
                $request->user(),
            );
        });

        return back()->with('success', 'Sample saved.');
    }

    public function approveSample(Request $request, Lot $lot, LotSample $sample): RedirectResponse
    {
        abort_unless($sample->lot_id === $lot->id, 404);
        abort_unless($lot->lot_type === 'dyed_fabric', 422, 'Only dyed fabric lots can approve samples.');
        abort_if($lot->isClosed() && ! $request->user()->hasPermission('edit_closed_lot'), 403, 'Closed lot samples cannot be changed.');

        $this->markSampleApproved($lot, $sample);

        $this->timeline->record(
            $lot,
            'Sample Approved',
            "Sample {$sample->sample_number} was marked as the approved sample for lot {$lot->display_number}.",
            $request->user(),
        );

        return back()->with('success', 'Sample approved.');
    }

    private function validateLot(Request $request, ?Lot $lot = null): array
    {
        return $request->validate([
            'lot_number' => ['required', 'digits_between:1,100', Rule::unique('lots', 'lot_number')->ignore($lot)],
            'lot_type' => ['required', Rule::in(['yarn', 'raw_fabric', 'dyed_fabric'])],
            'source_issue_order_id' => ['nullable', 'exists:issue_orders,id'],
            'production_order_id' => ['nullable', 'exists:production_orders,id'],
            'parent_lot_id' => ['nullable', 'exists:lots,id'],
            'product_id' => ['nullable', 'exists:products,id'],
            'color' => ['nullable', 'string', 'max:255'],
            'unit' => ['required', Rule::in(['kg', 'meter', 'piece', 'roll', 'carton'])],
            'quantity' => ['required', 'numeric', 'min:0'],
            'lot_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['open', 'closed', 'cancelled'])],
            'drop_number' => ['nullable', 'integer', 'min:1'],
            'finish_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'supplier' => ['nullable', 'required_if:lot_type,yarn', 'string', 'max:255'],
            'purchase_order' => ['nullable', 'required_if:lot_type,yarn', 'string', 'max:255'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'received_quantity' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function nextDropNumber(int $year): int
    {
        return ((int) Lot::query()
            ->where('lot_type', 'dyed_fabric')
            ->where('finish_year', $year)
            ->max('drop_number')) + 1;
    }

    private function nextSampleNumber(Lot $lot): string
    {
        return str_pad((string) ($lot->samples()->count() + 1), 2, '0', STR_PAD_LEFT);
    }

    private function markSampleApproved(Lot $lot, LotSample $sample): void
    {
        $lot->samples()->update(['approved' => false]);
        $sample->update(['approved' => true]);
        $lot->update(['approved_sample_id' => $sample->id]);
    }

    private function guardClosedLotUpdate(Request $request, Lot $lot): void
    {
        if (! $lot->isClosed() || $request->user()->hasPermission('edit_closed_lot')) {
            return;
        }

        $protectedFields = ['quantity', 'supplier', 'purchase_order', 'purchase_price', 'received_quantity'];

        foreach ($protectedFields as $field) {
            if ($request->has($field) && (string) $request->input($field) !== (string) $lot->{$field}) {
                abort(403, 'Closed lot protected fields cannot be changed.');
            }
        }
    }

    private function lotTypeLabel(string $type): string
    {
        return match ($type) {
            'yarn' => 'yarn',
            'raw_fabric' => 'raw fabric',
            'dyed_fabric' => 'dyed fabric',
            default => 'lot',
        };
    }
}
