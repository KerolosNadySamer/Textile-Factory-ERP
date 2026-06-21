<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('goods_receipts', function (Blueprint $table): void {
            $table->foreignId('rejected_by')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            $table->text('rejection_reason')->nullable()->after('rejected_at');
        });

        $permission = Permission::updateOrCreate(
            ['slug' => 'reject_goods_receipt'],
            [
                'name' => 'Reject goods receipt',
                'name_ar' => 'رفض استلام بضاعة',
                'name_en' => 'Reject goods receipt',
            ],
        );

        Role::whereIn('slug', ['admin', 'general_manager', 'warehouse'])->get()
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching([$permission->id]));
    }

    public function down(): void
    {
        $permission = Permission::where('slug', 'reject_goods_receipt')->first();

        if ($permission) {
            $permission->roles()->detach();
            $permission->delete();
        }

        Schema::table('goods_receipts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('rejected_by');
            $table->dropColumn(['rejected_at', 'rejection_reason']);
        });
    }
};
