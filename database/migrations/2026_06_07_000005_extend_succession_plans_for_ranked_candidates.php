<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('succession_plans', function (Blueprint $table) {
            $table->unsignedTinyInteger('candidate_order')->default(1)->after('successor_id');
            $table->unsignedTinyInteger('readiness_percent')->default(0)->after('readiness');
        });
    }

    public function down(): void
    {
        Schema::table('succession_plans', function (Blueprint $table) {
            $table->dropColumn(['candidate_order', 'readiness_percent']);
        });
    }
};
