<?php

namespace App\Console\Commands;

use App\Services\ContractExpiryNotificationService;
use Illuminate\Console\Command;

class NotifyExpiringRecruitmentContracts extends Command
{
    protected $signature = 'contracts:notify-expiring';

    protected $description = 'Notify HR about part-time employee contracts that are close to expiry.';

    public function handle(ContractExpiryNotificationService $notifier): int
    {
        $count = $notifier->notifyDue();

        $this->info("Sent {$count} employee contract expiry notification(s).");

        return self::SUCCESS;
    }
}
