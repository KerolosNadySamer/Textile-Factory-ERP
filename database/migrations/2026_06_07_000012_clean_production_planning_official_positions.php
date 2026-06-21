<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $productionPlanning = [
        'name' => 'الإنتاج والتخطيط',
        'type' => 'productive',
        'positions' => ['مدير الإنتاج والتخطيط', 'مساعد مدير الإنتاج والتخطيط'],
        'units' => [
            'weaving' => [
                'name' => 'النسيج',
                'positions' => ['مدير النسيج (مهندس)', 'مساعد مدير النسيج (مهندس)', 'مهندس نسيج', 'فني نسيج', 'عامل نسيج', 'مدخل بيانات'],
            ],
            'dyeing' => [
                'name' => 'الصباغة',
                'positions' => ['مدير الصباغة (مهندس)', 'مساعد مدير الصباغة (مهندس)', 'مهندس صباغة', 'فني صباغة', 'عامل صباغة', 'مدخل بيانات'],
            ],
            'finishing' => [
                'name' => 'التجهيز',
                'positions' => ['مدير التجهيز (مهندس)', 'مساعد مدير التجهيز (مهندس)', 'مهندس تجهيز', 'فني تجهيز', 'عامل تجهيز', 'مدخل بيانات'],
            ],
            'quality' => [
                'name' => 'الجودة',
                'positions' => ['مدير الجودة', 'مهندس جودة', 'مفتش جودة', 'فني جودة', 'مدخل بيانات'],
            ],
            'maintenance' => [
                'name' => 'الصيانة',
                'positions' => ['مدير الصيانة (مهندس صيانة)', 'مساعد مدير الصيانة (مهندس صيانة)', 'مهندس صيانة', 'فني كهرباء', 'فني ميكانيكا', 'فني إلكترونيات', 'عامل صيانة', 'مدخل بيانات'],
            ],
            'warehouse' => [
                'name' => 'إدارة المخازن',
                'children' => [
                    'yarn_store' => 'مخزن الغزل',
                    'raw_store' => 'مخزن الخام',
                    'chemical_store' => 'مخزن الكيماويات',
                    'finished_goods_store' => 'مخزن الإنتاج التام',
                    'maintenance_services_store' => 'مخزن خدمات الصيانة',
                    'cleaning_services_store' => 'مخزن خدمات النظافة',
                ],
                'positions' => ['مدير المخازن', 'أمين مخزن الغزل', 'أمين مخزن الخام', 'أمين مخزن الكيماويات', 'أمين مخزن الإنتاج التام', 'أمين مخزن خدمات الصيانة', 'أمين مخزن خدمات النظافة', 'مدخل بيانات', 'عامل مخزن'],
            ],
        ],
    ];

    public function up(): void
    {
        $departmentId = $this->department('production_planning', $this->productionPlanning['name'], $this->productionPlanning['type']);

        DB::table('department_positions')
            ->where('department_id', $departmentId)
            ->update(['is_active' => false, 'updated_at' => now()]);

        DB::table('department_units')
            ->where('department_id', $departmentId)
            ->where('code', 'main')
            ->delete();

        foreach (['production', 'planning', 'it'] as $pausedCode) {
            $pausedDepartmentId = DB::table('departments')->where('code', $pausedCode)->value('id');

            if ($pausedDepartmentId) {
                DB::table('department_positions')
                    ->where('department_id', $pausedDepartmentId)
                    ->update(['is_active' => false, 'updated_at' => now()]);
            }
        }

        $sort = 1;

        foreach ($this->productionPlanning['positions'] as $positionName) {
            $this->departmentPosition($departmentId, null, 'leadership', $positionName, $sort++);
        }

        $unitSort = 1;

        foreach ($this->productionPlanning['units'] as $unitCode => $unit) {
            $unitId = $this->unit($departmentId, $unitCode, $unit['name'], null, $unitSort++);

            foreach (($unit['children'] ?? []) as $childCode => $childName) {
                $this->unit($departmentId, $childCode, $childName, $unitId, $unitSort++);
            }

            foreach ($unit['positions'] as $positionName) {
                $this->departmentPosition($departmentId, $unitId, $unitCode, $positionName, $sort++);
            }
        }
    }

    public function down(): void
    {
        //
    }

    private function department(string $code, string $name, string $type): int
    {
        DB::table('departments')->updateOrInsert(
            ['code' => $code],
            ['name' => $name, 'department_type' => $type, 'created_at' => now(), 'updated_at' => now()],
        );

        return (int) DB::table('departments')->where('code', $code)->value('id');
    }

    private function unit(int $departmentId, string $code, string $name, ?int $parentId, int $sort): int
    {
        DB::table('department_units')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => $code],
            ['name' => $name, 'parent_id' => $parentId, 'sort_order' => $sort, 'created_at' => now(), 'updated_at' => now()],
        );

        return (int) DB::table('department_units')->where('department_id', $departmentId)->where('code', $code)->value('id');
    }

    private function departmentPosition(int $departmentId, ?int $unitId, string $unitCode, string $positionName, int $sort): void
    {
        $jobTitleId = $this->jobTitle($positionName);
        $positionId = $this->position($departmentId, $unitCode, $positionName);
        $approvedHeadcount = (int) DB::table('department_positions')
            ->where('department_id', $departmentId)
            ->where('position_id', $positionId)
            ->value('approved_headcount');

        DB::table('department_positions')->updateOrInsert(
            ['department_unit_id' => $unitId, 'job_title_id' => $jobTitleId],
            [
                'department_id' => $departmentId,
                'position_id' => $positionId,
                'approved_headcount' => $approvedHeadcount > 0 ? $approvedHeadcount : $this->defaultHeadcount($positionName),
                'is_active' => true,
                'sort_order' => $sort,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    private function jobTitle(string $name): int
    {
        DB::table('job_titles')->updateOrInsert(
            ['name' => $name],
            ['code' => Str::slug($name, '_') ?: 'job_'.substr(md5($name), 0, 10), 'created_at' => now(), 'updated_at' => now()],
        );

        return (int) DB::table('job_titles')->where('name', $name)->value('id');
    }

    private function position(int $departmentId, string $unitCode, string $name): int
    {
        $code = 'production_planning_'.$unitCode.'_'.(Str::slug($name, '_') ?: substr(md5($name), 0, 10));
        $currentHeadcount = DB::table('positions')
            ->where('department_id', $departmentId)
            ->where('name', $name)
            ->value('required_headcount');

        DB::table('positions')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => $code],
            [
                'name' => $name,
                'required_headcount' => $currentHeadcount ?? $this->defaultHeadcount($name),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return (int) DB::table('positions')->where('department_id', $departmentId)->where('code', $code)->value('id');
    }

    private function defaultHeadcount(string $name): int
    {
        return str_contains($name, 'مدير') || str_contains($name, 'رئيس') ? 1 : 0;
    }
};
