<?php

namespace App\Http\Controllers;

use App\Models\WeavingProduction;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WeavingProductionController extends Controller
{
    public function __construct(private readonly TimelineService $timeline)
    {
    }

    public function index(): Response
    {
        return Inertia::render('WeavingProduction/Index', [
            'records' => WeavingProduction::query()
                ->with(['creator:id,name', 'timeline' => fn ($query) => $query->with('user:id,name')->oldest()])
                ->latest('production_date')
                ->latest('id')
                ->limit(50)
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'production_date' => ['required', 'date'],
            'yarn_lot_no' => ['required', 'string', 'max:100'],
            'yarn_quantity' => ['required', 'numeric', 'min:0.01'],
            'raw_lot_no' => ['required', 'string', 'max:100', 'unique:weaving_productions,raw_lot_no'],
            'raw_quantity' => ['required', 'numeric', 'min:0.01'],
            'inspection_status' => ['required', Rule::in(['pending_inspection', 'accepted', 'rejected'])],
            'notes' => ['nullable', 'string'],
        ]);

        $record = WeavingProduction::create([
            ...$data,
            'weaving_number' => $this->nextNumber(),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($record, 'Weaving Production Created', "Raw lot {$record->raw_lot_no} was produced from yarn lot {$record->yarn_lot_no}.", $request->user());

        return back()->with('success', 'Weaving production recorded.');
    }

    public function updateStatus(Request $request, WeavingProduction $weavingProduction): RedirectResponse
    {
        $data = $request->validate([
            'inspection_status' => ['required', Rule::in(['pending_inspection', 'accepted', 'rejected', 'sent_to_raw_warehouse'])],
        ]);

        $weavingProduction->update([
            'inspection_status' => $data['inspection_status'],
            'sent_to_raw_warehouse_at' => $data['inspection_status'] === 'sent_to_raw_warehouse' ? now() : $weavingProduction->sent_to_raw_warehouse_at,
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($weavingProduction, 'Weaving Status Updated', "Weaving record {$weavingProduction->weaving_number} status changed to {$data['inspection_status']}.", $request->user());

        return back()->with('success', 'Weaving status updated.');
    }

    private function nextNumber(): string
    {
        $lastNumber = WeavingProduction::query()
            ->whereRaw('weaving_number REGEXP "^WV-[0-9]+$"')
            ->max(DB::raw('CAST(SUBSTRING(weaving_number, 4) AS UNSIGNED)'));

        return 'WV-'.str_pad((string) (((int) $lastNumber) + 1), 6, '0', STR_PAD_LEFT);
    }
}
