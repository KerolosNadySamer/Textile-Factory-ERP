import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { Fragment } from 'react';

const pageLabels = {
    ar: {
        title: 'أوامر الإنتاج',
        newOrder: 'إنشاء أمر إنتاج من طلب بيع معتمد',
        list: 'قائمة أوامر الإنتاج',
        productionNumber: 'رقم أمر الإنتاج',
        salesOrder: 'طلب البيع',
        customer: 'العميل',
        quantity: 'الكمية المطلوبة',
        startDate: 'تاريخ البدء',
        dueDate: 'تاريخ التسليم',
        status: 'الحالة',
        lotMethod: 'طريقة إنشاء اللوط',
        notes: 'ملاحظات',
        createdBy: 'أنشأه',
        releasedBy: 'تم التشغيل بواسطة',
        closedBy: 'أغلقه',
        actions: 'إجراءات',
        create: 'إنشاء أمر الإنتاج',
        planned: 'تخطيط الإنتاج',
        release: 'إطلاق',
        start: 'بدء الإنتاج',
        finish: 'إنهاء الإنتاج',
        close: 'إغلاق',
        cancel: 'إلغاء',
        history: 'سجل الحركة',
        empty: 'لا توجد أوامر إنتاج بعد.',
        noApproved: 'لا توجد طلبات بيع معتمدة جاهزة للإنتاج.',
        saved: 'تم حفظ العملية بنجاح.',
        exportExcel: 'تصدير Excel',
        print: 'طباعة',
    },
    en: {
        title: 'Production Orders',
        newOrder: 'Create Production Order From Approved Sales Order',
        list: 'Production Order List',
        productionNumber: 'Production No.',
        salesOrder: 'Sales Order',
        customer: 'Customer',
        quantity: 'Planned Quantity',
        startDate: 'Start Date',
        dueDate: 'Due Date',
        status: 'Status',
        lotMethod: 'Lot Generation Method',
        notes: 'Notes',
        createdBy: 'Created By',
        releasedBy: 'Released By',
        closedBy: 'Closed By',
        actions: 'Actions',
        create: 'Create Production Order',
        planned: 'Planning Approve',
        release: 'Release',
        start: 'Start Production',
        finish: 'Finish Production',
        close: 'Close',
        cancel: 'Cancel',
        history: 'History',
        empty: 'No production orders yet.',
        noApproved: 'No approved sales orders ready for production.',
        saved: 'Operation saved successfully.',
        exportExcel: 'Export Excel',
        print: 'Print',
    },
};

const fixedProductionLabels = {
    ar: {
        title: 'أوامر الإنتاج',
        newOrder: 'إنشاء أمر إنتاج من طلب بيع معتمد',
        list: 'قائمة أوامر الإنتاج',
        productionNumber: 'رقم أمر الإنتاج',
        salesOrder: 'طلب البيع',
        customer: 'العميل',
        quantity: 'الكمية المخططة',
        startDate: 'تاريخ البدء',
        dueDate: 'تاريخ الانتهاء',
        status: 'الحالة',
        lotMethod: 'طريقة إنشاء اللوط',
        notes: 'ملاحظات',
        createdBy: 'أنشأه',
        releasedBy: 'تم الإصدار بواسطة',
        closedBy: 'أغلقه',
        actions: 'إجراءات',
        create: 'إنشاء أمر الإنتاج',
        planned: 'اعتماد التخطيط',
        release: 'إصدار',
        start: 'بدء الإنتاج',
        finish: 'إنهاء الإنتاج',
        close: 'إغلاق',
        cancel: 'إلغاء',
        history: 'سجل الحركة',
        empty: 'لا توجد أوامر إنتاج بعد.',
        noApproved: 'لا توجد طلبات بيع معتمدة جاهزة لإنشاء أمر إنتاج.',
        saved: 'تم حفظ العملية بنجاح.',
        exportExcel: 'تصدير Excel',
        print: 'طباعة',
    },
    en: pageLabels.en,
};

