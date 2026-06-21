import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'محاسبة التكاليف',
        newEntry: 'إضافة تكلفة',
        summaries: 'ملخصات التكلفة',
        entries: 'بنود التكلفة',
        lot: 'اللوط',
        product: 'الصنف',
        type: 'نوع التكلفة',
        description: 'الوصف',
        amount: 'القيمة',
        department: 'القسم',
        material: 'الخامات',
        production: 'الإنتاج',
        dyeing: 'الصباغة',
        overhead: 'مصروفات غير مباشرة',
        total: 'الإجمالي',
        unitCost: 'تكلفة الوحدة',
        quantity: 'الكمية',
        status: 'الحالة',
        recalculate: 'إعادة حساب',
        review: 'مراجعة',
        approve: 'اعتماد',
        save: 'حفظ التكلفة',
        empty: 'لا توجد ملخصات تكلفة حتى الآن.',
        saved: 'تم الحفظ بنجاح.',
        lotTypes: {
            yarn: 'غزل',
            raw_fabric: 'خام',
            dyed_fabric: 'مصبوغ',
        },
    },
    en: {
        title: 'Cost Accounting',
        newEntry: 'Add Cost Entry',
        summaries: 'Cost Summaries',
        entries: 'Cost Entries',
        lot: 'Lot',
        product: 'Product',
        type: 'Cost Type',
        description: 'Description',
        amount: 'Amount',
        department: 'Department',
        material: 'Material',
        production: 'Production',
        dyeing: 'Dyeing',
        overhead: 'Overhead',
        total: 'Total',
        unitCost: 'Unit Cost',
        quantity: 'Qty',
        status: 'Status',
        recalculate: 'Recalculate',
        review: 'Review',
        approve: 'Approve',
        save: 'Save Entry',
        empty: 'No cost summaries yet.',
        saved: 'Saved successfully.',
        lotTypes: {
            yarn: 'Yarn',
            raw_fabric: 'Raw Fabric',
            dyed_fabric: 'Dyed Fabric',
        },
    },
};

const translatedCostTypes = {
    ar: {
        material: 'خامات',
        production: 'إنتاج',
        dyeing: 'صباغة',
        overhead: 'مصروفات غير مباشرة',
    },
    en: {
        material: 'Material',
        production: 'Production',
        dyeing: 'Dyeing',
        overhead: 'Overhead',
    },
};

