import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'سجل تغيير المستخدم',
        heading: 'User Switch History',
        help: 'كل عملية تبديل مستخدم مع المستخدم السابق والحالي والجهاز والوقت.',
        from: 'المستخدم السابق',
        to: 'المستخدم الحالي',
        device: 'الجهاز',
        ip: 'IP',
        date: 'التاريخ والوقت',
        empty: 'لا توجد عمليات تبديل مسجلة.',
    },
    en: {
        title: 'User Switch History',
        heading: 'User Switch History',
        help: 'Every user switch with previous user, current user, device, and time.',
        from: 'Previous User',
        to: 'Current User',
        device: 'Device',
        ip: 'IP',
        date: 'Date and Time',
        empty: 'No user switch records found.',
    },
};

export default function UserSwitchHistoryIndex({ auth, logs }) {
    const { language, isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="erp-card">
                        <div className="mb-4"><h3 className="text-lg font-semibold">{text.heading}</h3><p className="mt-1 text-sm text-slate-500">{text.help}</p></div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5 text-slate-600"><tr>{[text.from, text.to, text.device, text.ip, text.date].map((header) => <th key={header} className="px-4 py-3 text-start font-semibold">{header}</th>)}</tr></thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {logs.data.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {logs.data.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-4 py-4"><UserCell name={log.old_values?.from_user_name} email={log.old_values?.from_user_email} /></td>
                                            <td className="px-4 py-4"><UserCell name={log.new_values?.to_user_name} email={log.new_values?.to_user_email} /></td>
                                            <td className="max-w-xs truncate px-4 py-4" title={log.user_agent ?? ''}>{log.user_agent ?? '-'}</td>
                                            <td className="px-4 py-4">{log.ip_address ?? '-'}</td>
                                            <td className="px-4 py-4">{new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {logs.links.length > 3 && <div className="mt-4 flex flex-wrap gap-2">{logs.links.map((link, index) => <Link key={`${link.label}-${index}`} href={link.url ?? '#'} className={`rounded-md border px-3 py-2 text-sm ${link.active ? 'font-bold' : ''} ${link.url ? '' : 'pointer-events-none opacity-50'}`} style={{ borderColor: 'var(--erp-border)', background: link.active ? 'var(--erp-soft)' : 'var(--erp-control)' }} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function UserCell({ name, email }) {
    return <div><div className="font-semibold">{name ?? '-'}</div>{email && <div className="text-xs text-slate-500">{email}</div>}</div>;
}
