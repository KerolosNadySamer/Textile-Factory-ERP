import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'صلاحياتي',
        subtitle: 'ملخص واضح لما يمكنك متابعته أو إدخاله أو اعتماده داخل النظام.',
        role: 'الدور',
        department: 'القسم',
        position: 'الوظيفة',
        manager: 'المدير المباشر',
        noPermissions: 'لا توجد صلاحيات مخصصة.',
        monitor: 'متابعة فقط',
        monitorHelp: 'يمكنك فتح الشاشات ومتابعة البيانات والتقارير بدون تنفيذ تغييرات تشغيلية.',
        input: 'إدخال وتعديل',
        inputHelp: 'يمكنك إنشاء أو تعديل بيانات ومستندات حسب الصلاحيات المعطاة لك.',
        approval: 'مراجعة واعتماد',
        approvalHelp: 'يمكنك مراجعة أو اعتماد أو إغلاق أو إلغاء خطوات مؤثرة في دورة العمل.',
        management: 'إدارة النظام',
        managementHelp: 'صلاحيات حساسة مثل المستخدمين والأدوار والحذف وإعدادات النظام.',
        slug: 'الكود الداخلي',
        emptyCategory: 'لا توجد صلاحيات في هذا التصنيف.',
    },
    en: {
        title: 'My Permissions',
        subtitle: 'A clear summary of what you can monitor, enter, or approve in the system.',
        role: 'Role',
        department: 'Department',
        position: 'Position',
        manager: 'Direct Manager',
        noPermissions: 'No permissions assigned.',
        monitor: 'Monitoring Only',
        monitorHelp: 'You can open screens and follow data or reports without operational changes.',
        input: 'Data Entry & Editing',
        inputHelp: 'You can create or update records and documents according to your granted permissions.',
        approval: 'Review & Approval',
        approvalHelp: 'You can review, approve, close, or cancel important workflow steps.',
        management: 'System Management',
        managementHelp: 'Sensitive permissions such as users, roles, deletion, and system setup.',
        slug: 'Internal Code',
        emptyCategory: 'No permissions in this category.',
    },
};

export default function MyPermissions({ auth, user }) {
    const { language, isRtl, text } = useLanguage(labels);
    const permissions = user.role?.permissions ?? [];
    const userDisplayName = translatedName(user, language) ?? 'U';
    const initials = userDisplayName?.trim()?.charAt(0)?.toUpperCase() ?? 'U';
    const grouped = groupPermissions(permissions);

    const categories = [
        { key: 'monitor', title: text.monitor, help: text.monitorHelp, style: permissionTone('info') },
        { key: 'input', title: text.input, help: text.inputHelp, style: permissionTone('success') },
        { key: 'approval', title: text.approval, help: text.approvalHelp, style: permissionTone('warning') },
        { key: 'management', title: text.management, help: text.managementHelp, style: permissionTone('danger') },
    ];

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="erp-card">
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-5 md:flex-row md:items-center">
                                {user.profile_photo_url ? (
                                    <img src={user.profile_photo_url} alt={userDisplayName} className="h-24 w-24 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white">{initials}</div>
                                )}
                                <div>
                                    <h3 className="text-2xl font-semibold" style={{ color: 'var(--erp-text)' }}>{userDisplayName}</h3>
                                    <p className="mt-1 text-sm" style={{ color: 'var(--erp-muted)' }}>{text.subtitle}</p>
                                    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2" style={{ color: 'var(--erp-text)' }}>
                                        <Info label={text.role} value={translatedName(user.role, language) ?? '-'} />
                                        <Info label={text.department} value={user.department?.name ?? '-'} />
                                        <Info label={text.position} value={user.position?.name ?? '-'} />
                                        <Info label={text.manager} value={translatedName(user.manager, language) ?? '-'} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {permissions.length === 0 ? (
                            <div className="mt-8 rounded-md border px-4 py-6 text-center text-sm" style={{ borderColor: 'var(--erp-border)', color: 'var(--erp-muted)' }}>
                                {text.noPermissions}
                            </div>
                        ) : (
                            <div className="mt-8 grid gap-4 lg:grid-cols-2">
                                {categories.map((category) => (
                                    <PermissionCategory
                                        key={category.key}
                                        category={category}
                                        permissions={grouped[category.key]}
                                        language={language}
                                        text={text}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PermissionCategory({ category, permissions, language, text }) {
    return (
        <section className="rounded-lg border p-4" style={category.style}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className="text-base font-bold">{category.title}</h4>
                    <p className="mt-1 text-sm opacity-90">{category.help}</p>
                </div>
                <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--erp-card) 78%, transparent)', color: 'inherit' }}>
                    {permissions.length}
                </span>
            </div>

            {permissions.length === 0 ? (
                <div className="mt-4 rounded-md px-3 py-3 text-sm" style={{ background: 'color-mix(in srgb, var(--erp-card) 72%, transparent)', color: 'inherit' }}>
                    {text.emptyCategory}
                </div>
            ) : (
                <div className="mt-4 grid gap-2">
                    {permissions.map((permission) => (
                        <div key={permission.id} className="rounded-md px-3 py-2 text-sm" style={{ background: 'color-mix(in srgb, var(--erp-card) 86%, transparent)', color: 'var(--erp-text)' }}>
                            <div className="font-semibold">{translatedName(permission, language)}</div>
                            <div className="mt-1 text-xs" style={{ color: 'var(--erp-muted)' }}>{text.slug}: {permission.slug}</div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function Info({ label, value }) {
    return <div><span className="font-semibold" style={{ color: 'var(--erp-text)' }}>{label}:</span> {value}</div>;
}

function translatedName(item, language) {
    if (!item) return null;

    return language === 'ar'
        ? (item.name_ar ?? item.name ?? item.name_en)
        : (item.name_en ?? item.name ?? item.name_ar);
}

function groupPermissions(permissions) {
    return permissions.reduce((groups, permission) => {
        const category = permissionCategory(permission.slug);
        groups[category].push(permission);

        return groups;
    }, {
        monitor: [],
        input: [],
        approval: [],
        management: [],
    });
}

function permissionCategory(slug = '') {
    if (slug.startsWith('view_') || slug.includes('report') || slug.includes('ledger')) {
        return 'monitor';
    }

    if (
        slug.startsWith('approve_') ||
        slug.startsWith('review_') ||
        slug.startsWith('close_') ||
        slug.startsWith('cancel_') ||
        slug.includes('approval')
    ) {
        return 'approval';
    }

    if (
        slug.includes('user') ||
        slug.includes('role') ||
        slug.includes('permission') ||
        slug.startsWith('delete_') ||
        slug.startsWith('assign_') ||
        slug.includes('backup')
    ) {
        return 'management';
    }

    return 'input';
}

function permissionTone(tone) {
    const tones = {
        info: ['--erp-info-soft', '--erp-info-border', '--erp-info-text'],
        success: ['--erp-success-soft', '--erp-success-border', '--erp-success-text'],
        warning: ['--erp-warning-soft', '--erp-warning-border', '--erp-warning-text'],
        danger: ['--erp-danger-soft', '--erp-danger-border', '--erp-danger-text'],
    };
    const [background, borderColor, color] = tones[tone];

    return {
        background: `var(${background})`,
        borderColor: `var(${borderColor})`,
        color: `var(${color})`,
    };
}
