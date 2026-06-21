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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', [
                'yarn',
                'raw_fabric',
                'dyed_fabric',
                'chemical',
                'packing',
            ]);
            $table->enum('quality', [
                'premium',
                'first',
                'second',
            ])->nullable();
            $table->enum('unit', [
                'kg',
                'meter',
                'piece',
                'roll',
                'carton',
            ]);
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('weight', 8, 2)->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('tax', 5, 2)->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
