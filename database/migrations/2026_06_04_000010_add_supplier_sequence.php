<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $maxCode = DB::table('suppliers')
            ->pluck('code')
            ->filter(fn ($code) => is_string($code) && ctype_digit($code))
            ->map(fn ($code) => (int) $code)
            ->max() ?? 0;

        $nextSupplier = $maxCode + 1;

        DB::table('number_sequences')->updateOrInsert(
            ['key' => 'suppliers'],
            [
                'prefix' => 'SUP',
                'next_number' => max($nextSupplier, 1),
                'padding' => 6,
                'yearly' => false,
                'current_year' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('number_sequences')->where('key', 'suppliers')->delete();
    }
};
