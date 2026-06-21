import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'الجرد الفعلي',
        countSheet: 'ورقة الجرد',
        countDate: 'تاريخ الجرد',
        notes: 'ملاحظات',
        systemQty: 'الرصيد الدفتري',
        save: 'حفظ الجرد',
        history: 'سجل الجرد',
        countNo: 'رقم الجرد',
        date: 'التاريخ',
        status: 'الحالة',
        variance: 'الفروق',
        createdBy: 'أنشئ بواسطة',
        approvedBy: 'اعتمد بواسطة',
        approve: 'اعتماد',
        empty: 'لا توجد عمليات جرد حتى الآن.',
        confirmApprove: 'هل تريد اعتماد الجرد وترحيل الفروق؟',
    },
    en: {
        title: 'Physical Inventory',
        countSheet: 'Stock Count Sheet',
        countDate: 'Count Date',
        notes: 'Notes',
        systemQty: 'System',
        save: 'Save Stock Count',
        history: 'Count History',
        countNo: 'Count No',
        date: 'Date',
        status: 'Status',
        variance: 'Variance',
        createdBy: 'Created By',
        approvedBy: 'Approved By',
        approve: 'Approve',
        empty: 'No stock counts yet.',
        confirmApprove: 'Approve this count and post adjustments?',
    },
};

export default function PhysicalInventoryIndex({ auth, flash, stockCounts, openLots }) {
    const { isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const isGeneralManager = auth.user.role?.slug === 'general_manager';
    const canCreate = permissions.includes('create_stock_count') && !isGeneralManager;
    const canApprove = permissions.includes('approve_stock_count');
    const [selectedLots, setSelectedLots] = useState(openLots.slice(0, 5).map((lot) => ({
        lot_id: lot.id,
        counted_qty: lot.quantity,
        notes: '',
    })));
    const { data, setData, post, processing, errors, reset } = useForm({
        count_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: selectedLots,
    });

    const toggleLot = (lot) => {
        const exists = selectedLots.some((item) => item.lot_id === lot.id);
        const next = exists
            ? selectedLots.filter((item) => item.lot_id !== lot.id)
            : [...selectedLots, { lot_id: lot.id, counted_qty: lot.quantity, notes: '' }];

        setSelectedLots(next);
        setData('items', next);
    };

    const updateItem = (lotId, field, value) => {
        const next = selectedLots.map((item) => item.lot_id === lotId ? { ...item, [field]: value } : item);
        setSelectedLots(next);
        setData('items', next);
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('physical-inventory.store'), {
            preserveScroll: true,
            onSuccess: () => reset('notes'),
        });
    };

    const approve = (count) => {
        if (window.confirm(`${text.confirmApprove} ${count.count_number}`)) {
            router.patch(route('physical-inventory.approve', count.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{flash.success}</div>}

                    {canCreate && (
                        <div className="erp-card">
                            <h3 className="text-lg font-semibold">{text.countSheet}</h3>
                            <form onSubmit={submit} className="mt-5 space-y-5">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label={text.countDate} error={errors.count_date}><input type="date" value={data.count_date} onChange={(event) => setData('count_date', event.target.value)} className="form-input" required /></Field>
                                    <Field label={text.notes} error={errors.notes}><input value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input" /></Field>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {openLots.map((lot) => {
                                        const selected = selectedLots.find((item) => item.lot_id === lot.id);
                                        return (
                                            <div key={lot.id} className="rounded-md border border-slate-200 p-3">
                                                <label className="flex items-start gap-2">
                                                    <input type="checkbox" checked={Boolean(selected)} onChange={() => toggleLot(lot)} className="mt-1" />
                                                    <span>
                                                        <span className="block text-sm font-semibold">{lot.lot_number} - {lot.product?.code}</span>
                                                        <span className="block text-xs text-slate-500">{text.systemQty}: {lot.quantity} {lot.unit}</span>
                                                    </span>
                                                </label>
                                                {selected && (
                                                    <div className="mt-3 grid gap-2">
                                                        <input type="number" min="0" step="0.01" value={selected.counted_qty} onChange={(event) => updateItem(lot.id, 'counted_qty', event.target.value)} className="form-input" />
                                                        <input value={selected.notes} onChange={(event) => updateItem(lot.id, 'notes', event.target.value)} className="form-input" placeholder={text.notes} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <button disabled={processing || selectedLots.length === 0} className="erp-button">{text.save}</button>
                            </form>
                        </div>
                    )}

                    <div className="erp-card">
                        <h3 className="text-lg font-semibold">{text.history}</h3>
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5"><tr><Th>{text.countNo}</Th><Th>{text.date}</Th><Th>{text.status}</Th><Th>{text.variance}</Th><Th>{text.createdBy}</Th><Th>{text.approvedBy}</Th><Th></Th></tr></thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {stockCounts.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {stockCounts.map((count) => (
                                        <tr key={count.id}>
                                            <td className="px-4 py-4 font-semibold">{count.count_number}</td>
                                            <td className="px-4 py-4">{count.count_date}</td>
                                            <td className="px-4 py-4">{count.status}</td>
                                            <td className="px-4 py-4">{sumVariance(count.items)}</td>
                                            <td className="px-4 py-4">{count.creator?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{count.approver?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{canApprove && count.status === 'draft' && <button type="button" onClick={() => approve(count)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{text.approve}</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return <div><label className="block text-sm font-medium">{label}</label>{children}{error && <div className="mt-1 text-sm text-red-600">{error}</div>}</div>;
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function sumVariance(items) {
    return items.reduce((sum, item) => sum + Number(item.variance_qty), 0).toFixed(2);
}
