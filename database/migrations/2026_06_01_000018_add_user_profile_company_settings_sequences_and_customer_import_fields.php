<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_photo_path')->nullable()->after('email');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->unsignedBigInteger('internal_sequence')->nullable()->after('id');
            $table->string('barcode')->nullable()->after('code');
        });

        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name_ar');
            $table->string('company_name_en');
            $table->string('company_logo')->nullable();
            $table->text('company_address')->nullable();
            $table->string('company_phone')->nullable();
            $table->string('company_email')->nullable();
            $table->timestamps();
        });

        Schema::create('number_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('prefix')->nullable();
            $table->unsignedBigInteger('next_number')->default(1);
            $table->unsignedSmallInteger('padding')->default(6);
            $table->boolean('yearly')->default(false);
            $table->unsignedSmallInteger('current_year')->nullable();
            $table->timestamps();
        });

        DB::table('company_settings')->insert([
            'company_name_ar' => 'شركة أسود للصباغة والتجهيز والنسيج',
            'company_name_en' => 'Aswad Dyeing, Finishing & Weaving Co.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $nextCustomer = ((int) DB::table('customers')->max('id')) + 1;
        $nextEmployee = ((int) DB::table('users')->max('id')) + 1;

        DB::table('number_sequences')->insert([
            ['key' => 'customers', 'prefix' => 'CUS', 'next_number' => $nextCustomer, 'padding' => 6, 'yearly' => false, 'current_year' => null, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'employees', 'prefix' => 'EMP', 'next_number' => $nextEmployee, 'padding' => 4, 'yearly' => false, 'current_year' => null, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'lots', 'prefix' => 'LOT', 'next_number' => 1, 'padding' => 6, 'yearly' => true, 'current_year' => now()->year, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'sales_orders', 'prefix' => 'SO', 'next_number' => 1, 'padding' => 6, 'yearly' => true, 'current_year' => now()->year, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('customers')->orderBy('id')->get(['id', 'code'])->each(function ($customer, $index): void {
            DB::table('customers')->where('id', $customer->id)->update([
                'internal_sequence' => $index + 1,
                'barcode' => $customer->code,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('number_sequences');
        Schema::dropIfExists('company_settings');

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['internal_sequence', 'barcode']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_photo_path');
        });
    }
};
