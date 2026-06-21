<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('departments')
            ->orderBy('id')
            ->get(['id', 'required_headcount'])
            ->each(function ($department): void {
                $manager = DB::table('positions')
                    ->where('department_id', $department->id)
                    ->where(function ($query) {
                        $query
                            ->where('code', 'like', '%\_manager')
                            ->orWhere('name', 'like', '%مدير%');
                    })
                    ->orderBy('id')
                    ->first();

                if ($manager) {
                    DB::table('positions')
                        ->where('id', $manager->id)
                        ->update(['required_headcount' => 1, 'updated_at' => now()]);
                } else {
                    DB::table('positions')->insert([
                        'department_id' => $department->id,
                        'name' => 'مدير قسم',
                        'code' => 'department_manager',
                        'required_headcount' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $assigned = (int) DB::table('positions')
                    ->where('department_id', $department->id)
                    ->where('code', '!=', 'general_employee')
                    ->sum('required_headcount');
                $remaining = max(0, (int) ($department->required_headcount ?? 0) - $assigned);
                $general = DB::table('positions')
                    ->where('department_id', $department->id)
                    ->where('code', 'general_employee')
                    ->first();

                if ($remaining > 0) {
                    DB::table('positions')->updateOrInsert(
                        ['department_id' => $department->id, 'code' => 'general_employee'],
                        [
                            'name' => 'احتياج غير موزع',
                            'required_headcount' => $remaining,
                            'updated_at' => now(),
                            'created_at' => $general?->created_at ?? now(),
                        ],
                    );
                } elseif ($general) {
                    DB::table('positions')->where('id', $general->id)->delete();
                }
            });
    }

    public function down(): void
    {
        //
    }
};
