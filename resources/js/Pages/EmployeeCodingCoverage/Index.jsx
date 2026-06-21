import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'تغطية الأقسام والهيكل الوظيفي',
        subtitle: 'بطاقات توضح تغطية كل قسم والوظائف الشاغرة وطلبات النقل والتعيين.',
        departments: 'الأقسام',
        totalEmployees: 'إجمالي الموظفين',
        requiredHeadcount: 'الوظائف المطلوبة',
        occupiedHeadcount: 'المشغول',
        vacantHeadcount: 'العجز',
        surplusHeadcount: 'الفائض',
        coverage: 'التغطية',
        vacantJobs: 'وظائف شاغرة',
        positions: 'الوظائف',
        employees: 'الموظفون',
        openRecruitment: 'طلبات توظيف مفتوحة',
        openTransfers: 'طلبات نقل مفتوحة',
        transferEmployee: 'طلب نقل موظف',
        codeEmployee: 'تكويد موظف',
        employee: 'الموظف',
        targetDepartment: 'القسم الجديد',
        targetPosition: 'الوظيفة الجديدة',
        reason: 'سبب النقل',
        sendTransfer: 'إرسال طلب النقل',
        currentDepartment: 'القسم الحالي',
        from: 'من',
        to: 'إلى',
        status: 'الحالة',
        requester: 'طالب النقل',
        structuralImpact: 'تأثير الهيكل',
        suggestedSuccessor: 'البديل المقترح',
        vacantAfterMove: 'العجز المتوقع',
        noSuccessor: 'لا يوجد بديل معتمد',
        actions: 'إجراءات',
        approve: 'اعتماد',
        reject: 'رفض',
        openUsers: 'فتح شاشة المستخدمين',
        openDepartments: 'فتح سجل الأقسام',
        noData: 'لا توجد بيانات حاليًا.',
        notRecorded: 'غير مسجل',
        optional: 'اختياري',
        availableVacancies: 'المتاح',
        pending_current_manager: 'بانتظار المدير الحالي',
        pending_new_manager: 'بانتظار المدير الجديد',
        pending_hr: 'بانتظار HR',
        executed: 'تم التنفيذ',
        rejected: 'مرفوض',
    },
    en: {
        title: 'Department Coverage & Job Structure',
        subtitle: 'Cards showing each department coverage, vacancies, recruitment requests, and transfers.',
        departments: 'Departments',
        totalEmployees: 'Employees',
        requiredHeadcount: 'Required Jobs',
        occupiedHeadcount: 'Occupied',
        vacantHeadcount: 'Vacant',
        surplusHeadcount: 'Surplus',
        coverage: 'Coverage',
        vacantJobs: 'Vacant Jobs',
        positions: 'Positions',
        employees: 'Employees',
        openRecruitment: 'Open Recruitment',
        openTransfers: 'Open Transfers',
        transferEmployee: 'Employee Transfer Request',
        codeEmployee: 'Code Employee',
        employee: 'Employee',
        targetDepartment: 'New Department',
        targetPosition: 'New Position',
        reason: 'Transfer Reason',
        sendTransfer: 'Send Transfer Request',
        currentDepartment: 'Current Department',
        from: 'From',
        to: 'To',
        status: 'Status',
        requester: 'Requester',
        structuralImpact: 'Structure Impact',
        suggestedSuccessor: 'Suggested Successor',
        vacantAfterMove: 'Expected Vacancy',
        noSuccessor: 'No approved successor',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        openUsers: 'Open Users',
        openDepartments: 'Open Departments',
        noData: 'No data right now.',
        notRecorded: 'Not recorded',
        optional: 'Optional',
        availableVacancies: 'Available',
        pending_current_manager: 'Pending Current Manager',
        pending_new_manager: 'Pending New Manager',
        pending_hr: 'Pending HR',
        executed: 'Executed',
        rejected: 'Rejected',
    },
};

