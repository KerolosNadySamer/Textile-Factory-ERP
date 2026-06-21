import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'دورة الرواتب',
        subtitle: 'رفع كشف الرواتب ثم مراجعة HR واعتماد المدير العام قبل ظهوره للموظف.',
        openBatches: 'كشوف مفتوحة',
        pendingHr: 'بانتظار HR',
        pendingGeneralManager: 'بانتظار المدير العام',
        executedThisMonth: 'منفذ هذا الشهر',
        newBatch: 'كشف رواتب جديد',
        month: 'الشهر',
        notes: 'ملاحظات',
        employee: 'الموظف',
        basic: 'الأساسي',
        allowances: 'بدلات',
        overtime: 'إضافي',
        bonuses: 'مكافآت',
        deductions: 'خصومات',
        insurance: 'تأمينات',
        taxes: 'ضرائب',
        net: 'الصافي',
        addEmployee: 'إضافة موظف',
        upload: 'رفع الكشف',
        batches: 'كشوف الرواتب',
        batch: 'الكشف',
        status: 'الحالة',
        gross: 'الإجمالي',
        totalDeductions: 'الاستقطاعات',
        actions: 'إجراءات',
        review: 'مراجعة HR',
        approveHr: 'اعتماد HR',
        approveGm: 'اعتماد المدير العام',
        reject: 'رفض',
        noData: 'لا توجد بيانات.',
        submitted: 'مرفوع من الحسابات',
        hr_reviewed: 'تمت مراجعة HR',
        hr_approved: 'معتمد من HR',
        executed: 'منفذ',
        rejected: 'مرفوض',
    },
    en: {
        title: 'Payroll Workflow',
        subtitle: 'Upload payroll, HR reviews and approves, then general manager executes it before employees can see it.',
        openBatches: 'Open Batches',
        pendingHr: 'Pending HR',
        pendingGeneralManager: 'Pending General Manager',
        executedThisMonth: 'Executed This Month',
        newBatch: 'New Payroll Batch',
        month: 'Month',
        notes: 'Notes',
        employee: 'Employee',
        basic: 'Basic',
        allowances: 'Allowances',
        overtime: 'Overtime',
        bonuses: 'Bonuses',
        deductions: 'Deductions',
        insurance: 'Insurance',
        taxes: 'Taxes',
        net: 'Net',
        addEmployee: 'Add Employee',
        upload: 'Upload Payroll',
        batches: 'Payroll Batches',
        batch: 'Batch',
        status: 'Status',
        gross: 'Gross',
        totalDeductions: 'Deductions',
        actions: 'Actions',
        review: 'HR Review',
        approveHr: 'HR Approve',
        approveGm: 'GM Approve',
        reject: 'Reject',
        noData: 'No data.',
        submitted: 'Submitted',
        hr_reviewed: 'HR Reviewed',
        hr_approved: 'HR Approved',
        executed: 'Executed',
        rejected: 'Rejected',
    },
};

