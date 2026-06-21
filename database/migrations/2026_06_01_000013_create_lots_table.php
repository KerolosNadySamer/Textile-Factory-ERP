<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lots', function (Blueprint $table) {
            $table->id();
            $table->string('lot_number')->unique();
            $table->enum('lot_type', ['yarn', 'raw_fabric', 'dyed_fabric']);
            $table->foreignId('source_issue_order_id')->nullable()->constrained('issue_orders')->nullOnDelete();
            $table->foreignId('production_order_id')->nullable()->constrained('production_orders')->nullOnDelete();
            $table->foreignId('parent_lot_id')->nullable()->constrained('lots')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('color')->nullable();
            $table->string('unit')->default('kg');
            $table->decimal('quantity', 12, 2)->default(0);
            $table->date('lot_date')->nullable();
            $table->string('status')->default('active');
            $table->unsignedInteger('drop_number')->nullable();
            $table->unsignedInteger('finish_year')->nullable();
            $table->unsignedBigInteger('approved_sample_id')->nullable();
            $table->string('supplier')->nullable();
            $table->string('purchase_order')->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->decimal('received_quantity', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lot_type', 'status']);
            $table->index(['source_issue_order_id', 'production_order_id']);
            $table->index(['parent_lot_id', 'lot_type']);
        });

        Schema::create('lot_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained('lots')->cascadeOnDelete();
            $table->string('sample_number');
            $table->string('color')->nullable();
            $table->text('recipe')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('approved')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['lot_id', 'sample_number']);
        });

        Schema::table('lots', function (Blueprint $table) {
            $table->foreign('approved_sample_id')->references('id')->on('lot_samples')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lots', function (Blueprint $table) {
            $table->dropForeign(['approved_sample_id']);
        });

        Schema::dropIfExists('lot_samples');
        Schema::dropIfExists('lots');
    }
};
