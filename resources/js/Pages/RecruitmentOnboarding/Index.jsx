import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'ترشيح الترقيات',
        subtitle: 'هذه الشاشة مخصصة لترشيح ترقيات الموظفين من داخل الأقسام فقط، بدون إدخال مرشحين خارجيين أو إنشاء ملفات توظيف.',
        department: 'القسم',
        employee: 'الموظف',
        currentPosition: 'الوظيفة الحالية',
        targetPosition: 'الوظيفة المرشح لها',
        promotionType: 'نوع الترقية',
        same_department: 'داخل نفس القسم',
        other_department: 'إلى قسم آخر',
        higher_position: 'منصب أعلى',
        reason: 'سبب الترشيح',
        submit: 'إرسال ترشيح الترقية',
        requests: 'ترشيحات الترقيات',
        requestNumber: 'رقم الترشيح',
        from: 'من',
        to: 'إلى',
        requester: 'بواسطة',
        status: 'الحالة',
        actions: 'إجراءات',
        approve: 'اعتماد',
        reject: 'رفض',
        rejectPrompt: 'اكتب سبب الرفض',
        openPromotions: 'ترقيات مفتوحة',
        pendingHr: 'بانتظار HR',
        pendingGeneralManager: 'بانتظار المدير العام',
        executed: 'تم التنفيذ',
        rejected: 'مرفوض',
        pending_hr: 'بانتظار HR',
        pending_general_manager: 'بانتظار المدير العام',
        noDepartment: 'اختر القسم',
        noEmployee: 'اختر الموظف',
        noTargetPosition: 'اختر الوظيفة الجديدة',
        noData: 'لا توجد ترشيحات ترقيات حاليا.',
        availableVacancies: 'الشواغر المتاحة',
        approved: 'المعتمد',
        occupied: 'الموجود',
        vacant: 'الشاغر المتوقع',
    },
    en: {
        title: 'Promotion Nominations',
        subtitle: 'This screen is only for nominating promotions from existing department employees. No external candidates or hiring files.',
        department: 'Department',
        employee: 'Employee',
        currentPosition: 'Current Position',
        targetPosition: 'Target Position',
        promotionType: 'Promotion Type',
        same_department: 'Same Department',
        other_department: 'Other Department',
        higher_position: 'Higher Position',
        reason: 'Nomination Reason',
        submit: 'Submit Promotion Nomination',
        requests: 'Promotion Nominations',
        requestNumber: 'Nomination No.',
        from: 'From',
        to: 'To',
        requester: 'By',
        status: 'Status',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        rejectPrompt: 'Enter rejection reason',
        openPromotions: 'Open Promotions',
        pendingHr: 'Pending HR',
        pendingGeneralManager: 'Pending General Manager',
        executed: 'Executed',
        rejected: 'Rejected',
        pending_hr: 'Pending HR',
        pending_general_manager: 'Pending General Manager',
        noDepartment: 'Choose department',
        noEmployee: 'Choose employee',
        noTargetPosition: 'Choose target position',
        noData: 'No promotion nominations right now.',
        availableVacancies: 'Available vacancies',
        approved: 'Approved',
        occupied: 'Occupied',
        vacant: 'Expected vacancy',
    },
};

