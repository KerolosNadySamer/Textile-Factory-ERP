<?php

namespace App\Http\Controllers;

use App\Models\EmployeeMonthlyReview;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeMonthlyReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $employees = $this->manageableEmployees($request->user())
            ->orderBy('name')
            ->get(['id', 'employee_code', 'name', 'department_id', 'position_id', 'basic_salary', 'status'])
            ->load(['department:id,name', 'position:id,name']);

        return Inertia::render('EmployeeMonthlyReviews/Index', [
            'employees' => $employees,
            'reviews' => EmployeeMonthlyReview::query()
                ->with(['employee:id,employee_code,name,department_id,position_id', 'employee.department:id,name', 'employee.position:id,name', 'reviewer:id,name'])
                ->whereIn('user_id', $employees->pluck('id'))
                ->latest('review_month')
                ->latest()
                ->limit(200)
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $employee = User::findOrFail($data['user_id']);

        abort_unless($this->canManageEmployee($request->user(), $employee), 403);

        $month = Carbon::parse($data['review_month'])->startOfMonth()->toDateString();

        EmployeeMonthlyReview::updateOrCreate(
            [
                'user_id' => $employee->id,
                'review_month' => $month,
            ],
            [
                'salary_snapshot' => $data['salary_snapshot'] ?? $employee->basic_salary,
                'evaluation_score' => $data['evaluation_score'] ?? null,
                'rating' => $data['rating'] ?? null,
                'notes' => $data['notes'] ?? null,
                'strengths' => $data['strengths'] ?? null,
                'improvements' => $data['improvements'] ?? null,
                'reviewed_by' => $request->user()->id,
                'visible_to_employee' => filter_var($data['visible_to_employee'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ],
        );

        return back()->with('success', 'Monthly employee review saved.');
    }

    public function myReviews(Request $request): Response
    {
        $user = $request->user()->load(['department:id,name', 'position:id,name', 'role:id,name,name_ar,name_en,slug']);

        return Inertia::render('EmployeeMonthlyReviews/MyReviews', [
            'employee' => [
                'id' => $user->id,
                'employee_code' => $user->employee_code,
                'name' => $user->name,
                'basic_salary' => $user->basic_salary,
                'status' => $user->status,
                'department' => $user->department,
                'position' => $user->position,
                'role' => $user->role,
                'is_maintenance_account' => $user->hasRole('admin'),
            ],
            'reviews' => EmployeeMonthlyReview::query()
                ->with('reviewer:id,name')
                ->where('user_id', $user->id)
                ->when($user->hasRole('admin'), fn ($query) => $query->whereRaw('1 = 0'))
                ->where('visible_to_employee', true)
                ->latest('review_month')
                ->get(),
        ]);
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'review_month' => ['required', 'date'],
            'salary_snapshot' => ['nullable', 'numeric', 'min:0'],
            'evaluation_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'rating' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'strengths' => ['nullable', 'string', 'max:2000'],
            'improvements' => ['nullable', 'string', 'max:2000'],
            'visible_to_employee' => ['required', Rule::in([true, false, 1, 0, '1', '0'])],
        ]);
    }

    private function manageableEmployees(User $manager)
    {
        $query = User::query()
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'));

        if ($manager->hasRole(['admin', 'general_manager', 'hr']) || $manager->position?->code === 'hr_manager') {
            return $query;
        }

        return $query
            ->where(function ($query) use ($manager) {
                $query
                    ->where('manager_id', $manager->id)
                    ->orWhereHas('managers', fn ($managers) => $managers->where('users.id', $manager->id));
            });
    }

    private function canManageEmployee(User $manager, User $employee): bool
    {
        return $this->manageableEmployees($manager)
            ->whereKey($employee->id)
            ->exists();
    }
}