export default function CostAccountingIndex({ auth, flash, lots, summaries, departments, costTypes }) {
    const { language, isRtl, text } = useLanguage(labels);
    const costTypeText = {
        ...costTypes,
        ...(translatedCostTypes[language] ?? translatedCostTypes.en),
    };
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_cost_entry');
    const canReview = permissions.includes('review_cost_summary');
    const canApprove = permissions.includes('approve_cost_summary');
    const form = useForm({
        lot_id: lots[0]?.id ?? '',
        cost_type: Object.keys(costTypes)[0] ?? 'production',
        description: '',
        amount: '',
        department_id: auth.user.department_id ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('cost-accounting.entries.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('description', 'amount'),
        });
    };

    const recalculate = (lotId) => router.patch(route('cost-accounting.recalculate', lotId), {}, { preserveScroll: true });
    const review = (lotId) => router.patch(route('cost-accounting.review', lotId), {}, { preserveScroll: true });
    const approve = (lotId) => router.patch(route('cost-accounting.approve', lotId), {}, { preserveScroll: true });

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{text.saved}</div>}

                    {canCreate && (
                        <div className="erp-card">
                            <h3 className="mb-5 text-lg font-semibold">{text.newEntry}</h3>
                            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={text.lot} error={form.errors.lot_id}>
                                    <select className="form-input" value={form.data.lot_id} onChange={(event) => form.setData('lot_id', event.target.value)} required>
                                        {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.display_number ?? lot.lot_number} - {text.lotTypes[lot.lot_type] ?? lot.lot_type}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.type} error={form.errors.cost_type}>
                                    <select className="form-input" value={form.data.cost_type} onChange={(event) => form.setData('cost_type', event.target.value)}>
                                        {Object.entries(costTypeText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.amount} error={form.errors.amount}>
                                    <input type="number" min="0.01" step="0.01" className="form-input" value={form.data.amount} onChange={(event) => form.setData('amount', event.target.value)} required />
                                </Field>
                                <Field label={text.department} error={form.errors.department_id}>
                                    <select className="form-input" value={form.data.department_id} onChange={(event) => form.setData('department_id', event.target.value)}>
                                        <option value="">-</option>
                                        {departments.map((department) => <option key={department.id} value={department.id}>{department.code} - {department.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.description} error={form.errors.description} wide>
                                    <input className="form-input" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} required />
                                </Field>
                                <div className="lg:col-span-4">
                                    <button disabled={form.processing} className="erp-button">{text.save}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="erp-card">
                        <h3 className="mb-5 text-lg font-semibold">{text.summaries}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5" style={{ color: 'var(--erp-muted)' }}>
                                    <tr>
                                        <Th>{text.lot}</Th>
                                        <Th>{text.product}</Th>
                                        <Th>{text.quantity}</Th>
                                        <Th>{text.material}</Th>
                                        <Th>{text.production}</Th>
                                        <Th>{text.dyeing}</Th>
                                        <Th>{text.overhead}</Th>
                                        <Th>{text.total}</Th>
                                        <Th>{text.unitCost}</Th>
                                        <Th>{text.status}</Th>
                                        <Th></Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {summaries.length === 0 && <tr><td colSpan="11" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {summaries.map((summary) => (
                                        <tr key={summary.id}>
                                            <td className="px-4 py-4 font-semibold">{summary.lot?.display_number ?? summary.lot?.lot_number}</td>
                                            <td className="px-4 py-4">{summary.lot?.product ? `${summary.lot.product.code} - ${summary.lot.product.name}` : '-'}</td>
                                            <td className="px-4 py-4">{summary.lot?.quantity} {summary.lot?.unit}</td>
                                            <td className="px-4 py-4">{summary.material_cost}</td>
                                            <td className="px-4 py-4">{summary.production_cost}</td>
                                            <td className="px-4 py-4">{summary.dyeing_cost}</td>
                                            <td className="px-4 py-4">{summary.overhead_cost}</td>
                                            <td className="px-4 py-4 font-semibold">{summary.total_cost}</td>
                                            <td className="px-4 py-4 font-semibold">{summary.unit_cost}</td>
                                            <td className="px-4 py-4">{summary.status}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {canCreate && summary.status !== 'approved' && <SmallButton onClick={() => recalculate(summary.lot_id)}>{text.recalculate}</SmallButton>}
                                                    {canReview && ['draft', 'rejected'].includes(summary.status) && <SmallButton onClick={() => review(summary.lot_id)}>{text.review}</SmallButton>}
                                                    {canApprove && summary.status === 'reviewed' && <SmallButton onClick={() => approve(summary.lot_id)}>{text.approve}</SmallButton>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="erp-card">
                        <h3 className="mb-5 text-lg font-semibold">{text.entries}</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            {lots.flatMap((lot) => (lot.cost_entries ?? []).map((entry) => (
                                <div key={entry.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                                    <div className="font-semibold">{lot.display_number ?? lot.lot_number} - {costTypeText[entry.cost_type] ?? entry.cost_type}</div>
                                    <div className="mt-1 text-slate-600">{entry.description}</div>
                                    <div className="mt-2 text-xs text-slate-500">{entry.amount} - {entry.department?.name ?? '-'} - {entry.creator?.name ?? '-'}</div>
                                </div>
                            )))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children, wide = false }) {
    return <div className={wide ? 'lg:col-span-2' : ''}><label className="block text-sm font-medium">{label}</label>{children}{error && <div className="mt-1 text-sm text-red-600">{error}</div>}</div>;
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function SmallButton({ children, onClick }) {
    return <button type="button" onClick={onClick} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{children}</button>;
}
