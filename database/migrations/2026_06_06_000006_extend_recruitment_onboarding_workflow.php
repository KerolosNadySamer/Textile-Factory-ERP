<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('recruitment_requests', 'department_officer_approved_at')) {
                $table->timestamp('department_officer_approved_at')->nullable()->after('qualifications');
                $table->foreignId('department_officer_approved_by')->nullable()->after('department_officer_approved_at')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('recruitment_requests', 'hr_nominated_at')) {
                $table->timestamp('hr_nominated_at')->nullable()->after('general_manager_approved_by');
                $table->foreignId('hr_nominated_by')->nullable()->after('hr_nominated_at')->constrained('users', 'id', 'rr_hr_nom_by_fk')->nullOnDelete();
            }

            if (! Schema::hasColumn('recruitment_requests', 'candidate_department_approved_at')) {
                $table->timestamp('candidate_department_approved_at')->nullable()->after('hr_nominated_by');
                $table->foreignId('candidate_department_approved_by')->nullable()->after('candidate_department_approved_at')->constrained('users', 'id', 'rr_cdept_by_fk')->nullOnDelete();
            }

            if (! Schema::hasColumn('recruitment_requests', 'candidate_hr_approved_at')) {
                $table->timestamp('candidate_hr_approved_at')->nullable()->after('candidate_department_approved_by');
                $table->foreignId('candidate_hr_approved_by')->nullable()->after('candidate_hr_approved_at')->constrained('users', 'id', 'rr_chr_by_fk')->nullOnDelete();
            }

            if (! Schema::hasColumn('recruitment_requests', 'candidate_general_manager_approved_at')) {
                $table->timestamp('candidate_general_manager_approved_at')->nullable()->after('candidate_hr_approved_by');
                $table->foreignId('candidate_general_manager_approved_by')->nullable()->after('candidate_general_manager_approved_at')->constrained('users', 'id', 'rr_cgm_by_fk')->nullOnDelete();
            }

            if (! Schema::hasColumn('recruitment_requests', 'hr_final_approved_at')) {
                $table->timestamp('hr_final_approved_at')->nullable()->after('candidate_general_manager_approved_by');
                $table->foreignId('hr_final_approved_by')->nullable()->after('hr_final_approved_at')->constrained('users', 'id', 'rr_hr_final_by_fk')->nullOnDelete();
            }
        });

        DB::table('recruitment_requests')
            ->where('status', 'approved')
            ->update(['status' => 'ready_for_employee_creation']);
    }

    public function down(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            foreach ([
                'hr_final_approved_by',
                'candidate_general_manager_approved_by',
                'candidate_hr_approved_by',
                'candidate_department_approved_by',
                'hr_nominated_by',
                'department_officer_approved_by',
            ] as $column) {
                if (Schema::hasColumn('recruitment_requests', $column)) {
                    $table->dropConstrainedForeignId($column);
                }
            }

            $columns = [
                'department_officer_approved_at',
                'hr_nominated_at',
                'candidate_department_approved_at',
                'candidate_hr_approved_at',
                'candidate_general_manager_approved_at',
                'hr_final_approved_at',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('recruitment_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
