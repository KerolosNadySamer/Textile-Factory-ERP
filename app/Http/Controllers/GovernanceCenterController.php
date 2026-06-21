<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ChangeRequest;
use Inertia\Inertia;
use Inertia\Response;

class GovernanceCenterController extends Controller
{
    public function __invoke(): Response
    {
        $changeRequests = ChangeRequest::query()
            ->with(['requester:id,name', 'department:id,name,code', 'officerApprover:id,name', 'managerApprover:id,name', 'rejecter:id,name'])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('Governance/Index', [
            'metrics' => [
                'pending' => ChangeRequest::query()->whereIn('status', ['pending_department_officer', 'pending_department_manager'])->count(),
                'executed' => ChangeRequest::query()->where('status', 'executed')->count(),
                'rejected' => ChangeRequest::query()->where('status', 'rejected')->count(),
                'criticalActions' => ActivityLog::query()->whereIn('action', ['deleted', 'updated'])->count(),
            ],
            'changeRequests' => $changeRequests,
            'criticalActions' => ActivityLog::query()
                ->with('user:id,name')
                ->whereIn('action', ['deleted', 'updated'])
                ->latest()
                ->limit(20)
                ->get(),
        ]);
    }
}
