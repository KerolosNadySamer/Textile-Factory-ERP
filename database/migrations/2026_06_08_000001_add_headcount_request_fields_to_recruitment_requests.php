<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table): void {
            if (! Schema::hasColumn('recruitment_requests', 'request_kind')) {
                $table->string('request_kind')->default('new_employee')->after('status');
            }

            if (! Schema::hasColumn('recruitment_requests', 'requested_headcount')) {
                $table->unsignedSmallInteger('requested_headcount')->default(1)->after('request_kind');
            }

            if (! Schema::hasColumn('recruitment_requests', 'hired_headcount')) {
                $table->unsignedSmallInteger('hired_headcount')->default(0)->after('requested_headcount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table): void {
            foreach (['hired_headcount', 'requested_headcount', 'request_kind'] as $column) {
                if (Schema::hasColumn('recruitment_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
