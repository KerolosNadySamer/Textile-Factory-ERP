<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'customer_id')) {
                $table->foreignId('customer_id')->nullable()->after('manager_id')->constrained('customers')->nullOnDelete();
            }
        });

        Schema::table('sales_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('sales_orders', 'source')) {
                $table->string('source')->default('internal')->after('status');
            }

            if (! Schema::hasColumn('sales_orders', 'customer_submitted_at')) {
                $table->timestamp('customer_submitted_at')->nullable()->after('source');
            }

            if (! Schema::hasColumn('sales_orders', 'customer_visible_at')) {
                $table->timestamp('customer_visible_at')->nullable()->after('customer_submitted_at');
            }
        });

        Schema::table('customer_payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('customer_payments', 'reference_number')) {
                $table->string('reference_number')->nullable()->after('method');
            }

            if (! Schema::hasColumn('customer_payments', 'proof_path')) {
                $table->string('proof_path')->nullable()->after('reference_number');
            }
        });

        if (! Schema::hasTable('customer_order_messages')) {
            Schema::create('customer_order_messages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('customer_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
                $table->foreignId('sales_order_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();
                $table->foreignId('sender_user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
                $table->foreignId('recipient_user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
                $table->text('message');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();

                $table->index(['customer_id', 'sales_order_id']);
                $table->index(['recipient_user_id', 'read_at']);
            });
        }

        $now = now();

        $customerRoleId = DB::table('roles')->updateOrInsert(
            ['slug' => 'customer'],
            [
                'name' => 'Customer',
                'name_ar' => 'عميل',
                'name_en' => 'Customer',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $permissions = [
            ['slug' => 'view_customer_portal', 'name' => 'View customer portal', 'name_ar' => 'عرض بوابة العميل', 'name_en' => 'View Customer Portal'],
            ['slug' => 'create_customer_portal_order', 'name' => 'Create customer portal order', 'name_ar' => 'إنشاء طلبية من بوابة العميل', 'name_en' => 'Create Customer Portal Order'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                $permission + ['created_at' => $now, 'updated_at' => $now],
            );
        }

        $roleId = DB::table('roles')->where('slug', 'customer')->value('id');
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', array_column($permissions, 'slug'))
            ->pluck('id');

        foreach ($permissionIds as $permissionId) {
            DB::table('role_permission')->updateOrInsert([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_order_messages');

        Schema::table('customer_payments', function (Blueprint $table): void {
            foreach (['proof_path', 'reference_number'] as $column) {
                if (Schema::hasColumn('customer_payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('sales_orders', function (Blueprint $table): void {
            foreach (['customer_visible_at', 'customer_submitted_at', 'source'] as $column) {
                if (Schema::hasColumn('sales_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'customer_id')) {
                $table->dropConstrainedForeignId('customer_id');
            }
        });

        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['view_customer_portal', 'create_customer_portal_order'])
            ->pluck('id');

        DB::table('role_permission')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
