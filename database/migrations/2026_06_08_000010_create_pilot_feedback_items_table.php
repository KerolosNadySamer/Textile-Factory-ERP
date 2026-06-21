<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pilot_feedback_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('page')->nullable();
            $table->string('type')->default('problem');
            $table->string('finding_category')->default('bugs');
            $table->string('priority')->default('medium');
            $table->string('status')->default('new');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->string('ai_owner_suggestion')->nullable();
            $table->string('ai_risk_suggestion')->nullable();
            $table->text('ai_resolution_suggestion')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'priority']);
            $table->index(['finding_category', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pilot_feedback_items');
    }
};
