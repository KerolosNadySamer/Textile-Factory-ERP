import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'إنتاج النسيج',
        newRecord: 'تسجيل إنتاج خام من الغزل',
        productionDate: 'تاريخ الإنتاج',
        yarnLotNo: 'لوط الغزل',
        yarnQuantity: 'كمية الغزل',
        rawLotNo: 'لوط الخام الناتج',
        rawQuantity: 'كمية الخام المنتجة',
        inspectionStatus: 'حالة الفحص',
        notes: 'ملاحظات',
        save: 'حفظ',
        list: 'سجل إنتاج النسيج',
        pending_inspection: 'بانتظار الفحص',
        accepted: 'مقبول',
        rejected: 'مرفوض',
        sent_to_raw_warehouse: 'تم الإرسال لمخزن الخام',
        sendWarehouse: 'إرسال لمخزن الخام',
        empty: 'لا توجد حركات نسيج حالياً.',
        saved: 'تم الحفظ بنجاح.',
    },
    en: {
        title: 'Weaving Production',
        newRecord: 'Record Raw Fabric From Yarn',
        productionDate: 'Production Date',
        yarnLotNo: 'Yarn Lot',
        yarnQuantity: 'Yarn Qty',
        rawLotNo: 'Raw Fabric Lot',
        rawQuantity: 'Raw Fabric Qty',
        inspectionStatus: 'Inspection Status',
        notes: 'Notes',
        save: 'Save',
        list: 'Weaving Register',
        pending_inspection: 'Pending Inspection',
        accepted: 'Accepted',
        rejected: 'Rejected',
        sent_to_raw_warehouse: 'Sent to Raw Warehouse',
        sendWarehouse: 'Send to Raw Warehouse',
        empty: 'No weaving records yet.',
        saved: 'Saved successfully.',
    },
};

export default function WeavingProductionIndex({ auth, flash, records = [] }) {
    const { isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_weaving_production');
    const canEdit = permissions.includes('edit_weaving_production');
    const form = useForm({
        production_date: new Date().toISOString().slice(0, 10),
        yarn_lot_no: '',
        yarn_quantity: '',
        raw_lot_no: '',
        raw_quantity: '',
        inspection_status: 'pending_inspection',
        notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('weaving-production.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('yarn_lot_no', 'yarn_quantity', 'raw_lot_no', 'raw_quantity', 'notes'),
        });
    };

    const updateStatus = (record, inspection_status) => {
        router.patch(route('weaving-production.status', record.id), { inspection_status }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {canCreate && (
                        <section className="erp-card">
                            <h3 className="text-lg font-semibold">{text.newRecord}</h3>
                            {flash?.success && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{text.saved}</div>}
                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={text.productionDate} error={form.errors.production_date}><input type="date" className="form-input" value={form.data.production_date} onChange={(e) => form.setData('production_date', e.target.value)} required /></Field>
                                <Field label={text.yarnLotNo} error={form.errors.yarn_lot_no}><input className="form-input" value={form.data.yarn_lot_no} onChange={(e) => form.setData('yarn_lot_no', e.target.value)} required /></Field>
                                <Field label={text.yarnQuantity} error={form.errors.yarn_quantity}><input type="number" step="0.01" className="form-input" value={form.data.yarn_quantity} onChange={(e) => form.setData('yarn_quantity', e.target.value)} required /></Field>
                                <Field label={text.rawLotNo} error={form.errors.raw_lot_no}><input className="form-input" value={form.data.raw_lot_no} onChange={(e) => form.setData('raw_lot_no', e.target.value)} required /></Field>
                                <Field label={text.rawQuantity} error={form.errors.raw_quantity}><input type="number" step="0.01" className="form-input" value={form.data.raw_quantity} onChange={(e) => form.setData('raw_quantity', e.target.value)} required /></Field>
                                <Field label={text.inspectionStatus} error={form.errors.inspection_status}>
                                    <select className="form-input" value={form.data.inspection_status} onChange={(e) => form.setData('inspection_status', e.target.value)}>
                                        {['pending_inspection', 'accepted', 'rejected'].map((status) => <option key={status} value={status}>{text[status]}</option>)}
                                    </select>
                                </Field>
                                <div className="lg:col-span-2"><Field label={text.notes} error={form.errors.notes}><input className="form-input" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} /></Field></div>
                                <div className="lg:col-span-4"><button className="erp-button" disabled={form.processing}>{text.save}</button></div>
                            </form>
                        </section>
                    )}

                    <section className="erp-card">
                        <h3 className="text-lg font-semibold">{text.list}</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>{[text.productionDate, text.yarnLotNo, text.yarnQuantity, text.rawLotNo, text.rawQuantity, text.inspectionStatus, ''].map((h) => <th key={h} className="px-4 py-3 text-start">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {records.map((record) => (
                                        <tr key={record.id}>
                                            <td className="px-4 py-3">{record.production_date}</td>
                                            <td className="px-4 py-3">{record.yarn_lot_no}</td>
                                            <td className="px-4 py-3">{record.yarn_quantity}</td>
                                            <td className="px-4 py-3 font-semibold">{record.raw_lot_no}</td>
                                            <td className="px-4 py-3">{record.raw_quantity}</td>
                                            <td className="px-4 py-3">{text[record.inspection_status] ?? record.inspection_status}</td>
                                            <td className="px-4 py-3">{canEdit && record.inspection_status === 'accepted' && <button type="button" onClick={() => updateStatus(record, 'sent_to_raw_warehouse')} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">{text.sendWarehouse}</button>}</td>
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

function Field({ label, error, children }) {
    return <label className="block text-sm font-medium"><span>{label}</span><div className="mt-1">{children}</div>{error && <div className="mt-1 text-sm text-red-600">{error}</div>}</label>;
}
