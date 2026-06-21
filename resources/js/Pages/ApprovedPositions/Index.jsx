import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'الوظائف المعتمدة',
        subtitle: 'مقارنة العدد المعتمد بالحالي والعجز والفائض لكل وظيفة.',
        organizationStructure: 'الهيكل التنظيمي',
        department: 'القسم',
        unit: 'القسم الفرعي',
        jobTitle: 'الوظيفة',
        approved: 'العدد المعتمد',
        current: 'الحالي',
        shortage: 'العجز',
        surplus: 'الفائض',
        coverage: 'نسبة التغطية',
        openRequests: 'طلبات مفتوحة',
        availableForRecruitment: 'مسموح طلبه',
        noData: 'لا توجد بيانات.',
    },
    en: {
        title: 'Approved Positions',
        subtitle: 'Approved headcount compared with current employees, shortage, and surplus.',
        organizationStructure: 'Organization Structure',
        department: 'Department',
        unit: 'Unit',
        jobTitle: 'Job Title',
        approved: 'Approved',
        current: 'Current',
        shortage: 'Shortage',
        surplus: 'Surplus',
        coverage: 'Coverage',
        openRequests: 'Open Requests',
        availableForRecruitment: 'Allowed Request',
        noData: 'No data.',
    },
};

export default function ApprovedPositions({ auth, positions, metrics }) {
    const { isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <Link href={route('organization-structure.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                                {text.organizationStructure}
                            </Link>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                            <Kpi label={text.approved} value={metrics.approved} />
                            <Kpi label={text.current} value={metrics.current} />
                            <Kpi label={text.shortage} value={metrics.shortage} />
                            <Kpi label={text.surplus} value={metrics.surplus} />
                            <Kpi label={text.openRequests} value={metrics.openRequests} />
                            <Kpi label={text.availableForRecruitment} value={metrics.availableForRecruitment} />
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-sm">
                                <thead className="text-slate-600">
                                    <tr>
                                        {[text.department, text.unit, text.jobTitle, text.approved, text.current, text.shortage, text.surplus, text.coverage, text.openRequests, text.availableForRecruitment].map((label) => (
                                            <th key={label} className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-start first:rounded-s-md last:rounded-e-md">{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {positions.map((position) => (
                                        <tr key={position.id} className="group">
                                            <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900 group-hover:bg-slate-50">{position.department}</td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50">{position.unit ?? '-'}</td>
                                            <td className="border-b border-slate-100 px-4 py-3 font-semibold group-hover:bg-slate-50">{position.jobTitle}</td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50"><NumberBadge value={position.approved} tone="slate" /></td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50"><NumberBadge value={position.current} tone="emerald" /></td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50"><NumberBadge value={position.shortage} tone={position.shortage > 0 ? 'amber' : 'slate'} /></td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50"><NumberBadge value={position.surplus} tone={position.surplus > 0 ? 'rose' : 'slate'} /></td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(position.coveragePercent, 100)}%` }} />
                                                    </div>
                                                    <span className="font-semibold">{position.coveragePercent}%</span>
                                                </div>
                                            </td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50"><NumberBadge value={position.openRequests} tone="sky" /></td>
                                            <td className="border-b border-slate-100 px-4 py-3 group-hover:bg-slate-50"><NumberBadge value={position.availableForRecruitment} tone="emerald" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {positions.length === 0 && <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">{text.noData}</div>}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Kpi({ label, value }) {
    return (
        <div className="rounded-md border border-slate-200 p-4">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
        </div>
    );
}

function NumberBadge({ value, tone }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-700',
        emerald: 'bg-emerald-50 text-emerald-800',
        amber: 'bg-amber-50 text-amber-800',
        rose: 'bg-rose-50 text-rose-800',
        sky: 'bg-sky-50 text-sky-800',
    };

    return (
        <span className={`inline-flex min-w-9 justify-center rounded-md px-2 py-1 text-xs font-black ${tones[tone] ?? tones.slate}`}>
            {value}
        </span>
    );
}
