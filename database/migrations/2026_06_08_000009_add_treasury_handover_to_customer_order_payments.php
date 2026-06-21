<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'down_payment_treasury_received_by')) {
                $table->foreignId('down_payment_treasury_received_by')
                    ->nullable()
                    ->after('down_payment_collected_by')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_treasury_received_at')) {
                $table->timestamp('down_payment_treasury_received_at')->nullable()->after('down_payment_received_at');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_treasury_notes')) {
                $table->text('down_payment_treasury_notes')->nullable()->after('down_payment_collection_notes');
            }
        });

        Schema::table('customer_payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('customer_payments', 'treasury_received_by')) {
                $table->foreignId('treasury_received_by')
                    ->nullable()
                    ->after('received_by')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('customer_payments', 'treasury_received_at')) {
                $table->timestamp('treasury_received_at')->nullable()->after('received_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_payments', function (Blueprint $table): void {
            if (Schema::hasColumn('customer_payments', 'treasury_received_by')) {
                $table->dropConstrainedForeignId('treasury_received_by');
            }

            if (Schema::hasColumn('customer_payments', 'treasury_received_at')) {
                $table->dropColumn('treasury_received_at');
            }
        });

        Schema::table('sales_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('sales_orders', 'down_payment_treasury_received_by')) {
                $table->dropConstrainedForeignId('down_payment_treasury_received_by');
            }

            if (Schema::hasColumn('sales_orders', 'down_payment_treasury_received_at')) {
                $table->dropColumn('down_payment_treasury_received_at');
            }

            if (Schema::hasColumn('sales_orders', 'down_payment_treasury_notes')) {
                $table->dropColumn('down_payment_treasury_notes');
            }
        });
    }
};
