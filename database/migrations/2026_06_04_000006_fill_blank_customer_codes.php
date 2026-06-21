<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $maxCode = DB::table('customers')
            ->pluck('code')
            ->filter(fn ($code) => is_string($code) && ctype_digit($code))
            ->map(fn ($code) => (int) $code)
            ->max() ?? 0;

        $nextNumber = max(
            $maxCode + 1,
            (int) (DB::table('number_sequences')->where('key', 'customers')->value('next_number') ?? 1)
        );

        DB::table('customers')
            ->whereNull('code')
            ->orWhere('code', '')
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($customer) use (&$nextNumber): void {
                $code = str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT);

                DB::table('customers')->where('id', $customer->id)->update([
                    'code' => $code,
                    'barcode' => $code,
                    'internal_sequence' => $nextNumber,
                    'updated_at' => now(),
                ]);

                $nextNumber++;
            });

        DB::table('number_sequences')
            ->where('key', 'customers')
            ->update(['next_number' => $nextNumber, 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Customer codes are preserved intentionally.
    }
};
