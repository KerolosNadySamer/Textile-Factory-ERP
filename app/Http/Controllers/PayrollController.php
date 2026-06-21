<?php

namespace App\Http\Controllers;

use App\Models\PayrollBatch;
use App\Models\PayrollItem;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($this->canView($request->user()), 403);

        return Inertia::render('Payroll/Index', [
            'employees' => $this->employeeQuery()
                ->with(['department:id,name', 'position:id,name'])
                ->orderBy('name')
                ->get(['id', 'employee_code', 'name', 'department_id', 'position_id', 'basic_salary', 'status']),
            'batches' => PayrollBatch::query()
                ->with(['uploader:id,name', 'items.employee:id,employee_code,name,department_id,position_id', 'items.employee.department:id,name', 'items.employee.position:id,name'])
                ->latest('payroll_month')
                ->latest()
                ->limit(60)
                ->get()
                ->map(fn (PayrollBatch $batch) => $this->serializeBatch($batch)),
            'metrics' => [
                'openBatches' => PayrollBatch::query()->whereNotIn('status', ['executed', 'rejected'])->count(),
                'pendingHr' => PayrollBatch::query()->whereIn('status', ['submitted', 'hr_reviewed'])->count(),
                'pendingGeneralManager' => PayrollBatch::query()->where('status', 'hr_approved')->count(),
                'executedThisMonth' => PayrollBatch::query()
                    ->where('status', 'executed')
                    ->whereDate('payroll_month', now()->startOfMonth())
                    ->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->canUpload($request->user()), 403);

        $data = $request->validate([
            'payroll_month' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'items.*.basic_salary' => ['required', 'numeric', 'min:0'],
            'items.*.allowances' => ['nullable', 'numeric', 'min:0'],
            'items.*.overtime' => ['nullable', 'numeric', 'min:0'],
            'items.*.bonuses' => ['nullable', 'numeric', 'min:0'],
            'items.*.deductions' => ['nullable', 'numeric', 'min:0'],
            'items.*.insurance' => ['nullable', 'numeric', 'min:0'],
            'items.*.taxes' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $month = Carbon::parse($data['payroll_month'])->startOfMonth();

        $batch = PayrollBatch::create([
            'batch_number' => $this->nextBatchNumber(),
            'payroll_month' => $month->toDateString(),
            'status' => 'submitted',
            'notes' => $data['notes'] ?? null,
            'uploaded_by' => $request->user()->id,
            'uploaded_at' => now(),
        ]);

        foreach ($data['items'] as $item) {
            $this->storeItem($batch, $item);
        }

        return back()->with('success', 'Payroll batch uploaded for HR review.');
    }

    public function updateItem(Request $request, PayrollItem $item): RedirectResponse
    {
        abort_unless($this->canUpload($request->user()) && in_array($item->batch->status, ['submitted', 'hr_reviewed'], true), 403);

        $data = $request->validate([
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'allowances' => ['nullable', 'numeric', 'min:0'],
            'overtime' => ['nullable', 'numeric', 'min:0'],
            'bonuses' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
            'insurance' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $item->update($this->calculatedItemData($data));

        return back()->with('success', 'Payroll item updated.');
    }

    public function review(Request $request, PayrollBatch $batch): RedirectResponse
    {
        abort_unless($this->isHrUser($request->user()) && $batch->status === 'submitted', 403);

        $batch->update([
            'status' => 'hr_reviewed',
            'hr_reviewed_by' => $request->user()->id,
            'hr_reviewed_at' => now(),
        ]);

        return back()->with('success', 'Payroll reviewed by HR.');
    }

    public function approveHr(Request $request, PayrollBatch $batch): RedirectResponse
    {
        abort_unless($this->isHrUser($request->user()) && in_array($batch->status, ['submitted', 'hr_reviewed'], true), 403);

        $batch->update([
            'status' => 'hr_approved',
            'hr_approved_by' => $request->user()->id,
            'hr_approved_at' => now(),
        ]);

        return back()->with('success', 'Payroll approved by HR.');
    }

    public function approveGeneralManager(Request $request, PayrollBatch $batch): RedirectResponse
    {
        abort_unless($request->user()->hasRole(['admin', 'general_manager']) && $batch->status === 'hr_approved', 403);

        $batch->update([
            'status' => 'executed',
            'general_manager_approved_by' => $request->user()->id,
            'general_manager_approved_at' => now(),
            'executed_at' => now(),
        ]);

        return back()->with('success', 'Payroll approved and executed.');
    }

    public function reject(Request $request, PayrollBatch $batch): RedirectResponse
    {
        abort_unless($this->canView($request->user()) && ! in_array($batch->status, ['executed', 'rejected'], true), 403);

        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $batch->update([
            'status' => 'rejected',
            'rejected_by' => $request->user()->id,
            'rejected_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return back()->with('success', 'Payroll rejected.');
    }

    public function mine(Request $request): Response
    {
        $items = PayrollItem::query()
            ->with('batch:id,batch_number,payroll_month,status,executed_at')
            ->where('user_id', $request->user()->id)
            ->whereHas('batch', fn ($query) => $query->where('status', 'executed'))
            ->latest()
            ->limit(24)
            ->get();

        return Inertia::render('Payroll/MyPayroll', [
            'employee' => $request->user()->only(['id', 'employee_code', 'name', 'basic_salary']),
            'items' => $items,
        ]);
    }

    private function storeItem(PayrollBatch $batch, array $item): void
    {
        $batch->items()->updateOrCreate(
            ['user_id' => $item['user_id']],
            $this->calculatedItemData($item),
        );
    }

    private function calculatedItemData(array $item): array
    {
        $basic = (float) ($item['basic_salary'] ?? 0);
        $allowances = (float) ($item['allowances'] ?? 0);
        $overtime = (float) ($item['overtime'] ?? 0);
        $bonuses = (float) ($item['bonuses'] ?? 0);
        $deductions = (float) ($item['deductions'] ?? 0);
        $insurance = (float) ($item['insurance'] ?? 0);
        $taxes = (float) ($item['taxes'] ?? 0);

        return [
            'basic_salary' => $basic,
            'allowances' => $allowances,
            'overtime' => $overtime,
            'bonuses' => $bonuses,
            'deductions' => $deductions,
            'insurance' => $insurance,
            'taxes' => $taxes,
            'net_salary' => max(0, $basic + $allowances + $overtime + $bonuses - $deductions - $insurance - $taxes),
            'notes' => $item['notes'] ?? null,
        ];
    }

    private function serializeBatch(PayrollBatch $batch): array
    {
        return [
            'id' => $batch->id,
            'batch_number' => $batch->batch_number,
            'payroll_month' => $batch->payroll_month?->format('Y-m-d'),
            'status' => $batch->status,
            'notes' => $batch->notes,
            'uploader' => $batch->uploader,
            'items_count' => $batch->items->count(),
            'gross_total' => $batch->items->sum(fn (PayrollItem $item) => (float) $item->basic_salary + (float) $item->allowances + (float) $item->overtime + (float) $item->bonuses),
            'deductions_total' => $batch->items->sum(fn (PayrollItem $item) => (float) $item->deductions + (float) $item->insurance + (float) $item->taxes),
            'net_total' => $batch->items->sum('net_salary'),
            'items' => $batch->items,
        ];
    }

    private function employeeQuery()
    {
        return User::query()->whereDoesntHave('role', fn ($role) => $role->where('slug', 'admin'));
    }

    private function canView(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager', 'hr', 'accounting'])
            || $user->hasPermission('view_finance')
            || $user->hasPermission('view_users');
    }

    private function canUpload(User $user): bool
    {
        return $user->hasRole(['admin', 'accounting'])
            || $user->hasPermission('edit_finance');
    }

    private function isHrUser(User $user): bool
    {
        return $user->department?->code === 'hr'
            || $user->hasRole(['admin', 'hr'])
            || in_array($user->position?->code, ['hr_manager', 'hr_officer'], true);
    }

    private function nextBatchNumber(): string
    {
        return 'PAY-'.now()->format('Ymd').'-'.str_pad((string) (PayrollBatch::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT);
    }
}
