import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'الإشعارات',
        subtitle: 'متابعة التنبيهات الداخلية بين الأقسام.',
        unread: 'غير مقروء',
        read: 'مقروء',
        open: 'فتح',
        sender: 'القسم المرسل',
        empty: 'لا توجد إشعارات بعد.',
    },
    en: {
        title: 'Notifications',
        subtitle: 'Follow internal alerts between departments.',
        unread: 'Unread',
        read: 'Read',
        open: 'Open',
        sender: 'Sender Department',
        empty: 'No notifications yet.',
    },
};

export default function NotificationsIndex({ auth, notifications }) {
    const { isRtl, text } = useLanguage(labels);

    const markRead = (notification) => {
        router.patch(route('notifications.read', notification.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}
        >
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="erp-card">
                        <div className="border-b pb-4" style={{ borderColor: 'var(--erp-border)' }}>
                            <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                        </div>

                        <div className="mt-5 space-y-3">
                            {notifications.length === 0 && (
                                <div className="rounded-md border px-4 py-6 text-center text-sm text-slate-500" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-soft)' }}>
                                    {text.empty}
                                </div>
                            )}

                            {notifications.map((notification) => {
                                const senderDepartment = notification.sender_department?.name
                                    ?? notification.sender?.department?.name
                                    ?? '-';

                                return (
                                    <div
                                        key={notification.id}
                                        className={`rounded-md border p-4 ${notification.read_at ? '' : 'border-amber-200 bg-amber-50 text-amber-950'}`}
                                        style={notification.read_at ? { borderColor: 'var(--erp-border)', background: 'var(--erp-card)' } : undefined}
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="font-semibold text-slate-950">{notification.title}</h4>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${notification.read_at ? 'bg-slate-100 text-slate-600' : 'bg-amber-200 text-amber-900'}`}>
                                                        {notification.read_at ? text.read : text.unread}
                                                    </span>
                                                </div>
                                                {notification.body && (
                                                    <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p>
                                                )}
                                                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                                                    <span>{text.sender}: {senderDepartment}</span>
                                                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <button type="button" onClick={() => markRead(notification)} className="erp-button">
                                                {text.open}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
