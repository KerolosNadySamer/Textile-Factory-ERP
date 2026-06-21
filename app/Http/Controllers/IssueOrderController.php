<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\IssueOrder;
use App\Models\Product;
use App\Services\NotificationService;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IssueOrderController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly TimelineService $timeline,
    )
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('IssueOrders/Index', [
            'issueOrders' => IssueOrder::query()
                ->with([
                    'customer:id,code,name',
                    'product:id,code,name,type,unit',
                    'creator:id,name',
                    'timeline' => fn ($query) => $query
                        ->with(['user:id,name,department_id', 'department:id,name,code'])
                        ->oldest(),
                ])
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('issue_no', 'like', "%{$search}%")
                            ->orWhere('lot_no', 'like', "%{$search}%")
                            ->orWhere('fabric_type', 'like', "%{$search}%")
                            ->orWhere('color', 'like', "%{$search}%")
                            ->orWhereHas('customer', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                            ->orWhereHas('product', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                    });
                })
                ->latest()
                ->limit(30)
                ->get(),
            'customers' => Customer::query()
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'products' => Product::query()
                ->where('active', true)
                ->whereIn('type', ['raw_fabric', 'dyed_fabric'])
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'type', 'unit']),
            'filters' => [
                'search' => $search,
            ],
            'inventoryReady' => false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateIssueOrder($request);
        $data['lot_no'] = $data['issue_no'];
        $data['created_by'] = $request->user()->id;

        $issueOrder = IssueOrder::create($data);

        $this->timeline->record(
            $issueOrder,
            'Issue Order Created',
            "تم إنشاء إذن صرف {$issueOrder->issue_no} للعميل.",
            $request->user(),
        );

        $this->notifications->sendToRoles(
            ['sales'],
            "تم إنشاء إذن صرف {$issueOrder->issue_no}",
            "إذن صرف للعميل يحتاج متابعة المبيعات.",
            route('issue-orders.index'),
            $request->user(),
        );

        return back()->with('success', 'Issue order created.');
    }

    public function update(Request $request, IssueOrder $issueOrder): RedirectResponse
    {
        $data = $this->validateIssueOrder($request, $issueOrder);
        $data['lot_no'] = $data['issue_no'];

        $issueOrder->update($data);

        $this->timeline->record(
            $issueOrder,
            'Issue Order Updated',
            "تم تعديل إذن الصرف {$issueOrder->issue_no}.",
            $request->user(),
        );

        return back()->with('success', 'Issue order updated.');
    }

    public function destroy(Request $request, IssueOrder $issueOrder): RedirectResponse
    {
        $this->timeline->record(
            $issueOrder,
            'Issue Order Deleted',
            "تم حذف إذن الصرف {$issueOrder->issue_no}.",
            $request->user(),
        );

        $issueOrder->delete();

        return back()->with('success', 'Issue order deleted.');
    }

    private function validateIssueOrder(Request $request, ?IssueOrder $issueOrder = null): array
    {
        return $request->validate([
            'issue_no' => ['required', 'digits_between:1,100', Rule::unique('issue_orders', 'issue_no')->ignore($issueOrder)],
            'customer_id' => ['required', 'exists:customers,id'],
            'product_id' => ['required', 'exists:products,id'],
            'fabric_type' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit' => ['required', Rule::in(['kg', 'meter', 'piece', 'roll', 'carton'])],
            'issue_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