export default function RecruitmentOnboarding({ auth, departments = [], targetPositions = [], promotionRequests = [], metrics = {}, flash }) {
    const { isRtl, text } = useLanguage(labels);
    const [departmentId, setDepartmentId] = useState(auth.user.department_id ?? departments[0]?.id ?? '');
    const selectedDepartment = useMemo(
        () => departments.find((department) => String(department.id) === String(departmentId)),
        [departments, departmentId],
    );
    const departmentEmployees = selectedDepartment?.users ?? [];
    const form = useForm({
        employee_id: '',
        to_position_id: '',
        promotion_type: 'higher_position',
        reason: '',
    });
    const selectedEmployee = useMemo(
        () => departmentEmployees.find((employee) => String(employee.id) === String(form.data.employee_id)),
        [departmentEmployees, form.data.employee_id],
    );

    const submit = (event) => {
        event.preventDefault();
        form.post(route('recruitment-onboarding.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const approve = (request) => {
        router.patch(route('career-planning.promotions.approve', request.id), {}, { preserveScroll: true });
    };

    const reject = (request) => {
        const rejection_reason = window.prompt(text.rejectPrompt);

        if (rejection_reason?.trim()) {
            router.patch(route('career-planning.promotions.reject', request.id), { rejection_reason }, { preserveScroll: true });
        }
    };

    const metricCards = [
        [text.openPromotions, metrics.openPromotions ?? 0],
        [text.pendingHr, metrics.pendingHr ?? 0],
        [text.pendingGeneralManager, metrics.pendingGeneralManager ?? 0],
        [text.executed, metrics.executed ?? 0],
        [text.rejected, metrics.rejected ?? 0],
    ];

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
                            <div className="grid gap-3 sm:grid-cols-5 lg:min-w-[40rem]">
                                {metricCards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
                            </div>
                        </div>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                                {flash.success}
                            </div>
                        )}
                    </section>

                    <section className="erp-card">
                        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-4">
                            <Field label={text.department}>
                                <select
                                    value={departmentId}
                                    onChange={(event) => {
                                        setDepartmentId(event.target.value);
                                        form.setData((current) => ({ ...current, employee_id: '' }));
                                    }}
                                    className="form-input"
                                >
                                    <option value="">{text.noDepartment}</option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={text.employee} error={form.errors.employee_id}>
                                <select value={form.data.employee_id} onChange={(event) => form.setData('employee_id', event.target.value)} className="form-input" required>
                                    <option value="">{text.noEmployee}</option>
                                    {departmentEmployees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={text.currentPosition}>
                                <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                    {selectedEmployee?.position?.name ?? '-'}
                                </div>
                            </Field>

                            <Field label={text.targetPosition} error={form.errors.to_position_id}>
                                <select value={form.data.to_position_id} onChange={(event) => form.setData('to_position_id', event.target.value)} className="form-input" required>
                                    <option value="">{text.noTargetPosition}</option>
                                    {targetPositions.map((position) => (
                                        <option key={position.id} value={position.id} disabled={(position.available_vacancies ?? 0) <= 0}>
                                            {position.department_name} - {position.name} - {text.availableVacancies}: {position.available_vacancies ?? 0}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={text.promotionType} error={form.errors.promotion_type}>
                                <select value={form.data.promotion_type} onChange={(event) => form.setData('promotion_type', event.target.value)} className="form-input">
                                    {['higher_position', 'same_department', 'other_department'].map((type) => (
                                        <option key={type} value={type}>{text[type]}</option>
                                    ))}
                                </select>
                            </Field>

                            <div className="lg:col-span-3">
                                <Field label={text.reason} error={form.errors.reason}>
                                    <textarea value={form.data.reason} onChange={(event) => form.setData('reason', event.target.value)} className="form-input" rows="2" />
                                </Field>
                            </div>

                            <div className="lg:col-span-4">
                                <button type="submit" disabled={form.processing} className="erp-button">{text.submit}</button>
                            </div>
                        </form>
                    </section>

                    <section className="erp-card">
                        <h3 className="mb-4 text-lg font-semibold text-slate-950">{text.requests}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead>
                                    <tr>
                                        {[text.requestNumber, text.employee, text.from, text.to, text.status, text.requester, text.vacant, text.actions].map((header) => (
                                            <th key={header} className="px-4 py-3 text-start">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {promotionRequests.length === 0 && (
                                        <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">{text.noData}</td></tr>
                                    )}
                                    {promotionRequests.map((request) => (
                                        <tr key={request.id}>
                                            <td className="px-4 py-4 font-semibold text-slate-950">{request.request_number}</td>
                                            <td className="px-4 py-4">{employeeLabel(request.employee)}</td>
                                            <td className="px-4 py-4">{request.from_department?.name ?? '-'} - {request.from_position?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{request.to_department?.name ?? '-'} - {request.to_position?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{text[request.status] ?? request.status}</td>
                                            <td className="px-4 py-4">{request.requester?.name ?? '-'}</td>
                                            <td className="px-4 py-4">
                                                {request.source_impact ? (
                                                    <div className="space-y-1 text-xs font-semibold">
                                                        <div>{text.approved}: {request.source_impact.required}</div>
                                                        <div>{text.occupied}: {request.source_impact.occupied}</div>
                                                        <div>{text.vacant}: {request.source_impact.vacant}</div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-4">
                                                {!['executed', 'rejected'].includes(request.status) && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => approve(request)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">{text.approve}</button>
                                                        <button type="button" onClick={() => reject(request)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{text.reject}</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function employeeLabel(employee) {
    if (!employee) {
        return '-';
    }

    return `${employee.employee_code ?? employee.id} - ${employee.name}`;
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
