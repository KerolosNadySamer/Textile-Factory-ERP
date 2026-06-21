import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'مركز الحوكمة',
        pending: 'طلبات معلقة',
        executed: 'طلبات منفذة',
        rejected: 'طلبات مرفوضة',
        criticalActions: 'إجراءات حساسة',
        latestRequests: 'آخر طلبات التغيير',
        latestActions: 'آخر التعديلات والحذف',
        noRequests: 'لا توجد طلبات تغيير.',
        noActions: 'لا توجد إجراءات حساسة مسجلة.',
        requestNumber: 'رقم الطلب',
        type: 'النوع',
        department: 'القسم',
        requester: 'مقدم الطلب',
        risk: 'الخطورة',
        status: 'الحالة',
        officer: 'مسؤول القسم',
        manager: 'مدير القسم',
        action: 'الإجراء',
        recordType: 'نوع السجل',
        recordId: 'رقم السجل',
        user: 'المستخدم',
        date: 'التاريخ',
        statuses: { pending_department_officer: 'بانتظار مسؤول القسم', pending_department_manager: 'بانتظار مدير القسم', pending_general_manager: 'بانتظار المدير العام', rejected: 'مرفوض', executed: 'منفذ' },
        types: { password_reset: 'إعادة تعيين كلمة المرور', customer_update: 'تعديل عميل', supplier_update: 'تعديل مورد', product_update: 'تعديل صنف', price_update: 'تعديل سعر', cost_update: 'تعديل تكلفة' },
        actions: { created: 'إنشاء', updated: 'تعديل', deleted: 'حذف' },
    },
    en: {
        title: 'Governance Center',
        pending: 'Pending Requests',
        executed: 'Executed Requests',
        rejected: 'Rejected Requests',
        criticalActions: 'Sensitive Actions',
        latestRequests: 'Latest Change Requests',
        latestActions: 'Latest Updates and Deletes',
        noRequests: 'No change requests found.',
        noActions: 'No sensitive actions recorded.',
        requestNumber: 'Request No.',
        type: 'Type',
        department: 'Department',
        requester: 'Requester',
        risk: 'Risk',
        status: 'Status',
        officer: 'Department Officer',
        manager: 'Department Manager',
        action: 'Action',
        recordType: 'Record Type',
        recordId: 'Record ID',
        user: 'User',
        date: 'Date',
        statuses: { pending_department_officer: 'Pending Officer', pending_department_manager: 'Pending Manager', pending_general_manager: 'Pending General Manager', rejected: 'Rejected', executed: 'Executed' },
        types: { password_reset: 'Password Reset', customer_update: 'Customer Update', supplier_update: 'Supplier Update', product_update: 'Product Update', price_update: 'Price Update', cost_update: 'Cost Update' },
        actions: { created: 'Created', updated: 'Updated', deleted: 'Deleted' },
    },
};

export default function GovernanceIndex({ auth, metrics, changeRequests, criticalActions }) {
    const { language, isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Metric title={text.pending} value={metrics.pending} tone="amber" />
                        <Metric title={text.executed} value={metrics.executed} tone="emerald" />
                        <Metric title={text.rejected} value={metrics.rejected} tone="red" />
                        <Metric title={text.criticalActions} value={metrics.criticalActions} tone="slate" />
                    </div>

                    <Section title={text.latestRequests}>
                        <Table
                            empty={text.noRequests}
                            headers={[text.requestNumber, text.type, text.department, text.requester, text.risk, text.status, text.officer, text.manager]}
                            rows={changeRequests.map((item) => [item.request_number, text.types[item.type] ?? item.type, item.department?.name ?? '-', item.requester?.name ?? '-', item.risk_level, <Status key="status" status={item.status} text={text} />, item.officerApprover?.name ?? '-', item.managerApprover?.name ?? '-'])}
                        />
                    </Section>

                    <Section title={text.latestActions}>
                        <Table
                            empty={text.noActions}
                            headers={[text.action, text.recordType, text.recordId, text.user, text.date]}
                            rows={criticalActions.map((log) => [text.actions[log.action] ?? log.action, modelName(log.model_type), log.model_id, log.user?.name ?? '-', new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')])}
                        />
                    </Section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ title, value, tone }) {
    const colors = { amber: 'bg-amber-50 text-amber-800', emerald: 'bg-emerald-50 text-emerald-800', red: 'bg-red-50 text-red-800', slate: 'bg-slate-100 text-slate-800' };
    return <div className="erp-card"><div className="text-sm text-slate-500">{title}</div><div className={`mt-3 inline-flex rounded-md px-3 py-1 text-2xl font-bold ${colors[tone]}`}>{value}</div></div>;
}

function Section({ title, children }) {
    return <div className="erp-card"><h3 className="mb-4 text-lg font-semibold">{title}</h3>{children}</div>;
}

function Table({ headers, rows, empty }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                <thead className="bg-black/5 text-slate-600"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-start font-semibold">{header}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                    {rows.length === 0 && <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500">{empty}</td></tr>}
                    {rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-4">{cell}</td>)}</tr>)}
                </tbody>
            </table>
        </div>
    );
}

function Status({ status, text }) {
    const style = status === 'executed' ? 'bg-emerald-100 text-emerald-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>{text.statuses[status] ?? status}</span>;
}

function modelName(value) {
    return value ? value.split('\\').pop() : '-';
}
