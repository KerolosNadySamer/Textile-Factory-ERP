import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';

const labels = {
    ar: {
        title: 'طلبات التغيير',
        sectionTitle: 'طلبات التغيير والاعتماد',
        help: 'كل طلب يمر من مسؤول القسم ثم مدير القسم قبل التنفيذ.',
        requestNumber: 'رقم الطلب',
        type: 'النوع',
        department: 'القسم',
        requester: 'مقدم الطلب',
        risk: 'الخطورة',
        status: 'الحالة',
        reason: 'السبب',
        approvals: 'الاعتمادات',
        actions: 'إجراءات',
        requestedAt: 'وقت الطلب',
        officer: 'مسؤول القسم',
        officerAt: 'وقت اعتماد المسؤول',
        manager: 'مدير القسم',
        managerAt: 'وقت اعتماد المدير',
        generalManager: 'المدير العام',
        executedAt: 'وقت التنفيذ',
        rejectedBy: 'الرفض',
        approve: 'اعتماد',
        reject: 'رفض',
        rejectPrompt: 'اكتب سبب الرفض',
        empty: 'لا توجد طلبات تغيير.',
        statuses: { pending_department_officer: 'بانتظار مسؤول القسم', pending_department_manager: 'بانتظار مدير القسم', pending_general_manager: 'بانتظار المدير العام', rejected: 'مرفوض', executed: 'منفذ' },
        types: { password_reset: 'تغيير كلمة مرور', customer_update: 'تعديل عميل', supplier_update: 'تعديل مورد', product_update: 'تعديل صنف', price_update: 'تعديل سعر', cost_update: 'تعديل تكلفة', department_update: 'تعديل قسم', department_position_update: 'تعديل اعتماد وظيفة' },
    },
    en: {
        title: 'Change Requests',
        sectionTitle: 'Change Requests and Approvals',
        help: 'Each request passes through the department officer and department manager before execution.',
        requestNumber: 'Request No.',
        type: 'Type',
        department: 'Department',
        requester: 'Requester',
        risk: 'Risk',
        status: 'Status',
        reason: 'Reason',
        approvals: 'Approvals',
        actions: 'Actions',
        requestedAt: 'Requested At',
        officer: 'Department Officer',
        officerAt: 'Officer Approval Time',
        manager: 'Department Manager',
        managerAt: 'Manager Approval Time',
        generalManager: 'General Manager',
        executedAt: 'Executed At',
        rejectedBy: 'Rejected By',
        approve: 'Approve',
        reject: 'Reject',
        rejectPrompt: 'Enter rejection reason',
        empty: 'No change requests found.',
        statuses: { pending_department_officer: 'Pending Officer', pending_department_manager: 'Pending Manager', pending_general_manager: 'Pending General Manager', rejected: 'Rejected', executed: 'Executed' },
        types: { password_reset: 'Password Change', customer_update: 'Customer Update', supplier_update: 'Supplier Update', product_update: 'Product Update', price_update: 'Price Update', cost_update: 'Cost Update', department_update: 'Department Update', department_position_update: 'Position Approval Update' },
    },
};

export default function ChangeRequestsIndex({ auth, changeRequests }) {
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
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="erp-card">
                        <div className="mb-5"><h3 className="text-lg font-semibold">{text.sectionTitle}</h3><p className="mt-1 text-sm text-slate-600">{text.help}</p></div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5 text-slate-600"><tr>{[text.requestNumber, text.type, text.department, text.requester, text.requestedAt, text.risk, text.status, text.reason, text.approvals, text.actions].map((header) => <Th key={header}>{header}</Th>)}</tr></thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {changeRequests.length === 0 && <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {changeRequests.map((item) => {
                                        const focused = isFocused(item.id, focusId);

                                        return (
                                        <tr key={item.id} id={`focus-${item.id}`} className={focused ? focusRowClass() : ''}>
                                            <td className="px-4 py-4 font-semibold">{item.request_number}</td>
                                            <td className="px-4 py-4">{text.types[item.type] ?? item.type}</td>
                                            <td className="px-4 py-4">{item.department?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{item.requester?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{formatDate(item.created_at, language)}</td>
                                            <td className="px-4 py-4">{item.risk_level}</td>
                                            <td className="px-4 py-4"><Status status={item.status} text={text} /></td>
                                            <td className="max-w-[260px] px-4 py-4">{item.reason}</td>
                                            <td className="px-4 py-4 text-xs text-slate-600">
                                                <div>{text.officer}: {item.officer_approver?.name ?? item.officerApprover?.name ?? '-'}</div>
                                                <div>{text.officerAt}: {formatDate(item.department_officer_approved_at, language)}</div>
                                                <div className="mt-1">{text.manager}: {item.manager_approver?.name ?? item.managerApprover?.name ?? '-'}</div>
                                                <div>{text.managerAt}: {formatDate(item.department_manager_approved_at, language)}</div>
                                                {item.executor && <div className="mt-1">{text.generalManager}: {item.executor.name}</div>}
                                                {item.executed_by && <div>{text.executedAt}: {formatDate(item.executed_at, language)}</div>}
                                                {item.rejecter && <div className="mt-1">{text.rejectedBy}: {item.rejecter.name}</div>}
                                            </td>
                                            <td className="px-4 py-4">{['pending_department_officer', 'pending_department_manager', 'pending_general_manager'].includes(item.status) && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => approve(item)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">{text.approve}</button><button type="button" onClick={() => reject(item)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{text.reject}</button></div>}</td>
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

function Status({ status, text }) {
    const style = status === 'executed' ? 'bg-emerald-100 text-emerald-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>{text.statuses[status] ?? status}</span>;
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function formatDate(value, language) {
    return value ? new Date(value).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : '-';
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
