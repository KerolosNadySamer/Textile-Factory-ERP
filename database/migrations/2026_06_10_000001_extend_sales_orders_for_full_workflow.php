<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'invoice_number')) {
                $table->string('invoice_number')->nullable()->after('production_notes');
            }
            if (! Schema::hasColumn('sales_orders', 'invoice_status')) {
                $table->string('invoice_status')->default('not_invoiced')->after('invoice_number');
            }
            if (! Schema::hasColumn('sales_orders', 'invoiced_at')) {
                $table->timestamp('invoiced_at')->nullable()->after('invoice_status');
            }
            if (! Schema::hasColumn('sales_orders', 'shipping_number')) {
                $table->string('shipping_number')->nullable()->after('invoiced_at');
            }
            if (! Schema::hasColumn('sales_orders', 'shipping_status')) {
                $table->string('shipping_status')->default('not_ready')->after('shipping_number');
            }
            if (! Schema::hasColumn('sales_orders', 'shipping_company')) {
                $table->string('shipping_company')->nullable()->after('shipping_status');
            }
            if (! Schema::hasColumn('sales_orders', 'vehicle_number')) {
                $table->string('vehicle_number')->nullable()->after('shipping_company');
            }
            if (! Schema::hasColumn('sales_orders', 'driver_name')) {
                $table->string('driver_name')->nullable()->after('vehicle_number');
            }
            if (! Schema::hasColumn('sales_orders', 'shipped_quantity')) {
                $table->decimal('shipped_quantity', 12, 2)->nullable()->after('driver_name');
            }
            if (! Schema::hasColumn('sales_orders', 'rolls_count')) {
                $table->unsignedInteger('rolls_count')->nullable()->after('shipped_quantity');
            }
            if (! Schema::hasColumn('sales_orders', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('rolls_count');
            }
            if (! Schema::hasColumn('sales_orders', 'closed_at')) {
                $table->timestamp('closed_at')->nullable()->after('delivered_at');
            }
            if (! Schema::hasColumn('sales_orders', 'closed_by')) {
                $table->foreignId('closed_by')->nullable()->after('closed_at')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('sales_orders', 'closure_notes')) {
                $table->text('closure_notes')->nullable()->after('closed_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('sales_orders', 'closed_by')) {
                $table->dropForeign(['closed_by']);
            }

            foreach ([
                'closure_notes',
                'closed_by',
                'closed_at',
                'delivered_at',
                'rolls_count',
                'shipped_quantity',
                'driver_name',
                'vehicle_number',
                'shipping_company',
                'shipping_status',
                'shipping_number',
                'invoiced_at',
                'invoice_status',
                'invoice_number',
            ] as $column) {
                if (Schema::hasColumn('sales_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
