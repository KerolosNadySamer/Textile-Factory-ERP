<?php

namespace App\Http\Controllers;

use App\Models\SystemBackup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SystemBackupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SystemBackups/Index', [
            'backups' => SystemBackup::query()->with(['creator:id,name', 'restorer:id,name'])->latest()->get(),
            'canManageBackups' => request()->user()?->hasRole('admin') ?? false,
        ]);
    }

    public function store(): RedirectResponse
    {
        abort_unless(request()->user()?->hasRole('admin'), 403);

        $tables = collect(DB::select('SHOW TABLES'))
            ->map(fn ($row) => array_values((array) $row)[0])
            ->reject(fn ($table) => in_array($table, ['migrations', 'system_backups'], true))
            ->values();

        $payload = [
            'created_at' => Carbon::now()->toIso8601String(),
            'database' => config('database.connections.'.config('database.default').'.database'),
            'tables' => $tables->mapWithKeys(fn ($table) => [$table => DB::table($table)->get()->map(fn ($row) => (array) $row)->all()])->all(),
        ];

        $fileName = 'system-backup-'.now()->format('Ymd-His').'.json';
        $path = 'backups/'.$fileName;

        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        SystemBackup::create([
            'file_name' => $fileName,
            'disk_path' => $path,
            'file_size' => Storage::disk('local')->size($path),
            'created_by' => request()->user()->id,
        ]);

        return back()->with('success', 'Backup created.');
    }

    public function restore(SystemBackup $backup): RedirectResponse
    {
        abort_unless(request()->user()?->hasRole('admin'), 403);
        abort_unless(Storage::disk('local')->exists($backup->disk_path), 404);

        $payload = json_decode(Storage::disk('local')->get($backup->disk_path), true);
        abort_unless(is_array($payload) && isset($payload['tables']), 422);

        DB::transaction(function () use ($payload, $backup): void {
            Schema::disableForeignKeyConstraints();

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

            Schema::enableForeignKeyConstraints();

            $backup->update([
                'restored_at' => now(),
                'restored_by' => request()->user()->id,
            ]);
        });

        return back()->with('success', 'Backup restored.');
    }

    public function destroy(SystemBackup $backup): RedirectResponse
    {
        abort_unless(request()->user()?->hasRole('admin'), 403);

        if (Storage::disk('local')->exists($backup->disk_path)) {
            Storage::disk('local')->delete($backup->disk_path);
        }

        $backup->delete();

        return back()->with('success', 'Backup permanently deleted.');
    }
}
