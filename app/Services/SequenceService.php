<?php

namespace App\Services;

use App\Models\NumberSequence;
use Illuminate\Support\Facades\DB;

class SequenceService
{
    public function next(string $key): array
    {
        return DB::transaction(function () use ($key): array {
            $sequence = NumberSequence::query()
                ->where('key', $key)
                ->lockForUpdate()
                ->firstOrFail();

            $year = now()->year;

            if ($sequence->yearly && $sequence->current_year !== $year) {
                $sequence->next_number = 1;
                $sequence->current_year = $year;
            }

            $number = $sequence->next_number;
            $formatted = str_pad((string) $number, $sequence->padding, '0', STR_PAD_LEFT);

            while ($this->codeExists($key, $formatted)) {
                $number++;
                $formatted = str_pad((string) $number, $sequence->padding, '0', STR_PAD_LEFT);
            }

            $sequence->next_number = $number + 1;
            $sequence->save();

            return [
                'number' => $number,
                'code' => $formatted,
            ];
        });
    }

    private function codeExists(string $key, string $code): bool
    {
        return match ($key) {
            'employees' => DB::table('users')->where('employee_code', $code)->exists(),
            'customers' => DB::table('customers')->where('code', $code)->exists(),
            'suppliers' => DB::table('suppliers')->where('code', $code)->exists(),
            default => false,
        };
    }
}
