<?php

namespace App\Http\Controllers;

use App\Models\DyeSample;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Services\NotificationService;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DyeSampleController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly TimelineService $timeline,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('DyeSamples/Index', [
            'dyeSamples' => DyeSample::query()
                ->with([
                    'product:id,code,name,type',
                    'salesOrder:id,so_number,customer_id',
                    'salesOrder.customer:id,name,name_ar',
                    'creator:id,name',
                    'dyeingManagerApprover:id,name',
                    'salesOfficerApprover:id,name',
                    'salesManagerApprover:id,name',
                    'generalManagerApprover:id,name',
                    'timeline' => fn ($query) => $query
                        ->with(['user:id,name,department_id', 'department:id,name,code'])
                        ->oldest(),
                ])
                ->latest()
                ->limit(80)
                ->get(),
            'products' => Product::query()
                ->where('active', true)
                ->whereIn('type', ['raw_fabric', 'dyed_fabric'])
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type']),
            'salesOrders' => SalesOrder::query()
                ->with('customer:id,name,name_ar')
                ->whereIn('status', ['draft', 'submitted', 'planning_review', 'approved', 'in_production'])
                ->latest()
                ->limit(100)
                ->get(['id', 'so_number', 'customer_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedSample($request);
        $data['sample_sequence'] = $this->nextSampleSequence($data['issue_no']);
        $data['sample_no'] = $this->nextSampleNumber($data['issue_no'], $data['sample_sequence']);
        $data['status'] = 'draft';
        $data['created_by'] = $request->user()->id;

        $dyeSample = DyeSample::create($data);

        $this->timeline->record($dyeSample, 'Dye Sample Created', "Dye sample {$dyeSample->sample_no} was created.", $request->user());

        return back()->with('success', 'Dye sample created.');
    }

    public function update(Request $request, DyeSample $dyeSample): RedirectResponse
    {
        abort_unless(in_array($dyeSample->status, ['draft', 'rejected'], true), 403);

        $dyeSample->update($this->validatedSample($request));
        $this->timeline->record($dyeSample, 'Dye Sample Updated', "Dye sample {$dyeSample->sample_no} was updated.", $request->user());

        return back()->with('success', 'Dye sample updated.');
    }

    public function updateStatus(Request $request, DyeSample $dyeSample): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                'pending_dyeing_manager',
                'pending_sales_officer',
                'pending_sales_manager',
                'pending_general_manager',
                'approved',
                'rejected',
            ])],
            'rejection_reason' => ['nullable', 'required_if:status,rejected', 'string'],
        ]);

        abort_unless($this->canMoveToStatus($request, $dyeSample, $data['status']), 403);

        $now = Carbon::now();
        $updates = ['status' => $data['status']];

        if ($data['status'] === 'pending_dyeing_manager') {
            $updates += $this->clearApprovals() + [
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
                'approved_at' => null,
            ];
        }

        if ($data['status'] === 'pending_sales_officer') {
            $updates += [
                'dyeing_manager_approved_by' => $request->user()->id,
                'dyeing_manager_approved_at' => $now,
                'sales_officer_approved_by' => null,
                'sales_officer_approved_at' => null,
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
                'approved_at' => null,
            ];
        }

        if ($data['status'] === 'pending_sales_manager') {
            $updates += [
                'sales_officer_approved_by' => $request->user()->id,
                'sales_officer_approved_at' => $now,
                'sales_manager_approved_by' => null,
                'sales_manager_approved_at' => null,
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
                'approved_at' => null,
            ];
        }

        if ($data['status'] === 'pending_general_manager') {
            $updates += [
                'sales_manager_approved_by' => $request->user()->id,
                'sales_manager_approved_at' => $now,
                'general_manager_approved_by' => null,
                'general_manager_approved_at' => null,
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
                'approved_at' => null,
            ];
        }

        if ($data['status'] === 'approved') {
            $updates += [
                'general_manager_approved_by' => $request->user()->id,
                'general_manager_approved_at' => $now,
                'sales_approved_by' => $request->user()->id,
                'sales_approved_at' => $now,
                'approved_at' => $now,
                'rejected_by' => null,
                'rejected_at' => null,
                'rejection_reason' => null,
            ];
        }

        if ($data['status'] === 'rejected') {
            $updates += [
                'rejected_by' => $request->user()->id,
                'rejected_at' => $now,
                'rejection_reason' => $data['rejection_reason'],
                'approved_at' => null,
            ];
        }

        $dyeSample->update($updates);

        if ($data['status'] === 'approved' && $dyeSample->sales_order_id) {
            $dyeSample->salesOrder?->update([
                'approved_dye_sample_id' => $dyeSample->id,
                'sample_number' => $dyeSample->sample_no,
            ]);
        }

        $this->timeline->record($dyeSample, $this->timelineEventForStatus($data['status']), $this->timelineDescriptionForStatus($dyeSample, $data['status']), $request->user());

        if ($data['status'] === 'approved') {
            $this->notifications->sendToRoles(
                ['sales', 'planning', 'dyeing'],
                "Dye sample {$dyeSample->sample_no} approved",
                'The sample is linked to its customer order and ready for production follow-up.',
                route('dye-samples.index'),
                $request->user(),
            );
        }

        return back()->with('success', 'Dye sample status updated.');
    }

    public function destroy(Request $request, DyeSample $dyeSample): RedirectResponse
    {
        $this->timeline->record($dyeSample, 'Dye Sample Deleted', "Dye sample {$dyeSample->sample_no} was deleted.", $request->user());
        $dyeSample->delete();

        return back()->with('success', 'Dye sample deleted.');
    }

    private function validatedSample(Request $request): array
    {
        return $request->validate([
            'issue_no' => ['required', 'digits_between:1,100'],
            'sales_order_id' => ['nullable', 'exists:sales_orders,id'],
            'raw_lot_no' => ['nullable', 'string', 'max:100'],
            'product_id' => ['required', 'exists:products,id'],
            'requested_color' => ['required', 'string', 'max:255'],
            'sample_color' => ['nullable', 'string', 'max:255'],
            'recipe' => ['nullable', 'string'],
            'dyeing_notes' => ['nullable', 'string'],
        ]);
    }

    private function canMoveToStatus(Request $request, DyeSample $dyeSample, string $status): bool
    {
        $user = $request->user();

        return match ($status) {
            'pending_dyeing_manager' => in_array($dyeSample->status, ['draft', 'rejected'], true) && $user->hasPermission('create_dye_sample'),
            'pending_sales_officer' => $dyeSample->status === 'pending_dyeing_manager' && ($user->hasRole('admin') || in_array($user->position?->code, ['section_head', 'dyeing_manager'], true)),
            'pending_sales_manager' => $dyeSample->status === 'pending_sales_officer' && ($user->hasRole('admin') || in_array($user->position?->code, ['sales_officer', 'sales_rep'], true)),
            'pending_general_manager' => $dyeSample->status === 'pending_sales_manager' && ($user->hasRole('admin') || $user->position?->code === 'sales_manager'),
            'approved' => $dyeSample->status === 'pending_general_manager' && ($user->hasRole(['admin', 'general_manager']) || $user->position?->code === 'general_manager'),
            'rejected' => ! in_array($dyeSample->status, ['approved', 'rejected'], true) && (
                $user->hasRole(['admin', 'general_manager'])
                || in_array($user->position?->code, ['section_head', 'dyeing_manager', 'sales_officer', 'sales_rep', 'sales_manager', 'general_manager'], true)
            ),
            default => false,
        };
    }

    private function clearApprovals(): array
    {
        return [
            'dyeing_manager_approved_by' => null,
            'dyeing_manager_approved_at' => null,
            'sales_officer_approved_by' => null,
            'sales_officer_approved_at' => null,
            'sales_manager_approved_by' => null,
            'sales_manager_approved_at' => null,
            'general_manager_approved_by' => null,
            'general_manager_approved_at' => null,
            'sales_approved_by' => null,
            'sales_approved_at' => null,
        ];
    }

    private function nextSampleSequence(string $issueNo): int
    {
        return ((int) DyeSample::query()->where('issue_no', $issueNo)->max('sample_sequence')) + 1;
    }

    private function nextSampleNumber(string $issueNo, int $sequence): string
    {
        return $issueNo.'-S'.str_pad((string) $sequence, 2, '0', STR_PAD_LEFT);
    }

    private function timelineEventForStatus(string $status): string
    {
        return match ($status) {
            'pending_dyeing_manager' => 'Sample Sent To Dyeing Manager',
            'pending_sales_officer' => 'Dyeing Manager Approved Sample',
            'pending_sales_manager' => 'Sales Officer Approved Sample',
            'pending_general_manager' => 'Sales Manager Approved Sample',
            'approved' => 'General Manager Approved Sample',
            'rejected' => 'Dye Sample Rejected',
            default => 'Status Updated',
        };
    }

    private function timelineDescriptionForStatus(DyeSample $dyeSample, string $status): string
    {
        return match ($status) {
            'pending_dyeing_manager' => "Dye sample {$dyeSample->sample_no} was sent to the dyeing manager.",
            'pending_sales_officer' => "Dyeing manager approved sample {$dyeSample->sample_no}.",
            'pending_sales_manager' => "Sales officer approved sample {$dyeSample->sample_no}.",
            'pending_general_manager' => "Sales manager approved sample {$dyeSample->sample_no}.",
            'approved' => "General manager approved sample {$dyeSample->sample_no}.",
            'rejected' => "Dye sample {$dyeSample->sample_no} was rejected.",
            default => "Dye sample {$dyeSample->sample_no} was updated.",
        };
    }
}
