<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $departments = [
        ['code' => 'sales', 'name' => 'المبيعات', 'department_type' => 'administrative'],
        ['code' => 'purchasing', 'name' => 'المشتريات', 'department_type' => 'service'],
        ['code' => 'production', 'name' => 'الإنتاج', 'department_type' => 'productive'],
        ['code' => 'dyeing', 'name' => 'الصباغة', 'department_type' => 'productive'],
        ['code' => 'finishing', 'name' => 'التجهيز', 'department_type' => 'productive'],
        ['code' => 'laboratory', 'name' => 'المعمل', 'department_type' => 'service'],
        ['code' => 'quality', 'name' => 'الجودة', 'department_type' => 'service'],
        ['code' => 'warehouse', 'name' => 'المخازن', 'department_type' => 'service'],
        ['code' => 'maintenance', 'name' => 'الصيانة', 'department_type' => 'service'],
        ['code' => 'accounting', 'name' => 'الحسابات', 'department_type' => 'administrative'],
        ['code' => 'hr', 'name' => 'الموارد البشرية', 'department_type' => 'administrative'],
        ['code' => 'management', 'name' => 'الإدارة العامة', 'department_type' => 'administrative'],
    ];

    private array $positions = [
        'sales' => ['مدير مبيعات', 'مسؤول مبيعات', 'مندوب مبيعات', 'موظف مبيعات', 'سكرتارية مبيعات', 'عامل'],
        'purchasing' => ['مدير مشتريات', 'مسؤول مشتريات', 'موظف مشتريات', 'سكرتارية', 'عامل'],
        'production' => ['مدير إنتاج', 'مشرف إنتاج', 'مهندس إنتاج', 'مهندس مساعد', 'فني إنتاج', 'عامل إنتاج'],
        'dyeing' => ['مدير صباغة', 'مشرف صباغة', 'مهندس صباغة', 'مهندس مساعد', 'فني صباغة', 'عامل'],
        'finishing' => ['مدير تجهيز', 'مشرف تجهيز', 'مهندس تجهيز', 'فني تجهيز', 'عامل'],
        'maintenance' => ['مدير صيانة', 'مشرف صيانة', 'مهندس صيانة', 'فني صيانة', 'عامل'],
        'quality' => ['مدير جودة', 'مسؤول جودة', 'مفتش جودة', 'فني معمل'],
        'warehouse' => ['مدير مخازن', 'مسؤول مخازن', 'أمين مخزن', 'فني مخزن', 'عامل'],
        'accounting' => ['مدير مالي', 'رئيس حسابات', 'محاسب', 'محاسب تكاليف', 'سكرتارية'],
        'hr' => ['مدير موارد بشرية', 'مسؤول موارد بشرية', 'أخصائي موارد بشرية', 'موظف موارد بشرية'],
    ];

    public function up(): void
    {
        foreach ($this->departments as $department) {
            $existingHeadcount = DB::table('departments')
                ->where('code', $department['code'])
                ->value('required_headcount');

            DB::table('departments')->updateOrInsert(
                ['code' => $department['code']],
                [
                    'name' => $department['name'],
                    'department_type' => $department['department_type'],
                    'required_headcount' => $existingHeadcount ?? 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $departmentIds = DB::table('departments')->pluck('id', 'code');

        foreach ($this->positions as $departmentCode => $positions) {
            foreach ($positions as $name) {
                DB::table('positions')->updateOrInsert(
                    [
                        'department_id' => $departmentIds[$departmentCode],
                        'code' => $this->positionCode($departmentCode, $name),
                    ],
                    [
                        'name' => $name,
                        'required_headcount' => str_starts_with($this->positionCode($departmentCode, $name), $departmentCode.'_manager') || str_contains($name, 'مدير') ? 1 : 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }
        }
    }

    public function down(): void
    {
        //
    }

    private function positionCode(string $departmentCode, string $name): string
    {
        $known = [
            'مدير مبيعات' => 'sales_manager',
            'مسؤول مبيعات' => 'sales_officer',
            'مندوب مبيعات' => 'sales_rep',
            'موظف مبيعات' => 'sales_employee',
            'سكرتارية مبيعات' => 'sales_secretary',
            'مدير مشتريات' => 'purchasing_manager',
            'مسؤول مشتريات' => 'purchasing_officer',
            'موظف مشتريات' => 'purchasing_employee',
            'مدير إنتاج' => 'production_manager',
            'مشرف إنتاج' => 'production_supervisor',
            'مهندس إنتاج' => 'production_engineer',
            'فني إنتاج' => 'production_technician',
            'عامل إنتاج' => 'production_worker',
            'مدير صباغة' => 'dyeing_manager',
            'مشرف صباغة' => 'dyeing_supervisor',
            'مهندس صباغة' => 'dyeing_engineer',
            'فني صباغة' => 'dyeing_technician',
            'مدير تجهيز' => 'finishing_manager',
            'مشرف تجهيز' => 'finishing_supervisor',
            'مهندس تجهيز' => 'finishing_engineer',
            'فني تجهيز' => 'finishing_technician',
            'مدير صيانة' => 'maintenance_manager',
            'مشرف صيانة' => 'maintenance_supervisor',
            'مهندس صيانة' => 'maintenance_engineer',
            'فني صيانة' => 'maintenance_technician',
            'مدير جودة' => 'quality_manager',
            'مسؤول جودة' => 'quality_officer',
            'مفتش جودة' => 'quality_inspector',
            'فني معمل' => 'lab_technician',
            'مدير مخازن' => 'warehouse_manager',
            'مسؤول مخازن' => 'warehouse_officer',
            'أمين مخزن' => 'storekeeper',
            'فني مخزن' => 'warehouse_technician',
            'مدير مالي' => 'finance_manager',
            'رئيس حسابات' => 'chief_accountant',
            'محاسب' => 'accountant',
            'محاسب تكاليف' => 'cost_accountant',
            'مدير موارد بشرية' => 'hr_manager',
            'مسؤول موارد بشرية' => 'hr_officer',
            'أخصائي موارد بشرية' => 'hr_specialist',
            'موظف موارد بشرية' => 'hr_employee',
            'سكرتارية' => 'secretary',
            'عامل' => 'worker',
            'مهندس مساعد' => 'assistant_engineer',
        ];

        return $known[$name] ?? $departmentCode.'_position';
    }
};
