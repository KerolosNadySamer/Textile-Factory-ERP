<?php

namespace App\Services;

use App\Models\User;

class ContractExpiryNotificationService
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {
    }

    public function notifyDue(?User $sender = null): int
    {
        $sent = 0;

        User::query()
            ->where('employment_type', 'part_time')
            ->where('status', 'active')
            ->whereNotNull('contract_end_date')
            ->whereNull('contract_expiry_notified_at')
            ->whereDate('contract_end_date', '>=', today())
            ->whereDate('contract_end_date', '<=', today()->addDays(180))
            ->get()
            ->filter(function (User $employee): bool {
                $daysRemaining = today()->diffInDays($employee->contract_end_date, false);

                return $daysRemaining >= 0
                    && $daysRemaining <= (int) ($employee->contract_expiry_notice_days ?? 180);
            })
            ->each(function (User $employee) use ($sender, &$sent): void {
                $endDate = $employee->contract_end_date?->format('Y-m-d');
                $link = $employee->department_id
                    ? route('employee-coding.department', $employee->department_id)
                    : route('users.index');

                $this->notifications->sendToRoles(
                    ['hr'],
                    "تنبيه قرب انتهاء عقد {$employee->name}",
                    "ينتهي عقد الموظف {$employee->employee_code} بتاريخ {$endDate}. راجع قرار التجديد أو الاستغناء قبل انتهاء مدة التعاقد.",
                    $link,
                    $sender,
                );

                $employee->update(['contract_expiry_notified_at' => now()]);
                $sent++;
            });

        return $sent;
    }
}
