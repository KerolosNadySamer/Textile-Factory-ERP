import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'المسار الوظيفي والتعاقب',
        subtitle: 'إدارة الترقيات وخطط البدائل للمناصب القيادية.',
        openPromotions: 'ترقيات مفتوحة',
        activeSuccessionPlans: 'خطط تعاقب نشطة',
        readyNowSuccessors: 'بدائل جاهزة الآن',
        promotionRequest: 'طلب ترقية',
        employee: 'الموظف',
        targetPosition: 'الوظيفة الجديدة',
        promotionType: 'نوع الترقية',
        reason: 'سبب الترشيح',
        submitPromotion: 'إرسال طلب الترقية',
        promotionRequests: 'طلبات الترقيات',
        from: 'من',
        to: 'إلى',
        status: 'الحالة',
        requester: 'المرشح بواسطة',
        structuralImpact: 'تأثير الهيكل',
        suggestedSuccessor: 'البديل المقترح',
        requiredHeadcount: 'المعتمد',
        occupiedHeadcount: 'الموجود',
        expectedVacancy: 'العجز المتوقع',
        noSuccessor: 'لا يوجد بديل معتمد',
        actions: 'إجراءات',
        approve: 'اعتماد',
        reject: 'رفض',
        successionPlan: 'خطة تعاقب وظيفي',
        leadershipPosition: 'المنصب القيادي',
        incumbent: 'الشاغل الحالي',
        successor: 'البديل المرشح',
        firstCandidate: 'المرشح الأول',
        secondCandidate: 'المرشح الثاني',
        thirdCandidate: 'المرشح الثالث',
        candidateOrder: 'ترتيب المرشح',
        readinessPercent: 'جاهزية المرشح %',
        replacementEvent: 'حدث التغيير',
        replacementSuggestion: 'اقتراح البديل',
        readiness: 'الجاهزية',
        riskLevel: 'درجة المخاطر',
        notes: 'ملاحظات',
        saveSuccession: 'حفظ خطة التعاقب',
        successionPlans: 'خطط التعاقب',
        noData: 'لا توجد بيانات حاليًا.',
        notRecorded: 'غير مسجل',
        pending_hr: 'بانتظار HR',
        pending_general_manager: 'بانتظار المدير العام',
        executed: 'تم التنفيذ',
        rejected: 'مرفوض',
        same_department: 'داخل القسم',
        other_department: 'إلى قسم آخر',
        higher_position: 'منصب أعلى',
        ready_now: 'جاهز الآن',
        ready_3_months: 'جاهز خلال 3 أشهر',
        ready_6_months: 'جاهز خلال 6 أشهر',
        needs_development: 'يحتاج تطوير',
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'مرتفعة',
        active: 'نشطة',
        inactive: 'متوقفة',
        used: 'تم استخدامها',
        resignation: 'استقالة',
        promotion: 'ترقية',
        transfer: 'نقل',
        suspension: 'إيقاف',
        retirement: 'تقاعد',
    },
    en: {
        title: 'Career & Succession',
        subtitle: 'Manage promotion requests and successors for leadership roles.',
        openPromotions: 'Open Promotions',
        activeSuccessionPlans: 'Active Succession Plans',
        readyNowSuccessors: 'Ready Now Successors',
        promotionRequest: 'Promotion Request',
        employee: 'Employee',
        targetPosition: 'New Position',
        promotionType: 'Promotion Type',
        reason: 'Nomination Reason',
        submitPromotion: 'Submit Promotion',
        promotionRequests: 'Promotion Requests',
        from: 'From',
        to: 'To',
        status: 'Status',
        requester: 'Requested By',
        structuralImpact: 'Structure Impact',
        suggestedSuccessor: 'Suggested Successor',
        requiredHeadcount: 'Approved',
        occupiedHeadcount: 'Available',
        expectedVacancy: 'Expected Vacancy',
        noSuccessor: 'No approved successor',
        actions: 'Actions',
        approve: 'Approve',
        reject: 'Reject',
        successionPlan: 'Succession Plan',
        leadershipPosition: 'Leadership Position',
        incumbent: 'Current Holder',
        successor: 'Successor',
        firstCandidate: 'First Candidate',
        secondCandidate: 'Second Candidate',
        thirdCandidate: 'Third Candidate',
        candidateOrder: 'Candidate Order',
        readinessPercent: 'Readiness %',
        replacementEvent: 'Change Event',
        replacementSuggestion: 'Replacement Suggestion',
        readiness: 'Readiness',
        riskLevel: 'Risk',
        notes: 'Notes',
        saveSuccession: 'Save Succession Plan',
        successionPlans: 'Succession Plans',
        noData: 'No data right now.',
        notRecorded: 'Not recorded',
        pending_hr: 'Pending HR',
        pending_general_manager: 'Pending General Manager',
        executed: 'Executed',
        rejected: 'Rejected',
        same_department: 'Same Department',
        other_department: 'Other Department',
        higher_position: 'Higher Position',
        ready_now: 'Ready Now',
        ready_3_months: 'Ready in 3 Months',
        ready_6_months: 'Ready in 6 Months',
        needs_development: 'Needs Development',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        active: 'Active',
        inactive: 'Inactive',
        used: 'Used',
        resignation: 'Resignation',
        promotion: 'Promotion',
        transfer: 'Transfer',
        suspension: 'Suspension',
        retirement: 'Retirement',
    },
};

