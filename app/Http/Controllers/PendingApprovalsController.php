<?php

namespace App\Http\Controllers;

use App\Models\ChangeRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PendingApprovalsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user()->load(['department', 'position', 'role']);
        $query = ChangeRequest::query()
            ->with(['requester:id,name,department_id', 'requester.department:id,name,code', 'department:id,name,code', 'officerApprover:id,name', 'managerApprover:id,name', 'executor:id,name'])
            ->whereIn('status', ['pending_department_officer', 'pending_department_manager', 'pending_general_manager'])
            ->where(function ($approvals) use ($user) {
                if ($user->hasRole(['admin', 'general_manager'])) {
                    $approvals->where('status', 'pending_general_manager');

                    return;
                }

                $approvals->where('department_id', $user->department_id);

                if (str_ends_with((string) $user->position?->code, '_officer')) {
                    $approvals->where('status', 'pending_department_officer');
                } elseif (str_ends_with((string) $user->position?->code, '_manager')) {
                    $approvals->where('status', 'pending_department_manager');
                } else {
                    $approvals->whereRaw('1 = 0');
                }
            });

        $requests = (clone $query)->latest()->get();

        return Inertia::render('PendingApprovals/Index', [
            'metrics' => [
                'pending' => $requests->count(),
                'critical' => $requests->where('risk_level', 'critical')->count(),
                'today' => $requests->filter(fn ($item) => $item->created_at?->isToday())->count(),
                'overdue' => $requests->filter(fn ($item) => $item->created_at?->lt(now()->subDay()))->count(),
            ],
            'requests' => $requests->values(),
        ]);
    }
}
