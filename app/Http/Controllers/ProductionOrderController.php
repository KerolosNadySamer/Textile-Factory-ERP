<?php

namespace App\Http\Controllers;

use App\Models\ProductionOrder;
use App\Models\SalesOrder;
use App\Services\NotificationService;
use App\Services\TimelineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductionOrderController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly TimelineService $timeline,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('ProductionOrders/Index', [
            'productionOrders' => ProductionOrder::query()
                ->with([
                    'salesOrder:id,so_number,status',
                    'customer:id,code,name,name_ar',
                    'items.product:id,code,name,unit',
                    'creator:id,name',
                    'releaser:id,name',
                    'closer:id,name',
                    'timeline' => fn ($query) => $query->with(['user:id,name', 'department:id,name,code'])->oldest(),
                ])
                ->latest()
                ->get(),
            'approvedSalesOrders' => SalesOrder::query()
                ->with(['customer:id,code,name,name_ar', 'items.product:id,code,name,unit'])
                ->where('status', 'approved')
                ->doesntHave('productionOrders')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sales_order_id' => ['required', 'exists:sales_orders,id'],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'lot_generation_method' => ['required', Rule::in(['single_lot', 'per_item', 'manual'])],
            'notes' => ['nullable', 'string'],
        ]);

        $salesOrder = SalesOrder::query()
            ->with('items')
            ->where('status', 'approved')
            ->findOrFail($data['sales_order_id']);

        abort_if($salesOrder->productionOrders()->exists(), 422, 'Production order already exists for this sales order.');

        DB::transaction(function () use ($request, $salesOrder, $data): void {
            $plannedQuantity = (float) $salesOrder->items->sum('quantity');
            $productionOrder = ProductionOrder::create([
                'production_number' => $this->nextProductionNumber(),
                'sales_order_id' => $salesOrder->id,
                'customer_id' => $salesOrder->customer_id,
                'planned_quantity' => $plannedQuantity,
                'start_date' => $data['start_date'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'lot_generation_method' => $data['lot_generation_method'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);

            foreach ($salesOrder->items as $item) {
                $productionOrder->items()->create([
                    'sales_order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'color' => $item->color,
                    'quality' => $item->quality,
                    'width' => $item->width,
                    'weight' => $item->weight,
                    'quantity' => $item->quantity,
                ]);
            }

            $salesOrder->update(['status' => 'in_production', 'updated_by' => $request->user()->id]);

            $this->timeline->record($productionOrder, 'Production Order Created', "تم إنشاء أمر الإنتاج {$productionOrder->production_number} من طلب البيع {$salesOrder->so_number}.", $request->user());
            $this->timeline->record($salesOrder, 'Production Order Created', "تم إنشاء أمر الإنتاج {$productionOrder->production_number}.", $request->user());

            $this->notifications->sendToRoles(['production'], "تم إنشاء أمر إنتاج {$productionOrder->production_number}", 'أمر إنتاج جديد من التخطيط يحتاج متابعة الإنتاج.', route('production-orders.index'), $request->user());
        });

        return back()->with('success', 'Production order created.');
    }

    public function updateStatus(Request $request, ProductionOrder $productionOrder): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['planned', 'released', 'in_production', 'finished', 'closed', 'cancelled'])],
        ]);

        $this->authorizeStatusMove($request, $productionOrder, $data['status']);

        $now = Carbon::now();
        $updates = ['status' => $data['status'], 'updated_by' => $request->user()->id];

        if ($data['status'] === 'released') {
            $updates += ['released_by' => $request->user()->id, 'released_at' => $now];
        }

        if ($data['status'] === 'closed') {
            $updates += ['closed_by' => $request->user()->id, 'closed_at' => $now];
        }

        DB::transaction(function () use ($request, $productionOrder, $updates, $data): void {
            $productionOrder->update($updates);

            if ($data['status'] === 'closed') {
                $productionOrder->salesOrder?->update([
                    'status' => 'completed',
                    'updated_by' => $request->user()->id,
                ]);

                if ($productionOrder->salesOrder) {
                    $this->timeline->record(
                        $productionOrder->salesOrder,
                        'Ready For Invoice',
                        "Production order {$productionOrder->production_number} was closed. Sales order {$productionOrder->salesOrder->so_number} is ready for invoicing.",
                        $request->user(),
                    );
                }
            }
        });

        $this->timeline->record(
            $productionOrder,
            $this->timelineEventForStatus($data['status']),
            $this->timelineDescriptionForStatus($productionOrder, $data['status']),
            $request->user(),
        );

        if ($data['status'] === 'released') {
            $this->notifications->sendToRoles(['warehouse', 'production'], "تم Release لأمر إنتاج {$productionOrder->production_number}", 'أمر الإنتاج جاهز للتشغيل ويحتاج متابعة المخزن والإنتاج.', route('production-orders.index'), $request->user());
        }

        if ($data['status'] === 'finished') {
            $this->notifications->sendToRoles(['quality', 'sales'], "تم إنهاء إنتاج {$productionOrder->production_number}", 'أمر الإنتاج انتهى ويحتاج متابعة الجودة والمبيعات.', route('production-orders.index'), $request->user());
        }

        return back()->with('success', 'Production order status updated.');
    }

    private function authorizeStatusMove(Request $request, ProductionOrder $productionOrder, string $status): void
    {
        $allowed = match ($status) {
            'planned' => $productionOrder->status === 'draft' && $request->user()->hasPermission('plan_production_order'),
            'released' => $productionOrder->status === 'planned' && $request->user()->hasPermission('release_production_order'),
            'in_production' => $productionOrder->status === 'released' && $request->user()->hasPermission('run_production_order'),
            'finished' => $productionOrder->status === 'in_production' && $request->user()->hasPermission('run_production_order'),
            'closed' => $productionOrder->status === 'finished' && $request->user()->hasPermission('close_production_order'),
            'cancelled' => in_array($productionOrder->status, ['draft', 'planned'], true) && $request->user()->hasPermission('plan_production_order'),
            default => false,
        };

        abort_unless($allowed, 403);
    }

    private function nextProductionNumber(): string
    {
        return str_pad((string) (((int) ProductionOrder::max('id')) + 1), 6, '0', STR_PAD_LEFT);
    }

    private function timelineEventForStatus(string $status): string
    {
        return match ($status) {
            'planned' => 'Planning Approved',
            'released' => 'Released To Production',
            'in_production' => 'Production Started',
            'finished' => 'Production Finished',
            'closed' => 'Production Closed',
            'cancelled' => 'Production Cancelled',
            default => 'Status Updated',
        };
    }

    private function timelineDescriptionForStatus(ProductionOrder $productionOrder, string $status): string
    {
        return match ($status) {
            'planned' => "تمت مراجعة التخطيط لأمر الإنتاج {$productionOrder->production_number}.",
            'released' => "تم السماح بتشغيل أمر الإنتاج {$productionOrder->production_number}.",
            'in_production' => "بدأ تنفيذ أمر الإنتاج {$productionOrder->production_number}.",
            'finished' => "انتهى إنتاج أمر الإنتاج {$productionOrder->production_number}.",
            'closed' => "تم إغلاق أمر الإنتاج {$productionOrder->production_number}.",
            'cancelled' => "تم إلغاء أمر الإنتاج {$productionOrder->production_number}.",
            default => "تم تحديث حالة أمر الإنتاج {$productionOrder->production_number}.",
        };
    }
}
