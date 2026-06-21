import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'راتبي',
        subtitle: 'تظهر هنا كشوف الرواتب بعد اعتمادها وتنفيذها فقط.',
        currentSalary: 'الراتب الأساسي الحالي',
        month: 'الشهر',
        basic: 'الأساسي',
        additions: 'الإضافات',
        deductions: 'الاستقطاعات',
        net: 'الصافي المستحق',
        noData: 'لا توجد كشوف رواتب معتمدة حتى الآن.',
    },
    en: {
        title: 'My Payroll',
        subtitle: 'Payroll appears here only after final approval and execution.',
        currentSalary: 'Current Basic Salary',
        month: 'Month',
        basic: 'Basic',
        additions: 'Additions',
        deductions: 'Deductions',
        net: 'Net Due',
        noData: 'No approved payroll yet.',
    },
};

export default function MyPayroll({ auth, employee, items = [] }) {
    const { isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="erp-card">
                        <h3 className="text-lg font-semibold text-slate-950">{employee.employee_code ?? employee.id} - {employee.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                        <div className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
                            {text.currentSalary}: {formatNumber(employee.basic_salary)}
                        </div>
                    </section>

                    <section className="erp-card">
                        {items.length === 0 ? (
                            <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">{text.noData}</div>
                        ) : (
                            <div className="grid gap-3">
                                {items.map((item) => {
                                    const additions = Number(item.allowances) + Number(item.overtime) + Number(item.bonuses);
                                    const deductions = Number(item.deductions) + Number(item.insurance) + Number(item.taxes);

                                    return (
                                        <div key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                                            <div className="mb-3 text-sm font-black text-slate-950">{text.month}: {item.batch?.payroll_month}</div>
                                            <div className="grid gap-3 sm:grid-cols-4">
                                                <Metric label={text.basic} value={item.basic_salary} />
                                                <Metric label={text.additions} value={additions} />
                                                <Metric label={text.deductions} value={deductions} />
                                                <Metric label={text.net} value={item.net_salary} tone="success" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ label, value, tone = 'neutral' }) {
    return (
        <div className={`rounded-md px-4 py-3 ${tone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-900'}`}>
            <div className="text-xs font-bold opacity-75">{label}</div>
            <div className="mt-1 text-lg font-black">{formatNumber(value)}</div>
        </div>
    );
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
