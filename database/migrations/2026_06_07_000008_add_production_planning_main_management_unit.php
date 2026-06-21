<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $departmentId = (int) DB::table('departments')->where('code', 'production_planning')->value('id');

        if (! $departmentId) {
            return;
        }

        DB::table('department_units')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => 'main'],
            [
                'name' => 'إدارة الإنتاج والتخطيط',
                'parent_id' => null,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $unitId = (int) DB::table('department_units')
            ->where('department_id', $departmentId)
            ->where('code', 'main')
            ->value('id');

        foreach (['مدير الإنتاج والتخطيط', 'مساعد مدير الإنتاج والتخطيط'] as $index => $positionName) {
            $jobTitleId = $this->jobTitle($positionName);
            $positionId = $this->position($departmentId, $positionName);

            DB::table('department_positions')->updateOrInsert(
                ['department_unit_id' => $unitId, 'job_title_id' => $jobTitleId],
                [
                    'department_id' => $departmentId,
                    'position_id' => $positionId,
                    'approved_headcount' => 1,
                    'is_active' => true,
                    'sort_order' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        DB::table('departments')->where('id', $departmentId)->update([
            'required_headcount' => DB::table('positions')->where('department_id', $departmentId)->sum('required_headcount'),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        //
    }

    private function jobTitle(string $name): int
    {
        $code = Str::slug($name, '_') ?: 'job_'.substr(md5($name), 0, 10);

        DB::table('job_titles')->updateOrInsert(
            ['name' => $name],
            ['code' => $code, 'created_at' => now(), 'updated_at' => now()],
        );

        return (int) DB::table('job_titles')->where('name', $name)->value('id');
    }

    private function position(int $departmentId, string $name): int
    {
        $code = 'production_planning_main_'.(Str::slug($name, '_') ?: substr(md5($name), 0, 10));

        DB::table('positions')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => $code],
            [
                'name' => $name,
                'required_headcount' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return (int) DB::table('positions')->where('department_id', $departmentId)->where('code', $code)->value('id');
    }
};
