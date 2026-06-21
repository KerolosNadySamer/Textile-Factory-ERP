<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserSwitchController extends Controller
{
    public function candidates(Request $request)
    {
        $currentUserId = $request->user()->id;
        $browserRecentIds = collect(explode(',', (string) $request->header('X-Recent-User-Ids')))
            ->map(fn ($id) => (int) trim($id))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->take(10)
            ->values();
        $deviceId = (string) $request->header('X-Device-Id');
        $auditRecentIds = collect();

        if ($deviceId !== '') {
            $auditRecentIds = ActivityLog::query()
                ->where('action', 'user_switch')
                ->where('new_values->device_id', $deviceId)
                ->latest()
                ->limit(20)
                ->get()
                ->pluck('new_values.to_user_id')
                ->map(fn ($id) => (int) $id)
                ->filter();
        }

        $recentIds = $browserRecentIds
            ->merge($auditRecentIds)
            ->unique()
            ->take(10)
            ->values();

        $users = User::query()
            ->with(['role:id,name,slug', 'department:id,name,code', 'position:id,name,code'])
            ->where('id', '!=', $currentUserId)
            ->whereNull('customer_id')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'customer'))
            ->where('status', 'active')
            ->where('login_enabled', true)
            ->whereNotNull('password')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role_id', 'department_id', 'position_id']);

        $recentUsers = $users
            ->whereIn('id', $recentIds)
            ->sortBy(fn (User $user) => $recentIds->search($user->id))
            ->values();

        return response()->json([
            'recentUsers' => $recentUsers->map(fn (User $user) => $this->serializeUser($user))->values(),
            'users' => $users->map(fn (User $user) => $this->serializeUser($user))->values(),
        ]);
    }

    public function switch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'password' => ['required', 'string'],
            'device_id' => ['nullable', 'string', 'max:100'],
        ]);

        $fromUser = $request->user();
        $toUser = User::query()
            ->with(['role:id,name,slug', 'department:id,name,code', 'position:id,name,code'])
            ->whereKey($validated['user_id'])
            ->whereNull('customer_id')
            ->whereDoesntHave('role', fn ($role) => $role->where('slug', 'customer'))
            ->where('status', 'active')
            ->where('login_enabled', true)
            ->whereNotNull('password')
            ->first();

        if (! $toUser || ! Hash::check($validated['password'], $toUser->password)) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        if ($fromUser->id === $toUser->id) {
            return back()->with('success', 'User is already signed in.');
        }

        ActivityLog::create([
            'user_id' => $fromUser->id,
            'action' => 'user_switch',
            'model_type' => User::class,
            'model_id' => $toUser->id,
            'old_values' => [
                'from_user_id' => $fromUser->id,
                'from_user_name' => $fromUser->name,
                'from_user_email' => $fromUser->email,
            ],
            'new_values' => [
                'to_user_id' => $toUser->id,
                'to_user_name' => $toUser->name,
                'to_user_email' => $toUser->email,
                'device_id' => $validated['device_id'] ?? null,
                'device' => $request->userAgent(),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        Auth::guard('web')->login($toUser);
        $request->session()->regenerate();

        return redirect()->intended(RouteServiceProvider::HOME);
    }

    public function history(Request $request): Response
    {
        $logs = ActivityLog::query()
            ->with('user:id,name,email')
            ->where('action', 'user_switch')
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('UserSwitchHistory/Index', [
            'logs' => $logs,
        ]);
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->name,
            'department' => $user->department?->name,
            'position' => $user->position?->name,
        ];
    }
}
