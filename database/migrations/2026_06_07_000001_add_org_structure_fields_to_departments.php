<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'department_type')) {
                $table->string('department_type')->default('administrative')->after('code');
            }

            if (! Schema::hasColumn('departments', 'direct_manager_id')) {
                $table->foreignId('direct_manager_id')
                    ->nullable()
                    ->after('department_type')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });

        $types = [
            'sales' => 'administrative',
            'purchasing' => 'service',
            'production' => 'productive',
            'dyeing' => 'productive',
            'finishing' => 'productive',
            'laboratory' => 'service',
            'quality' => 'service',
            'warehouse' => 'service',
            'maintenance' => 'service',
            'accounting' => 'administrative',
            'hr' => 'administrative',
            'management' => 'administrative',
            'planning' => 'administrative',
        ];

        foreach ($types as $code => $type) {
            DB::table('departments')
                ->where('code', $code)
                ->update(['department_type' => $type, 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'direct_manager_id')) {
                $table->dropConstrainedForeignId('direct_manager_id');
            }

            if (Schema::hasColumn('departments', 'department_type')) {
                $table->dropColumn('department_type');
            }
        });
    }
};
