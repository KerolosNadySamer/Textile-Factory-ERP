<?php

namespace App\Console\Commands;

use App\Models\ActivityTimeline;
use App\Models\CostEntry;
use App\Models\CostSummary;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Department;
use App\Models\InventoryLedgerEntry;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\ProductionOrderItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SystemBackup;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class SeedOperationalFlowDemo extends Command
{
    protected $signature = 'demo:seed-operational-flow';

    protected $description = 'Create a backup, then seed demo customers, sales orders, production flow, inventory, payments, and delivery.';

    public function handle(): int
    {
        $admin = User::query()
            ->whereHas('role', fn ($role) => $role->where('slug', 'admin'))
            ->orderBy('id')
            ->first();

        if (! $admin) {
            $this->error('No admin account was found. Demo data was not created.');

            return self::FAILURE;
        }

        $backupPath = $this->createBackup($admin);
        $runCode = Carbon::now()->format('YmdHis');

        DB::transaction(function () use ($admin, $runCode): void {
            $products = $this->products();
            $customers = $this->customers($admin);
            $departments = $this->departments();

            $this->createClosedOrder($runCode, $admin, $customers[0], $products[0], $departments);
            $this->createDeliveredOrder($runCode, $admin, $customers[1], $products[1], $departments);
            $this->createInProductionOrder($runCode, $admin, $customers[2], $products[2], $departments);
        });

        $this->info('Operational demo flow created.');
        $this->line("Backup: {$backupPath}");
        $this->line("Demo run code: {$runCode}");

        return self::SUCCESS;
    }

    private function createBackup(User $admin): string
    {
        $tables = collect(DB::select('SHOW TABLES'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->reject(fn ($table) => in_array($table, ['migrations', 'system_backups'], true))
            ->values();

        $payload = [
            'created_at' => Carbon::now()->toIso8601String(),
            'database' => config('database.connections.'.config('database.default').'.database'),
            'reason' => 'Before operational flow demo seed',
            'tables' => $tables
                ->mapWithKeys(fn ($table) => [$table => DB::table($table)->get()->map(fn ($row) => (array) $row)->all()])
                ->all(),
        ];

        $fileName = 'before-operational-flow-demo-'.now()->format('Ymd-His').'.json';
        $path = 'backups/'.$fileName;

        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if (Schema::hasTable('system_backups')) {
            SystemBackup::create([
                'file_name' => $fileName,
                'disk_path' => $path,
                'file_size' => Storage::disk('local')->size($path),
                'created_by' => $admin->id,
            ]);
        }

        return $path;
    }

    private function products(): array
    {
        return [
            Product::updateOrCreate(
                ['code' => 'DEMO-FAB-001'],
                [
                    'name' => 'قماش قطني مصبوغ تجريبي',
                    'type' => 'dyed_fabric',
                    'quality' => 'first',
                    'unit' => 'meter',
                    'width' => 160,
                    'weight' => 180,
                    'price' => 125,
                    'tax' => 14,
                    'active' => true,
                ]
            ),
            Product::updateOrCreate(
                ['code' => 'DEMO-FAB-002'],
                [
                    'name' => 'قماش بوليستر مصبوغ تجريبي',
                    'type' => 'dyed_fabric',
                    'quality' => 'premium',
                    'unit' => 'meter',
                    'width' => 150,
                    'weight' => 155,
                    'price' => 110,
                    'tax' => 14,
                    'active' => true,
                ]
            ),
            Product::updateOrCreate(
                ['code' => 'DEMO-FAB-003'],
                [
                    'name' => 'قماش خام للتشغيل التجريبي',
                    'type' => 'raw_fabric',
                    'quality' => 'first',
                    'unit' => 'meter',
                    'width' => 170,
                    'weight' => 200,
                    'price' => 95,
                    'tax' => 14,
                    'active' => true,
                ]
            ),
        ];
    }

    private function customers(User $admin): array
    {
        $rows = [
            ['code' => 'DEMO-CUST-001', 'name' => 'عميل تجريبي - تسليم كامل', 'email' => 'customer1@example.invalid', 'tier' => 'gold'],
            ['code' => 'DEMO-CUST-002', 'name' => 'عميل تجريبي - تم التسليم', 'email' => 'customer2@example.invalid', 'tier' => 'silver'],
            ['code' => 'DEMO-CUST-003', 'name' => 'عميل تجريبي - تحت التشغيل', 'email' => 'customer3@example.invalid', 'tier' => 'bronze'],
        ];

        return collect($rows)
            ->map(fn ($row) => Customer::updateOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'name_ar' => $row['name'],
                    'name_en' => str_replace('عميل تجريبي - ', 'Demo Customer - ', $row['name']),
                    'mobile' => '01000000000',
                    'phone' => '0200000000',
                    'email' => $row['email'],
                    'national_id' => '2990101010'.substr($row['code'], -2),
                    'credit_limit' => $row['tier'] === 'gold' ? 250000 : ($row['tier'] === 'silver' ? 125000 : 50000),
                    'wallet_balance' => 0,
                    'payment_terms' => 'تشغيل تجريبي',
                    'city' => 'القاهرة',
                    'address' => 'عنوان تجريبي لعرض التقارير',
                    'status' => 'active',
                    'data_status' => 'approved',
                    'verification_tier' => $row['tier'],
                    'data_reviewed_by' => $admin->id,
                    'data_reviewed_at' => now(),
                    'sales_officer_approved_by' => $admin->id,
                    'sales_officer_approved_at' => now(),
                    'sales_manager_approved_by' => $admin->id,
                    'sales_manager_approved_at' => now(),
                    'notes' => 'بيانات تشغيل تجريبي للتقارير.',
                    'active' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ]
            ))
            ->all();
    }

    private function departments(): array
    {
        return [
            'warehouse' => Department::query()->where('code', 'warehouse')->value('id'),
            'planning' => Department::query()->whereIn('code', ['production_planning', 'planning'])->value('id'),
            'production' => Department::query()->where('code', 'production')->value('id'),
            'dyeing' => Department::query()->where('code', 'dyeing')->value('id'),
            'sales' => Department::query()->where('code', 'sales')->value('id'),
        ];
    }

    private function createClosedOrder(string $runCode, User $admin, Customer $customer, Product $product, array $departments): void
    {
        $order = $this->createSalesOrder($runCode, '001', $admin, $customer, $product, 1200, 'كحلي', 'closed', [
            'invoice_status' => 'invoiced',
            'shipping_status' => 'delivered',
            'closed_at' => now(),
            'closed_by' => $admin->id,
            'closure_notes' => 'تم التسليم والإغلاق في التشغيل التجريبي.',
        ]);

        $productionOrder = $this->createProductionOrder($runCode, '001', $admin, $order, 'closed');
        $this->createProductionFlow($runCode, '001', $admin, $order, $productionOrder, $product, 1200, 'كحلي', $departments, true);
        $this->createPayment($runCode, '001', $admin, $order, (float) $order->order_total, 'bank_transfer', 'received');
        $this->recordTimeline($order, 'Demo Order Closed', 'طلب تجريبي مكتمل من أمر البيع حتى التسليم والإغلاق.', $admin, $departments['sales'] ?? null);
    }

    private function createDeliveredOrder(string $runCode, User $admin, Customer $customer, Product $product, array $departments): void
    {
        $order = $this->createSalesOrder($runCode, '002', $admin, $customer, $product, 850, 'رمادي', 'delivered', [
            'invoice_status' => 'invoiced',
            'shipping_status' => 'delivered',
        ]);

        $productionOrder = $this->createProductionOrder($runCode, '002', $admin, $order, 'closed');
        $this->createProductionFlow($runCode, '002', $admin, $order, $productionOrder, $product, 850, 'رمادي', $departments, true);
        $this->createPayment($runCode, '002', $admin, $order, round((float) $order->order_total * 0.6, 2), 'vodafone_cash', 'received');
        $this->recordTimeline($order, 'Demo Order Delivered', 'طلب تجريبي تم تسليمه للعميل ومتبقي رصيد في كشف الحساب.', $admin, $departments['sales'] ?? null);
    }

    private function createInProductionOrder(string $runCode, User $admin, Customer $customer, Product $product, array $departments): void
    {
        $order = $this->createSalesOrder($runCode, '003', $admin, $customer, $product, 650, 'أبيض خام', 'in_production', [
            'invoice_status' => 'not_invoiced',
            'shipping_status' => 'not_ready',
        ]);

        $productionOrder = $this->createProductionOrder($runCode, '003', $admin, $order, 'in_production');
        $this->createProductionFlow($runCode, '003', $admin, $order, $productionOrder, $product, 650, 'أبيض خام', $departments, false);
        $this->createPayment($runCode, '003', $admin, $order, round((float) $order->order_total * 0.25, 2), 'orange_cash', 'received');
        $this->recordTimeline($order, 'Demo Order In Production', 'طلب تجريبي ما زال تحت التشغيل لمتابعة تقارير الإنتاج.', $admin, $departments['planning'] ?? null);
    }

    private function createSalesOrder(string $runCode, string $serial, User $admin, Customer $customer, Product $product, float $quantity, string $color, string $status, array $extra): SalesOrder
    {
        $orderTotal = round($quantity * (float) $product->price, 2);
        $now = now();

        $order = SalesOrder::create(array_merge([
            'so_number' => "DEMO-SO-{$runCode}-{$serial}",
            'customer_id' => $customer->id,
            'order_date' => $now->copy()->subDays(12 - (int) $serial),
            'required_delivery_date' => $now->copy()->addDays(7 + (int) $serial),
            'status' => $status,
            'source' => 'internal',
            'customer_visible_at' => $status === 'in_production' ? null : $now,
            'sample_required' => false,
            'priority' => $serial === '003' ? 'urgent' : 'normal',
            'order_total' => $orderTotal,
            'down_payment_amount' => round($orderTotal * 0.25, 2),
            'down_payment_collected_amount' => round($orderTotal * 0.25, 2),
            'down_payment_method' => 'bank_transfer',
            'down_payment_status' => 'received',
            'down_payment_received_by' => $admin->id,
            'down_payment_collected_by' => $admin->id,
            'down_payment_treasury_received_by' => $admin->id,
            'down_payment_received_at' => $now,
            'down_payment_treasury_received_at' => $now,
            'notes' => 'طلب تشغيل تجريبي لعرض التقارير.',
            'production_notes' => 'تشغيل تجريبي: نسج ثم صباغة ثم تجهيز وتسليم.',
            'invoice_number' => in_array($status, ['delivered', 'closed'], true) ? "DEMO-INV-{$runCode}-{$serial}" : null,
            'invoiced_at' => in_array($status, ['delivered', 'closed'], true) ? $now : null,
            'shipping_number' => in_array($status, ['delivered', 'closed'], true) ? "DEMO-SHIP-{$runCode}-{$serial}" : null,
            'shipping_company' => in_array($status, ['delivered', 'closed'], true) ? 'سيارة الشركة' : null,
            'vehicle_number' => in_array($status, ['delivered', 'closed'], true) ? 'تجريبي 1234' : null,
            'driver_name' => in_array($status, ['delivered', 'closed'], true) ? 'سائق تجريبي' : null,
            'shipped_quantity' => in_array($status, ['delivered', 'closed'], true) ? $quantity : 0,
            'rolls_count' => in_array($status, ['delivered', 'closed'], true) ? max(1, (int) ceil($quantity / 100)) : 0,
            'delivered_at' => in_array($status, ['delivered', 'closed'], true) ? $now : null,
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'reviewed_at' => $now,
            'approved_by' => $admin->id,
            'approved_at' => $now,
        ], $extra));

        SalesOrderItem::create([
            'sales_order_id' => $order->id,
            'product_id' => $product->id,
            'color' => $color,
            'quality' => $product->quality,
            'width' => $product->width,
            'weight' => $product->weight,
            'quantity' => $quantity,
            'unit_price' => $product->price,
            'total_price' => $orderTotal,
        ]);

        return $order;
    }

    private function createProductionOrder(string $runCode, string $serial, User $admin, SalesOrder $order, string $status): ProductionOrder
    {
        $item = $order->items()->first();
        $now = now();

        $productionOrder = ProductionOrder::create([
            'production_number' => "DEMO-PO-{$runCode}-{$serial}",
            'sales_order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'planned_quantity' => $item->quantity,
            'start_date' => $now->copy()->subDays(8 - (int) $serial),
            'due_date' => $now->copy()->addDays(4 + (int) $serial),
            'status' => $status,
            'lot_generation_method' => 'single_lot',
            'notes' => 'أمر إنتاج تجريبي مرتبط بطلبية عميل.',
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
            'released_by' => $admin->id,
            'released_at' => $status === 'draft' ? null : $now,
            'closed_by' => $status === 'closed' ? $admin->id : null,
            'closed_at' => $status === 'closed' ? $now : null,
        ]);

        ProductionOrderItem::create([
            'production_order_id' => $productionOrder->id,
            'sales_order_item_id' => $item->id,
            'product_id' => $item->product_id,
            'color' => $item->color,
            'quality' => $item->quality,
            'width' => $item->width,
            'weight' => $item->weight,
            'quantity' => $item->quantity,
        ]);

        return $productionOrder;
    }

    private function createProductionFlow(string $runCode, string $serial, User $admin, SalesOrder $order, ProductionOrder $productionOrder, Product $product, float $quantity, string $color, array $departments, bool $delivered): void
    {
        $rawLot = $this->createLot($runCode, $serial, 'RAW', $admin, $productionOrder, $product, 'raw_fabric', $quantity, 'أبيض خام');
        $dyedLot = $this->createLot($runCode, $serial, 'DYED', $admin, $productionOrder, $product, 'dyed_fabric', $quantity * 0.97, $color, $rawLot->id);

        $this->ledger($rawLot, $product, $quantity, 0, $quantity, "DEMO-GRN-{$runCode}-{$serial}", 'goods_receipt', $departments['warehouse'] ?? null, $admin, 55, 'استلام خام للتشغيل التجريبي.');
        $this->ledger($rawLot, $product, 0, $quantity, 0, "DEMO-ISS-{$runCode}-{$serial}", 'production_issue', $departments['production'] ?? $departments['planning'] ?? null, $admin, 55, 'صرف الخام للإنتاج.');
        $this->ledger($dyedLot, $product, $quantity * 0.97, 0, $quantity * 0.97, "DEMO-FG-{$runCode}-{$serial}", 'finished_goods_receipt', $departments['warehouse'] ?? null, $admin, 78, 'استلام القماش المصبوغ من الإنتاج.');

        if ($delivered) {
            $this->ledger($dyedLot, $product, 0, $quantity * 0.97, 0, $order->shipping_number, 'customer_delivery', $departments['sales'] ?? null, $admin, 78, 'تسليم للعميل.');
            $dyedLot->update(['status' => 'closed']);
        }

        $rawLot->update(['status' => 'closed']);
        $this->costs($rawLot, $admin, $departments);
        $this->costs($dyedLot, $admin, $departments);
    }

    private function createLot(string $runCode, string $serial, string $stage, User $admin, ProductionOrder $productionOrder, Product $product, string $type, float $quantity, string $color, ?int $parentLotId = null): Lot
    {
        return Lot::create([
            'lot_number' => "DEMO-LOT-{$runCode}-{$serial}-{$stage}",
            'lot_type' => $type,
            'production_order_id' => $productionOrder->id,
            'parent_lot_id' => $parentLotId,
            'product_id' => $product->id,
            'color' => $color,
            'unit' => $product->unit,
            'quantity' => round($quantity, 2),
            'lot_date' => now(),
            'status' => 'open',
            'drop_number' => $type === 'dyed_fabric' ? (int) $serial : null,
            'finish_year' => $type === 'dyed_fabric' ? (int) now()->format('Y') : null,
            'notes' => 'لوط تجريبي لدورة الطلب حتى الاستلام.',
            'created_by' => $admin->id,
        ]);
    }

    private function ledger(Lot $lot, Product $product, float $inQty, float $outQty, float $balance, string $documentNumber, string $documentType, ?int $departmentId, User $admin, float $unitCost, string $notes): void
    {
        InventoryLedgerEntry::create([
            'entry_date' => now(),
            'document_type' => $documentType,
            'document_number' => $documentNumber,
            'lot_id' => $lot->id,
            'product_id' => $product->id,
            'in_qty' => round($inQty, 2),
            'out_qty' => round($outQty, 2),
            'balance' => round($balance, 2),
            'unit_cost' => $unitCost,
            'total_cost' => round(max($inQty, $outQty) * $unitCost, 2),
            'department_id' => $departmentId,
            'user_id' => $admin->id,
            'notes' => $notes,
        ]);
    }

    private function costs(Lot $lot, User $admin, array $departments): void
    {
        $entries = [
            ['material', 'خامات مباشرة', 18000, $departments['warehouse'] ?? null],
            ['production', 'تكلفة تشغيل وإنتاج', 7200, $departments['production'] ?? $departments['planning'] ?? null],
            ['dyeing', 'تكلفة صباغة وتجهيز', 5100, $departments['dyeing'] ?? null],
            ['overhead', 'مصروفات غير مباشرة', 2600, $departments['planning'] ?? null],
        ];

        foreach ($entries as [$type, $description, $amount, $departmentId]) {
            CostEntry::create([
                'lot_id' => $lot->id,
                'cost_type' => $type,
                'description' => $description,
                'amount' => $amount,
                'department_id' => $departmentId,
                'created_by' => $admin->id,
            ]);
        }

        $total = collect($entries)->sum(fn ($entry) => $entry[2]);
        $quantity = max((float) $lot->quantity, 0.0001);

        CostSummary::create([
            'lot_id' => $lot->id,
            'material_cost' => 18000,
            'production_cost' => 7200,
            'dyeing_cost' => 5100,
            'overhead_cost' => 2600,
            'total_cost' => $total,
            'unit_cost' => round($total / $quantity, 4),
            'status' => 'reviewed',
            'calculated_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);
    }

    private function createPayment(string $runCode, string $serial, User $admin, SalesOrder $order, float $amount, string $method, string $status): void
    {
        CustomerPayment::create([
            'customer_id' => $order->customer_id,
            'sales_order_id' => $order->id,
            'payment_number' => "DEMO-PAY-{$runCode}-{$serial}",
            'transaction_type' => 'payment',
            'amount' => $amount,
            'method' => $method,
            'reference_number' => "REF-{$runCode}-{$serial}",
            'status' => $status,
            'payment_date' => now(),
            'notes' => 'دفعة تجريبية مرتبطة بطلبية العميل.',
            'created_by' => $admin->id,
            'received_by' => $admin->id,
            'treasury_received_by' => $admin->id,
            'received_at' => now(),
            'treasury_received_at' => now(),
        ]);
    }

    private function recordTimeline(object $subject, string $event, string $description, User $admin, ?int $departmentId): void
    {
        ActivityTimeline::create([
            'model_type' => $subject::class,
            'model_id' => $subject->id,
            'event' => $event,
            'description' => $description,
            'user_id' => $admin->id,
            'department_id' => $departmentId,
        ]);
    }
}
