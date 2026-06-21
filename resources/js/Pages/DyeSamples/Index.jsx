import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'عينات الصباغة',
        subtitle: 'ترشيح عينة أو أكثر وربطها بطلبية العميل ثم اعتمادها عبر مدير المصبغة، مسؤول المبيعات، مدير المبيعات، والمدير العام.',
        newSample: 'عينة جديدة',
        sampleNo: 'رقم العينة',
        salesOrder: 'طلبية العميل',
        issueNo: 'إذن دخول/صرف الخام',
        rawLotNo: 'لوط الخام',
        product: 'الصنف',
        requestedColor: 'اللون المطلوب',
        sampleColor: 'لون العينة',
        recipe: 'الوصفة',
        notes: 'ملاحظات',
        save: 'حفظ العينة',
        update: 'تحديث العينة',
        cancel: 'إلغاء',
        list: 'سجل العينات',
        status: 'الحالة',
        createdBy: 'أنشأها',
        submit: 'إرسال لمدير المصبغة',
        dyeingApprove: 'اعتماد مدير المصبغة',
        salesOfficerApprove: 'اعتماد مسؤول المبيعات',
        salesManagerApprove: 'اعتماد مدير المبيعات',
        generalManagerApprove: 'اعتماد المدير العام',
        reject: 'رفض وإعادة عينة',
        edit: 'تعديل',
        delete: 'حذف',
        reason: 'سبب الرفض',
        empty: 'لا توجد عينات مسجلة.',
        saved: 'تم الحفظ بنجاح.',
        draft: 'مسودة',
        pending_dyeing_manager: 'بانتظار مدير المصبغة',
        pending_sales_officer: 'بانتظار مسؤول المبيعات',
        pending_sales_manager: 'بانتظار مدير المبيعات',
        pending_general_manager: 'بانتظار المدير العام',
        approved: 'معتمدة',
        rejected: 'مرفوضة',
    },
    en: {
        title: 'Dye Samples',
        subtitle: 'Nominate one or more samples and approve them through dyeing manager, sales officer, sales manager, and general manager.',
        newSample: 'New Sample',
        sampleNo: 'Sample No.',
        salesOrder: 'Customer Order',
        issueNo: 'Raw Entry/Issue No.',
        rawLotNo: 'Raw Lot',
        product: 'Product',
        requestedColor: 'Requested Color',
        sampleColor: 'Sample Color',
        recipe: 'Recipe',
        notes: 'Notes',
        save: 'Save Sample',
        update: 'Update Sample',
        cancel: 'Cancel',
        list: 'Samples Register',
        status: 'Status',
        createdBy: 'Created By',
        submit: 'Send to Dyeing Manager',
        dyeingApprove: 'Dyeing Manager Approve',
        salesOfficerApprove: 'Sales Officer Approve',
        salesManagerApprove: 'Sales Manager Approve',
        generalManagerApprove: 'General Manager Approve',
        reject: 'Reject and Redye',
        edit: 'Edit',
        delete: 'Delete',
        reason: 'Rejection reason',
        empty: 'No dye samples recorded.',
        saved: 'Saved successfully.',
        draft: 'Draft',
        pending_dyeing_manager: 'Pending Dyeing Manager',
        pending_sales_officer: 'Pending Sales Officer',
        pending_sales_manager: 'Pending Sales Manager',
        pending_general_manager: 'Pending General Manager',
        approved: 'Approved',
        rejected: 'Rejected',
    },
};

