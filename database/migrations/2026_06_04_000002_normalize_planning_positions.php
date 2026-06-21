<?php

use App\Models\Department;
use App\Models\Position;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $department = Department::updateOrCreate(
            ['code' => 'planning'],
            ['name' => 'التخطيط']
        );

        Position::updateOrCreate(
            ['department_id' => $department->id, 'code' => 'planning_manager'],
            ['name' => 'مدير التخطيط']
        );

        $officer = Position::updateOrCreate(
            ['department_id' => $department->id, 'code' => 'planning_officer'],
            ['name' => 'موظف تخطيط']
        );

        Position::where('department_id', $department->id)
            ->whereNotIn('code', ['planning_manager', 'planning_officer'])
            ->get()
            ->each(function (Position $position) use ($officer): void {
                if ($position->users()->exists()) {
                    $position->users()->update(['position_id' => $officer->id]);
                }

                $position->delete();
            });
    }

    public function down(): void
    {
        $department = Department::where('code', 'planning')->first();

        if (! $department) {
            return;
        }

        Position::updateOrCreate(
            ['department_id' => $department->id, 'code' => 'planning_manager'],
            ['name' => 'مديرة التخطيط']
        );
    }
};
