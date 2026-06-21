<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'order_total')) {
                $table->decimal('order_total', 14, 2)->default(0)->after('priority');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_amount')) {
                $table->decimal('down_payment_amount', 14, 2)->default(0)->after('order_total');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_method')) {
                $table->string('down_payment_method')->nullable()->after('down_payment_amount');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_status')) {
                $table->string('down_payment_status')->default('pending_accounting')->after('down_payment_method');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_received_by')) {
                $table->foreignId('down_payment_received_by')->nullable()->after('down_payment_status')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_received_at')) {
                $table->timestamp('down_payment_received_at')->nullable()->after('down_payment_received_by');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_check_number')) {
                $table->string('down_payment_check_number')->nullable()->after('down_payment_received_at');
            }

            if (! Schema::hasColumn('sales_orders', 'down_payment_check_due_date')) {
                $table->date('down_payment_check_due_date')->nullable()->after('down_payment_check_number');
            }
        });

        if (! Schema::hasTable('customer_payments')) {
            Schema::create('customer_payments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('customer_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
                $table->foreignId('sales_order_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();
                $table->string('payment_number')->unique();
                $table->string('transaction_type')->default('payment');
                $table->decimal('amount', 14, 2);
                $table->string('method');
                $table->string('status')->default('pending_accounting');
                $table->date('payment_date')->nullable();
                $table->string('check_number')->nullable();
                $table->date('check_due_date')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('received_at')->nullable();
                $table->timestamps();

                $table->index(['customer_id', 'status']);
                $table->index(['sales_order_id', 'transaction_type']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_payments');

        Schema::table('sales_orders', function (Blueprint $table): void {
            foreach ([
                'down_payment_check_due_date',
                'down_payment_check_number',
                'down_payment_received_at',
                'down_payment_received_by',
                'down_payment_status',
                'down_payment_method',
                'down_payment_amount',
                'order_total',
            ] as $column) {
                if (Schema::hasColumn('sales_orders', $column)) {
                    if ($column === 'down_payment_received_by') {
                        $table->dropConstrainedForeignId($column);
                    } else {
                        $table->dropColumn($column);
                    }
                }
            }
        });
    }
};
