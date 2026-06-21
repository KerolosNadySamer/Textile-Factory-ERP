<?php

namespace App\Console\Commands;

use App\Models\SystemBackup;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class RestoreSystemBackupFile extends Command
{
    protected $signature = 'system:restore-backup-file {file : Backup file name or path under storage/app/backups} {--force : Confirm destructive restore}';

    protected $description = 'Restore a system JSON backup file after writing a pre-restore snapshot.';

    public function handle(): int
    {
        if (! $this->option('force')) {
            $this->error('This command replaces current table data. Re-run with --force when you are sure.');

            return self::FAILURE;
        }

        $relativePath = $this->normalizePath((string) $this->argument('file'));

        if (! Storage::disk('local')->exists($relativePath)) {
            $this->error("Backup file not found: {$relativePath}");

            return self::FAILURE;
        }

        $payload = json_decode(Storage::disk('local')->get($relativePath), true);

        if (! is_array($payload) || ! isset($payload['tables']) || ! is_array($payload['tables'])) {
            $this->error('Backup payload is invalid.');

            return self::FAILURE;
        }

        $snapshotPath = $this->writeCurrentSnapshot();

        Schema::disableForeignKeyConstraints();

        try {
            foreach (array_reverse(array_keys($payload['tables'])) as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->truncate();
                }
            }

            foreach ($payload['tables'] as $table => $rows) {
                if (! Schema::hasTable($table) || empty($rows)) {
                    continue;
                }

                foreach (array_chunk($rows, 200) as $chunk) {
                    DB::table($table)->insert($chunk);
                }
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $this->recordRestore($relativePath);

        $this->info("Restored {$relativePath}");
        $this->info("Pre-restore snapshot written to {$snapshotPath}");

        return self::SUCCESS;
    }

    private function normalizePath(string $path): string
    {
        $path = str_replace('\\', '/', trim($path));

        if (str_starts_with($path, 'storage/app/')) {
            $path = substr($path, strlen('storage/app/'));
        }

        return str_starts_with($path, 'backups/') ? $path : "backups/{$path}";
    }

    private function writeCurrentSnapshot(): string
    {
        $tables = collect(DB::select('SHOW TABLES'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->reject(fn ($table) => in_array($table, ['migrations', 'system_backups'], true))
            ->values();

        $payload = [
            'created_at' => Carbon::now()->toIso8601String(),
            'database' => config('database.connections.'.config('database.default').'.database'),
            'tables' => $tables
                ->mapWithKeys(fn ($table) => [$table => DB::table($table)->get()->map(fn ($row) => (array) $row)->all()])
                ->all(),
        ];

        $path = 'backups/pre-restore-current-'.now()->format('Ymd-His').'.json';
        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $path;
    }

    private function recordRestore(string $relativePath): void
    {
        if (! Schema::hasTable('system_backups')) {
            return;
        }

        SystemBackup::updateOrCreate(
            ['disk_path' => $relativePath],
            [
                'file_name' => basename($relativePath),
                'file_size' => Storage::disk('local')->size($relativePath),
                'restored_at' => now(),
            ],
        );
    }
}
