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
        Schema::create('dye_samples', function (Blueprint $table) {
            $table->id();
            $table->string('sample_no')->unique();
            $table->string('issue_no');
            $table->foreignId('product_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('requested_color');
            $table->string('sample_color')->nullable();
            $table->text('recipe')->nullable();
            $table->text('dyeing_notes')->nullable();
            $table->enum('status', [
                'draft',
                'pending_planning',
                'pending_sales',
                'approved',
                'rejected',
            ])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('planning_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('planning_approved_at')->nullable();
            $table->foreignId('sales_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('sales_approved_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['issue_no', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dye_samples');
    }
};
