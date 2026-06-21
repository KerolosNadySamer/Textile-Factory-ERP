<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $positionMap = [
        'مدير حسابات' => 'المدير المالي',
        'مدير مالي' => 'المدير المالي',
        'رئيس حسابات' => 'رئيس الحسابات',
        'محاسب' => 'محاسب',
        'محاسب تكاليف' => 'محاسب تكاليف',
        'أمين خزينة' => 'أمين خزينة',
        'سكرتارية' => 'مدخل بيانات',
    ];

    private array $officialFinancePositions = [
        'المدير المالي',
        'رئيس الحسابات',
        'محاسب',
        'محاسب تكاليف',
        'أمين خزينة',
        'مدخل بيانات',
    ];

    public function up(): void
    {
        $financeId = DB::table('departments')->where('code', 'finance')->value('id');
        $accountingId = DB::table('departments')->where('code', 'accounting')->value('id');

        if (! $financeId) {
            return;
        }

        DB::table('departments')
            ->where('id', $financeId)
            ->update(['name' => 'الإدارة المالية', 'department_type' => 'administrative', 'updated_at' => now()]);

        $financeUnitId = $this->unit((int) $financeId);
        $sort = 1;

        foreach ($this->officialFinancePositions as $positionName) {
            $this->departmentPosition((int) $financeId, $financeUnitId, $positionName, $sort++);
        }

        if (! $accountingId) {
            return;
        }

        $this->moveAccountingUsers((int) $accountingId, (int) $financeId);
        $this->moveAccountingRequests((int) $accountingId, (int) $financeId);

        DB::table('department_positions')
            ->where('department_id', $accountingId)
            ->update(['is_active' => false, 'updated_at' => now()]);
    }

    public function down(): void
    {
        //
    }

    private function unit(int $financeId): int
    {
        DB::table('department_units')->updateOrInsert(
            ['department_id' => $financeId, 'code' => 'main'],
            [
                'name' => 'الإدارة المالية',
                'parent_id' => null,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return (int) DB::table('department_units')
            ->where('department_id', $financeId)
            ->where('code', 'main')
            ->value('id');
    }

    private function departmentPosition(int $financeId, int $unitId, string $positionName, int $sort): void
    {
        $jobTitleId = $this->jobTitle($positionName);
        $positionId = $this->position($financeId, $positionName);
        $approved = (int) DB::table('department_positions')
            ->where('department_id', $financeId)
            ->where('position_id', $positionId)
            ->value('approved_headcount');

        DB::table('department_positions')->updateOrInsert(
            ['department_unit_id' => $unitId, 'job_title_id' => $jobTitleId],
            [
                'department_id' => $financeId,
                'position_id' => $positionId,
                'approved_headcount' => $approved > 0 ? $approved : $this->defaultHeadcount($positionName),
                'is_active' => true,
                'sort_order' => $sort,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }

    private function moveAccountingUsers(int $accountingId, int $financeId): void
    {
        $users = DB::table('users')
            ->leftJoin('positions', 'positions.id', '=', 'users.position_id')
            ->where('users.department_id', $accountingId)
            ->select('users.id', 'positions.name as position_name')
            ->get();

        foreach ($users as $user) {
            $targetPositionName = $this->positionMap[$user->position_name] ?? null;
            $targetPositionId = $targetPositionName
                ? DB::table('positions')->where('department_id', $financeId)->where('name', $targetPositionName)->value('id')
                : null;

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'department_id' => $financeId,
                    'position_id' => $targetPositionId,
                    'updated_at' => now(),
                ]);
        }
    }

    private function moveAccountingRequests(int $accountingId, int $financeId): void
    {
        foreach (['recruitment_requests', 'change_requests', 'cost_entries', 'inventory_ledger_entries', 'activity_timelines'] as $table) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            $values = ['department_id' => $financeId];

            if (DB::getSchemaBuilder()->hasColumn($table, 'updated_at')) {
                $values['updated_at'] = now();
            }

            DB::table($table)
                ->where('department_id', $accountingId)
                ->update($values);
        }

        foreach (['employee_transfer_requests', 'employee_promotion_requests'] as $table) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            $fromValues = ['from_department_id' => $financeId];
            $toValues = ['to_department_id' => $financeId];

            if (DB::getSchemaBuilder()->hasColumn($table, 'updated_at')) {
                $fromValues['updated_at'] = now();
                $toValues['updated_at'] = now();
            }

            DB::table($table)->where('from_department_id', $accountingId)->update($fromValues);
            DB::table($table)->where('to_department_id', $accountingId)->update($toValues);
        }
    }

    private function jobTitle(string $name): int
    {
        DB::table('job_titles')->updateOrInsert(
            ['name' => $name],
            ['code' => Str::slug($name, '_') ?: 'job_'.substr(md5($name), 0, 10), 'created_at' => now(), 'updated_at' => now()],
        );

        return (int) DB::table('job_titles')->where('name', $name)->value('id');
    }

    private function position(int $financeId, string $name): int
    {
        $code = 'finance_main_'.(Str::slug($name, '_') ?: substr(md5($name), 0, 10));
        $currentHeadcount = DB::table('positions')
            ->where('department_id', $financeId)
            ->where('name', $name)
            ->value('required_headcount');

        DB::table('positions')->updateOrInsert(
            ['department_id' => $financeId, 'code' => $code],
            [
                'name' => $name,
                'required_headcount' => $currentHeadcount ?? $this->defaultHeadcount($name),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        return (int) DB::table('positions')->where('department_id', $financeId)->where('code', $code)->value('id');
    }

    private function defaultHeadcount(string $name): int
    {
        return str_contains($name, 'مدير') || str_contains($name, 'رئيس') ? 1 : 0;
    }
};
