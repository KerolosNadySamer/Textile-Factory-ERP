<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'customer_credit_used')) {
                $table->decimal('customer_credit_used', 14, 2)->default(0)->after('down_payment_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('sales_orders', 'customer_credit_used')) {
                $table->dropColumn('customer_credit_used');
            }
        });
    }
};
