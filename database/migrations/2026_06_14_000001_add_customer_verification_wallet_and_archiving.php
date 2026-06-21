<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            if (! Schema::hasColumn('customers', 'national_id')) {
                $table->string('national_id', 50)->nullable()->after('commercial_register');
            }

            if (! Schema::hasColumn('customers', 'national_id_image_path')) {
                $table->string('national_id_image_path')->nullable()->after('national_id');
            }

            if (! Schema::hasColumn('customers', 'verification_tier')) {
                $table->string('verification_tier', 20)->default('none')->after('data_status');
            }

            if (! Schema::hasColumn('customers', 'wallet_balance')) {
                $table->decimal('wallet_balance', 14, 2)->default(0)->after('credit_limit');
            }

            if (! Schema::hasColumn('customers', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('active');
            }

            if (! Schema::hasColumn('customers', 'archived_by')) {
                $table->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('customers', 'archived_reason')) {
                $table->text('archived_reason')->nullable()->after('archived_by');
            }

            if (! Schema::hasColumn('customers', 'accounting_statement_confirmed_at')) {
                $table->timestamp('accounting_statement_confirmed_at')->nullable()->after('archived_reason');
            }

            if (! Schema::hasColumn('customers', 'accounting_statement_confirmed_by')) {
                $table->foreignId('accounting_statement_confirmed_by')->nullable()->after('accounting_statement_confirmed_at')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('login_enabled');
            }

            if (! Schema::hasColumn('users', 'archived_by')) {
                $table->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('users', 'archived_reason')) {
                $table->text('archived_reason')->nullable()->after('archived_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            foreach (['archived_reason', 'archived_by', 'archived_at'] as $column) {
                if (! Schema::hasColumn('users', $column)) {
                    continue;
                }

                $column === 'archived_by'
                    ? $table->dropConstrainedForeignId($column)
                    : $table->dropColumn($column);
            }
        });

        Schema::table('customers', function (Blueprint $table): void {
            foreach ([
                'accounting_statement_confirmed_by',
                'accounting_statement_confirmed_at',
                'archived_reason',
                'archived_by',
                'archived_at',
                'wallet_balance',
                'verification_tier',
                'national_id_image_path',
                'national_id',
            ] as $column) {
                if (! Schema::hasColumn('customers', $column)) {
                    continue;
                }

                in_array($column, ['archived_by', 'accounting_statement_confirmed_by'], true)
                    ? $table->dropConstrainedForeignId($column)
                    : $table->dropColumn($column);
            }
        });
    }
};
