import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'طلبات موظفين جدد',
        subtitle: 'طلب موظفين جدد أو زيادة عدد داخل القسم، ثم اعتماد مدير القسم وHR والمدير العام قبل تعيين HR للموظفين.',
        newRequest: 'طلب جديد',
        requestKind: 'نوع الطلب',
        new_employee: 'موظف جديد',
        headcount_increase: 'زيادة عدد داخل القسم',
        department: 'القسم',
        position: 'الوظيفة',
        requestedHeadcount: 'العدد المطلوب',
        reason: 'سبب الطلب',
        submit: 'إرسال الطلب',
        requests: 'طلبات الأقسام',
        requestNumber: 'رقم الطلب',
        status: 'الحالة',
        requester: 'مقدم الطلب',
        hired: 'تم تعيينه',
        actions: 'إجراءات',
        approve: 'اعتماد',
        reject: 'رفض',
        rejectPrompt: 'اكتب سبب الرفض',
        hireEmployee: 'تعيين موظف',
        employeeName: 'اسم الموظف',
        phone: 'الهاتف',
        nationalId: 'الرقم القومي',
        educationQualification: 'المؤهل',
        hiredAt: 'تاريخ التعيين',
        employmentType: 'نوع التعاقد',
        permanent: 'دائم',
        partTime: 'جزئي',
        contractStartDate: 'بداية العقد',
        contractEndDate: 'نهاية العقد',
        contractDurationMonths: 'مدة العقد بالشهور',
        contractNoticeDays: 'تنبيه HR قبل الانتهاء',
        basicSalary: 'الراتب الأساسي',
        saveHire: 'حفظ التعيين',
        open: 'طلبات مفتوحة',
        pendingDepartmentManager: 'بانتظار مدير القسم',
        pendingHr: 'بانتظار HR',
        pendingGeneralManager: 'بانتظار المدير العام',
        readyForHiring: 'جاهز للتعيين',
        rejected: 'مرفوض',
        pending_department_manager: 'بانتظار مدير القسم',
        pending_hr_manager: 'بانتظار HR',
        pending_general_manager: 'بانتظار المدير العام',
        ready_for_employee_creation: 'جاهز لتعيين HR',
        employee_created: 'تم تعيين العدد المطلوب',
        noPosition: 'بدون وظيفة محددة',
        empty: 'لا توجد طلبات حاليا.',
        available: 'المتاح',
        current: 'الحالي',
        approved: 'المعتمد',
    },
    en: {
        title: 'New Employee Requests',
        subtitle: 'Request new employees or department headcount increases, then approve by department manager, HR, and general manager before HR hiring.',
        newRequest: 'New Request',
        requestKind: 'Request Type',
        new_employee: 'New Employee',
        headcount_increase: 'Headcount Increase',
        department: 'Department',
        position: 'Position',
        requestedHeadcount: 'Requested Count',
        reason: 'Reason',
        submit: 'Submit Request',
        requests: 'Department Requests',
        requestNumber: 'Request No.',
        status: 'Status',
        requester: 'Requester',
        hired: 'Hired',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        rejectPrompt: 'Enter rejection reason',
        hireEmployee: 'Hire Employee',
        employeeName: 'Employee Name',
        phone: 'Phone',
        nationalId: 'National ID',
        educationQualification: 'Qualification',
        hiredAt: 'Hire Date',
        employmentType: 'Employment Type',
        permanent: 'Permanent',
        partTime: 'Part-time',
        contractStartDate: 'Contract Start',
        contractEndDate: 'Contract End',
        contractDurationMonths: 'Contract Months',
        contractNoticeDays: 'HR Notice Days',
        basicSalary: 'Basic Salary',
        saveHire: 'Save Hire',
        cancel: 'Cancel',
        open: 'Open Requests',
        pendingDepartmentManager: 'Pending Department Manager',
        pendingHr: 'Pending HR',
        pendingGeneralManager: 'Pending General Manager',
        readyForHiring: 'Ready for Hiring',
        rejected: 'Rejected',
        pending_department_manager: 'Pending Department Manager',
        pending_hr_manager: 'Pending HR',
        pending_general_manager: 'Pending General Manager',
        ready_for_employee_creation: 'Ready for HR Hiring',
        employee_created: 'Requested count hired',
        noPosition: 'No specific position',
        empty: 'No requests right now.',
        available: 'Available',
        current: 'Current',
        approved: 'Approved',
    },
};

