<?php

namespace App\Http\Middleware;

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->load(['role.permissions', 'department:id,name,code', 'position:id,name,code']);
        $permissions = $user?->role?->permissions?->pluck('slug')->values()->all() ?? [];
        $showProvisioningAlert = $user && (
            $user->hasRole(['admin', 'general_manager'])
            || $user->position?->code === 'hr_manager'
            || $user->hasRole('hr')
        );

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'permissions' => $permissions,
                'role' => $user?->role?->slug,
            ],
            'company' => fn () => CompanySetting::query()->first(),
            'provisioningAlert' => [
                'employeesWithoutAccounts' => fn () => $showProvisioningAlert
                    ? User::query()->where('login_enabled', false)->where('status', 'active')->count()
                    : 0,
            ],
            'notifications' => [
                'unreadCount' => fn () => $user
                    ? $user->receivedNotifications()->whereNull('read_at')->count()
                    : 0,
                'latest' => fn () => $user
                    ? $user->receivedNotifications()
                        ->with(['sender:id,name,department_id', 'sender.department:id,name,code', 'senderDepartment:id,name,code'])
                        ->latest()
                        ->limit(5)
                        ->get()
                    : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'duplicateImport' => fn () => $request->session()->get('duplicate_import'),
                'duplicateSupplierImport' => fn () => $request->session()->get('duplicate_supplier_import'),
                'duplicateProductImport' => fn () => $request->session()->get('duplicate_product_import'),
            ],
        ];
    }
}
