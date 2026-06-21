import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'النسخ الاحتياطي',
        heading: 'النسخ والاسترجاع',
        description: 'إنشاء نسخة JSON كاملة واسترجاعها من سجل النسخ الاحتياطية.',
        create: 'إنشاء نسخة احتياطية',
        restore: 'استرجاع النسخة',
        delete: 'حذف نهائي',
        confirmRestore: 'هل تريد استرجاع النسخة؟ سيتم استبدال البيانات الحالية.',
        confirmDelete: 'هل تريد حذف هذه النسخة نهائيًا؟ لا يمكن استرجاعها بعد الحذف.',
        fileName: 'اسم الملف',
        createdAt: 'تاريخ الإنشاء',
        fileSize: 'حجم الملف',
        createdBy: 'منشئ النسخة',
        lastRestore: 'آخر استرجاع',
        restoredBy: 'بواسطة',
        empty: 'لا توجد نسخ احتياطية حتى الآن.',
    },
    en: {
        title: 'System Backup',
        heading: 'Backup & Restore',
        description: 'Create a full JSON backup and restore from backup history.',
        create: 'System Backup',
        restore: 'Restore Backup',
        delete: 'Delete Permanently',
        confirmRestore: 'Restore this backup? Current data will be replaced.',
        confirmDelete: 'Delete this backup permanently? It cannot be restored after deletion.',
        fileName: 'File Name',
        createdAt: 'Created At',
        fileSize: 'File Size',
        createdBy: 'Created By',
        lastRestore: 'Last Restore',
        restoredBy: 'by',
        empty: 'No backups yet.',
    },
};

export default function SystemBackupsIndex({ auth, flash, backups, canManageBackups }) {
    const { isRtl, text } = useLanguage(labels);

    const createBackup = () => router.post(route('system-backups.store'), {}, { preserveScroll: true });

    const restoreBackup = (backup) => {
        if (window.confirm(`${text.confirmRestore} ${backup.file_name}`)) {
            router.post(route('system-backups.restore', backup.id), {}, { preserveScroll: true });
        }
    };

    const deleteBackup = (backup) => {
        if (window.confirm(`${text.confirmDelete} ${backup.file_name}`)) {
            router.delete(route('system-backups.destroy', backup.id), { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{flash.success}</div>}
                    {flash?.error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{flash.error}</div>}

                    <div className="erp-card">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold">{text.heading}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.description}</p>
                            </div>
                            {canManageBackups && <button type="button" onClick={createBackup} className="erp-button">{text.create}</button>}
                        </div>

                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5">
                                    <tr>
                                        <Th>{text.fileName}</Th>
                                        <Th>{text.createdAt}</Th>
                                        <Th>{text.fileSize}</Th>
                                        <Th>{text.createdBy}</Th>
                                        <Th>{text.lastRestore}</Th>
                                        <Th></Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {backups.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {backups.map((backup) => (
                                        <tr key={backup.id}>
                                            <td className="px-4 py-4 font-semibold">{backup.file_name}</td>
                                            <td className="px-4 py-4">{new Date(backup.created_at).toLocaleString()}</td>
                                            <td className="px-4 py-4">{formatBytes(backup.file_size)}</td>
                                            <td className="px-4 py-4">{backup.creator?.name ?? '-'}</td>
                                            <td className="px-4 py-4">
                                                {backup.restored_at ? `${new Date(backup.restored_at).toLocaleString()} ${text.restoredBy} ${backup.restorer?.name ?? '-'}` : '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                {canManageBackups && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => restoreBackup(backup)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{text.restore}</button>
                                                        <button type="button" onClick={() => deleteBackup(backup)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{text.delete}</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}
