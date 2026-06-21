<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('change_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->string('type');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('risk_level')->default('medium');
            $table->string('status')->default('pending_department_officer');
            $table->text('reason');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('payload')->nullable();
            $table->foreignId('department_officer_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('department_officer_approved_at')->nullable();
            $table->foreignId('department_manager_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('department_manager_approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('executed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();
        });

        DB::table('permissions')->updateOrInsert(
            ['slug' => 'view_change_requests'],
            ['name' => 'View change requests', 'name_ar' => 'عرض طلبات التغيير', 'name_en' => 'View change requests', 'created_at' => now(), 'updated_at' => now()],
        );

        $permissionId = DB::table('permissions')->where('slug', 'view_change_requests')->value('id');
        DB::table('roles')->whereIn('slug', ['admin', 'general_manager'])->pluck('id')->each(function ($roleId) use ($permissionId): void {
            DB::table('role_permission')->updateOrInsert(['role_id' => $roleId, 'permission_id' => $permissionId]);
        });
    }

    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('slug', 'view_change_requests')->value('id');

        if ($permissionId) {
            DB::table('role_permission')->where('permission_id', $permissionId)->delete();
            DB::table('permissions')->where('id', $permissionId)->delete();
        }

        Schema::dropIfExists('change_requests');
    }
};
