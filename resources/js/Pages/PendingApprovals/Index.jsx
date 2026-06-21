import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';

const labels = {
    ar: {
        title: 'الاعتمادات المعلقة',
        pending: 'معلقة',
        critical: 'حرجة',
        today: 'طلبات اليوم',
        overdue: 'متأخرة',
        needsDecision: 'طلبات تحتاج قرار',
        requestNumber: 'رقم الطلب',
        type: 'النوع',
        department: 'القسم',
        requester: 'مقدم الطلب',
        requestedAt: 'وقت الطلب',
        risk: 'الخطورة',
        status: 'الحالة',
        reason: 'السبب',
        approvals: 'الاعتمادات السابقة',
        officer: 'مسؤول القسم',
        manager: 'مدير القسم',
        actions: 'إجراءات',
        approve: 'اعتماد',
        reject: 'رفض',
        rejectPrompt: 'اكتب سبب الرفض',
        empty: 'لا توجد طلبات معلقة.',
        statuses: { pending_department_officer: 'بانتظار مسؤول القسم', pending_department_manager: 'بانتظار مدير القسم', pending_general_manager: 'بانتظار المدير العام' },
        risks: { low: 'منخفض', medium: 'متوسط', high: 'مرتفع', critical: 'حرج' },
    },
    en: {
        title: 'Pending Approvals',
        pending: 'Pending',
        critical: 'Critical',
        today: 'Today Requests',
        overdue: 'Overdue',
        needsDecision: 'Requests Needing Decision',
        requestNumber: 'Request No.',
        type: 'Type',
        department: 'Department',
        requester: 'Requester',
        requestedAt: 'Requested At',
        risk: 'Risk',
        status: 'Status',
        reason: 'Reason',
        approvals: 'Previous Approvals',
        officer: 'Department Officer',
        manager: 'Department Manager',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        rejectPrompt: 'Enter rejection reason',
        empty: 'No pending requests.',
        statuses: { pending_department_officer: 'Pending Officer', pending_department_manager: 'Pending Manager', pending_general_manager: 'Pending General Manager' },
        risks: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
    },
};

export default function PendingApprovalsIndex({ auth, metrics, requests }) {
    const { language, isRtl, text } = useLanguage(labels);
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const approve = (item) => router.patch(route('change-requests.approve', item.id), {}, { preserveScroll: true });
    const reject = (item) => {
        const rejection_reason = window.prompt(text.rejectPrompt);
        if (rejection_reason?.trim()) router.patch(route('change-requests.reject', item.id), { rejection_reason }, { preserveScroll: true });
    };

    useEffect(() => {
        scrollToFocusedRow(focusId);
    }, [focusId]);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Metric title={text.pending} value={metrics.pending} />
                        <Metric title={text.critical} value={metrics.critical} />
                        <Metric title={text.today} value={metrics.today} />
                        <Metric title={text.overdue} value={metrics.overdue} />
                    </div>
                    <div className="erp-card">
                        <h3 className="mb-4 text-lg font-semibold">{text.needsDecision}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5 text-slate-600"><tr>{[text.requestNumber, text.type, text.department, text.requester, text.requestedAt, text.risk, text.status, text.reason, text.approvals, text.actions].map((header) => <Th key={header}>{header}</Th>)}</tr></thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {requests.length === 0 && <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {requests.map((item) => {
                                        const focused = isFocused(item.id, focusId);

                                        return (
                                        <tr key={item.id} id={`focus-${item.id}`} className={focused ? focusRowClass() : ''}>
                                            <td className="px-4 py-4 font-semibold">{item.request_number}</td>
                                            <td className="px-4 py-4">{item.type}</td>
                                            <td className="px-4 py-4">{item.department?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{item.requester?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{item.created_at ? new Date(item.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}</td>
                                            <td className="px-4 py-4">{text.risks[item.risk_level] ?? item.risk_level}</td>
                                            <td className="px-4 py-4">{text.statuses[item.status] ?? item.status}</td>
                                            <td className="max-w-[280px] px-4 py-4">{item.reason}</td>
                                            <td className="px-4 py-4 text-xs text-slate-600">
                                                <div>{text.officer}: {item.officer_approver?.name ?? item.officerApprover?.name ?? '-'}</div>
                                                <div>{item.department_officer_approved_at ? new Date(item.department_officer_approved_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}</div>
                                                <div className="mt-1">{text.manager}: {item.manager_approver?.name ?? item.managerApprover?.name ?? '-'}</div>
                                                <div>{item.department_manager_approved_at ? new Date(item.department_manager_approved_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}</div>
                                            </td>
                                            <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => approve(item)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">{text.approve}</button><button type="button" onClick={() => reject(item)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{text.reject}</button></div></td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ title, value }) {
    return <div className="erp-card"><div className="text-sm text-slate-500">{title}</div><div className="mt-3 text-2xl font-bold text-slate-900">{value}</div></div>;
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function isFocused(id, focusId) {
    return focusId && String(id) === String(focusId);
}

function focusRowClass() {
    return 'scroll-mt-28 bg-amber-100/80 outline outline-2 outline-amber-500';
}

function scrollToFocusedRow(focusId) {
    if (!focusId) return;
    window.setTimeout(() => {
        document.getElementById(`focus-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
}
