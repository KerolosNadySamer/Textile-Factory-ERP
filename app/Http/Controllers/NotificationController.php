<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Notifications/Index', [
            'notifications' => AppNotification::query()
                ->with(['sender:id,name,department_id', 'sender.department:id,name,code', 'senderDepartment:id,name,code'])
                ->where('recipient_user_id', $request->user()->id)
                ->latest()
                ->limit(100)
                ->get(),
        ]);
    }

    public function markRead(Request $request, AppNotification $notification): RedirectResponse
    {
        abort_unless($notification->recipient_user_id === $request->user()->id, 403);

        $notification->update(['read_at' => now()]);

        if ($notification->link) {
            return redirect($notification->link);
        }

        return back();
    }
}
