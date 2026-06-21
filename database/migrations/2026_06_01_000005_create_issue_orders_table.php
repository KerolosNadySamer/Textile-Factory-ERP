<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('issue_orders', function (Blueprint $table) {
            $table->id();
            $table->string('issue_no')->unique();
            $table->string('lot_no')->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('fabric_type');
            $table->string('color');
            $table->decimal('quantity', 12, 2);
            $table->string('unit')->default('meter');
            $table->date('issue_date');
            $table->text('notes')->nullable();
            $table->boolean('stock_deducted')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['issue_date', 'customer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issue_orders');
    }
};