export default function EmployeeCodingCoverage({
    auth,
    flash,
    metrics,
    departments,
    allDepartments,
    transferEmployees,
    transferRequests,
}) {
    const { isRtl, text } = useLanguage(labels);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(departments[0]?.id ?? null);
    const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId) ?? departments[0];
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        department_id: '',
        position_id: '',
        reason: '',
    });

    const targetDepartment = useMemo(
        () => allDepartments.find((department) => String(department.id) === String(data.department_id)),
        [allDepartments, data.department_id],
    );
    const targetPositions = targetDepartment?.positions ?? [];
    const selectedEmployee = transferEmployees.find((employee) => String(employee.id) === String(data.user_id));

    const submitTransfer = (event) => {
        event.preventDefault();
        post(route('employee-coding-coverage.transfers.store'), {
            preserveScroll: true,
            onSuccess: () => reset('user_id', 'department_id', 'position_id', 'reason'),
        });
    };

    const approveTransfer = (request) => {
        router.patch(route('employee-coding-coverage.transfers.approve', request.id), {}, { preserveScroll: true });
    };

    const rejectTransfer = (request) => {
        const reason = window.prompt(text.reason);
        router.patch(route('employee-coding-coverage.transfers.reject', request.id), { rejection_reason: reason }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={route('users.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">{text.openUsers}</Link>
                                <Link href={route('master-data.departments')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">{text.openDepartments}</Link>
                            </div>
                        </div>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                                {flash.success}
                            </div>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                            <Kpi label={text.departments} value={metrics.departments} />
                            <Kpi label={text.totalEmployees} value={metrics.totalEmployees} />
                            <Kpi label={text.requiredHeadcount} value={metrics.requiredHeadcount} />
                            <Kpi label={text.occupiedHeadcount} value={metrics.occupiedHeadcount} />
                            <Kpi label={text.vacantHeadcount} value={metrics.vacantHeadcount} />
                            <Kpi label={text.surplusHeadcount} value={metrics.surplusHeadcount} />
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {departments.map((department) => (
                            <button
                                key={department.id}
                                type="button"
                                onClick={() => setSelectedDepartmentId(department.id)}
                                className={`rounded-lg border bg-white p-5 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selectedDepartment?.id === department.id ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-lg font-bold text-slate-950">{department.name}</div>
                                        <div className="mt-1 text-sm text-slate-500">{department.totalEmployees} {text.totalEmployees}</div>
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{department.coveragePercent}%</div>
                                </div>
                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${department.coveragePercent}%` }} />
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                                    <MiniStat label={text.requiredHeadcount} value={department.requiredHeadcount} />
                                    <MiniStat label={text.occupiedHeadcount} value={department.occupiedHeadcount} />
                                    <MiniStat label={text.vacantHeadcount} value={department.vacantHeadcount} />
                                </div>
                                <div className="mt-4 text-sm font-semibold text-slate-950">{text.vacantJobs}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {department.missingPositions.length ? department.missingPositions.map((position) => (
                                        <span key={position.id} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                                            {position.name}: {position.vacantHeadcount}
                                        </span>
                                    )) : (
                                        <span className="text-sm text-slate-500">{text.noData}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </section>

                    {selectedDepartment && (
                        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-950">{selectedDepartment.name}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{text.openRecruitment}: {selectedDepartment.openRecruitmentRequests} | {text.openTransfers}: {selectedDepartment.openTransferRequests}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link href={route('employee-coding.department', selectedDepartment.id)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">{text.codeEmployee}</Link>
                                    <div className="text-3xl font-black text-rose-700">{selectedDepartment.coveragePercent}%</div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-6 xl:grid-cols-2">
                                <Panel title={text.positions}>
                                    <Table
                                        rows={selectedDepartment.positions}
                                        columns={[
                                            [text.positions, (row) => row.name],
                                            [text.requiredHeadcount, (row) => row.optional ? text.optional : row.requiredHeadcount],
                                            [text.occupiedHeadcount, (row) => row.occupiedHeadcount],
                                            [text.vacantHeadcount, (row) => row.vacantHeadcount],
                                            [text.surplusHeadcount, (row) => row.surplusHeadcount],
                                            [text.coverage, (row) => `${row.coveragePercent}%`],
                                        ]}
                                        emptyText={text.noData}
                                    />
                                </Panel>

                                <Panel title={text.employees}>
                                    <Table
                                        rows={selectedDepartment.employees}
                                        columns={[
                                            [text.employee, (row) => `${row.employee_code ?? '-'} - ${row.name}`],
                                            [text.positions, (row) => row.position ?? text.notRecorded],
                                            [text.status, (row) => row.status],
                                            [text.currentDepartment, (row) => row.manager ?? text.notRecorded],
                                        ]}
                                        emptyText={text.noData}
                                    />
                                </Panel>
                            </div>
                        </section>
                    )}

                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">{text.transferEmployee}</h3>
                        <form onSubmit={submitTransfer} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <Field label={text.employee} error={errors.user_id}>
                                <select value={data.user_id} onChange={(event) => setData('user_id', event.target.value)} className="form-input w-full" required>
                                    <option value="">{text.employee}</option>
                                    {transferEmployees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.employee_code ?? employee.id} - {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={text.targetDepartment} error={errors.department_id}>
                                <select
                                    value={data.department_id}
                                    onChange={(event) => setData((current) => ({ ...current, department_id: event.target.value, position_id: '' }))}
                                    className="form-input w-full"
                                    required
                                >
                                    <option value="">{text.targetDepartment}</option>
                                    {allDepartments.map((department) => (
                                        <option key={department.id} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={text.targetPosition} error={errors.position_id}>
                                <select value={data.position_id} onChange={(event) => setData('position_id', event.target.value)} className="form-input w-full">
                                    <option value="">{text.targetPosition}</option>
                                    {targetPositions.map((position) => (
                                        <option key={position.id} value={position.id} disabled={(position.available_vacancies ?? 0) <= 0}>
                                            {position.name} - {text.availableVacancies}: {position.available_vacancies ?? 0}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                {text.currentDepartment}: {selectedEmployee?.department?.name ?? text.notRecorded}
                            </div>

                            <div className="md:col-span-2 xl:col-span-4">
                                <Field label={text.reason} error={errors.reason}>
                                    <textarea value={data.reason} onChange={(event) => setData('reason', event.target.value)} className="form-input w-full" rows="2" />
                                </Field>
                            </div>

                            <div className="md:col-span-2 xl:col-span-4">
                                <button disabled={processing} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                    {text.sendTransfer}
                                </button>
                            </div>
                        </form>
                    </section>

                    <Panel title={text.openTransfers}>
                        <Table
                            rows={transferRequests}
                            columns={[
                                [text.employee, (row) => row.employee?.name ?? text.notRecorded],
                                [text.from, (row) => row.from_department?.name ?? text.notRecorded],
                                [text.to, (row) => row.to_department?.name ?? text.notRecorded],
                                [text.structuralImpact, (row) => <ImpactCell impact={row.source_impact} text={text} />],
                                [text.suggestedSuccessor, (row) => <SuccessorCell successor={row.suggested_successor} text={text} />],
                                [text.status, (row) => text[row.status] ?? row.status],
                                [text.requester, (row) => row.requester?.name ?? text.notRecorded],
                                [text.actions, (row) => (
                                    row.status === 'executed' || row.status === 'rejected' ? '-' : (
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => approveTransfer(row)} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{text.approve}</button>
                                            <button type="button" onClick={() => rejectTransfer(row)} className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white">{text.reject}</button>
                                        </div>
                                    )
                                )],
                            ]}
                            emptyText={text.noData}
                        />
                    </Panel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            <span>{label}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </label>
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

function MiniStat({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-base font-bold text-slate-950">{value}</div>
        </div>
    );
}

function ImpactCell({ impact, text }) {
    if (!impact) {
        return text.notRecorded;
    }

    return (
        <div className="space-y-1 text-xs font-semibold">
            <div>{text.requiredHeadcount}: {impact.required}</div>
            <div>{text.occupiedHeadcount}: {impact.occupied}</div>
            <div className={impact.vacant > 0 ? 'text-amber-700' : 'text-emerald-700'}>{text.vacantAfterMove}: {impact.vacant}</div>
        </div>
    );
}

function SuccessorCell({ successor, text }) {
    if (!successor) {
        return <span className="text-xs font-semibold text-slate-500">{text.noSuccessor}</span>;
    }

    return (
        <div className="space-y-1 text-xs font-semibold">
            <div className="text-slate-900">{successor.employee_code ?? '-'} - {successor.name}</div>
            <div className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">{successor.readiness_percent ?? 0}%</div>
        </div>
    );
}

function Panel({ title, children }) {
    return <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h3 className="mb-4 text-lg font-semibold text-slate-950">{title}</h3>{children}</section>;
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
                            {columns.map(([label, render]) => <td key={label} className="px-4 py-3">{render(row)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