const statusLabels = {
    ar: {
        draft: 'مسودة',
        planned: 'مخطط',
        released: 'مصدر',
        in_production: 'تحت الإنتاج',
        finished: 'منتهي',
        closed: 'مغلق',
        cancelled: 'ملغي',
    },
    en: {
        draft: 'Draft',
        planned: 'Planned',
        released: 'Released',
        in_production: 'In Production',
        finished: 'Finished',
        closed: 'Closed',
        cancelled: 'Cancelled',
    },
};

const lotMethods = {
    ar: {
        single_lot: 'لوط واحد',
        per_item: 'لوط لكل بند',
        manual: 'يدوي',
    },
    en: {
        single_lot: 'Single Lot',
        per_item: 'Per Item',
        manual: 'Manual',
    },
};

export default function ProductionOrdersIndex({ auth, flash, productionOrders, approvedSalesOrders }) {
    const { language, isRtl, text: labels } = useLanguage(fixedProductionLabels);
    const statusText = statusLabels[language] ?? statusLabels.en;
    const lotMethodText = lotMethods[language] ?? lotMethods.en;
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_production_order');
    const canPlan = permissions.includes('plan_production_order');
    const canRelease = permissions.includes('release_production_order');
    const canRun = permissions.includes('run_production_order');
    const canClose = permissions.includes('close_production_order');
    const canExport = permissions.includes('export_reports');
    const canPrint = permissions.includes('print_documents');
    const { data, setData, post, processing, errors, reset } = useForm({
        sales_order_id: approvedSalesOrders[0]?.id ?? '',
        start_date: '',
        due_date: '',
        lot_generation_method: 'single_lot',
        notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('production-orders.store'), {
            preserveScroll: true,
            onSuccess: () => reset('start_date', 'due_date', 'notes'),
        });
    };

    const changeStatus = (order, status) => {
        router.patch(route('production-orders.status', order.id), { status }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{labels.title}</h2>}>
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {canCreate && (
                        <div className="erp-card mb-6">
                            <h3 className="text-lg font-semibold">{labels.newOrder}</h3>
                            {flash?.success && (
                                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">تم حفظ العملية بنجاح.</div>
                            )}
                            {approvedSalesOrders.length === 0 ? (
                                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{labels.noApproved}</div>
                            ) : (
                                <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Field label={labels.salesOrder} error={errors.sales_order_id}>
                                        <select value={data.sales_order_id} onChange={(event) => setData('sales_order_id', event.target.value)} className="form-input" required>
                                            {approvedSalesOrders.map((order) => (
                                                <option key={order.id} value={order.id}>
                                                    {order.so_number} - {order.customer?.name_ar ?? order.customer?.name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label={labels.startDate} error={errors.start_date}>
                                        <input type="date" value={data.start_date} onChange={(event) => setData('start_date', event.target.value)} className="form-input" />
                                    </Field>
                                    <Field label={labels.dueDate} error={errors.due_date}>
                                        <input type="date" value={data.due_date} onChange={(event) => setData('due_date', event.target.value)} className="form-input" />
                                    </Field>
                                    <Field label={labels.lotMethod} error={errors.lot_generation_method}>
                                        <select value={data.lot_generation_method} onChange={(event) => setData('lot_generation_method', event.target.value)} className="form-input">
                                            {Object.entries(lotMethodText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </Field>
                                    <Field label={labels.notes} error={errors.notes} wide>
                                        <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input min-h-[90px]" />
                                    </Field>
                                    <div className="lg:col-span-4">
                                        <button disabled={processing} className="erp-button">{labels.create}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="erp-card">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold">{labels.list}</h3>
                            {canExport && <a href={route('exports.show', { type: 'production-orders', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.exportExcel}</a>}
                        </div>
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5" style={{ color: 'var(--erp-muted)' }}>
                                    <tr>
                                        <Th>{labels.productionNumber}</Th>
                                        <Th>{labels.salesOrder}</Th>
                                        <Th>{labels.customer}</Th>
                                        <Th>{labels.quantity}</Th>
                                        <Th>{labels.startDate}</Th>
                                        <Th>{labels.dueDate}</Th>
                                        <Th>{labels.status}</Th>
                                        <Th>{labels.createdBy}</Th>
                                        <Th>{labels.releasedBy}</Th>
                                        <Th>{labels.closedBy}</Th>
                                        <Th>{labels.actions}</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {productionOrders.length === 0 && <tr><td colSpan="11" className="px-4 py-8 text-center text-slate-500">{labels.empty}</td></tr>}
                                    {productionOrders.map((order) => (
                                        <Fragment key={order.id}>
                                            <tr>
                                                <td className="px-4 py-4 font-semibold">{order.production_number}</td>
                                                <td className="px-4 py-4">{order.sales_order?.so_number}</td>
                                                <td className="px-4 py-4">{order.customer?.name_ar ?? order.customer?.name}</td>
                                                <td className="px-4 py-4">{order.planned_quantity}</td>
                                                <td className="px-4 py-4">{order.start_date ?? '-'}</td>
                                                <td className="px-4 py-4">{order.due_date ?? '-'}</td>
                                                <td className="px-4 py-4">{statusText[order.status] ?? order.status}</td>
                                                <td className="px-4 py-4">{order.creator?.name ?? '-'}</td>
                                                <td className="px-4 py-4">{order.releaser?.name ?? '-'}</td>
                                                <td className="px-4 py-4">{order.closer?.name ?? '-'}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.status === 'draft' && canPlan && <SmallButton onClick={() => changeStatus(order, 'planned')}>{labels.planned}</SmallButton>}
                                                        {order.status === 'planned' && canRelease && <SmallButton onClick={() => changeStatus(order, 'released')}>{labels.release}</SmallButton>}
                                                        {order.status === 'released' && canRun && <SmallButton onClick={() => changeStatus(order, 'in_production')}>{labels.start}</SmallButton>}
                                                        {order.status === 'in_production' && canRun && <SmallButton onClick={() => changeStatus(order, 'finished')}>{labels.finish}</SmallButton>}
                                                        {order.status === 'finished' && canClose && <SmallButton onClick={() => changeStatus(order, 'closed')}>{labels.close}</SmallButton>}
                                                        {['draft', 'planned'].includes(order.status) && canPlan && <SmallButton danger onClick={() => changeStatus(order, 'cancelled')}>{labels.cancel}</SmallButton>}
                                                        {canPrint && <a href={route('print.production-orders', order.id)} target="_blank" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{labels.print}</a>}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="11" className="bg-black/5 px-4 py-3">
                                                    <ItemSummary items={order.items ?? []} />
                                                    <HistoryTimeline title={labels.history} items={order.timeline ?? []} />
                                                </td>
                                            </tr>
                                        </Fragment>
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

function Field({ label, error, children, wide = false }) {
    return (
        <div className={wide ? 'lg:col-span-2' : ''}>
            <label className="block text-sm font-medium">{label}</label>
            {children}
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </div>
    );
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function SmallButton({ children, onClick, danger = false }) {
    return <button type="button" onClick={onClick} className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${danger ? 'bg-red-700' : 'bg-slate-800'}`}>{children}</button>;
}

function ItemSummary({ items }) {
    if (items.length === 0) return null;

    return (
        <div className="mb-3 flex flex-wrap gap-2">
            {items.map((item) => (
                <span key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                    {item.product?.code} - {item.color} - {item.quantity}
                </span>
            ))}
        </div>
    );
}

function HistoryTimeline({ title, items }) {
    if (items.length === 0) return null;

    return (
        <div>
            <div className="mb-2 text-xs font-semibold text-slate-600">{title}</div>
            <div className="grid gap-2 md:grid-cols-2">
                {items.map((item) => (
                    <div key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                        <div className="font-semibold text-slate-900">{item.event}</div>
                        <div className="mt-1 text-slate-600">{item.description}</div>
                        <div className="mt-2 text-slate-500">{item.user?.name ?? '-'} - {item.department?.name ?? '-'} - {new Date(item.created_at).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
