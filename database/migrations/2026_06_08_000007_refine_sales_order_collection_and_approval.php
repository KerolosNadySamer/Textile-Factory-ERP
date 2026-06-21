<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE sales_orders MODIFY status VARCHAR(80) NOT NULL DEFAULT 'draft'");
        }

        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'down_payment_collected_amount')) {
                $table->decimal('down_payment_collected_amount', 14, 2)->default(0)->after('down_payment_amount');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_collected_by')) {
                $table->foreignId('down_payment_collected_by')->nullable()->after('down_payment_received_by')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_bank_name')) {
                $table->string('down_payment_bank_name')->nullable()->after('down_payment_check_number');
            }
        });

        Schema::table('customer_payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('customer_payments', 'bank_name')) {
                $table->string('bank_name')->nullable()->after('check_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_payments', function (Blueprint $table): void {
            if (Schema::hasColumn('customer_payments', 'bank_name')) {
                $table->dropColumn('bank_name');
            }
        });

        Schema::table('sales_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('sales_orders', 'down_payment_bank_name')) {
                $table->dropColumn('down_payment_bank_name');
            }

            if (Schema::hasColumn('sales_orders', 'down_payment_collected_by')) {
                $table->dropConstrainedForeignId('down_payment_collected_by');
            }

            if (Schema::hasColumn('sales_orders', 'down_payment_collected_amount')) {
                $table->dropColumn('down_payment_collected_amount');
            }
        });
    }
};
