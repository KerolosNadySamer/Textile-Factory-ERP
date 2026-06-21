<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruitment_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->string('candidate_name');
            $table->string('candidate_phone')->nullable();
            $table->string('candidate_email')->nullable();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->foreignId('position_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending_department_manager');
            $table->string('employment_type')->nullable();
            $table->date('planned_start_date')->nullable();
            $table->decimal('proposed_salary', 12, 2)->nullable();
            $table->string('national_id')->nullable();
            $table->text('reason')->nullable();
            $table->json('qualifications')->nullable();
            $table->timestamp('department_manager_approved_at')->nullable();
            $table->foreignId('department_manager_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('hr_approved_at')->nullable();
            $table->foreignId('hr_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('general_manager_approved_at')->nullable();
            $table->foreignId('general_manager_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $permissions = [
            ['name' => 'View recruitment onboarding', 'name_ar' => 'عرض التوظيف وإدخال الموظفين', 'name_en' => 'View recruitment onboarding', 'slug' => 'view_recruitment_onboarding'],
            ['name' => 'Create recruitment request', 'name_ar' => 'إنشاء طلب توظيف', 'name_en' => 'Create recruitment request', 'slug' => 'create_recruitment_request'],
            ['name' => 'Manage recruitment requests', 'name_ar' => 'إدارة طلبات التوظيف', 'name_en' => 'Manage recruitment requests', 'slug' => 'manage_recruitment_requests'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => now(), 'updated_at' => now()]
            );
        }

        $viewCreateIds = DB::table('permissions')
            ->whereIn('slug', ['view_recruitment_onboarding', 'create_recruitment_request'])
            ->pluck('id');
        $manageIds = DB::table('permissions')
            ->whereIn('slug', ['view_recruitment_onboarding', 'create_recruitment_request', 'manage_recruitment_requests'])
            ->pluck('id');

        DB::table('roles')
            ->whereIn('slug', ['sales', 'purchasing', 'planning', 'accounting', 'warehouse', 'production', 'quality', 'dyeing', 'weaving', 'cost_accountant'])
            ->pluck('id')
            ->each(function ($roleId) use ($viewCreateIds): void {
                foreach ($viewCreateIds as $permissionId) {
                    DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionId]);
                }
            });

        DB::table('roles')
            ->whereIn('slug', ['admin', 'general_manager', 'hr'])
            ->pluck('id')
            ->each(function ($roleId) use ($manageIds): void {
                foreach ($manageIds as $permissionId) {
                    DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionId]);
                }
            });
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['view_recruitment_onboarding', 'create_recruitment_request', 'manage_recruitment_requests'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
        Schema::dropIfExists('recruitment_requests');
    }
};
