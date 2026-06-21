<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceipt;
use App\Models\IssueOrder;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use Illuminate\View\View;

class PrintController extends Controller
{
    public function purchaseOrder(PurchaseOrder $purchaseOrder): View
    {
        return $this->document('Purchase Order', $purchaseOrder->po_number, [
            'Supplier' => $purchaseOrder->supplier?->name,
            'Order Date' => $purchaseOrder->order_date?->format('Y-m-d'),
            'Status' => $purchaseOrder->status,
            'Subtotal' => $purchaseOrder->subtotal,
        ], $purchaseOrder->load(['supplier', 'items.product'])->items->map(fn ($item) => [
            $item->product?->code.' - '.$item->product?->name,
            $item->qty,
            $item->unit,
            $item->unit_price,
            $item->total,
        ]), ['Product', 'Qty', 'Unit', 'Price', 'Total']);
    }

    public function goodsReceipt(GoodsReceipt $goodsReceipt): View
    {
        return $this->document('Goods Receipt', $goodsReceipt->grn_number, [
            'Supplier' => $goodsReceipt->supplier?->name,
            'Receipt Date' => $goodsReceipt->receipt_date?->format('Y-m-d'),
            'Status' => $goodsReceipt->status,
        ], $goodsReceipt->load(['supplier', 'items.product'])->items->map(fn ($item) => [
            $item->product?->code.' - '.$item->product?->name,
            $item->lot_number,
            $item->received_qty,
            $item->unit,
            $item->unit_price,
        ]), ['Product', 'Lot', 'Qty', 'Unit', 'Price']);
    }

    public function salesOrder(SalesOrder $salesOrder): View
    {
        return $this->document('Sales Order', $salesOrder->so_number, [
            'Customer' => $salesOrder->customer?->name_ar ?? $salesOrder->customer?->name,
            'Order Date' => $salesOrder->order_date?->format('Y-m-d'),
            'Status' => $salesOrder->status,
        ], $salesOrder->load(['customer', 'items.product'])->items->map(fn ($item) => [
            $item->product?->code.' - '.$item->product?->name,
            $item->color,
            $item->quantity,
            $item->unit_price,
            $item->total_price,
        ]), ['Product', 'Color', 'Qty', 'Price', 'Total']);
    }

    public function productionOrder(ProductionOrder $productionOrder): View
    {
        return $this->document('Production Order', $productionOrder->production_number, [
            'Sales Order' => $productionOrder->salesOrder?->so_number,
            'Customer' => $productionOrder->customer?->name_ar ?? $productionOrder->customer?->name,
            'Status' => $productionOrder->status,
        ], $productionOrder->load(['salesOrder', 'customer', 'items.product'])->items->map(fn ($item) => [
            $item->product?->code.' - '.$item->product?->name,
            $item->color,
            $item->quantity,
            $item->unit,
        ]), ['Product', 'Color', 'Qty', 'Unit']);
    }

    public function issueOrder(IssueOrder $issueOrder): View
    {
        return $this->document('Issue Order', $issueOrder->issue_no, [
            'Lot No' => $issueOrder->lot_no,
            'Customer' => $issueOrder->customer?->name_ar ?? $issueOrder->customer?->name,
            'Issue Date' => $issueOrder->issue_date?->format('Y-m-d'),
        ], collect([[
            $issueOrder->product?->code.' - '.$issueOrder->product?->name,
            $issueOrder->fabric_type,
            $issueOrder->color,
            $issueOrder->quantity,
            $issueOrder->unit,
        ]]), ['Product', 'Fabric', 'Color', 'Qty', 'Unit']);
    }

    public function lotReport(Lot $lot): View
    {
        return $this->document('Lot Report', $lot->display_number, [
            'Type' => $lot->lot_type,
            'Product' => $lot->product?->code.' - '.$lot->product?->name,
            'Status' => $lot->status,
            'Supplier' => $lot->supplier,
        ], $lot->load(['product', 'ledgerEntries'])->ledgerEntries->map(fn ($entry) => [
            $entry->entry_date?->format('Y-m-d'),
            $entry->document_type,
            $entry->document_number,
            $entry->in_qty,
            $entry->out_qty,
            $entry->balance,
        ]), ['Date', 'Type', 'Document', 'In', 'Out', 'Balance']);
    }

    public function priceList(): View
    {
        return $this->document('Price List', 'PRICE-LIST', [
            'Printed Products' => Product::query()->count(),
        ], Product::query()->orderBy('code')->get()->map(fn ($product) => [
            $product->code,
            $product->name,
            $product->type,
            $product->unit,
            $product->price,
        ]), ['Code', 'Product', 'Type', 'Unit', 'Price']);
    }

    private function document(string $title, string $number, array $summary, $rows, array $headings): View
    {
        return view('print.document', compact('title', 'number', 'summary', 'rows', 'headings'));
    }
}
