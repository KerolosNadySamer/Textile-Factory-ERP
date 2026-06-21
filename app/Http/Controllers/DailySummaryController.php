<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ChangeRequest;
use App\Models\Customer;
use App\Models\Department;
use App\Models\PilotFeedbackItem;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\RecruitmentRequest;
use App\Models\SalesOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailySummaryController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role.permissions', 'department', 'position']);
        $language = $request->query('lang') === 'en' ? 'en' : 'ar';
        $pending = [];
        $alerts = [];
        $completed = [];

        $pendingApprovalQuery = $this->pendingApprovalsQuery($user)->with(['department:id,name,code', 'requester:id,name']);
        $pendingApprovals = (clone $pendingApprovalQuery)->count();
        $pending[] = $this->item(
            $this->line($language, "طلبات الاعتماد المنتظرة منك: {$pendingApprovals}.", "Approval requests waiting for you: {$pendingApprovals}."),
            'pending-approvals.index',
            $this->focusParams($pendingApprovalQuery),
            detail: $this->detail($language, 'المكان الدقيق', 'Exact location', $this->samples($pendingApprovalQuery, fn ($item) => "{$item->request_number} - {$item->department?->name} - {$item->status}"), $pendingApprovals)
        );

        $executedChangeRequests = $this->visibleChangeRequests($user)->whereDate('executed_at', today())->count();
        $rejectedChangeRequests = $this->visibleChangeRequests($user)->whereDate('rejected_at', today())->count();
        $openChangeRequestQuery = $this->visibleChangeRequests($user)
            ->with(['department:id,name,code', 'requester:id,name'])
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->latest();
        $openChangeRequests = (clone $openChangeRequestQuery)->count();
        $completed[] = $this->item($this->line($language, "تم تنفيذ {$executedChangeRequests} طلب تغيير اليوم.", "{$executedChangeRequests} change requests were executed today."), 'change-requests.index');
        $completed[] = $this->item($this->line($language, "تم رفض {$rejectedChangeRequests} طلب تغيير اليوم.", "{$rejectedChangeRequests} change requests were rejected today."), 'change-requests.index');
        $pending[] = $this->item(
            $this->line($language, "طلبات التغيير المفتوحة للمتابعة: {$openChangeRequests}.", "Open change requests for follow-up: {$openChangeRequests}."),
            'change-requests.index',
            $this->focusParams($openChangeRequestQuery),
            detail: $this->detail($language, 'أول طلبات التغيير', 'First change requests', $this->samples($openChangeRequestQuery, fn ($item) => "{$item->request_number} - {$item->type} - {$item->department?->name} - {$item->status}"), $openChangeRequests)
        );

        if ($this->canSeeSales($user)) {
            $createdSalesOrders = SalesOrder::query()->whereDate('created_at', today())->count();
            $completedSalesOrders = SalesOrder::query()->whereDate('updated_at', today())->whereIn('status', ['completed', 'delivered'])->count();
            $openSalesOrderQuery = SalesOrder::query()
                ->with('customer:id,code,name,name_ar')
                ->whereNotIn('status', ['completed', 'delivered', 'cancelled', 'rejected'])
                ->latest();
            $openSalesOrders = (clone $openSalesOrderQuery)->count();
            $newCustomers = Customer::query()->whereDate('created_at', today())->count();
            $pendingCustomerQuery = Customer::query()
                ->whereIn('data_status', ['pending_review', 'pending_sales_officer', 'pending_sales_manager'])
                ->latest();
            $pendingCustomers = (clone $pendingCustomerQuery)->count();

            $completed[] = $this->item($this->line($language, "تم إنشاء {$createdSalesOrders} طلب بيع اليوم.", "{$createdSalesOrders} sales orders were created today."), 'sales-orders.index');
            $completed[] = $this->item($this->line($language, "تم إكمال أو تسليم {$completedSalesOrders} طلب بيع اليوم.", "{$completedSalesOrders} sales orders were completed or delivered today."), 'sales-orders.index');
            $completed[] = $this->item($this->line($language, "تم إنشاء {$newCustomers} عميل جديد اليوم.", "{$newCustomers} customers were created today."), 'master-data.customers');
            $pending[] = $this->item(
                $this->line($language, "طلبات البيع المفتوحة: {$openSalesOrders}.", "Open sales orders: {$openSalesOrders}."),
                'sales-orders.index',
                $this->focusParams($openSalesOrderQuery),
                detail: $this->detail($language, 'أول طلبات البيع', 'First sales orders', $this->samples($openSalesOrderQuery, fn ($item) => "{$item->so_number} - {$item->customer?->name} - {$item->status}"), $openSalesOrders)
            );
            $pending[] = $this->item(
                $this->line($language, "عملاء يحتاجون مراجعة بيانات: {$pendingCustomers}.", "{$pendingCustomers} customers need data review."),
                'master-data.customers',
                $this->focusParams($pendingCustomerQuery),
                detail: $this->detail($language, 'أول العملاء', 'First customers', $this->samples($pendingCustomerQuery, fn ($item) => "{$item->code} - {$item->name} - {$item->data_status}"), $pendingCustomers)
            );
        }

        if ($this->canSeePurchasing($user)) {
            $pendingPurchaseOrderQuery = PurchaseOrder::query()
                ->with('supplier:id,code,name')
                ->whereIn('status', ['draft', 'submitted', 'pending_approval'])
                ->latest();
            $pendingPurchaseRequestQuery = PurchaseRequest::query()
                ->with('requester:id,name')
                ->whereIn('status', ['draft', 'submitted', 'pending_approval'])
                ->latest();
            $pendingPurchaseOrders = (clone $pendingPurchaseOrderQuery)->count();
            $pendingPurchaseRequests = (clone $pendingPurchaseRequestQuery)->count();
            $createdPurchaseRequests = PurchaseRequest::query()->whereDate('created_at', today())->count();
            $createdPurchaseOrders = PurchaseOrder::query()->whereDate('created_at', today())->count();
            $newSuppliers = Supplier::query()->whereDate('created_at', today())->count();

            $completed[] = $this->item($this->line($language, "تم إنشاء {$createdPurchaseRequests} طلب شراء اليوم.", "{$createdPurchaseRequests} purchase requests were created today."), 'purchasing.index');
            $completed[] = $this->item($this->line($language, "تم إنشاء {$createdPurchaseOrders} أمر شراء اليوم.", "{$createdPurchaseOrders} purchase orders were created today."), 'purchasing.index');
            $completed[] = $this->item($this->line($language, "تم إنشاء {$newSuppliers} مورد جديد اليوم.", "{$newSuppliers} suppliers were created today."), 'purchasing.index');
            $pending[] = $this->item(
                $this->line($language, "طلبات الشراء التي تحتاج متابعة: {$pendingPurchaseRequests}.", "Purchase requests needing follow-up: {$pendingPurchaseRequests}."),
                'purchasing.index',
                $this->focusParams($pendingPurchaseRequestQuery, 'purchase_request'),
                detail: $this->detail($language, 'أول طلبات الشراء', 'First purchase requests', $this->samples($pendingPurchaseRequestQuery, fn ($item) => "{$item->pr_number} - {$item->requester?->name} - {$item->status}"), $pendingPurchaseRequests)
            );
            $pending[] = $this->item(
                $this->line($language, "أوامر الشراء التي تحتاج متابعة: {$pendingPurchaseOrders}.", "Purchase orders needing follow-up: {$pendingPurchaseOrders}."),
                'purchasing.index',
                $this->focusParams($pendingPurchaseOrderQuery, 'purchase_order'),
                detail: $this->detail($language, 'أول أوامر الشراء', 'First purchase orders', $this->samples($pendingPurchaseOrderQuery, fn ($item) => "{$item->po_number} - {$item->supplier?->name} - {$item->status}"), $pendingPurchaseOrders)
            );
        }

        if ($this->canSeeHr($user)) {
            $employeesWithoutAccountsQuery = User::query()
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->where('login_enabled', false)
                ->where('status', 'active')
                ->latest();
            $employeesWithoutAccounts = (clone $employeesWithoutAccountsQuery)->count();
            $newRecruitmentRequests = RecruitmentRequest::query()->whereDate('created_at', today())->count();
            $approvedRecruitmentRequests = RecruitmentRequest::query()
                ->where(function ($query) {
                    $query
                        ->whereDate('general_manager_approved_at', today())
                        ->orWhereDate('candidate_general_manager_approved_at', today())
                        ->orWhereDate('hr_final_approved_at', today());
                })
                ->count();
            $rejectedRecruitmentRequests = RecruitmentRequest::query()->whereDate('rejected_at', today())->count();
            $openRecruitmentRequestQuery = RecruitmentRequest::query()
                ->with(['department:id,name,code', 'position:id,name,code'])
                ->whereNotIn('status', ['rejected', 'cancelled', 'hired', 'employee_created'])
                ->latest();
            $openRecruitmentRequests = (clone $openRecruitmentRequestQuery)->count();
            $activeEmployees = User::query()->where('status', 'active')->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))->count();
            $employeesWithoutDepartmentQuery = User::query()
                ->with('position:id,name,code')
                ->where('status', 'active')
                ->whereNull('department_id')
                ->latest();
            $employeesWithoutDepartment = (clone $employeesWithoutDepartmentQuery)->count();

            $pending[] = $this->item(
                $this->line($language, "موظفون بدون حساب نظام: {$employeesWithoutAccounts}.", "Employees without system accounts: {$employeesWithoutAccounts}."),
                'users.index',
                $this->focusParams($employeesWithoutAccountsQuery),
                detail: $this->detail($language, 'أول الموظفين', 'First employees', $this->samples($employeesWithoutAccountsQuery, fn ($item) => "{$item->employee_code} - {$item->name} - {$item->department?->name} - {$item->position?->name}"), $employeesWithoutAccounts)
            );
            $completed[] = $this->item($this->line($language, "تم تسجيل {$newRecruitmentRequests} طلب توظيف اليوم.", "{$newRecruitmentRequests} recruitment requests were created today."), 'recruitment-onboarding.index');
            $completed[] = $this->item($this->line($language, "تم اعتماد {$approvedRecruitmentRequests} خطوة توظيف اليوم.", "{$approvedRecruitmentRequests} recruitment approval steps were completed today."), 'recruitment-onboarding.index');
            $completed[] = $this->item($this->line($language, "تم رفض {$rejectedRecruitmentRequests} طلب توظيف اليوم.", "{$rejectedRecruitmentRequests} recruitment requests were rejected today."), 'recruitment-onboarding.index');
            $pending[] = $this->item(
                $this->line($language, "طلبات التوظيف المفتوحة: {$openRecruitmentRequests}.", "Open recruitment requests: {$openRecruitmentRequests}."),
                'department-hiring-requests.index',
                $this->focusParams($openRecruitmentRequestQuery),
                detail: $this->detail($language, 'أول طلبات التوظيف', 'First recruitment requests', $this->samples($openRecruitmentRequestQuery, fn ($item) => "{$item->request_number} - {$item->department?->name} - {$item->position?->name} - {$item->status}"), $openRecruitmentRequests)
            );
            $pending[] = $this->item($this->line($language, "إجمالي الموظفين النشطين الحالي: {$activeEmployees}.", "Current active employees: {$activeEmployees}."), 'users.index');

            if ($employeesWithoutDepartment > 0) {
                $alerts[] = $this->item(
                    $this->line($language, "يوجد {$employeesWithoutDepartment} موظف نشط بدون قسم.", "{$employeesWithoutDepartment} active employees do not have a department."),
                    'users.index',
                    $this->focusParams($employeesWithoutDepartmentQuery),
                    detail: $this->detail($language, 'الموظفون المتأثرون', 'Affected employees', $this->samples($employeesWithoutDepartmentQuery, fn ($item) => "{$item->employee_code} - {$item->name} - {$item->position?->name}"), $employeesWithoutDepartment)
                );
            }
        }

        if ($user->hasPermission('view_departments') || $user->hasRole(['admin', 'general_manager', 'hr'])) {
            $coverage = $this->departmentCoverage($user);
            if ($coverage !== null) {
                $pending[] = $this->item($this->line($language, "نسبة تغطية الوظائف الحالية: {$coverage}%.", "Current position coverage: {$coverage}%."), 'department-staffing.index');
            }
        }

        if ($user->hasPermission('view_products') || $user->hasRole(['admin', 'general_manager'])) {
            $newProducts = Product::query()->whereDate('created_at', today())->count();
            $completed[] = $this->item($this->line($language, "تم إنشاء {$newProducts} صنف اليوم.", "{$newProducts} products were created today."), 'products.index');
        }

        $openFeedbackQuery = $this->visibleFeedbackItems($user)
            ->with(['assignedDepartment:id,name,code', 'assignedUser:id,name'])
            ->whereIn('status', ['new', 'in_review'])
            ->latest();
        $feedbackCount = (clone $openFeedbackQuery)->count();
        $newFeedbackToday = $this->visibleFeedbackItems($user)->whereDate('created_at', today())->count();
        $closedFeedbackToday = $this->visibleFeedbackItems($user)->whereDate('closed_at', today())->count();
        $pending[] = $this->item(
            $this->line($language, "ملاحظات التشغيل التي تحتاج متابعة: {$feedbackCount}.", "Pilot feedback items needing follow-up: {$feedbackCount}."),
            'pilot-feedback.index',
            ['status' => 'new'] + $this->focusParams($openFeedbackQuery),
            $this->detail($language, 'أول الملاحظات', 'First feedback items', $this->samples($openFeedbackQuery, fn ($item) => "#{$item->id} - {$item->title} - {$item->page} - {$item->status}"), $feedbackCount)
        );
        $completed[] = $this->item($this->line($language, "تم تسجيل {$newFeedbackToday} ملاحظة تشغيل اليوم.", "{$newFeedbackToday} pilot feedback items were logged today."), 'pilot-feedback.index');
        $completed[] = $this->item($this->line($language, "تم إغلاق {$closedFeedbackToday} ملاحظة تشغيل اليوم.", "{$closedFeedbackToday} pilot feedback items were closed today."), 'pilot-feedback.index');

        $highFeedbackQuery = $this->visibleFeedbackItems($user)
            ->with(['assignedDepartment:id,name,code', 'assignedUser:id,name'])
            ->where('priority', 'high')
            ->whereIn('status', ['new', 'in_review'])
            ->latest();
        $highFeedback = (clone $highFeedbackQuery)->count();
        if ($highFeedback > 0) {
            $alerts[] = $this->item(
                $this->line($language, "يوجد {$highFeedback} ملاحظة تشغيل عالية الأولوية.", "{$highFeedback} high priority pilot feedback items are open."),
                'pilot-feedback.index',
                ['priority' => 'high', 'status' => 'new'] + $this->focusParams($highFeedbackQuery),
                $this->detail($language, 'الملاحظات الحرجة', 'Critical feedback items', $this->samples($highFeedbackQuery, fn ($item) => "#{$item->id} - {$item->title} - {$item->page} - {$item->assignedDepartment?->name}"), $highFeedback)
            );
        }

        if ($this->canSeeSales($user) || $user->hasRole(['admin', 'general_manager'])) {
            $duplicateCustomerNames = Customer::query()
                ->select('name')
                ->whereNotNull('name')
                ->groupBy('name')
                ->havingRaw('COUNT(*) > 1')
                ->pluck('name')
                ->filter()
                ->values();
            $duplicateCustomers = $duplicateCustomerNames->count();

            if ($duplicateCustomers > 0) {
                $alerts[] = $this->item(
                    $this->line($language, "يوجد {$duplicateCustomers} اسم عميل مكرر يحتاج مراجعة.", "{$duplicateCustomers} duplicate customer names need review."),
                    'master-data.customers',
                    $this->focusParams(Customer::query()->where('name', $duplicateCustomerNames->first())),
                    detail: $this->detail($language, 'الأسماء المكررة', 'Duplicate names', $duplicateCustomerNames->take(3)->all(), $duplicateCustomers)
                );
            }
        }

        $activitiesToday = ActivityLog::query()
            ->when(! $user->hasRole(['admin', 'general_manager']), fn ($query) => $query->where('user_id', $user->id))
            ->whereDate('created_at', today())
            ->count();
        $completed[] = $this->item($this->line($language, "تم تسجيل {$activitiesToday} حركة في سجل النشاط اليوم.", "{$activitiesToday} activity log entries were recorded today."), 'governance.index');

        $oldPendingChangeRequestQuery = $this->visibleChangeRequests($user)
            ->with(['department:id,name,code', 'requester:id,name'])
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->where('created_at', '<', now()->subDay())
            ->latest();
        $oldPendingChangeRequests = (clone $oldPendingChangeRequestQuery)->count();
        if ($oldPendingChangeRequests > 0) {
            $alerts[] = $this->item(
                $this->line($language, "يوجد {$oldPendingChangeRequests} طلب تغيير معلق منذ أكثر من يوم.", "{$oldPendingChangeRequests} change requests have been pending for more than one day."),
                'change-requests.index',
                $this->focusParams($oldPendingChangeRequestQuery),
                detail: $this->detail($language, 'الطلبات المتأخرة', 'Delayed requests', $this->samples($oldPendingChangeRequestQuery, fn ($item) => "{$item->request_number} - {$item->department?->name} - {$item->created_at?->format('Y-m-d')}"), $oldPendingChangeRequests)
            );
        }

        $summary = array_values(array_filter(array_merge($alerts, $completed, $pending)));
        if (count($summary) === 0) {
            $summary[] = $this->line($language, 'لا توجد أحداث مهمة ظاهرة لك حتى الآن اليوم.', 'No important visible events for you yet today.');
        }

        return response()->json([
            'date' => today()->toDateString(),
            'user' => $user->name,
            'role' => $user->role?->slug,
            'department' => $user->department?->name,
            'items' => $summary,
            'pending' => $pending,
            'alerts' => $alerts,
            'completed' => $completed,
            'spokenText' => $this->spokenText($language, $user->name, $completed, $pending, $alerts),
        ]);
    }

    private function pendingApprovalsCount(User $user): int
    {
        return $this->pendingApprovalsQuery($user)->count();
    }

    private function pendingApprovalsQuery(User $user)
    {
        return ChangeRequest::query()
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->where(function ($query) use ($user) {
                if ($user->hasRole(['admin', 'general_manager'])) {
                    $query->where('status', 'pending_general_manager');

                    return;
                }

                $query->where('department_id', $user->department_id);

                if (str_ends_with((string) $user->position?->code, '_officer')) {
                    $query->where('status', 'pending_department_officer');
                } elseif (str_ends_with((string) $user->position?->code, '_manager')) {
                    $query->where('status', 'pending_department_manager');
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->latest();
    }

    private function departmentCoverage(User $user): ?int
    {
        $query = Department::query()
            ->where('active', true)
            ->with(['departmentPositions' => fn ($positions) => $positions->where('is_active', true)])
            ->withCount(['users as current_employees_count' => fn ($users) => $users->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'))]);

        if (! $user->hasRole(['admin', 'general_manager', 'hr'])) {
            $query->where('id', $user->department_id);
        }

        $rows = $query->get();
        $approved = (int) $rows->sum(fn ($department) => max(0, (int) $department->departmentPositions->sum('approved_headcount')));
        $current = (int) $rows->sum('current_employees_count');

        if ($approved <= 0) {
            return null;
        }

        return (int) round(min($current, $approved) / $approved * 100);
    }

    private function visibleChangeRequests(User $user)
    {
        return ChangeRequest::query()
            ->when(! $user->hasRole(['admin', 'general_manager']), function ($query) use ($user) {
                $query->where(function ($scope) use ($user) {
                    $scope->where('requested_by', $user->id);

                    if ($user->department_id) {
                        $scope->orWhere('department_id', $user->department_id);
                    }
                });
            });
    }

    private function visibleFeedbackItems(User $user)
    {
        return PilotFeedbackItem::query()
            ->when(! $user->hasRole(['admin', 'general_manager']), function ($query) use ($user) {
                $query->where(function ($scope) use ($user) {
                    $scope
                        ->where('created_by', $user->id)
                        ->orWhere('assigned_user_id', $user->id);

                    if ($user->department_id) {
                        $scope->orWhere('assigned_department_id', $user->department_id);
                    }
                });
            });
    }

    private function canSeeHr(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission(['view_users', 'create_user', 'edit_user'])
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function canSeeSales(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager'])
            || $user->hasPermission(['view_sales_orders', 'view_customers'])
            || $user->department?->code === 'sales';
    }

    private function canSeePurchasing(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager'])
            || $user->hasPermission(['view_purchasing', 'manage_suppliers'])
            || $user->department?->code === 'purchasing';
    }

    private function line(string $language, string $ar, string $en): string
    {
        return $language === 'en' ? $en : $ar;
    }

    private function item(string $label, string $routeName, array $routeParams = [], ?string $detail = null): array
    {
        $item = [
            'label' => $label,
            'url' => route($routeName, $routeParams),
        ];

        if ($detail) {
            $item['detail'] = $detail;
        }

        return $item;
    }

    private function focusParams($query, ?string $type = null): array
    {
        $id = (clone $query)->value('id');
        $params = [];

        if ($id !== null) {
            $params['focus'] = $id;
        }

        if ($type !== null) {
            $params['focus_type'] = $type;
        }

        return $params;
    }

    private function itemText(array|string $item): string
    {
        if (! is_array($item)) {
            return (string) $item;
        }

        return trim((string) ($item['label'] ?? '').' '.(string) ($item['detail'] ?? ''));
    }

    private function samples($query, callable $formatter, int $limit = 3): array
    {
        return (clone $query)
            ->limit($limit)
            ->get()
            ->map(fn ($item) => trim((string) $formatter($item)))
            ->filter()
            ->values()
            ->all();
    }

    private function detail(string $language, string $arTitle, string $enTitle, array $samples, ?int $total = null): ?string
    {
        $samples = array_values(array_filter($samples));

        if ($samples === []) {
            return null;
        }

        $remaining = $total !== null ? max(0, $total - count($samples)) : 0;
        $suffix = $remaining > 0
            ? $this->line($language, "، وباقي {$remaining}.", ", and {$remaining} more.")
            : '.';

        return $this->line($language, $arTitle, $enTitle).': '.implode(' | ', $samples).$suffix;
    }

    private function spokenText(string $language, string $name, array $completed, array $pending, array $alerts): string
    {
        $intro = $language === 'en'
            ? "Hello {$name}. Here is your daily summary."
            : "مرحبًا {$name}. هذا ملخصك اليومي.";

        $completedText = count($completed) > 0
            ? implode(' ', array_map(fn ($item) => $this->itemText($item), $completed))
            : $this->line($language, 'لا توجد إنجازات ظاهرة لك حتى الآن اليوم.', 'No visible completed work for you yet today.');

        $pendingText = count($pending) > 0
            ? implode(' ', array_map(fn ($item) => $this->itemText($item), $pending))
            : $this->line($language, 'لا توجد مهام متابعة ظاهرة لك الآن.', 'No visible pending follow-up items for you now.');

        $alertsText = count($alerts) > 0
            ? implode(' ', array_map(fn ($item) => $this->itemText($item), $alerts))
            : $this->line($language, 'لا توجد تنبيهات حرجة ظاهرة لك الآن.', 'No critical visible alerts for you now.');

        if ($language === 'en') {
            return "{$intro} Completed today: {$completedText} Still pending: {$pendingText} Alerts: {$alertsText}";
        }

        return "{$intro} ما تم اليوم: {$completedText} ما زال مطلوبًا: {$pendingText} التنبيهات: {$alertsText}";
    }
}
