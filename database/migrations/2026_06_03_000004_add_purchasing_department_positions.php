<?php

use App\Models\Department;
use App\Models\Position;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $department = Department::updateOrCreate(
            ['code' => 'purchasing'],
            ['name' => 'المشتريات']
        );

        foreach ([
            ['code' => 'purchasing_manager', 'name' => 'مدير مشتريات'],
            ['code' => 'purchasing_officer', 'name' => 'مسؤول مشتريات'],
            ['code' => 'purchasing_rep', 'name' => 'مندوب مشتريات'],
        ] as $position) {
            Position::updateOrCreate(
                ['department_id' => $department->id, 'code' => $position['code']],
                ['name' => $position['name']]
            );
        }
    }

    public function down(): void
    {
        $department = Department::where('code', 'purchasing')->first();

        if (! $department) {
            return;
        }

        Position::where('department_id', $department->id)
            ->whereIn('code', ['purchasing_manager', 'purchasing_officer', 'purchasing_rep'])
            ->delete();
    }
};
