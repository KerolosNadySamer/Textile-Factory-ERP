<?php

namespace App\Services;

use App\Models\SalesOrder;

class SalesOrderWorkflowService
{
    public const STEPS = [
        'sales_approval',
        'planning',
        'materials',
        'weaving',
        'dyeing',
        'quality',
        'finished_goods',
        'invoice',
        'delivery',
        'closed',
    ];

    public function snapshot(SalesOrder $salesOrder): array
    {
        $salesOrder->loadMissing([
            'items',
            'productionOrders',
            'customerPayments',
            'approvedDyeSample',
        ]);

        $productionOrder = $salesOrder->productionOrders->sortByDesc('id')->first();
        $productionStatus = $productionOrder?->status;

        $completed = [
            'sales_approval' => in_array($salesOrder->status, ['approved', 'in_production', 'completed', 'delivered', 'closed'], true),
            'planning' => $productionOrder !== null,
            'materials' => in_array($productionStatus, ['released', 'in_production', 'finished', 'closed'], true),
            'weaving' => in_array($productionStatus, ['in_production', 'finished', 'closed'], true),
            'dyeing' => ! $this->needsDyeing($salesOrder) || $salesOrder->approved_dye_sample_id !== null,
            'quality' => in_array($productionStatus, ['finished', 'closed'], true),
            'finished_goods' => in_array($salesOrder->status, ['completed', 'delivered', 'closed'], true),
            'invoice' => $salesOrder->invoice_status === 'invoiced',
            'delivery' => $salesOrder->shipping_status === 'delivered' || in_array($salesOrder->status, ['delivered', 'closed'], true),
            'closed' => $salesOrder->status === 'closed',
        ];

        $current = collect(self::STEPS)->first(fn (string $step) => ! $completed[$step]) ?? 'closed';

        return [
            'current_step' => $current,
            'completed' => $completed,
            'production_status' => $productionStatus,
            'needs_dyeing' => $this->needsDyeing($salesOrder),
            'ready_for_invoice' => $this->readyForInvoice($salesOrder),
            'ready_for_delivery' => $this->readyForDelivery($salesOrder),
            'ready_for_close' => $this->readyForClose($salesOrder),
        ];
    }

    public function readyForInvoice(SalesOrder $salesOrder): bool
    {
        return in_array($salesOrder->status, ['completed', 'delivered'], true)
            && $salesOrder->invoice_status !== 'invoiced';
    }

    public function readyForDelivery(SalesOrder $salesOrder): bool
    {
        return $salesOrder->invoice_status === 'invoiced'
            && in_array($salesOrder->status, ['completed', 'delivered'], true)
            && $salesOrder->shipping_status !== 'delivered';
    }

    public function readyForClose(SalesOrder $salesOrder): bool
    {
        return $salesOrder->invoice_status === 'invoiced'
            && ($salesOrder->shipping_status === 'delivered' || $salesOrder->status === 'delivered')
            && $salesOrder->status !== 'closed';
    }

    public function assertCanInvoice(SalesOrder $salesOrder): void
    {
        abort_unless($this->readyForInvoice($salesOrder), 422, 'Order must be completed by production and quality before invoicing.');
    }

    public function assertCanPrepareDelivery(SalesOrder $salesOrder): void
    {
        abort_unless($salesOrder->invoice_status === 'invoiced', 422, 'Invoice must be created before shipping.');
        abort_unless(in_array($salesOrder->status, ['completed', 'delivered'], true), 422, 'Order must be completed before shipping.');
    }

    public function assertCanDeliver(SalesOrder $salesOrder): void
    {
        abort_unless($salesOrder->shipping_status === 'ready', 422, 'Shipping order must be prepared before delivery.');
    }

    public function assertCanClose(SalesOrder $salesOrder): void
    {
        abort_unless($this->readyForClose($salesOrder), 422, 'Order must be invoiced and delivered before closing.');
    }

    private function needsDyeing(SalesOrder $salesOrder): bool
    {
        return $salesOrder->items->contains(function ($item): bool {
            $color = trim((string) $item->color);

            return $color !== '' && ! in_array(strtolower($color), ['raw', 'grey', 'gray', 'خام'], true);
        });
    }
}
