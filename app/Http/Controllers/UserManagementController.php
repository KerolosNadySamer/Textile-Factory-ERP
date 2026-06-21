<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $canManageAdminRole = $request->user()?->hasRole('admin') ?? false;

        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->with(['role', 'department', 'position', 'manager:id,name'])
                ->latest()
                ->get([
                    'id',
                    'employee_code',
                    'name',
                    'email',
                    'phone',
                    'national_id',
                    'status',
                    'role_id',
                    'department_id',
                    'position_id',
                    'manager_id',
                    'hired_at',
                    'created_at',
                ]),
            'roles' => Role::query()
                ->when(! $canManageAdminRole, fn ($query) => $query->where('slug', '!=', 'admin'))
                ->orderBy('id')
                ->get(['id', 'name', 'slug']),
            'departments' => Department::query()
                ->officialActive()
                ->with(['positions' => fn ($positions) => $positions
                    ->whereHas('departmentPosition', fn ($departmentPosition) => $departmentPosition->where('is_active', true))
                    ->select('id', 'department_id', 'name', 'code')])
                ->orderBy('id')
                ->get(['id', 'name', 'code']),
            'managers' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $role = Role::findOrFail($data['role_id']);

        if ($role->slug === 'admin' && ! $request->user()?->hasRole('admin')) {
            abort(403);
        }

        $user->update($data);

        return back()->with('success', 'User role updated.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'employee_code' => ['nullable', 'digits_between:1,50', 'unique:users,employee_code'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:50', 'unique:users,national_id'],
            'address' => ['nullable', 'string', 'max:1000'],
            'hired_at' => ['nullable', 'date'],
            'basic_salary' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => [
                'nullable',
                Rule::exists('positions', 'id')->where(fn ($query) => $query->where('department_id', $request->input('department_id'))),
            ],
            'manager_id' => ['nullable', 'exists:users,id'],
        ]);

        $role = Role::findOrFail($data['role_id']);

        if ($role->slug === 'admin' && ! $request->user()?->hasRole('admin')) {
            abort(403);
        }

        User::create([
            'employee_code' => $data['employee_code'] ?: $this->nextEmployeeCode(),
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'national_id' => $data['national_id'] ?? null,
            'address' => $data['address'] ?? null,
            'hired_at' => $data['hired_at'] ?? null,
            'basic_salary' => $data['basic_salary'] ?? null,
            'status' => $data['status'],
            'password' => Hash::make($data['password']),
            'role_id' => $data['role_id'],
            'department_id' => $data['department_id'] ?? null,
            'position_id' => $data['position_id'] ?? null,
            'manager_id' => $data['manager_id'] ?? null,
        ]);

        return back()->with('success', 'User created.');
    }

    private function nextEmployeeCode(): string
    {
        $nextId = ((int) User::max('id')) + 1;

        return str_pad((string) $nextId, 4, '0', STR_PAD_LEFT);
    }
}
