<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table): void {
            if (! Schema::hasColumn('recruitment_requests', 'contract_start_date')) {
                $table->date('contract_start_date')->nullable()->after('planned_start_date');
            }

            if (! Schema::hasColumn('recruitment_requests', 'contract_end_date')) {
                $table->date('contract_end_date')->nullable()->after('contract_start_date');
            }

            if (! Schema::hasColumn('recruitment_requests', 'contract_duration_months')) {
                $table->unsignedSmallInteger('contract_duration_months')->default(6)->after('contract_end_date');
            }

            if (! Schema::hasColumn('recruitment_requests', 'contract_expiry_notice_days')) {
                $table->unsignedSmallInteger('contract_expiry_notice_days')->default(180)->after('contract_duration_months');
            }

            if (! Schema::hasColumn('recruitment_requests', 'contract_expiry_notified_at')) {
                $table->timestamp('contract_expiry_notified_at')->nullable()->after('contract_expiry_notice_days');
            }
        });
    }

    public function down(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table): void {
            $columns = [
                'contract_expiry_notified_at',
                'contract_expiry_notice_days',
                'contract_duration_months',
                'contract_end_date',
                'contract_start_date',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('recruitment_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