export default function CareerPlanning({ auth, flash, employees = [], departments = [], leadershipPositions = [], promotionRequests = [], successionPlans = [], successionSuggestions = [], metrics = {} }) {
    const { isRtl, text } = useLanguage(labels);
    const [eventPositionId, setEventPositionId] = useState(successionSuggestions[0]?.id ?? '');
    const [replacementEvent, setReplacementEvent] = useState('resignation');
    const promotionForm = useForm({
        employee_id: '',
        to_position_id: '',
        promotion_type: 'higher_position',
        reason: '',
    });
    const successionForm = useForm({
        position_id: '',
        incumbent_id: '',
        successor_id: '',
        candidate_order: 1,
        readiness: 'ready_now',
        readiness_percent: 90,
        risk_level: 'medium',
        notes: '',
    });

    const allPositions = useMemo(
        () => departments.flatMap((department) => (department.positions ?? []).map((position) => ({ ...position, department_name: department.name }))),
        [departments],
    );
    const selectedSuggestion = useMemo(
        () => successionSuggestions.find((item) => String(item.id) === String(eventPositionId)) ?? successionSuggestions[0],
        [eventPositionId, successionSuggestions],
    );

    const submitPromotion = (event) => {
        event.preventDefault();
        promotionForm.post(route('career-planning.promotions.store'), {
            preserveScroll: true,
            onSuccess: () => promotionForm.reset(),
        });
    };

    const submitSuccession = (event) => {
        event.preventDefault();
        successionForm.post(route('career-planning.succession.store'), {
            preserveScroll: true,
            onSuccess: () => successionForm.reset(),
        });
    };

    const approvePromotion = (request) => {
        router.patch(route('career-planning.promotions.approve', request.id), {}, { preserveScroll: true });
    };

    const rejectPromotion = (request) => {
        const rejection_reason = window.prompt(text.reason);
        router.patch(route('career-planning.promotions.reject', request.id), { rejection_reason }, { preserveScroll: true });
    };

    const updateSuccession = (event, plan) => {
        event.preventDefault();
        router.patch(route('career-planning.succession.update', plan.id), Object.fromEntries(new FormData(event.currentTarget)), {
            preserveScroll: true,
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
                            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[32rem]">
                                <Kpi label={text.openPromotions} value={metrics.openPromotions ?? 0} />
                                <Kpi label={text.activeSuccessionPlans} value={metrics.activeSuccessionPlans ?? 0} />
                                <Kpi label={text.readyNowSuccessors} value={metrics.readyNowSuccessors ?? 0} />
                            </div>
                        </div>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                                {flash.success}
                            </div>
                        )}
                    </section>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <section className="erp-card">
                            <h3 className="text-lg font-semibold text-slate-950">{text.promotionRequest}</h3>
                            <form onSubmit={submitPromotion} className="mt-5 grid gap-4 md:grid-cols-2">
                                <Field label={text.employee} error={promotionForm.errors.employee_id}>
                                    <select value={promotionForm.data.employee_id} onChange={(event) => promotionForm.setData('employee_id', event.target.value)} className="form-input" required>
                                        <option value="">{text.employee}</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={text.targetPosition} error={promotionForm.errors.to_position_id}>
                                    <select value={promotionForm.data.to_position_id} onChange={(event) => promotionForm.setData('to_position_id', event.target.value)} className="form-input" required>
                                        <option value="">{text.targetPosition}</option>
                                        {allPositions.map((position) => (
                                            <option key={position.id} value={position.id}>{position.department_name} - {position.name}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={text.promotionType} error={promotionForm.errors.promotion_type}>
                                    <select value={promotionForm.data.promotion_type} onChange={(event) => promotionForm.setData('promotion_type', event.target.value)} className="form-input">
                                        {['higher_position', 'same_department', 'other_department'].map((type) => (
                                            <option key={type} value={type}>{text[type]}</option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="md:col-span-2">
                                    <Field label={text.reason} error={promotionForm.errors.reason}>
                                        <textarea value={promotionForm.data.reason} onChange={(event) => promotionForm.setData('reason', event.target.value)} className="form-input" rows="3" />
                                    </Field>
                                </div>

                                <div className="md:col-span-2">
                                    <button disabled={promotionForm.processing} className="erp-button">{text.submitPromotion}</button>
                                </div>
                            </form>
                        </section>

                        <section className="erp-card">
                            <h3 className="text-lg font-semibold text-slate-950">{text.successionPlan}</h3>
                            <form onSubmit={submitSuccession} className="mt-5 grid gap-4 md:grid-cols-2">
                                <Field label={text.leadershipPosition} error={successionForm.errors.position_id}>
                                    <select value={successionForm.data.position_id} onChange={(event) => successionForm.setData('position_id', event.target.value)} className="form-input" required>
                                        <option value="">{text.leadershipPosition}</option>
                                        {leadershipPositions.map((position) => (
                                            <option key={position.id} value={position.id}>{position.department?.name} - {position.name}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={text.incumbent} error={successionForm.errors.incumbent_id}>
                                    <select value={successionForm.data.incumbent_id} onChange={(event) => successionForm.setData('incumbent_id', event.target.value)} className="form-input">
                                        <option value="">{text.notRecorded}</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={text.successor} error={successionForm.errors.successor_id}>
                                    <select value={successionForm.data.successor_id} onChange={(event) => successionForm.setData('successor_id', event.target.value)} className="form-input" required>
                                        <option value="">{text.successor}</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>{employeeLabel(employee)}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={text.candidateOrder} error={successionForm.errors.candidate_order}>
                                    <select value={successionForm.data.candidate_order} onChange={(event) => successionForm.setData('candidate_order', Number(event.target.value))} className="form-input">
                                        <option value="1">{text.firstCandidate}</option>
                                        <option value="2">{text.secondCandidate}</option>
                                        <option value="3">{text.thirdCandidate}</option>
                                    </select>
                                </Field>

                                <Field label={text.readiness} error={successionForm.errors.readiness}>
                                    <select value={successionForm.data.readiness} onChange={(event) => successionForm.setData('readiness', event.target.value)} className="form-input">
                                        {['ready_now', 'ready_3_months', 'ready_6_months', 'needs_development'].map((value) => (
                                            <option key={value} value={value}>{text[value]}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label={text.readinessPercent} error={successionForm.errors.readiness_percent}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={successionForm.data.readiness_percent}
                                        onChange={(event) => successionForm.setData('readiness_percent', event.target.value)}
                                        className="form-input"
                                    />
                                </Field>

                                <Field label={text.riskLevel} error={successionForm.errors.risk_level}>
                                    <select value={successionForm.data.risk_level} onChange={(event) => successionForm.setData('risk_level', event.target.value)} className="form-input">
                                        {['low', 'medium', 'high'].map((value) => (
                                            <option key={value} value={value}>{text[value]}</option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="md:col-span-2">
                                    <Field label={text.notes} error={successionForm.errors.notes}>
                                        <textarea value={successionForm.data.notes} onChange={(event) => successionForm.setData('notes', event.target.value)} className="form-input" rows="3" />
                                    </Field>
                                </div>

                                <div className="md:col-span-2">
                                    <button disabled={successionForm.processing} className="erp-button">{text.saveSuccession}</button>
                                </div>
                            </form>
                        </section>
                    </div>

                    <Panel title={text.replacementSuggestion}>
                        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
                            <Field label={text.leadershipPosition}>
                                <select value={eventPositionId} onChange={(event) => setEventPositionId(event.target.value)} className="form-input">
                                    {successionSuggestions.map((item) => (
                                        <option key={item.id} value={item.id}>{item.department?.name} - {item.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={text.replacementEvent}>
                                <select value={replacementEvent} onChange={(event) => setReplacementEvent(event.target.value)} className="form-input">
                                    {['resignation', 'promotion', 'transfer', 'suspension', 'retirement'].map((value) => (
                                        <option key={value} value={value}>{text[value]}</option>
                                    ))}
                                </select>
                            </Field>

                            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                                {selectedSuggestion ? (
                                    <div className="grid gap-3 md:grid-cols-4">
                                        <Info label={text.incumbent} value={employeeLabel(selectedSuggestion.incumbent, text.notRecorded)} />
                                        <CandidateCard label={text.firstCandidate} plan={selectedSuggestion.candidates?.[0]} text={text} />
                                        <CandidateCard label={text.secondCandidate} plan={selectedSuggestion.candidates?.[1]} text={text} />
                                        <CandidateCard label={text.thirdCandidate} plan={selectedSuggestion.candidates?.[2]} text={text} />
                                    </div>
                                ) : (
                                    <div className="text-sm font-semibold text-slate-600">{text.noData}</div>
                                )}
                            </div>
                        </div>
                    </Panel>

                    <Panel title={text.promotionRequests}>
                        <Table
                            rows={promotionRequests}
                            columns={[
                                [text.employee, (row) => employeeLabel(row.employee)],
                                [text.from, (row) => `${row.from_department?.name ?? text.notRecorded} - ${row.from_position?.name ?? text.notRecorded}`],
                                [text.to, (row) => `${row.to_department?.name ?? text.notRecorded} - ${row.to_position?.name ?? text.notRecorded}`],
                                [text.structuralImpact, (row) => <ImpactCell impact={row.source_impact} text={text} />],
                                [text.suggestedSuccessor, (row) => <SuccessorCell successor={row.suggested_successor} text={text} />],
                                [text.status, (row) => text[row.status] ?? row.status],
                                [text.requester, (row) => row.requester?.name ?? text.notRecorded],
                                [text.actions, (row) => row.status === 'executed' || row.status === 'rejected' ? '-' : (
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => approvePromotion(row)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">{text.approve}</button>
                                        <button type="button" onClick={() => rejectPromotion(row)} className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">{text.reject}</button>
                                    </div>
                                )],
                            ]}
                            emptyText={text.noData}
                        />
                    </Panel>

                    <Panel title={text.successionPlans}>
                        {successionPlans.length === 0 ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{text.noData}</div>
                        ) : (
                            <div className="grid gap-3">
                                {successionPlans.map((plan) => (
                                    <form key={plan.id} onSubmit={(event) => updateSuccession(event, plan)} className="rounded-md border border-slate-200 bg-white p-4">
                                        <div className="grid gap-3 lg:grid-cols-6">
                                            <Info label={text.leadershipPosition} value={`${plan.department?.name ?? text.notRecorded} - ${plan.position?.name ?? text.notRecorded}`} />
                                            <Info label={text.incumbent} value={employeeLabel(plan.incumbent, text.notRecorded)} />
                                            <Info label={text.successor} value={employeeLabel(plan.successor, text.notRecorded)} />
                                            <select name="candidate_order" defaultValue={plan.candidate_order ?? 1} className="form-input">
                                                <option value="1">{text.firstCandidate}</option>
                                                <option value="2">{text.secondCandidate}</option>
                                                <option value="3">{text.thirdCandidate}</option>
                                            </select>
                                            <select name="readiness" defaultValue={plan.readiness} className="form-input">
                                                {['ready_now', 'ready_3_months', 'ready_6_months', 'needs_development'].map((value) => (
                                                    <option key={value} value={value}>{text[value]}</option>
                                                ))}
                                            </select>
                                            <input name="readiness_percent" type="number" min="0" max="100" defaultValue={plan.readiness_percent ?? 0} className="form-input" />
                                            <select name="risk_level" defaultValue={plan.risk_level} className="form-input">
                                                {['low', 'medium', 'high'].map((value) => (
                                                    <option key={value} value={value}>{text[value]}</option>
                                                ))}
                                            </select>
                                            <select name="status" defaultValue={plan.status} className="form-input">
                                                {['active', 'inactive', 'used'].map((value) => (
                                                    <option key={value} value={value}>{text[value]}</option>
                                                ))}
                                            </select>
                                            <textarea name="notes" defaultValue={plan.notes ?? ''} className="form-input lg:col-span-4" rows="2" placeholder={text.notes} />
                                            <button className="erp-button">{text.saveSuccession}</button>
                                        </div>
                                    </form>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function employeeLabel(employee, fallback = '-') {
    if (!employee) {
        return fallback;
    }

    return `${employee.employee_code ?? employee.id} - ${employee.name}`;
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

function Kpi({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-4 py-3">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
        </div>
    );
}

function Panel({ title, children }) {
    return (
        <section className="erp-card">
            <h3 className="mb-4 text-lg font-semibold text-slate-950">{title}</h3>
            {children}
        </section>
    );
}

function Table({ rows, columns, emptyText }) {
    if (!rows || rows.length === 0) {
        return <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{emptyText}</div>;
    }

    return (
        <table className="w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead>
                <tr>{columns.map(([label]) => <th key={label} className="px-3 py-3 text-start">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                    <tr key={row.id} className="align-top">
                        {columns.map(([label, render]) => <td key={label} className="px-3 py-3">{render(row)}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
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
            <div className={impact.vacant > 0 ? 'text-amber-700' : 'text-emerald-700'}>{text.expectedVacancy}: {impact.vacant}</div>
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

function CandidateCard({ label, plan, text }) {
    if (!plan) {
        return (
            <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2">
                <div className="text-xs font-bold text-slate-500">{label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{text.noSuccessor}</div>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-emerald-200 bg-white px-3 py-2">
            <div className="text-xs font-bold text-emerald-700">{label}</div>
            <div className="mt-1 text-sm font-black text-slate-950">{employeeLabel(plan.successor, text.notRecorded)}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">{plan.readiness_percent ?? 0}%</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{text[plan.readiness] ?? plan.readiness}</span>
            </div>
        </div>
    );
}
