<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_monthly_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('review_month');
            $table->decimal('salary_snapshot', 12, 2)->nullable();
            $table->unsignedTinyInteger('evaluation_score')->nullable();
            $table->string('rating')->nullable();
            $table->text('notes')->nullable();
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('visible_to_employee')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'review_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_monthly_reviews');
    }
};
