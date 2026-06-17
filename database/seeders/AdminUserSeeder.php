<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = [
            'name' => 'Kerolos Nady Samer',
            'password' => Hash::make('01278330872'),
            'role' => 'System Admin',
            'status' => 'Active',
            'is_system' => true,
            'employee_id' => null,
            'email_verified_at' => now(),
            'updated_at' => now(),
        ];

        if (DB::table('users')->where('email', 'kerolos.nady.samer@gmail.com')->exists()) {
            DB::table('users')->where('email', 'kerolos.nady.samer@gmail.com')->update($admin);
            return;
        }

        DB::table('users')->insert($admin + [
            'email' => 'kerolos.nady.samer@gmail.com',
            'created_at' => now(),
        ]);
    }
}
