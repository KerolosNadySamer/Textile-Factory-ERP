<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\EmployeeMonthlyReview;
use App\Models\PayrollBatch;
use App\Models\RecruitmentRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SystemAssistantFindingsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role.permissions', 'department', 'position']);
        $language = $request->query('lang') === 'en' ? 'en' : 'ar';
        $findings = [];

        if ($this->canSeeHr($user)) {
            $findings['employees_without_position'] = $this->finding(
                $this->employeeQuery()
                    ->with(['department:id,name,code'])
                    ->whereNull('position_id')
                    ->latest(),
                fn (User $employee) => $this->employeeLabel($employee, $language),
                'users.index'
            );

            $findings['employees_without_manager'] = $this->finding(
                $this->employeeQuery()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->whereNull('manager_id')
                    ->latest(),
                fn (User $employee) => $this->employeeLabel($employee, $language),
                'users.index'
            );

            $findings['inactive_accounts'] = $this->finding(
                User::query()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->where('status', 'active')
                    ->where('login_enabled', false)
                    ->latest(),
                fn (User $employee) => $this->employeeLabel($employee, $language),
                'users.index'
            );

            $findings['incomplete_data'] = $this->finding(
                $this->employeeQuery()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->where(function ($query) {
                        $query
                            ->whereNull('employee_code')
                            ->orWhere('employee_code', '')
                            ->orWhereNull('department_id')
                            ->orWhereNull('position_id');
                    })
                    ->latest(),
                fn (User $employee) => $this->employeeLabel($employee, $language),
                'employee-coding-coverage.index'
            );

            $findings['delayed_recruitment_requests'] = $this->finding(
                RecruitmentRequest::query()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->whereNotIn('status', ['rejected', 'cancelled', 'hired', 'employee_created'])
                    ->where('created_at', '<=', now()->subDays(3))
                    ->latest(),
                fn (RecruitmentRequest $item) => trim(implode(' - ', array_filter([
                    $item->request_number,
                    $item->department?->name,
                    $item->position?->name,
                    $item->status,
                ]))),
                'department-hiring-requests.index'
            );

            $reviewMonth = now()->subMonthNoOverflow()->startOfMonth()->toDateString();
            $reviewedEmployeeIds = EmployeeMonthlyReview::query()
                ->whereDate('review_month', $reviewMonth)
                ->pluck('user_id');
            $findings['delayed_reviews'] = $this->finding(
                $this->employeeQuery()
                    ->with(['department:id,name,code', 'position:id,name,code'])
                    ->whereNotIn('id', $reviewedEmployeeIds)
                    ->oldest('name'),
                fn (User $employee) => $this->employeeLabel($employee, $language),
                'employee-monthly-reviews.index'
            );
        }

        if ($user->hasPermission('view_departments') || $user->hasRole(['admin', 'general_manager', 'hr'])) {
            $findings['departments_without_manager'] = $this->finding(
                Department::query()
                    ->officialActive()
                    ->whereNull('direct_manager_id')
                    ->oldest('name'),
                fn (Department $department) => trim("{$department->code} - {$department->name}", ' -'),
                'department-staffing.index'
            );
        }

        if ($this->canSeePayroll($user)) {
            $findings['payroll_pending_approval'] = $this->finding(
                PayrollBatch::query()
                    ->whereIn('status', ['submitted', 'hr_reviewed', 'hr_approved'])
                    ->latest('payroll_month')
                    ->latest(),
                fn (PayrollBatch $batch) => trim(implode(' - ', array_filter([
                    $batch->batch_number,
                    $batch->payroll_month instanceof Carbon ? $batch->payroll_month->format('Y-m') : null,
                    $batch->status,
                ]))),
                'payroll.index'
            );
        }

        return response()->json([
            'generatedAt' => now()->toIso8601String(),
            'findings' => $findings,
        ]);
    }

    private function finding($query, callable $formatter, string $routeName): array
    {
        $count = (clone $query)->count();
        $firstId = (clone $query)->value('id');

        return [
            'count' => $count,
            'samples' => (clone $query)
                ->limit(5)
                ->get()
                ->map(fn ($item) => trim((string) $formatter($item)))
                ->filter()
                ->values(),
            'url' => route($routeName, $firstId ? ['focus' => $firstId] : []),
        ];
    }

    private function employeeQuery()
    {
        return User::query()
            ->where('status', 'active')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'));
    }

    private function employeeLabel(User $employee, string $language): string
    {
        return trim(implode(' - ', array_filter([
            $employee->employee_code,
            $employee->name,
            $language === 'en' ? $employee->department?->code : $employee->department?->name,
            $employee->position?->name,
        ])));
    }

    private function canSeeHr(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr'])
            || $user->hasPermission(['view_users', 'create_user', 'edit_user'])
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function canSeePayroll(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr', 'accounting'])
            || $user->hasPermission(['view_finance', 'view_users']);
    }
}
