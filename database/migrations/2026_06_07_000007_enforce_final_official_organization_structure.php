<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $structure = [
        'hr' => ['name' => 'الموارد البشرية', 'type' => 'administrative', 'units' => [
            'main' => ['name' => 'الموارد البشرية', 'positions' => ['مدير الموارد البشرية', 'مسؤول الموارد البشرية', 'أخصائي شؤون عاملين', 'أخصائي توظيف', 'سكرتارية']],
        ]],
        'finance' => ['name' => 'الإدارة المالية', 'type' => 'administrative', 'units' => [
            'main' => ['name' => 'الإدارة المالية', 'positions' => ['المدير المالي', 'رئيس الحسابات', 'محاسب', 'محاسب تكاليف', 'أمين خزينة', 'مدخل بيانات']],
        ]],
        'sales' => ['name' => 'المبيعات', 'type' => 'administrative', 'units' => [
            'main' => ['name' => 'المبيعات', 'positions' => ['مدير المبيعات', 'مسؤول المبيعات', 'مندوب مبيعات', 'سكرتارية مبيعات']],
        ]],
        'purchasing' => ['name' => 'المشتريات', 'type' => 'service', 'units' => [
            'main' => ['name' => 'المشتريات', 'positions' => ['مدير المشتريات', 'مندوب مشتريات', 'مدخل بيانات', 'سكرتارية']],
        ]],
        'production_planning' => ['name' => 'الإنتاج والتخطيط', 'type' => 'productive', 'units' => [
            'main' => ['name' => 'إدارة الإنتاج والتخطيط', 'positions' => ['مدير الإنتاج والتخطيط', 'مساعد مدير الإنتاج والتخطيط']],
            'weaving' => ['name' => 'النسيج', 'positions' => ['مدير النسيج (مهندس)', 'مساعد مدير النسيج (مهندس)', 'مهندس نسيج', 'فني نسيج', 'عامل نسيج', 'مدخل بيانات']],
            'dyeing' => ['name' => 'الصباغة', 'positions' => ['مدير الصباغة (مهندس)', 'مساعد مدير الصباغة (مهندس)', 'مهندس صباغة', 'فني صباغة', 'عامل صباغة', 'مدخل بيانات']],
            'finishing' => ['name' => 'التجهيز', 'positions' => ['مدير التجهيز (مهندس)', 'مساعد مدير التجهيز (مهندس)', 'مهندس تجهيز', 'فني تجهيز', 'عامل تجهيز', 'مدخل بيانات']],
            'quality' => ['name' => 'الجودة', 'positions' => ['مدير الجودة', 'مهندس جودة', 'مفتش جودة', 'فني معمل', 'مدخل بيانات']],
            'maintenance' => ['name' => 'الصيانة', 'positions' => ['مدير الصيانة', 'مساعد مدير الصيانة', 'مهندس صيانة', 'فني كهرباء', 'فني ميكانيكا', 'فني إلكترونيات', 'عامل صيانة', 'مدخل بيانات']],
            'warehouse' => ['name' => 'إدارة المخازن', 'positions' => ['مدير مخازن', 'أمين مخزن الغزل', 'أمين مخزن الخام', 'أمين مخزن الكيماويات', 'أمين مخزن الإنتاج التام', 'أمين مخزن خدمات الصيانة', 'أمين مخزن خدمات النظافة', 'مدخل بيانات', 'عامل مخزن'], 'children' => [
                'yarn_store' => 'مخزن الغزل',
                'raw_store' => 'مخزن الخام',
                'chemical_store' => 'مخزن الكيماويات',
                'finished_goods_store' => 'مخزن الإنتاج التام',
                'maintenance_services_store' => 'مخزن خدمات الصيانة',
                'cleaning_services_store' => 'مخزن خدمات النظافة',
            ]],
        ]],
        'it' => ['name' => 'تكنولوجيا المعلومات', 'type' => 'service', 'units' => [
            'main' => ['name' => 'تكنولوجيا المعلومات', 'positions' => ['مدير نظم المعلومات', 'مسؤول نظم', 'دعم فني', 'مبرمج']],
        ]],
    ];

    public function up(): void
    {
        if (DB::getSchemaBuilder()->hasTable('department_positions')) {
            DB::table('department_positions')->update(['is_active' => false, 'updated_at' => now()]);
        }

        foreach ($this->structure as $departmentCode => $department) {
            $departmentId = $this->department($departmentCode, $department['name'], $department['type']);
            $unitSort = 1;
            $positionSort = 1;

            foreach ($department['units'] as $unitCode => $unit) {
                $unitId = $this->unit($departmentId, $unitCode, $unit['name'], null, $unitSort++);

                foreach (($unit['children'] ?? []) as $childCode => $childName) {
                    $this->unit($departmentId, $childCode, $childName, $unitId, $unitSort++);
                }

                foreach ($unit['positions'] as $positionName) {
                    $jobTitleId = $this->jobTitle($positionName);
                    $positionId = $this->position($departmentId, $departmentCode, $unitCode, $positionName);
                    $currentHeadcount = (int) DB::table('department_positions')
                        ->where('position_id', $positionId)
                        ->value('approved_headcount');

                    DB::table('department_positions')->updateOrInsert(
                        ['department_unit_id' => $unitId, 'job_title_id' => $jobTitleId],
                        [
                            'department_id' => $departmentId,
                            'position_id' => $positionId,
                            'approved_headcount' => $currentHeadcount > 0 ? $currentHeadcount : $this->defaultHeadcount($positionName),
                            'is_active' => true,
                            'sort_order' => $positionSort++,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ],
                    );
                }
            }

            DB::table('departments')->where('id', $departmentId)->update([
                'required_headcount' => DB::table('positions')->where('department_id', $departmentId)->sum('required_headcount'),
                'updated_at' => now(),
            ]);
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

    private function jobTitle(string $name): int
    {
        $code = Str::slug($name, '_') ?: 'job_'.substr(md5($name), 0, 10);

        DB::table('job_titles')->updateOrInsert(
            ['name' => $name],
            ['code' => $code, 'created_at' => now(), 'updated_at' => now()],
        );

        return (int) DB::table('job_titles')->where('name', $name)->value('id');
    }

    private function position(int $departmentId, string $departmentCode, string $unitCode, string $name): int
    {
        $code = $departmentCode.'_'.$unitCode.'_'.(Str::slug($name, '_') ?: substr(md5($name), 0, 10));
        $existingHeadcount = DB::table('positions')
            ->where('department_id', $departmentId)
            ->where('name', $name)
            ->value('required_headcount');

        DB::table('positions')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => $code],
            [
                'name' => $name,
                'required_headcount' => $existingHeadcount ?? $this->defaultHeadcount($name),
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
