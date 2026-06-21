<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\IssueOrder;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\SalesOrder;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));

        if (mb_strlen($term) < 2) {
            return response()->json([]);
        }

        $like = "%{$term}%";
        $results = collect();

        Customer::query()
            ->where(fn ($query) => $query->where('code', 'like', $like)->orWhere('name', 'like', $like)->orWhere('name_ar', 'like', $like)->orWhere('mobile', 'like', $like))
            ->limit(5)
            ->get(['id', 'code', 'name', 'name_ar'])
            ->each(fn ($item) => $results->push($this->result('Customer', $item->code, $item->name_ar ?? $item->name, route('master-data.customers', ['focus' => $item->id]))));

        Supplier::query()
            ->where(fn ($query) => $query->where('code', 'like', $like)->orWhere('name', 'like', $like)->orWhere('mobile', 'like', $like))
            ->limit(5)
            ->get(['id', 'code', 'name'])
            ->each(fn ($item) => $results->push($this->result('Supplier', $item->code, $item->name, route('purchasing.index', ['supplier' => $item->id]))));

        Product::query()
            ->where(fn ($query) => $query->where('code', 'like', $like)->orWhere('name', 'like', $like))
            ->limit(5)
            ->get(['id', 'code', 'name'])
            ->each(fn ($item) => $results->push($this->result('Product', $item->code, $item->name, route('products.index', ['focus' => $item->id]))));

        Lot::query()
            ->where(fn ($query) => $query->where('lot_number', 'like', $like)->orWhere('supplier', 'like', $like)->orWhere('purchase_order', 'like', $like))
            ->limit(5)
            ->get(['id', 'lot_number', 'lot_type', 'supplier'])
            ->each(fn ($item) => $results->push($this->result('Lot', $item->lot_number, $item->supplier ?? $item->lot_type, route('lots.index', ['search' => $item->lot_number]))));

        SalesOrder::query()
            ->with('customer:id,code,name,name_ar,name_en')
            ->where(function ($query) use ($like): void {
                $query->where('so_number', 'like', $like)
                    ->orWhereHas('customer', fn ($customer) => $customer
                        ->where('code', 'like', $like)
                        ->orWhere('name', 'like', $like)
                        ->orWhere('name_ar', 'like', $like)
                        ->orWhere('name_en', 'like', $like));
            })
            ->limit(5)
            ->get(['id', 'customer_id', 'so_number', 'status'])
            ->each(fn ($item) => $results->push($this->result('Customer Order', $item->so_number, $item->customer?->name_ar ?? $item->customer?->name ?? $item->status, route('sales-orders.index', ['search' => $item->so_number]))));

        ProductionOrder::query()
            ->where('production_number', 'like', $like)
            ->limit(5)
            ->get(['id', 'production_number', 'status'])
            ->each(fn ($item) => $results->push($this->result('Production Order', $item->production_number, $item->status, route('production-orders.index', ['search' => $item->production_number]))));

        IssueOrder::query()
            ->where(fn ($query) => $query->where('issue_no', 'like', $like)->orWhere('lot_no', 'like', $like)->orWhere('color', 'like', $like))
            ->limit(5)
            ->get(['id', 'issue_no', 'lot_no'])
            ->each(fn ($item) => $results->push($this->result('Issue Order', $item->issue_no, $item->lot_no, route('issue-orders.index', ['search' => $item->issue_no]))));

        return response()->json($results->take(20)->values());
    }

    private function result(string $type, string $number, ?string $title, string $url): array
    {
        return compact('type', 'number', 'title', 'url');
    }
}
