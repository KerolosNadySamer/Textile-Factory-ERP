<?php

namespace App\Http\Controllers;

use App\Models\DyeingOrder;
use App\Models\DyeSample;
use App\Models\SalesOrder;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DyeingOrderController extends Controller
{
    public function __construct(private readonly TimelineService $timeline)
    {
    }

    public function index(): Response
    {
        return Inertia::render('DyeingOrders/Index', [
            'orders' => DyeingOrder::query()
                ->with(['salesOrder:id,so_number,customer_id', 'salesOrder.customer:id,name,name_ar', 'dyeSample:id,sample_no,sample_color,requested_color', 'creator:id,name'])
                ->latest()
                ->limit(50)
                ->get(),
            'salesOrders' => SalesOrder::query()
                ->with('customer:id,name,name_ar')
                ->whereIn('status', ['approved', 'in_production'])
                ->latest()
                ->get(['id', 'so_number', 'customer_id', 'approved_dye_sample_id']),
            'dyeSamples' => DyeSample::query()
                ->where('status', 'approved')
                ->latest()
                ->get(['id', 'sales_order_id', 'sample_no', 'sample_color', 'requested_color', 'raw_lot_no']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sales_order_id' => ['required', 'exists:sales_orders,id'],
            'dye_sample_id' => ['nullable', 'exists:dye_samples,id'],
            'raw_lot_no' => ['required', 'string', 'max:100'],
            'dyeing_entry_no' => ['required', 'string', 'max:100'],
            'drop_number' => ['required', 'integer', 'min:1', 'max:999'],
            'finish_year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! empty($data['dye_sample_id'])) {
            $sample = DyeSample::findOrFail($data['dye_sample_id']);
            abort_unless((int) $sample->sales_order_id === (int) $data['sales_order_id'] || $sample->sales_order_id === null, 422);
        }

        $finalLotNo = $this->finalLotNo($data['dyeing_entry_no'], (int) $data['drop_number'], (int) $data['finish_year']);

        $order = DyeingOrder::create([
            ...$data,
            'dyeing_number' => $this->nextNumber(),
            'final_lot_no' => $finalLotNo,
            'status' => 'draft',
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($order, 'Dyeing Order Created', "Dyeing order {$order->dyeing_number} created for final lot {$order->final_lot_no}.", $request->user());

        return back()->with('success', 'Dyeing order created.');
    }

    public function updateStatus(Request $request, DyeingOrder $dyeingOrder): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['draft', 'in_dyeing', 'finished', 'sent_to_finished_warehouse', 'rejected'])],
        ]);

        $dyeingOrder->update([
            'status' => $data['status'],
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($dyeingOrder, 'Dyeing Order Status Updated', "Dyeing order {$dyeingOrder->dyeing_number} status changed to {$data['status']}.", $request->user());

        return back()->with('success', 'Dyeing order updated.');
    }

    private function finalLotNo(string $entryNo, int $dropNumber, int $year): string
    {
        return "{$entryNo}-{$dropNumber}-{$year}";
    }

    private function nextNumber(): string
    {
        $lastNumber = DyeingOrder::query()
            ->whereRaw('dyeing_number REGEXP "^DY-[0-9]+$"')
            ->max(DB::raw('CAST(SUBSTRING(dyeing_number, 4) AS UNSIGNED)'));

        return 'DY-'.str_pad((string) (((int) $lastNumber) + 1), 6, '0', STR_PAD_LEFT);
    }
}
