<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'down_payment_collection_notes')) {
                $table->text('down_payment_collection_notes')->nullable()->after('down_payment_collected_by');
            }

            if (! Schema::hasColumn('sales_orders', 'production_notes')) {
                $table->text('production_notes')->nullable()->after('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('sales_orders', 'production_notes')) {
                $table->dropColumn('production_notes');
            }

            if (Schema::hasColumn('sales_orders', 'down_payment_collection_notes')) {
                $table->dropColumn('down_payment_collection_notes');
            }
        });
    }
};
