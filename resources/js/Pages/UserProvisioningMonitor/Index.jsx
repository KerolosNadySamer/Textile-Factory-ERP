import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'متابعة حسابات الموظفين',
        subtitle: 'لوحة متابعة دورة الموظف من سجل التعيين حتى إنشاء وتفعيل حساب النظام.',
        totalEmployees: 'إجمالي الموظفين',
        activeSystemUsers: 'حسابات نشطة',
        employeesWithoutAccounts: 'بدون حساب نظام',
        inactiveAccounts: 'حسابات غير مفعلة',
        suspendedAccounts: 'حسابات موقوفة',
        pendingAccountRequests: 'طلبات إنشاء حساب',
        aging: 'تنبيهات التأخير',
        over3: '3 أيام',
        over7: '7 أيام',
        over15: '15 يوم',
        over30: '30 يوم',
        employeeCode: 'كود الموظف',
        name: 'الاسم',
        email: 'البريد',
        department: 'القسم',
        position: 'الوظيفة',
        phone: 'الهاتف',
        days: 'الأيام',
        requestNumber: 'رقم الطلب',
        requester: 'طالب الإجراء',
        status: 'الحالة',
        createdAt: 'تاريخ الإنشاء',
        suspendedAt: 'تاريخ الإيقاف',
        suspensionReason: 'سبب الإيقاف',
        notRecorded: 'غير مسجل',
        openUsers: 'فتح شاشة المستخدمين',
        openRequests: 'فتح طلبات التغيير',
        noData: 'لا توجد بيانات حاليًا.',
    },
    en: {
        title: 'User Provisioning Monitor',
        subtitle: 'Track the employee account lifecycle from employee record to active system login.',
        totalEmployees: 'Total Employees',
        activeSystemUsers: 'Active Accounts',
        employeesWithoutAccounts: 'Without System Account',
        inactiveAccounts: 'Inactive Accounts',
        suspendedAccounts: 'Suspended Accounts',
        pendingAccountRequests: 'Account Requests',
        aging: 'Aging Alerts',
        over3: '3 days',
        over7: '7 days',
        over15: '15 days',
        over30: '30 days',
        employeeCode: 'Employee Code',
        name: 'Name',
        email: 'Email',
        department: 'Department',
        position: 'Position',
        phone: 'Phone',
        days: 'Days',
        requestNumber: 'Request No.',
        requester: 'Requester',
        status: 'Status',
        createdAt: 'Created At',
        suspendedAt: 'Suspended At',
        suspensionReason: 'Suspension Reason',
        notRecorded: 'Not recorded',
        openUsers: 'Open Users',
        openRequests: 'Open Change Requests',
        noData: 'No data right now.',
    },
};

export default function UserProvisioningMonitor({ auth, metrics, employeesWithoutAccounts, inactiveAccounts, suspendedAccounts, pendingAccountRequests }) {
    const { isRtl, text } = useLanguage(labels);
    const metricCards = [
        [text.totalEmployees, metrics.totalEmployees],
        [text.activeSystemUsers, metrics.activeSystemUsers],
        [text.employeesWithoutAccounts, metrics.employeesWithoutAccounts],
        [text.inactiveAccounts, metrics.inactiveAccounts],
        [text.suspendedAccounts, metrics.suspendedAccounts],
        [text.pendingAccountRequests, metrics.pendingAccountRequests],
    ];
    const agingCards = [
        [text.over3, metrics.newWithoutAccount3Days],
        [text.over7, metrics.newWithoutAccount7Days],
        [text.over15, metrics.newWithoutAccount15Days],
        [text.over30, metrics.newWithoutAccount30Days],
    ];

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="erp-card">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={route('users.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">{text.openUsers}</Link>
                                <Link href={route('change-requests.index')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">{text.openRequests}</Link>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                            {metricCards.map(([label, value]) => <Kpi key={label} label={label} value={value} />)}
                        </div>
                    </section>

                    <section className="erp-card">
                        <h3 className="text-lg font-semibold text-slate-950">{text.aging}</h3>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {agingCards.map(([label, value]) => <Kpi key={label} label={label} value={value} />)}
                        </div>
                    </section>

                    <Panel title={text.employeesWithoutAccounts}>
                        <Table
                            rows={employeesWithoutAccounts}
                            emptyText={text.noData}
                            columns={[
                                [text.employeeCode, (row) => row.employee_code ?? '-'],
                                [text.name, (row) => row.name],
                                [text.department, (row) => row.department?.name ?? '-'],
                                [text.position, (row) => row.position?.name ?? '-'],
                                [text.phone, (row) => row.phone ?? '-'],
                                [text.days, (row) => daysSince(row.created_at)],
                            ]}
                        />
                    </Panel>

                    <Panel title={text.pendingAccountRequests}>
                        <Table
                            rows={pendingAccountRequests}
                            emptyText={text.noData}
                            columns={[
                                [text.requestNumber, (row) => row.request_number],
                                [text.name, (row) => row.new_values?.name ?? '-'],
                                [text.department, (row) => row.department?.name ?? '-'],
                                [text.requester, (row) => row.requester?.name ?? '-'],
                                [text.status, (row) => row.status],
                                [text.createdAt, (row) => formatDate(row.created_at)],
                            ]}
                        />
                    </Panel>

                    <Panel title={text.inactiveAccounts}>
                        <Table
                            rows={inactiveAccounts}
                            emptyText={text.noData}
                            columns={[
                                [text.employeeCode, (row) => row.employee_code ?? '-'],
                                [text.name, (row) => row.name],
                                [text.email, (row) => row.email ?? '-'],
                                [text.department, (row) => row.department?.name ?? '-'],
                                [text.position, (row) => row.position?.name ?? '-'],
                                [text.createdAt, (row) => formatDate(row.updated_at)],
                            ]}
                        />
                    </Panel>

                    <Panel title={text.suspendedAccounts}>
                        <Table
                            rows={suspendedAccounts}
                            emptyText={text.noData}
                            columns={[
                                [text.name, (row) => row.name],
                                [text.email, (row) => row.email ?? '-'],
                                [text.department, (row) => row.department?.name ?? '-'],
                                [text.suspensionReason, () => text.notRecorded],
                                [text.suspendedAt, (row) => formatDate(row.updated_at)],
                            ]}
                        />
                    </Panel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Kpi({ label, value }) {
    return (
        <div className="rounded-md border border-slate-200 p-4">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
        </div>
    );
}

function Panel({ title, children }) {
    return <section className="erp-card"><h3 className="mb-4 text-lg font-semibold text-slate-950">{title}</h3>{children}</section>;
}

function Table({ rows, columns, emptyText }) {
    if (!rows || rows.length === 0) {
        return <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{emptyText}</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600">
                    <tr>{columns.map(([label]) => <th key={label} className="px-4 py-3 text-right">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rows.map((row) => (
                        <tr key={row.id}>
                            {columns.map(([label, render]) => <td key={label} className="px-4 py-4">{render(row)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function daysSince(dateValue) {
    if (!dateValue) return 0;

    return Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateValue) {
    if (!dateValue) return '-';

    return new Date(dateValue).toLocaleDateString();
}