export default function DyeSamplesIndex({ auth, flash, dyeSamples = [], products = [], salesOrders = [] }) {
    const { isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const position = auth.user.position?.code;
    const role = auth.user.role?.slug;
    const canCreate = permissions.includes('create_dye_sample');
    const canDelete = permissions.includes('delete_dye_sample');
    const [editingSample, setEditingSample] = useState(null);
    const form = useForm({
        issue_no: '',
        sales_order_id: salesOrders[0]?.id ?? '',
        raw_lot_no: '',
        product_id: products[0]?.id ?? '',
        requested_color: '',
        sample_color: '',
        recipe: '',
        dyeing_notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: clearForm };
        if (editingSample) {
            router.patch(route('dye-samples.update', editingSample.id), form.data, options);
            return;
        }
        form.post(route('dye-samples.store'), options);
    };

    const clearForm = () => {
        setEditingSample(null);
        form.setData({
            issue_no: '',
            sales_order_id: salesOrders[0]?.id ?? '',
            raw_lot_no: '',
            product_id: products[0]?.id ?? '',
            requested_color: '',
            sample_color: '',
            recipe: '',
            dyeing_notes: '',
        });
    };

    const editSample = (sample) => {
        setEditingSample(sample);
        form.setData({
            issue_no: sample.issue_no ?? '',
            sales_order_id: sample.sales_order_id ?? '',
            raw_lot_no: sample.raw_lot_no ?? '',
            product_id: sample.product_id ?? '',
            requested_color: sample.requested_color ?? '',
            sample_color: sample.sample_color ?? '',
            recipe: sample.recipe ?? '',
            dyeing_notes: sample.dyeing_notes ?? '',
        });
    };

    const changeStatus = (sample, status) => {
        const payload = { status };
        if (status === 'rejected') {
            const reason = window.prompt(text.reason);
            if (!reason) return;
            payload.rejection_reason = reason;
        }
        router.patch(route('dye-samples.status', sample.id), payload, { preserveScroll: true });
    };

    const deleteSample = (sample) => {
        if (window.confirm(`${text.delete} ${sample.sample_no}?`)) {
            router.delete(route('dye-samples.destroy', sample.id), { preserveScroll: true });
        }
    };

    const canMove = (sample, status) => {
        if (status === 'pending_dyeing_manager') return canCreate && ['draft', 'rejected'].includes(sample.status);
        if (status === 'pending_sales_officer') return sample.status === 'pending_dyeing_manager' && (role === 'admin' || ['section_head', 'dyeing_manager'].includes(position));
        if (status === 'pending_sales_manager') return sample.status === 'pending_sales_officer' && (role === 'admin' || ['sales_officer', 'sales_rep'].includes(position));
        if (status === 'pending_general_manager') return sample.status === 'pending_sales_manager' && (role === 'admin' || position === 'sales_manager');
        if (status === 'approved') return sample.status === 'pending_general_manager' && (['admin', 'general_manager'].includes(role) || position === 'general_manager');
        return false;
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {(canCreate || editingSample) && (
                        <section className="erp-card">
                            <h3 className="text-lg font-semibold">{editingSample ? text.update : text.newSample}</h3>
                            <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            {flash?.success && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{text.saved}</div>}
                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={text.salesOrder} error={form.errors.sales_order_id}>
                                    <select className="form-input" value={form.data.sales_order_id} onChange={(e) => form.setData('sales_order_id', e.target.value)}>
                                        <option value="">-</option>
                                        {salesOrders.map((order) => <option key={order.id} value={order.id}>{order.so_number} - {order.customer?.name_ar ?? order.customer?.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.issueNo} error={form.errors.issue_no}><input className="form-input" value={form.data.issue_no} onChange={(e) => form.setData('issue_no', e.target.value)} required /></Field>
                                <Field label={text.rawLotNo} error={form.errors.raw_lot_no}><input className="form-input" value={form.data.raw_lot_no} onChange={(e) => form.setData('raw_lot_no', e.target.value)} /></Field>
                                <Field label={text.product} error={form.errors.product_id}>
                                    <select className="form-input" value={form.data.product_id} onChange={(e) => form.setData('product_id', e.target.value)} required>
                                        {products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.requestedColor} error={form.errors.requested_color}><input className="form-input" value={form.data.requested_color} onChange={(e) => form.setData('requested_color', e.target.value)} required /></Field>
                                <Field label={text.sampleColor} error={form.errors.sample_color}><input className="form-input" value={form.data.sample_color} onChange={(e) => form.setData('sample_color', e.target.value)} /></Field>
                                <Field label={text.recipe} error={form.errors.recipe}><input className="form-input" value={form.data.recipe} onChange={(e) => form.setData('recipe', e.target.value)} /></Field>
                                <Field label={text.notes} error={form.errors.dyeing_notes}><input className="form-input" value={form.data.dyeing_notes} onChange={(e) => form.setData('dyeing_notes', e.target.value)} /></Field>
                                <div className="lg:col-span-4">
                                    <button className="erp-button" disabled={form.processing}>{editingSample ? text.update : text.save}</button>
                                    {editingSample && <button type="button" className="control-pill ms-2" onClick={clearForm}>{text.cancel}</button>}
                                </div>
                            </form>
                        </section>
                    )}

                    <section className="erp-card">
                        <h3 className="text-lg font-semibold">{text.list}</h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>{[text.sampleNo, text.salesOrder, text.issueNo, text.rawLotNo, text.product, text.requestedColor, text.sampleColor, text.status, ''].map((h) => <th key={h} className="px-4 py-3 text-start">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dyeSamples.length === 0 && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {dyeSamples.map((sample) => (
                                        <tr key={sample.id}>
                                            <td className="px-4 py-3 font-semibold">{sample.sample_no}</td>
                                            <td className="px-4 py-3">{sample.sales_order?.so_number ?? '-'}</td>
                                            <td className="px-4 py-3">{sample.issue_no}</td>
                                            <td className="px-4 py-3">{sample.raw_lot_no ?? '-'}</td>
                                            <td className="px-4 py-3">{sample.product?.name}</td>
                                            <td className="px-4 py-3">{sample.requested_color}</td>
                                            <td className="px-4 py-3">{sample.sample_color ?? '-'}</td>
                                            <td className="px-4 py-3">{text[sample.status] ?? sample.status}</td>
                                            <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                                                {canMove(sample, 'pending_dyeing_manager') && <Button onClick={() => changeStatus(sample, 'pending_dyeing_manager')}>{text.submit}</Button>}
                                                {canMove(sample, 'pending_sales_officer') && <Button onClick={() => changeStatus(sample, 'pending_sales_officer')}>{text.dyeingApprove}</Button>}
                                                {canMove(sample, 'pending_sales_manager') && <Button onClick={() => changeStatus(sample, 'pending_sales_manager')}>{text.salesOfficerApprove}</Button>}
                                                {canMove(sample, 'pending_general_manager') && <Button onClick={() => changeStatus(sample, 'pending_general_manager')}>{text.salesManagerApprove}</Button>}
                                                {canMove(sample, 'approved') && <Button onClick={() => changeStatus(sample, 'approved')}>{text.generalManagerApprove}</Button>}
                                                {!['approved', 'rejected'].includes(sample.status) && <Button danger onClick={() => changeStatus(sample, 'rejected')}>{text.reject}</Button>}
                                                {['draft', 'rejected'].includes(sample.status) && canCreate && <Button onClick={() => editSample(sample)}>{text.edit}</Button>}
                                                {canDelete && <Button danger onClick={() => deleteSample(sample)}>{text.delete}</Button>}
                                            </div></td>
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

function Button({ children, onClick, danger = false }) {
    return <button type="button" onClick={onClick} className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${danger ? 'bg-red-700' : 'bg-slate-900'}`}>{children}</button>;
}
