<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_manager', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'manager_id']);
        });

        $now = now();

        DB::table('users')
            ->whereNotNull('manager_id')
            ->orderBy('id')
            ->get(['id', 'manager_id'])
            ->each(function ($user) use ($now): void {
                DB::table('employee_manager')->updateOrInsert(
                    ['user_id' => $user->id, 'manager_id' => $user->manager_id],
                    ['created_at' => $now, 'updated_at' => $now]
                );
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_manager');
    }
};
