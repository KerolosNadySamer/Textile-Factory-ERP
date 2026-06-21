<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_user_does_not_see_admin_role_on_users_screen(): void
    {
        Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $managerRole = Role::create(['name' => 'General Manager', 'slug' => 'general_manager']);
        $viewUsers = Permission::create(['name' => 'View users', 'slug' => 'view_users']);
        $managerRole->permissions()->sync([$viewUsers->id]);
        $manager = User::factory()->create(['role_id' => $managerRole->id]);

        $this->actingAs($manager)
            ->get('/users')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Users/Index')
                ->where('roles', fn ($roles) => $roles->contains('slug', 'general_manager')
                    && $roles->doesntContain('slug', 'admin')
                    && $roles->doesntContain('slug', 'customer'))
            );
    }

    public function test_non_admin_user_cannot_assign_admin_role(): void
    {
        $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $managerRole = Role::create(['name' => 'General Manager', 'slug' => 'general_manager']);
        $assignRole = Permission::create(['name' => 'Assign role', 'slug' => 'assign_role']);
        $managerRole->permissions()->sync([$assignRole->id]);
        $manager = User::factory()->create(['role_id' => $managerRole->id]);
        $employee = User::factory()->create();

        $this->actingAs($manager)
            ->patch(route('users.update-role', $employee), ['role_id' => $adminRole->id])
            ->assertForbidden();
    }
}
