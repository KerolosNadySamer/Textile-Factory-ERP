import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'أوامر الصباغة',
        newOrder: 'أمر صباغة جديد',
        salesOrder: 'طلبية العميل',
        dyeSample: 'العينة المعتمدة',
        rawLotNo: 'لوط الخام',
        dyeingEntryNo: 'إذن دخول الخام للمصبغة',
        dropNumber: 'رقم النزلة',
        finishYear: 'السنة',
        finalLotNo: 'اللوط النهائي',
        notes: 'ملاحظات',
        save: 'حفظ أمر الصباغة',
        list: 'سجل أوامر الصباغة',
        status: 'الحالة',
        draft: 'مسودة',
        in_dyeing: 'تحت الصباغة',
        finished: 'انتهت الصباغة',
        sent_to_finished_warehouse: 'تم الإرسال لمخزن المصبوغ',
        rejected: 'مرفوض',
        empty: 'لا توجد أوامر صباغة حالياً.',
        saved: 'تم الحفظ بنجاح.',
    },
    en: {
        title: 'Dyeing Orders',
        newOrder: 'New Dyeing Order',
        salesOrder: 'Customer Order',
        dyeSample: 'Approved Sample',
        rawLotNo: 'Raw Lot',
        dyeingEntryNo: 'Dyeing Entry No.',
        dropNumber: 'Drop No.',
        finishYear: 'Year',
        finalLotNo: 'Final Lot',
        notes: 'Notes',
        save: 'Save Dyeing Order',
        list: 'Dyeing Register',
        status: 'Status',
        draft: 'Draft',
        in_dyeing: 'In Dyeing',
        finished: 'Finished',
        sent_to_finished_warehouse: 'Sent to Finished Warehouse',
        rejected: 'Rejected',
        empty: 'No dyeing orders yet.',
        saved: 'Saved successfully.',
    },
};

export default function DyeingOrdersIndex({ auth, flash, orders = [], salesOrders = [], dyeSamples = [] }) {
    const { isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_dyeing_order');
    const canEdit = permissions.includes('edit_dyeing_order');
    const form = useForm({
        sales_order_id: salesOrders[0]?.id ?? '',
        dye_sample_id: '',
        raw_lot_no: '',
        dyeing_entry_no: '',
        drop_number: 1,
        finish_year: new Date().getFullYear(),
        notes: '',
    });
    const finalLotPreview = form.data.dyeing_entry_no ? `${form.data.dyeing_entry_no}-${form.data.drop_number}-${form.data.finish_year}` : '-';
    const availableSamples = dyeSamples.filter((sample) => !form.data.sales_order_id || String(sample.sales_order_id) === String(form.data.sales_order_id) || !sample.sales_order_id);

    const submit = (event) => {
        event.preventDefault();
        form.post(route('dyeing-orders.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('dye_sample_id', 'raw_lot_no', 'dyeing_entry_no', 'drop_number', 'notes'),
        });
    };

    const updateStatus = (order, status) => {
        router.patch(route('dyeing-orders.status', order.id), { status }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {canCreate && (
                        <section className="erp-card">
                            <h3 className="text-lg font-semibold">{text.newOrder}</h3>
                            {flash?.success && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{text.saved}</div>}
                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={text.salesOrder} error={form.errors.sales_order_id}>
                                    <select className="form-input" value={form.data.sales_order_id} onChange={(e) => form.setData('sales_order_id', e.target.value)} required>
                                        {salesOrders.map((order) => <option key={order.id} value={order.id}>{order.so_number} - {order.customer?.name_ar ?? order.customer?.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.dyeSample} error={form.errors.dye_sample_id}>
                                    <select className="form-input" value={form.data.dye_sample_id} onChange={(e) => form.setData('dye_sample_id', e.target.value)}>
                                        <option value="">-</option>
                                        {availableSamples.map((sample) => <option key={sample.id} value={sample.id}>{sample.sample_no} - {sample.sample_color ?? sample.requested_color}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.rawLotNo} error={form.errors.raw_lot_no}><input className="form-input" value={form.data.raw_lot_no} onChange={(e) => form.setData('raw_lot_no', e.target.value)} required /></Field>
                                <Field label={text.dyeingEntryNo} error={form.errors.dyeing_entry_no}><input className="form-input" value={form.data.dyeing_entry_no} onChange={(e) => form.setData('dyeing_entry_no', e.target.value)} required /></Field>
                                <Field label={text.dropNumber} error={form.errors.drop_number}><input type="number" min="1" className="form-input" value={form.data.drop_number} onChange={(e) => form.setData('drop_number', e.target.value)} required /></Field>
                                <Field label={text.finishYear} error={form.errors.finish_year}><input type="number" min="2020" className="form-input" value={form.data.finish_year} onChange={(e) => form.setData('finish_year', e.target.value)} required /></Field>
                                <Field label={text.finalLotNo}><input className="form-input bg-slate-50" value={finalLotPreview} disabled /></Field>
                                <Field label={text.notes} error={form.errors.notes}><input className="form-input" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} /></Field>
                                <div className="lg:col-span-4"><button className="erp-button" disabled={form.processing}>{text.save}</button></div>
                            </form>
                        </section>
                    )}
                    <section className="erp-card">
                        <h3 className="text-lg font-semibold">{text.list}</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-500"><tr>{[text.salesOrder, text.dyeSample, text.rawLotNo, text.finalLotNo, text.status, ''].map((h) => <th key={h} className="px-4 py-3 text-start">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-4 py-3">{order.sales_order?.so_number}</td>
                                            <td className="px-4 py-3">{order.dye_sample?.sample_no ?? '-'}</td>
                                            <td className="px-4 py-3">{order.raw_lot_no}</td>
                                            <td className="px-4 py-3 font-semibold">{order.final_lot_no}</td>
                                            <td className="px-4 py-3">{text[order.status] ?? order.status}</td>
                                            <td className="px-4 py-3">{canEdit && <StatusButtons text={text} order={order} onChange={updateStatus} />}</td>
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

function StatusButtons({ text, order, onChange }) {
    const next = order.status === 'draft' ? 'in_dyeing' : order.status === 'in_dyeing' ? 'finished' : order.status === 'finished' ? 'sent_to_finished_warehouse' : null;
    if (!next) return null;
    return <button type="button" onClick={() => onChange(order, next)} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">{text[next]}</button>;
}

function Field({ label, error, children }) {
    return <label className="block text-sm font-medium"><span>{label}</span><div className="mt-1">{children}</div>{error && <div className="mt-1 text-sm text-red-600">{error}</div>}</label>;
}