export default function PayrollIndex({ auth, flash, employees = [], batches = [], metrics = {} }) {
    const { isRtl, text } = useLanguage(labels);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm({
        payroll_month: new Date().toISOString().slice(0, 7) + '-01',
        notes: '',
        items: [],
    });

    const employeeMap = useMemo(() => new Map(employees.map((employee) => [String(employee.id), employee])), [employees]);

    const addEmployee = () => {
        const employee = employeeMap.get(String(selectedEmployeeId));
        if (!employee || data.items.some((item) => String(item.user_id) === String(employee.id))) {
            return;
        }

        setData('items', [
            ...data.items,
            {
                user_id: employee.id,
                name: employee.name,
                employee_code: employee.employee_code,
                basic_salary: employee.basic_salary ?? 0,
                allowances: 0,
                overtime: 0,
                bonuses: 0,
                deductions: 0,
                insurance: 0,
                taxes: 0,
                notes: '',
            },
        ]);
        setSelectedEmployeeId('');
    };

    const updateItem = (index, key, value) => {
        setData('items', data.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('payroll.store'), {
            preserveScroll: true,
            onSuccess: () => reset('notes', 'items'),
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
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[40rem]">
                                <Kpi label={text.openBatches} value={metrics.openBatches ?? 0} />
                                <Kpi label={text.pendingHr} value={metrics.pendingHr ?? 0} />
                                <Kpi label={text.pendingGeneralManager} value={metrics.pendingGeneralManager ?? 0} />
                                <Kpi label={text.executedThisMonth} value={metrics.executedThisMonth ?? 0} />
                            </div>
                        </div>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                                {flash.success}
                            </div>
                        )}
                    </section>

                    <section className="erp-card">
                        <h3 className="text-lg font-semibold text-slate-950">{text.newBatch}</h3>
                        <form onSubmit={submit} className="mt-5 space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field label={text.month} error={errors.payroll_month}>
                                    <input type="date" value={data.payroll_month} onChange={(event) => setData('payroll_month', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={text.notes} error={errors.notes}>
                                    <input value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={text.employee}>
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="form-input">
                                            <option value="">{text.employee}</option>
                                            {employees.map((employee) => (
                                                <option key={employee.id} value={employee.id}>{employee.employee_code ?? employee.id} - {employee.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={addEmployee} className="erp-button">{text.addEmployee}</button>
                                    </div>
                                </Field>
                            </div>

                            <div className="grid gap-3">
                                {data.items.map((item, index) => (
                                    <PayrollItemEditor key={item.user_id} item={item} index={index} text={text} onChange={updateItem} />
                                ))}
                                {errors.items && <div className="text-sm text-rose-600">{errors.items}</div>}
                            </div>

                            <button disabled={processing || data.items.length === 0} className="erp-button">{text.upload}</button>
                        </form>
                    </section>

                    <section className="erp-card">
                        <h3 className="text-lg font-semibold text-slate-950">{text.batches}</h3>
                        <div className="mt-5 grid gap-4">
                            {batches.length === 0 && <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">{text.noData}</div>}
                            {batches.map((batch) => (
                                <BatchPanel key={batch.id} batch={batch} text={text} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PayrollItemEditor({ item, index, text, onChange }) {
    const net = calculateNet(item);

    return (
        <div className="rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-3 font-bold text-slate-950">{item.employee_code ?? item.user_id} - {item.name}</div>
            <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
                {[
                    ['basic_salary', text.basic],
                    ['allowances', text.allowances],
                    ['overtime', text.overtime],
                    ['bonuses', text.bonuses],
                    ['deductions', text.deductions],
                    ['insurance', text.insurance],
                    ['taxes', text.taxes],
                ].map(([key, label]) => (
                    <label key={key} className="text-xs font-bold text-slate-600">
                        {label}
                        <input type="number" min="0" step="0.01" value={item[key]} onChange={(event) => onChange(index, key, event.target.value)} className="form-input" />
                    </label>
                ))}
                <div className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
                    <div className="text-xs font-bold">{text.net}</div>
                    <div className="text-lg font-black">{formatNumber(net)}</div>
                </div>
            </div>
        </div>
    );
}

function BatchPanel({ batch, text }) {
    const canReview = batch.status === 'submitted';
    const canApproveHr = ['submitted', 'hr_reviewed'].includes(batch.status);
    const canApproveGm = batch.status === 'hr_approved';
    const canReject = !['executed', 'rejected'].includes(batch.status);

    const reject = () => {
        const rejection_reason = window.prompt(text.reject);
        router.patch(route('payroll.reject', batch.id), { rejection_reason }, { preserveScroll: true });
    };

    return (
        <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="text-base font-black text-slate-950">{batch.batch_number}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">{batch.payroll_month} - {text[batch.status] ?? batch.status}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <Mini label={text.gross} value={formatNumber(batch.gross_total)} />
                    <Mini label={text.totalDeductions} value={formatNumber(batch.deductions_total)} />
                    <Mini label={text.net} value={formatNumber(batch.net_total)} tone="success" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {canReview && <button type="button" onClick={() => router.patch(route('payroll.review', batch.id), {}, { preserveScroll: true })} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white">{text.review}</button>}
                    {canApproveHr && <button type="button" onClick={() => router.patch(route('payroll.approve-hr', batch.id), {}, { preserveScroll: true })} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">{text.approveHr}</button>}
                    {canApproveGm && <button type="button" onClick={() => router.patch(route('payroll.approve-general-manager', batch.id), {}, { preserveScroll: true })} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">{text.approveGm}</button>}
                    {canReject && <button type="button" onClick={reject} className="rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white">{text.reject}</button>}
                </div>
            </div>

            <div className="mt-4 grid gap-2">
                {batch.items.map((item) => (
                    <div key={item.id} className="grid gap-2 rounded-md bg-slate-50 p-3 text-sm md:grid-cols-4">
                        <div className="font-bold text-slate-950">{item.employee?.employee_code ?? item.user_id} - {item.employee?.name}</div>
                        <div>{text.basic}: {formatNumber(item.basic_salary)}</div>
                        <div>{text.totalDeductions}: {formatNumber(Number(item.deductions) + Number(item.insurance) + Number(item.taxes))}</div>
                        <div className="font-black text-emerald-700">{text.net}: {formatNumber(item.net_salary)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Kpi({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-4 py-3">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
        </div>
    );
}

function Mini({ label, value, tone = 'neutral' }) {
    return (
        <div className={`rounded-md px-3 py-2 ${tone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-900'}`}>
            <div className="text-xs font-bold opacity-75">{label}</div>
            <div className="text-sm font-black">{value}</div>
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

function calculateNet(item) {
    return Math.max(0,
        Number(item.basic_salary || 0)
        + Number(item.allowances || 0)
        + Number(item.overtime || 0)
        + Number(item.bonuses || 0)
        - Number(item.deductions || 0)
        - Number(item.insurance || 0)
        - Number(item.taxes || 0),
    );
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
