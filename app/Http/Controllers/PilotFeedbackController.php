<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\PilotFeedbackItem;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PilotFeedbackController extends Controller
{
    private const TYPES = ['problem', 'suggestion', 'improvement'];
    private const CATEGORIES = ['bugs', 'improvements', 'user_requests', 'missing_permissions', 'required_reports', 'screen_changes'];
    private const PRIORITIES = ['low', 'medium', 'high'];
    private const STATUSES = ['new', 'in_review', 'resolved', 'rejected', 'deferred'];

    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function index(Request $request): Response|JsonResponse
    {
        $query = $this->visibleFeedback($request->user())
            ->with(['creator:id,name,department_id', 'creator.department:id,name,code', 'assignedDepartment:id,name,code', 'assignedUser:id,name'])
            ->when($request->boolean('trash'), fn ($items) => $items->onlyTrashed())
            ->when($request->filled('status'), fn ($items) => $items->where('status', $request->input('status')))
            ->when($request->filled('finding_category'), fn ($items) => $items->where('finding_category', $request->input('finding_category')))
            ->when($request->filled('priority'), fn ($items) => $items->where('priority', $request->input('priority')))
            ->latest();

        if ($request->expectsJson()) {
            return response()->json([
                'items' => $query->limit(50)->get(),
            ]);
        }

        return Inertia::render('PilotFeedback/Index', [
            'items' => $query->paginate(100)->through(fn ($item) => $item),
            'departments' => Department::query()->where('active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'users' => User::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'department_id']),
            'filters' => $request->only(['status', 'finding_category', 'priority', 'trash']),
            'canManageAll' => $this->canManageAll($request->user()),
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $data = $this->validated($request);
        $data['created_by'] = $request->user()->id;
        $data += $this->suggestions($data);

        $item = PilotFeedbackItem::create($data)->load(['creator:id,name', 'assignedDepartment:id,name,code', 'assignedUser:id,name']);

        if ($item->priority === 'high') {
            $this->notifyHighPriority($item, $request->user());
        }

        if ($request->expectsJson()) {
            return response()->json(['item' => $item], 201);
        }

        return back()->with('success', 'Pilot feedback saved.');
    }

    public function update(Request $request, PilotFeedbackItem $pilotFeedback): RedirectResponse|JsonResponse
    {
        abort_unless($this->canUpdate($request->user(), $pilotFeedback), 403);

        $data = $this->validated($request, partial: true);

        if (array_key_exists('status', $data)) {
            $data['reviewed_at'] = $pilotFeedback->reviewed_at ?? now();
            $data['closed_at'] = in_array($data['status'], ['resolved', 'rejected'], true) ? now() : null;
        }

        $pilotFeedback->update($data + $this->suggestions($data + $pilotFeedback->only(['title', 'description', 'page'])));

        if ($request->expectsJson()) {
            return response()->json(['item' => $pilotFeedback->fresh(['creator:id,name', 'assignedDepartment:id,name,code', 'assignedUser:id,name'])]);
        }

        return back()->with('success', 'Pilot feedback updated.');
    }

    public function destroy(Request $request, PilotFeedbackItem $pilotFeedback): RedirectResponse
    {
        abort_unless($this->canUpdate($request->user(), $pilotFeedback), 403);

        $pilotFeedback->delete();

        return back()->with('success', 'Pilot feedback moved to trash.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']])['ids'];

        $this->visibleFeedback($request->user())->whereIn('id', $ids)->get()->each(function (PilotFeedbackItem $item) use ($request): void {
            if ($this->canUpdate($request->user(), $item)) {
                $item->delete();
            }
        });

        return back()->with('success', 'Selected feedback moved to trash.');
    }

    public function restore(Request $request, int $id): RedirectResponse
    {
        $item = PilotFeedbackItem::withTrashed()->findOrFail($id);
        abort_unless($this->canUpdate($request->user(), $item), 403);

        $item->restore();

        return back()->with('success', 'Pilot feedback restored.');
    }

    public function export(Request $request, string $format)
    {
        abort_unless(in_array($format, ['json', 'excel', 'word', 'pdf'], true), 404);

        $items = $this->visibleFeedback($request->user())
            ->with(['creator:id,name', 'assignedDepartment:id,name,code', 'assignedUser:id,name'])
            ->latest()
            ->get();
        $language = $request->query('lang') === 'en' ? 'en' : 'ar';

        if ($format === 'json') {
            return response()->json($items)->header('Content-Disposition', 'attachment; filename="pilot-feedback.json"');
        }

        $rows = $items->map(fn ($item) => [
            $item->title,
            $item->description,
            $item->page,
            $item->creator?->name,
            $item->assignedDepartment?->name,
            $item->assignedUser?->name,
            $item->priority,
            $item->status,
            $item->finding_category,
            $item->created_at?->format('Y-m-d H:i'),
            $item->closed_at?->format('Y-m-d H:i'),
            $item->ai_owner_suggestion,
            $item->ai_risk_suggestion,
            $item->ai_resolution_suggestion,
        ]);
        $headings = ['Title', 'Description', 'Page', 'Created By', 'Department', 'Owner', 'Priority', 'Status', 'Category', 'Created At', 'Closed At', 'Suggested Owner', 'Suggested Risk', 'Suggested Resolution'];

        if ($format === 'excel') {
            $html = view('exports.excel', compact('language', 'headings', 'rows'))->render();

            return response($html, 200, [
                'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="pilot-feedback.xls"',
            ]);
        }

        $html = view('exports.excel', compact('language', 'headings', 'rows'))->render();

        return response($html, 200, [
            'Content-Type' => $format === 'word' ? 'application/msword; charset=UTF-8' : 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="pilot-feedback.'.($format === 'word' ? 'doc' : 'html').'"',
        ]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:160'],
            'description' => [$required, 'string', 'max:5000'],
            'page' => ['nullable', 'string', 'max:160'],
            'type' => [$required, 'string', 'in:'.implode(',', self::TYPES)],
            'finding_category' => [$required, 'string', 'in:'.implode(',', self::CATEGORIES)],
            'priority' => [$required, 'string', 'in:'.implode(',', self::PRIORITIES)],
            'status' => ['sometimes', 'string', 'in:'.implode(',', self::STATUSES)],
            'assigned_department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'resolution_notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    private function visibleFeedback(User $user)
    {
        if ($this->canManageAll($user)) {
            return PilotFeedbackItem::query();
        }

        return PilotFeedbackItem::query()->where(function ($query) use ($user) {
            $query
                ->where('created_by', $user->id)
                ->orWhere('assigned_user_id', $user->id)
                ->orWhere('assigned_department_id', $user->department_id);
        });
    }

    private function canManageAll(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager'])
            || $user->hasPermission(['view_governance_center', 'view_audit_logs']);
    }

    private function canUpdate(User $user, PilotFeedbackItem $item): bool
    {
        return $this->canManageAll($user)
            || (int) $item->created_by === (int) $user->id
            || (int) $item->assigned_user_id === (int) $user->id;
    }

    private function notifyHighPriority(PilotFeedbackItem $item, User $sender): void
    {
        $recipients = User::query()
            ->where('status', 'active')
            ->where(function ($query) use ($item) {
                $query
                    ->whereHas('role', fn ($role) => $role->whereIn('slug', ['admin', 'general_manager']))
                    ->when($item->assigned_department_id, fn ($users) => $users->orWhere('department_id', $item->assigned_department_id));
            })
            ->get();

        $this->notifications->sendToUsers(
            $recipients,
            "High priority pilot feedback: {$item->title}",
            $item->description,
            route('pilot-feedback.index'),
            $sender,
        );
    }

    private function suggestions(array $data): array
    {
        $text = mb_strtolower(($data['title'] ?? '').' '.($data['description'] ?? '').' '.($data['page'] ?? ''));
        $owner = str_contains($text, 'راتب') || str_contains($text, 'payroll') ? 'HR / Finance'
            : (str_contains($text, 'عميل') || str_contains($text, 'sales') ? 'Sales'
            : (str_contains($text, 'مورد') || str_contains($text, 'purchase') ? 'Purchasing'
            : (str_contains($text, 'صلاح') || str_contains($text, 'permission') ? 'Admin'
            : 'IT')));

        return [
            'ai_owner_suggestion' => $owner,
            'ai_risk_suggestion' => $data['priority'] ?? 'medium',
            'ai_resolution_suggestion' => 'Review the reported screen, reproduce the step, then decide whether this is a bug, permission adjustment, report request, or UI improvement.',
        ];
    }
}
