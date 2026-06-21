<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * @param  array<int, string>  $roleSlugs
     */
    public function sendToRoles(array $roleSlugs, string $title, ?string $body = null, ?string $link = null, ?User $sender = null): void
    {
        $this->sendToUsers(
            User::query()
                ->with('department')
                ->whereHas('role', fn ($query) => $query->whereIn('slug', $roleSlugs))
                ->get(),
            $title,
            $body,
            $link,
            $sender,
        );
    }

    /**
     * @param  Collection<int, User>  $users
     */
    public function sendToUsers(Collection $users, string $title, ?string $body = null, ?string $link = null, ?User $sender = null): void
    {
        $users
            ->unique('id')
            ->each(function (User $recipient) use ($title, $body, $link, $sender): void {
                AppNotification::create([
                    'recipient_user_id' => $recipient->id,
                    'recipient_department_id' => $recipient->department_id,
                    'sender_user_id' => $sender?->id,
                    'sender_department_id' => $sender?->department_id,
                    'title' => $title,
                    'body' => $body,
                    'link' => $link,
                ]);
            });
    }
}