export default function DepartmentHiringRequests({ auth, requests = [], metrics = {}, departments = [], canSeeAll = false, canHire = false, flash }) {
    const { isRtl, text } = useLanguage(labels);
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const [hiringRequest, setHiringRequest] = useState(null);
    const requestForm = useForm({
        request_kind: 'new_employee',
        department_id: auth.user.department_id ?? departments[0]?.id ?? '',
        position_id: '',
        requested_headcount: 1,
        reason: '',
    });
    const hireForm = useForm(emptyHireForm());
    const selectedDepartment = useMemo(
        () => departments.find((department) => String(department.id) === String(requestForm.data.department_id)),
        [departments, requestForm.data.department_id],
    );
    const positions = selectedDepartment?.positions ?? [];
    const metricCards = [
        [text.open, metrics.open ?? 0],
        [text.pendingDepartmentManager, metrics.pendingDepartmentManager ?? 0],
        [text.pendingHr, metrics.pendingHr ?? 0],
        [text.pendingGeneralManager, metrics.pendingGeneralManager ?? 0],
        [text.readyForHiring, metrics.readyForHiring ?? 0],
        [text.rejected, metrics.rejected ?? 0],
    ];

    useEffect(() => {
        scrollToFocusedRow(focusId);
    }, [focusId]);

    const submitRequest = (event) => {
        event.preventDefault();
        requestForm.post(route('department-hiring-requests.store'), {
            preserveScroll: true,
            onSuccess: () => requestForm.reset('position_id', 'requested_headcount', 'reason'),
        });
    };

    const approve = (item) => router.patch(route('department-hiring-requests.approve', item.id), {}, { preserveScroll: true });
    const reject = (item) => {
        const rejection_reason = window.prompt(text.rejectPrompt);

        if (rejection_reason?.trim()) {
            router.patch(route('department-hiring-requests.reject', item.id), { rejection_reason }, { preserveScroll: true });
        }
    };

    const startHire = (item) => {
        setHiringRequest(item);
        hireForm.setData(emptyHireForm());
    };

    const submitHire = (event) => {
        event.preventDefault();

        if (!hiringRequest) {
            return;
        }

        hireForm.post(route('department-hiring-requests.hire', hiringRequest.id), {
            preserveScroll: true,
            onSuccess: () => {
                hireForm.setData(emptyHireForm());
                setHiringRequest(null);
            },
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 max-w-3xl text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
                                {metricCards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
                            </div>
                        </div>
                        {flash?.success && <Alert>{flash.success}</Alert>}
                        {flash?.error && <Alert danger>{flash.error}</Alert>}
                    </section>

                    <section className="erp-card">
                        <h3 className="text-lg font-semibold text-slate-950">{text.newRequest}</h3>
                        <form onSubmit={submitRequest} className="mt-5 grid gap-4 lg:grid-cols-5">
                            <Field label={text.requestKind} error={requestForm.errors.request_kind}>
                                <select value={requestForm.data.request_kind} onChange={(event) => requestForm.setData('request_kind', event.target.value)} className="form-input">
                                    <option value="new_employee">{text.new_employee}</option>
                                    <option value="headcount_increase">{text.headcount_increase}</option>
                                </select>
                            </Field>
                            <Field label={text.department} error={requestForm.errors.department_id}>
                                <select
                                    value={requestForm.data.department_id}
                                    onChange={(event) => requestForm.setData((current) => ({ ...current, department_id: event.target.value, position_id: '' }))}
                                    className="form-input"
                                    disabled={!canSeeAll}
                                    required
                                >
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.name} - {text.current}: {department.current_headcount ?? 0} - {text.approved}: {department.required_headcount ?? 0}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={text.position} error={requestForm.errors.position_id}>
                                <select value={requestForm.data.position_id} onChange={(event) => requestForm.setData('position_id', event.target.value)} className="form-input">
                                    <option value="">{text.noPosition}</option>
                                    {positions.map((position) => (
                                        <option key={position.id} value={position.id}>
                                            {position.name} - {text.available}: {position.available_vacancies ?? 0}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={text.requestedHeadcount} error={requestForm.errors.requested_headcount}>
                                <input type="number" min="1" max="50" value={requestForm.data.requested_headcount} onChange={(event) => requestForm.setData('requested_headcount', event.target.value)} className="form-input" required />
                            </Field>
                            <div className="lg:col-span-5">
                                <Field label={text.reason} error={requestForm.errors.reason}>
                                    <textarea value={requestForm.data.reason} onChange={(event) => requestForm.setData('reason', event.target.value)} className="form-input" rows="2" required />
                                </Field>
                            </div>
                            <div className="lg:col-span-5">
                                <button type="submit" disabled={requestForm.processing} className="erp-button">{text.submit}</button>
                            </div>
                        </form>
                    </section>

                    {hiringRequest && (
                        <section className="erp-card">
                            <h3 className="text-lg font-semibold text-slate-950">{text.hireEmployee}: {hiringRequest.request_number}</h3>
                            <form onSubmit={submitHire} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Field label={text.employeeName} error={hireForm.errors.name}>
                                    <input value={hireForm.data.name} onChange={(event) => hireForm.setData('name', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={text.phone} error={hireForm.errors.phone}>
                                    <input value={hireForm.data.phone} onChange={(event) => hireForm.setData('phone', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={text.nationalId} error={hireForm.errors.national_id}>
                                    <input value={hireForm.data.national_id} onChange={(event) => hireForm.setData('national_id', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={text.educationQualification} error={hireForm.errors.education_qualification}>
                                    <input value={hireForm.data.education_qualification} onChange={(event) => hireForm.setData('education_qualification', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={text.hiredAt} error={hireForm.errors.hired_at}>
                                    <input type="date" value={hireForm.data.hired_at} onChange={(event) => hireForm.setData('hired_at', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={text.employmentType} error={hireForm.errors.employment_type}>
                                    <select value={hireForm.data.employment_type} onChange={(event) => hireForm.setData('employment_type', event.target.value)} className="form-input">
                                        <option value="permanent">{text.permanent}</option>
                                        <option value="part_time">{text.partTime}</option>
                                    </select>
                                </Field>
                                {hireForm.data.employment_type === 'part_time' && (
                                    <>
                                        <Field label={text.contractStartDate} error={hireForm.errors.contract_start_date}>
                                            <input type="date" value={hireForm.data.contract_start_date} onChange={(event) => hireForm.setData('contract_start_date', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={text.contractDurationMonths} error={hireForm.errors.contract_duration_months}>
                                            <input type="number" min="1" max="60" value={hireForm.data.contract_duration_months} onChange={(event) => hireForm.setData('contract_duration_months', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={text.contractEndDate} error={hireForm.errors.contract_end_date}>
                                            <input type="date" value={hireForm.data.contract_end_date} onChange={(event) => hireForm.setData('contract_end_date', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={text.contractNoticeDays} error={hireForm.errors.contract_expiry_notice_days}>
                                            <input type="number" min="1" max="365" value={hireForm.data.contract_expiry_notice_days} onChange={(event) => hireForm.setData('contract_expiry_notice_days', event.target.value)} className="form-input" />
                                        </Field>
                                    </>
                                )}
                                <Field label={text.basicSalary} error={hireForm.errors.basic_salary}>
                                    <input type="number" min="0" step="0.01" value={hireForm.data.basic_salary} onChange={(event) => hireForm.setData('basic_salary', event.target.value)} className="form-input" />
                                </Field>
                                <div className="lg:col-span-5 flex flex-wrap gap-2">
                                    <button type="submit" disabled={hireForm.processing} className="erp-button">{text.saveHire}</button>
                                    <button type="button" onClick={() => setHiringRequest(null)} className="control-pill">{text.cancel ?? 'إلغاء'}</button>
                                </div>
                            </form>
                        </section>
                    )}

                    <section className="erp-card">
                        <h3 className="mb-4 text-lg font-semibold text-slate-950">{text.requests}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead>
                                    <tr>
                                        {[text.requestNumber, text.requestKind, text.department, text.position, text.requestedHeadcount, text.hired, text.status, text.requester, text.actions].map((header) => <th key={header} className="px-4 py-3 text-start">{header}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {requests.length === 0 && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {requests.map((item) => {
                                        const focused = isFocused(item.id, focusId);

                                        return (
                                        <tr key={item.id} id={`focus-${item.id}`} className={focused ? focusRowClass() : ''}>
                                            <td className="px-4 py-4 font-semibold text-slate-950">{item.request_number}</td>
                                            <td className="px-4 py-4">{text[item.request_kind] ?? item.request_kind}</td>
                                            <td className="px-4 py-4">{item.department?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{item.position?.name ?? text.noPosition}</td>
                                            <td className="px-4 py-4">{item.requested_headcount ?? 1}</td>
                                            <td className="px-4 py-4">{item.hired_headcount ?? 0}</td>
                                            <td className="px-4 py-4">{text[item.status] ?? item.status}</td>
                                            <td className="px-4 py-4">{item.requester?.name ?? '-'}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {['pending_department_manager', 'pending_hr_manager', 'pending_general_manager'].includes(item.status) && (
                                                        <>
                                                            <button type="button" onClick={() => approve(item)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">{text.approve}</button>
                                                            <button type="button" onClick={() => reject(item)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{text.reject}</button>
                                                        </>
                                                    )}
                                                    {canHire && item.status === 'ready_for_employee_creation' && Number(item.hired_headcount ?? 0) < Number(item.requested_headcount ?? 1) && (
                                                        <button type="button" onClick={() => startHire(item)} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">{text.hireEmployee}</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function emptyHireForm() {
    return {
        name: '',
        phone: '',
        national_id: '',
        education_qualification: '',
        hired_at: '',
        employment_type: 'permanent',
        contract_start_date: '',
        contract_duration_months: 6,
        contract_end_date: '',
        contract_expiry_notice_days: 180,
        basic_salary: '',
    };
}

function Metric({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            <span>{label}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-rose-600">{error}</div>}
        </label>
    );
}

function Alert({ children, danger = false }) {
    return (
        <div className={`mt-4 rounded-md border px-4 py-3 text-sm font-semibold ${danger ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {children}
        </div>
    );
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
