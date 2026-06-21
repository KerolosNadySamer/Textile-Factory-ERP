<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserProvisioningMonitorController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('UserProvisioningMonitor/Index', [
            'metrics' => [
                'totalEmployees' => $this->employeeUsersQuery()->count(),
                'activeSystemUsers' => $this->employeeUsersQuery()->where('login_enabled', true)->where('status', 'active')->count(),
                'employeesWithoutAccounts' => $this->employeesWithoutAccountsQuery()->count(),
                'inactiveAccounts' => $this->employeeUsersQuery()->where('login_enabled', true)->where('status', 'inactive')->count(),
                'suspendedAccounts' => $this->employeeUsersQuery()->where('login_enabled', true)->where('status', 'suspended')->count(),
                'pendingAccountRequests' => $this->pendingAccountRequests()->count(),
                'newWithoutAccount3Days' => $this->employeesWithoutAccountsQuery()->where('created_at', '<=', now()->subDays(3))->count(),
                'newWithoutAccount7Days' => $this->employeesWithoutAccountsQuery()->where('created_at', '<=', now()->subDays(7))->count(),
                'newWithoutAccount15Days' => $this->employeesWithoutAccountsQuery()->where('created_at', '<=', now()->subDays(15))->count(),
                'newWithoutAccount30Days' => $this->employeesWithoutAccountsQuery()->where('created_at', '<=', now()->subDays(30))->count(),
            ],
            'employeesWithoutAccounts' => $this->employeesWithoutAccountsQuery()
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->oldest()
                ->limit(50)
                ->get(['id', 'employee_code', 'name', 'department_id', 'position_id', 'phone', 'created_at']),
            'inactiveAccounts' => $this->employeeUsersQuery()
                ->where('login_enabled', true)
                ->where('status', 'inactive')
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->latest('updated_at')
                ->limit(50)
                ->get(['id', 'employee_code', 'name', 'email', 'department_id', 'position_id', 'updated_at']),
            'suspendedAccounts' => $this->employeeUsersQuery()
                ->where('login_enabled', true)
                ->where('status', 'suspended')
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->latest('updated_at')
                ->limit(50)
                ->get(['id', 'employee_code', 'name', 'email', 'department_id', 'position_id', 'updated_at']),
            'pendingAccountRequests' => $this->pendingAccountRequests()
                ->with(['requester:id,name', 'department:id,name,code'])
                ->latest()
                ->limit(50)
                ->get(['id', 'request_number', 'type', 'department_id', 'requested_by', 'status', 'created_at', 'new_values']),
        ]);
    }

    private function employeesWithoutAccountsQuery()
    {
        return User::query()
            ->whereNull('customer_id')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'customer'))
            ->where('login_enabled', false)
            ->where('status', 'active');
    }

    private function employeeUsersQuery()
    {
        return User::query()
            ->whereNull('customer_id')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'customer'));
    }

    private function pendingAccountRequests()
    {
        return ChangeRequest::query()
            ->where('subject_type', User::class)
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->whereIn('type', ['user_create', 'user_update'])
            ->get()
            ->filter(function (ChangeRequest $changeRequest): bool {
                $newValues = $changeRequest->new_values ?? [];
                $attributes = $changeRequest->payload['attributes'] ?? [];

                return filter_var($newValues['login_enabled'] ?? $attributes['login_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
            })
            ->pluck('id')
            ->pipe(fn ($ids) => ChangeRequest::query()->whereIn('id', $ids));
    }
}
