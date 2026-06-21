<?php

use App\Models\Department;
use App\Models\Position;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $definitions = [
            'sales' => [
                ['code' => 'sales_manager', 'name' => 'مدير المبيعات'],
                ['code' => 'sales_rep', 'name' => 'مندوب مبيعات'],
                ['code' => 'sales_officer', 'name' => 'مسؤول مبيعات'],
            ],
            'planning' => [
                ['code' => 'planning_manager', 'name' => 'مديرة التخطيط'],
                ['code' => 'planning_officer', 'name' => 'موظف تخطيط'],
            ],
            'dyeing' => [
                ['code' => 'section_head', 'name' => 'رئيس قسم'],
                ['code' => 'assistant_section_head', 'name' => 'مساعد رئيس قسم'],
                ['code' => 'engineer', 'name' => 'مهندس'],
                ['code' => 'worker', 'name' => 'عامل'],
                ['code' => 'employee', 'name' => 'موظف'],
            ],
            'production' => [
                ['code' => 'section_head', 'name' => 'رئيس قسم'],
                ['code' => 'assistant_section_head', 'name' => 'مساعد رئيس قسم'],
                ['code' => 'engineer', 'name' => 'مهندس'],
                ['code' => 'worker', 'name' => 'عامل'],
                ['code' => 'employee', 'name' => 'موظف'],
            ],
            'warehouse' => [
                ['code' => 'storekeeper', 'name' => 'أمين مخزن'],
                ['code' => 'warehouse_worker', 'name' => 'عامل مخزن'],
            ],
        ];

        foreach ($definitions as $departmentCode => $positions) {
            $department = Department::where('code', $departmentCode)->first();

            if (! $department) {
                continue;
            }

            foreach ($positions as $position) {
                Position::updateOrCreate(
                    ['department_id' => $department->id, 'code' => $position['code']],
                    ['name' => $position['name']]
                );
            }

            $allowedCodes = collect($positions)->pluck('code')->all();
            $fallbackCode = $departmentCode === 'warehouse' ? 'storekeeper' : $allowedCodes[0];
            $fallback = Position::where('department_id', $department->id)->where('code', $fallbackCode)->first();

            Position::where('department_id', $department->id)
                ->whereNotIn('code', $allowedCodes)
                ->get()
                ->each(function (Position $position) use ($fallback): void {
                    if ($fallback && $position->users()->exists()) {
                        $position->users()->update(['position_id' => $fallback->id]);
                    }

                    $position->delete();
                });
        }
    }

    public function down(): void
    {
        // This migration normalizes operational job titles; keeping the new
        // structure on rollback avoids orphaning users from their positions.
    }
};
