<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $structure = [
        'management' => ['name' => 'المدير العام', 'type' => 'administrative', 'units' => []],
        'hr' => ['name' => 'الموارد البشرية', 'type' => 'administrative', 'units' => [
            'main' => ['name' => 'الموارد البشرية', 'positions' => ['مدير الموارد البشرية', 'مسؤول الموارد البشرية', 'أخصائي شؤون عاملين', 'أخصائي توظيف', 'سكرتارية']],
        ]],
        'finance' => ['name' => 'المالية', 'type' => 'administrative', 'units' => [
            'main' => ['name' => 'المالية', 'positions' => ['المدير المالي', 'نائب المدير المالي', 'محاسب', 'محاسب تكاليف', 'أمين خزينة', 'مدخل بيانات']],
        ]],
        'sales' => ['name' => 'المبيعات', 'type' => 'administrative', 'units' => [
            'main' => ['name' => 'المبيعات', 'positions' => ['مدير المبيعات', 'مسؤول المبيعات', 'مندوب مبيعات', 'سكرتارية']],
        ]],
        'purchasing' => ['name' => 'المشتريات', 'type' => 'service', 'units' => [
            'main' => ['name' => 'المشتريات', 'positions' => ['مدير المشتريات', 'مندوب مشتريات', 'مدخل بيانات', 'سكرتارية']],
        ]],
        'production_planning' => ['name' => 'الإنتاج والتخطيط', 'type' => 'productive', 'units' => [
            'weaving' => ['name' => 'النسيج', 'positions' => ['مدير النسيج (مهندس)', 'مساعد مدير النسيج (مهندس)', 'مهندس نسيج', 'فني نسيج', 'عامل نسيج', 'مدخل بيانات']],
            'dyeing' => ['name' => 'الصباغة', 'positions' => ['مدير الصباغة (مهندس)', 'مساعد مدير الصباغة (مهندس)', 'مهندس صباغة', 'فني صباغة', 'عامل صباغة', 'مدخل بيانات']],
            'finishing' => ['name' => 'التجهيز', 'positions' => ['مدير التجهيز (مهندس)', 'مساعد مدير التجهيز (مهندس)', 'مهندس تجهيز', 'فني تجهيز', 'عامل تجهيز', 'مدخل بيانات']],
            'quality' => ['name' => 'الجودة', 'positions' => ['مدير الجودة', 'مهندس جودة', 'مفتش جودة', 'فني جودة', 'مدخل بيانات']],
            'warehouse' => ['name' => 'المخازن', 'positions' => ['مدير المخازن', 'أمين مخزن الغزل', 'أمين مخزن الخام', 'أمين مخزن الكيماويات', 'أمين مخزن الإنتاج التام', 'أمين مخزن خدمات الصيانة', 'أمين مخزن خدمات النظافة', 'مدخل بيانات', 'عامل مخزن'], 'children' => [
                'yarn_store' => 'مخزن الغزل',
                'raw_store' => 'مخزن الخام',
                'chemical_store' => 'مخزن الكيماويات',
                'finished_goods_store' => 'مخزن الإنتاج التام',
                'maintenance_services_store' => 'مخزن خدمات الصيانة',
                'cleaning_services_store' => 'مخزن خدمات النظافة',
            ]],
            'maintenance' => ['name' => 'الصيانة', 'positions' => ['مدير الصيانة (مهندس صيانة)', 'مساعد مدير الصيانة (مهندس صيانة)', 'مهندس صيانة', 'فني كهرباء', 'فني ميكانيكا', 'فني إلكترونيات', 'عامل صيانة', 'مدخل بيانات']],
        ]],
        'it' => ['name' => 'تكنولوجيا المعلومات', 'type' => 'service', 'units' => [
            'main' => ['name' => 'تكنولوجيا المعلومات', 'positions' => ['مدير نظم المعلومات', 'مسؤول نظم', 'دعم فني', 'مبرمج']],
        ]],
    ];

    public function up(): void
    {
        Schema::create('department_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('department_units')->nullOnDelete();
            $table->string('name');
            $table->string('code');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['department_id', 'code']);
        });

        Schema::create('job_titles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->timestamps();
        });

        Schema::create('department_positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_unit_id')->nullable()->constrained('department_units')->nullOnDelete();
            $table->foreignId('job_title_id')->constrained()->cascadeOnDelete();
            $table->foreignId('position_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('approved_headcount')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['department_unit_id', 'job_title_id']);
        });

        $this->seedStructure();
    }

    public function down(): void
    {
        Schema::dropIfExists('department_positions');
        Schema::dropIfExists('job_titles');
        Schema::dropIfExists('department_units');
    }

    private function seedStructure(): void
    {
        $departmentSort = 1;

        foreach ($this->structure as $departmentCode => $department) {
            $departmentId = $this->department($departmentCode, $department['name'], $department['type']);
            $positionSort = 1;
            $unitSort = 1;

            foreach ($department['units'] as $unitCode => $unit) {
                $unitId = $this->unit($departmentId, $unitCode, $unit['name'], null, $unitSort++);

                foreach (($unit['children'] ?? []) as $childCode => $childName) {
                    $this->unit($departmentId, $childCode, $childName, $unitId, $unitSort++);
                }

                foreach ($unit['positions'] as $title) {
                    $jobTitleId = $this->jobTitle($title);
                    $positionId = $this->position($departmentId, $departmentCode, $title);
                    $approved = $this->defaultHeadcount($title);

                    DB::table('department_positions')->updateOrInsert(
                        ['department_unit_id' => $unitId, 'job_title_id' => $jobTitleId],
                        [
                            'department_id' => $departmentId,
                            'position_id' => $positionId,
                            'approved_headcount' => DB::table('positions')->where('id', $positionId)->value('required_headcount') ?? $approved,
                            'is_active' => true,
                            'sort_order' => $positionSort++,
                            'updated_at' => now(),
                            'created_at' => now(),
                        ],
                    );
                }
            }

            DB::table('departments')->where('id', $departmentId)->update([
                'required_headcount' => DB::table('positions')->where('department_id', $departmentId)->sum('required_headcount'),
                'updated_at' => now(),
            ]);

            $departmentSort++;
        }
    }

    private function department(string $code, string $name, string $type): int
    {
        DB::table('departments')->updateOrInsert(
            ['code' => $code],
            ['name' => $name, 'department_type' => $type, 'updated_at' => now(), 'created_at' => now()],
        );

        return (int) DB::table('departments')->where('code', $code)->value('id');
    }

    private function unit(int $departmentId, string $code, string $name, ?int $parentId, int $sort): int
    {
        DB::table('department_units')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => $code],
            ['name' => $name, 'parent_id' => $parentId, 'sort_order' => $sort, 'updated_at' => now(), 'created_at' => now()],
        );

        return (int) DB::table('department_units')->where('department_id', $departmentId)->where('code', $code)->value('id');
    }

    private function jobTitle(string $name): int
    {
        $code = Str::slug($name, '_') ?: 'job_'.substr(md5($name), 0, 10);

        DB::table('job_titles')->updateOrInsert(
            ['name' => $name],
            ['code' => $code, 'updated_at' => now(), 'created_at' => now()],
        );

        return (int) DB::table('job_titles')->where('name', $name)->value('id');
    }

    private function position(int $departmentId, string $departmentCode, string $name): int
    {
        $code = $departmentCode.'_'.(Str::slug($name, '_') ?: substr(md5($name), 0, 10));
        $approved = $this->defaultHeadcount($name);

        DB::table('positions')->updateOrInsert(
            ['department_id' => $departmentId, 'code' => $code],
            ['name' => $name, 'required_headcount' => $approved, 'updated_at' => now(), 'created_at' => now()],
        );

        return (int) DB::table('positions')->where('department_id', $departmentId)->where('code', $code)->value('id');
    }

    private function defaultHeadcount(string $title): int
    {
        return str_contains($title, 'مدير') || str_contains($title, 'نائب') ? 1 : 0;
    }
};
