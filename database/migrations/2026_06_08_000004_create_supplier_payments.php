<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('supplier_payments')) {
            Schema::create('supplier_payments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('supplier_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
                $table->foreignId('purchase_order_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();
                $table->string('payment_number')->unique();
                $table->decimal('amount', 14, 2);
                $table->string('method');
                $table->string('status')->default('paid');
                $table->date('payment_date');
                $table->string('check_number')->nullable();
                $table->date('check_due_date')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['supplier_id', 'payment_date']);
                $table->index(['purchase_order_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_payments');
    }
};
