<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use App\Models\Customer;
use App\Models\Department;
use App\Models\Lot;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\SalesOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasRole('customer')) {
            return redirect()->route('customer-portal.index');
        }

        $inventoryValue = Lot::query()
            ->get(['quantity', 'purchase_price'])
            ->sum(fn (Lot $lot) => (float) $lot->quantity * (float) ($lot->purchase_price ?? 0));
        $canSeeAccountRequests = $this->canSeeAccountRequests($request->user());
        $canSeeDepartmentStrength = $canSeeAccountRequests || $request->user()?->hasPermission('view_departments');

        return Inertia::render('Dashboard', [
            'metrics' => [
                'customers' => Customer::query()->count(),
                'suppliers' => Supplier::query()->count(),
                'products' => Product::query()->count(),
                'openSalesOrders' => SalesOrder::query()->whereNotIn('status', ['completed', 'delivered', 'cancelled', 'rejected'])->count(),
                'openProductionOrders' => ProductionOrder::query()->whereNotIn('status', ['closed', 'cancelled'])->count(),
                'openLots' => Lot::query()->where('status', 'open')->count(),
                'inventoryValue' => $inventoryValue,
                'totalEmployees' => $canSeeAccountRequests ? $this->employeeUsersQuery()->count() : 0,
                'activeSystemUsers' => $canSeeAccountRequests ? $this->employeeUsersQuery()->where('login_enabled', true)->where('status', 'active')->count() : 0,
                'employeesWithoutAccounts' => $canSeeAccountRequests ? $this->employeesWithoutAccountsQuery()->count() : 0,
                'suspendedAccounts' => $canSeeAccountRequests ? $this->employeeUsersQuery()->where('login_enabled', true)->where('status', 'suspended')->count() : 0,
                'pendingAccountRequests' => $canSeeAccountRequests ? $this->pendingAccountRequestsCount() : 0,
                'employeesWithoutAccountsOver7Days' => $canSeeAccountRequests ? $this->employeesWithoutAccountsQuery()->where('created_at', '<=', now()->subDays(7))->count() : 0,
                'employeesWithoutAccountsOver30Days' => $canSeeAccountRequests ? $this->employeesWithoutAccountsQuery()->where('created_at', '<=', now()->subDays(30))->count() : 0,
            ],
            'kpis' => [
                'departmentStrength' => $canSeeDepartmentStrength ? $this->departmentStrengthRows() : [],
                'employeesWithoutAccounts' => $canSeeAccountRequests
                    ? $this->employeesWithoutAccountsQuery()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'employee_code', 'name', 'department_id', 'position_id', 'created_at'])
                    : [],
                'employeesWithoutAccountsAging' => $canSeeAccountRequests
                    ? $this->employeesWithoutAccountsQuery()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->oldest()
                    ->limit(5)
                    ->get(['id', 'employee_code', 'name', 'department_id', 'position_id', 'created_at'])
                    : [],
                'topCustomers' => Customer::query()
                    ->withCount('salesOrders')
                    ->orderByDesc('sales_orders_count')
                    ->limit(5)
                    ->get(['id', 'code', 'name', 'name_ar']),
                'topProducts' => Product::query()
                    ->withSum('salesOrderItems as sold_qty', 'quantity')
                    ->orderByDesc('sold_qty')
                    ->limit(6)
                    ->get(),
                'monthlySales' => SalesOrder::query()
                    ->latest('order_date')
                    ->get(['order_date'])
                    ->groupBy(fn (SalesOrder $order) => $order->order_date?->format('Y-m') ?? '-')
                    ->map(fn ($orders, $month) => ['month' => $month, 'orders' => $orders->count()])
                    ->values()
                    ->take(6),
                'productionEfficiency' => [
                    'closed' => ProductionOrder::query()->where('status', 'closed')->count(),
                    'active' => ProductionOrder::query()->whereIn('status', ['released', 'in_production', 'finished'])->count(),
                ],
            ],
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

    private function departmentStrengthRows()
    {
        return Department::query()
            ->officialActive()
            ->with(['departmentPositions' => fn ($positions) => $positions
                ->where('is_active', true)])
            ->withCount(['users as current_employees_count' => fn ($users) => $users->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))])
            ->orderBy('id')
            ->get(['id', 'name', 'code', 'required_headcount'])
            ->map(function (Department $department) {
                $approved = max(0, (int) $department->departmentPositions->sum('approved_headcount'));
                $current = (int) $department->current_employees_count;

                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'code' => $department->code,
                    'approved' => $approved,
                    'current' => $current,
                    'vacant' => max(0, $approved - $current),
                    'surplus' => max(0, $current - $approved),
                    'strength' => $approved > 0 ? round(min($current, $approved) / $approved * 100) : 0,
                ];
            })
            ->values();
    }

    private function pendingAccountRequestsCount(): int
    {
        return ChangeRequest::query()
            ->where('subject_type', User::class)
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->whereIn('type', ['user_create', 'user_update'])
            ->get(['new_values', 'payload'])
            ->filter(function (ChangeRequest $changeRequest): bool {
                $newValues = $changeRequest->new_values ?? [];
                $attributes = $changeRequest->payload['attributes'] ?? [];

                return filter_var($newValues['login_enabled'] ?? $attributes['login_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
            })
            ->count();
    }

    private function canSeeAccountRequests(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        $managerPositionCodes = [
            'general_manager',
            'admin_assistant',
            'department_manager',
            'department_officer',
            'sales_manager',
            'sales_officer',
            'planning_manager',
            'planning_officer',
            'section_head',
            'assistant_section_head',
            'accounting_manager',
            'purchasing_manager',
            'purchasing_officer',
            'hr_manager',
            'hr_officer',
        ];

        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission(['view_users', 'create_user', 'edit_user'])
            || in_array($user->position?->code, $managerPositionCodes, true);
    }
}
