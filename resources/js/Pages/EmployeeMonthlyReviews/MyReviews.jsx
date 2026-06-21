import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'تقييماتي الشهرية',
        subtitle: 'عرض تقييماتك الشهرية المنشورة ومرتب كل شهر خاص بك فقط.',
        employeeCode: 'كود الموظف',
        currentSalary: 'المرتب الحالي',
        status: 'الحالة',
        department: 'القسم',
        position: 'الوظيفة',
        month: 'الشهر',
        salary: 'مرتب الشهر',
        score: 'التقييم',
        rating: 'التقدير',
        reviewedBy: 'تم بواسطة',
        notes: 'ملاحظات',
        strengths: 'نقاط القوة',
        improvements: 'نقاط التحسين',
        noData: 'لا توجد تقييمات شهرية منشورة لك حتى الآن.',
        maintenanceAccount: 'هذا حساب إداري للصيانة وليس ملف موظف داخل الشركة، لذلك لا توجد له تقييمات شهرية أو مرتب موظف.',
        notRecorded: 'غير مسجل',
        active: 'نشط',
        inactive: 'غير نشط',
        suspended: 'موقوف',
    },
    en: {
        title: 'My Monthly Reviews',
        subtitle: 'View your published monthly reviews and your own monthly salary only.',
        employeeCode: 'Employee Code',
        currentSalary: 'Current Salary',
        status: 'Status',
        department: 'Department',
        position: 'Position',
        month: 'Month',
        salary: 'Monthly Salary',
        score: 'Score',
        rating: 'Rating',
        reviewedBy: 'Reviewed By',
        notes: 'Notes',
        strengths: 'Strengths',
        improvements: 'Improvements',
        noData: 'No monthly reviews have been published for you yet.',
        maintenanceAccount: 'This is a maintenance administration account, not a company employee profile, so it has no monthly reviews or employee salary.',
        notRecorded: 'Not recorded',
        active: 'Active',
        inactive: 'Inactive',
        suspended: 'Suspended',
    },
};

export default function MyMonthlyReviews({ auth, employee, reviews }) {
    const { isRtl, text } = useLanguage(labels);
    const formatNumber = (value) => value !== null && value !== undefined && value !== ''
        ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : text.notRecorded;
    const formatMonth = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : text.notRecorded;
    const statusLabel = (status) => text[status] ?? status ?? text.notRecorded;

    const cards = [
        [text.employeeCode, employee.employee_code ?? text.notRecorded],
        [text.currentSalary, formatNumber(employee.basic_salary)],
        [text.status, statusLabel(employee.status)],
        [text.department, employee.department?.name ?? text.notRecorded],
        [text.position, employee.position?.name ?? text.notRecorded],
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}
        >
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-950">{employee.name}</h1>
                        <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                    </div>

                    {employee.is_maintenance_account && (
                        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 shadow-sm">
                            {text.maintenanceAccount}
                        </div>
                    )}

                    {!employee.is_maintenance_account && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {cards.map(([label, value]) => (
                            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                                <div className="mt-2 text-lg font-bold text-slate-950">{value}</div>
                            </div>
                        ))}
                    </div>}

                    {!employee.is_maintenance_account && <div className="mt-6 grid gap-4">
                        {reviews.length ? reviews.map((review) => (
                            <article key={review.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-950">{formatMonth(review.review_month)}</h3>
                                        <p className="mt-1 text-sm text-slate-500">{text.reviewedBy}: {review.reviewer?.name ?? text.notRecorded}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-md bg-slate-50 px-3 py-2">
                                            <div className="text-xs text-slate-500">{text.salary}</div>
                                            <div className="text-sm font-bold text-slate-950">{formatNumber(review.salary_snapshot)}</div>
                                        </div>
                                        <div className="rounded-md bg-emerald-50 px-3 py-2">
                                            <div className="text-xs text-emerald-700">{text.score}</div>
                                            <div className="text-sm font-bold text-emerald-900">{review.evaluation_score ?? text.notRecorded}</div>
                                        </div>
                                        <div className="rounded-md bg-amber-50 px-3 py-2">
                                            <div className="text-xs text-amber-700">{text.rating}</div>
                                            <div className="text-sm font-bold text-amber-900">{review.rating ?? text.notRecorded}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <InfoBlock title={text.notes} value={review.notes} fallback={text.notRecorded} />
                                    <InfoBlock title={text.strengths} value={review.strengths} fallback={text.notRecorded} />
                                    <InfoBlock title={text.improvements} value={review.improvements} fallback={text.notRecorded} />
                                </div>
                            </article>
                        )) : (
                            <div className="rounded-lg border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
                                {text.noData}
                            </div>
                        )}
                    </div>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InfoBlock({ title, value, fallback }) {
    return (
        <div className="rounded-md bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-950">{title}</div>
            <div className="mt-1 whitespace-pre-line text-sm text-slate-600">{value || fallback}</div>
        </div>
    );
}
