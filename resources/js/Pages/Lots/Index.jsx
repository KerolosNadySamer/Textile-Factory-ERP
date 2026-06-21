import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ApprovalBadge } from '@/Components/CustomerTrustBadges';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { Fragment, useMemo, useState } from 'react';

const labels = {
    title: 'Lot Tracking',
    createLot: 'Create Lot',
    list: 'Lot Register',
    search: 'Search lot, supplier, issue order, production order',
    allTypes: 'All Types',
    lotNumber: 'Lot Number',
    lotType: 'Lot Type',
    sourceIssue: 'Source Issue Order',
    productionOrder: 'Production Order',
    parentLot: 'Parent Lot',
    product: 'Product',
    color: 'Color',
    quantity: 'Quantity',
    unit: 'Unit',
    lotDate: 'Lot Date',
    status: 'Status',
    supplier: 'Supplier',
    purchaseOrder: 'Purchase Order',
    purchasePrice: 'Purchase Price',
    receivedQuantity: 'Received Quantity',
    dropNumber: 'Drop Number',
    finishYear: 'Finish Year',
    notes: 'Notes',
    traceability: 'Traceability',
    samples: 'Dye Samples',
    sampleNumber: 'Sample Number',
    sampleColor: 'Sample Color',
    recipe: 'Recipe',
    approved: 'Approved',
    approve: 'Approve',
    addSample: 'Add Sample',
    close: 'Close',
    reopen: 'Reopen',
    cancel: 'Cancel',
    history: 'Lot Timeline',
    empty: 'No lots recorded yet.',
    delete: 'Delete / Cancel',
};

const pageLabels = {
    ar: {
        title: 'تتبع اللوطات',
        createLot: 'إنشاء لوط',
        list: 'سجل اللوطات',
        search: 'بحث باللوط أو المورد أو إذن الصرف أو أمر الإنتاج',
        allTypes: 'كل الأنواع',
        lotNumber: 'رقم اللوط',
        lotType: 'نوع اللوط',
        sourceIssue: 'إذن الصرف المصدر',
        productionOrder: 'أمر الإنتاج',
        parentLot: 'اللوط الأب',
        product: 'الصنف',
        color: 'اللون',
        quantity: 'الكمية',
        unit: 'الوحدة',
        lotDate: 'تاريخ اللوط',
        status: 'الحالة',
        supplier: 'المورد',
        purchaseOrder: 'أمر الشراء',
        purchasePrice: 'سعر الشراء',
        receivedQuantity: 'الكمية المستلمة',
        dropNumber: 'رقم النزلة',
        finishYear: 'سنة التشطيب',
        notes: 'ملاحظات',
        traceability: 'التتبع',
        samples: 'عينات الصباغة',
        sampleNumber: 'رقم العينة',
        sampleColor: 'لون العينة',
        recipe: 'الوصفة',
        approved: 'معتمد',
        approve: 'اعتماد',
        addSample: 'إضافة عينة',
        close: 'إغلاق',
        reopen: 'إعادة فتح',
        cancel: 'إلغاء',
        history: 'سجل اللوط',
        empty: 'لا توجد لوطات مسجلة حتى الآن.',
        delete: 'حذف / إلغاء',
        saved: 'تم الحفظ بنجاح.',
        filter: 'فلترة',
        exportExcel: 'تصدير Excel',
        print: 'طباعة',
        deleteConfirm: 'حذف أو إلغاء اللوط؟ اللوطات المستخدمة سيتم إلغاؤها بدل حذفها.',
        from: 'من',
        po: 'أمر شراء',
        child: 'فرعي',
    },
    en: labels,
};

const lotTypes = {
    ar: {
        yarn: 'غزل',
        raw_fabric: 'قماش خام',
        dyed_fabric: 'قماش مصبوغ',
    },
    en: {
        yarn: 'Yarn',
        raw_fabric: 'Raw Fabric',
        dyed_fabric: 'Dyed Fabric',
    },
};

const unitLabels = {
    ar: {
        kg: 'كيلو',
        meter: 'متر',
        piece: 'قطعة',
        roll: 'رول',
        carton: 'كرتونة',
    },
    en: {
        kg: 'Kg',
        meter: 'Meter',
        piece: 'Piece',
        roll: 'Roll',
        carton: 'Carton',
    },
};

const statusLabels = {
    ar: {
        open: 'مفتوح',
        closed: 'مغلق',
        cancelled: 'ملغي',
    },
    en: {
        open: 'Open',
        closed: 'Closed',
        cancelled: 'Cancelled',
    },
};

const units = ['kg', 'meter', 'piece', 'roll', 'carton'];
const statuses = ['open', 'closed', 'cancelled'];

export default function LotsIndex({ auth, flash, lots, issueOrders, productionOrders, products, parentLots, filters }) {
    const { language, isRtl, text: labels } = useLanguage(pageLabels);
    const lotTypeText = lotTypes[language] ?? lotTypes.en;
    const unitText = unitLabels[language] ?? unitLabels.en;
    const statusText = statusLabels[language] ?? statusLabels.en;
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_lot');
    const canDelete = permissions.includes('delete_lot');
    const canEdit = permissions.includes('edit_lot');
    const canEditClosed = permissions.includes('edit_closed_lot');
    const canApproveSample = permissions.includes('approve_lot_sample');
    const canExport = permissions.includes('export_reports');
    const canPrint = permissions.includes('print_documents');
    const [sampleForms, setSampleForms] = useState({});
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const { data, setData, post, processing, errors, reset } = useForm({
        lot_number: '',
        lot_type: 'yarn',
        source_issue_order_id: '',
        production_order_id: '',
        parent_lot_id: '',
        product_id: '',
        color: '',
        unit: 'kg',
        quantity: '',
        lot_date: '',
        status: 'open',
        drop_number: '',
        finish_year: new Date().getFullYear(),
        supplier: '',
        purchase_order: '',
        purchase_price: '',
        received_quantity: '',
        notes: '',
    });

    const productOptions = useMemo(() => {
        if (data.lot_type === 'yarn') {
            return products.filter((product) => product.type === 'yarn');
        }

        if (data.lot_type === 'raw_fabric') {
            return products.filter((product) => product.type === 'raw_fabric');
        }

        return products.filter((product) => ['raw_fabric', 'dyed_fabric'].includes(product.type));
    }, [data.lot_type, products]);

    const submit = (event) => {
        event.preventDefault();
        post(route('lots.store'), {
            preserveScroll: true,
            onSuccess: () => reset('lot_number', 'source_issue_order_id', 'production_order_id', 'parent_lot_id', 'product_id', 'color', 'quantity', 'lot_date', 'drop_number', 'supplier', 'purchase_order', 'purchase_price', 'received_quantity', 'notes'),
        });
    };

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('lots.index'), { search, type }, { preserveState: true, preserveScroll: true });
    };

    const destroyLot = (lot) => {
        if (window.confirm(`${labels.deleteConfirm} ${lot.display_number}`)) {
            router.delete(route('lots.destroy', lot.id), { preserveScroll: true });
        }
    };

    const changeStatus = (lot, status) => {
        router.patch(route('lots.status', lot.id), { status }, { preserveScroll: true });
    };

    const updateSampleForm = (lotId, field, value) => {
        setSampleForms((forms) => ({
            ...forms,
            [lotId]: {
                sample_number: '',
                color: '',
                recipe: '',
                notes: '',
                approved: false,
                ...(forms[lotId] ?? {}),
                [field]: value,
            },
        }));
    };

    const addSample = (event, lot) => {
        event.preventDefault();
        router.post(route('lots.samples.store', lot.id), sampleForms[lot.id] ?? {}, {
            preserveScroll: true,
            onSuccess: () => setSampleForms((forms) => ({ ...forms, [lot.id]: undefined })),
        });
    };

    const approveSample = (lot, sample) => {
        router.patch(route('lots.samples.approve', [lot.id, sample.id]), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{labels.title}</h2>}>
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{labels.saved}</div>
                    )}

                    {canCreate && (
                        <div className="erp-card mb-6">
                            <h3 className="text-lg font-semibold">{labels.createLot}</h3>
                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={labels.lotType} error={errors.lot_type}>
                                    <select value={data.lot_type} onChange={(event) => setData('lot_type', event.target.value)} className="form-input">
                                        {Object.entries(lotTypeText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </Field>
                                <Field label={labels.lotNumber} error={errors.lot_number}>
                                    <input value={data.lot_number} onChange={(event) => setData('lot_number', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={labels.product} error={errors.product_id}>
                                    <select value={data.product_id} onChange={(event) => setData('product_id', event.target.value)} className="form-input">
                                        <option value="">-</option>
                                        {productOptions.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={labels.quantity} error={errors.quantity}>
                                    <input type="number" min="0" step="0.01" value={data.quantity} onChange={(event) => setData('quantity', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={labels.unit} error={errors.unit}>
                                    <select value={data.unit} onChange={(event) => setData('unit', event.target.value)} className="form-input">
                                        {units.map((unit) => <option key={unit} value={unit}>{unitText[unit] ?? unit}</option>)}
                                    </select>
                                </Field>
                                <Field label={labels.status} error={errors.status}>
                                    <select value={data.status} onChange={(event) => setData('status', event.target.value)} className="form-input">
                                        {statuses.map((status) => <option key={status} value={status}>{statusText[status] ?? status}</option>)}
                                    </select>
                                </Field>
                                <Field label={labels.lotDate} error={errors.lot_date}>
                                    <input type="date" value={data.lot_date} onChange={(event) => setData('lot_date', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.color} error={errors.color}>
                                    <input value={data.color} onChange={(event) => setData('color', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.sourceIssue} error={errors.source_issue_order_id}>
                                    <select value={data.source_issue_order_id} onChange={(event) => setData('source_issue_order_id', event.target.value)} className="form-input">
                                        <option value="">-</option>
                                        {issueOrders.map((order) => <option key={order.id} value={order.id}>{order.issue_no} - {order.customer?.name_ar ?? order.customer?.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={labels.productionOrder} error={errors.production_order_id}>
                                    <select value={data.production_order_id} onChange={(event) => setData('production_order_id', event.target.value)} className="form-input">
                                        <option value="">-</option>
                                        {productionOrders.map((order) => <option key={order.id} value={order.id}>{order.production_number} - {order.customer?.name_ar ?? order.customer?.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={labels.parentLot} error={errors.parent_lot_id}>
                                    <select value={data.parent_lot_id} onChange={(event) => setData('parent_lot_id', event.target.value)} className="form-input">
                                        <option value="">-</option>
                                        {parentLots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number} - {lotTypeText[lot.lot_type]}</option>)}
                                    </select>
                                </Field>
                                {data.lot_type === 'dyed_fabric' && (
                                    <>
                                        <Field label={labels.dropNumber} error={errors.drop_number}>
                                            <input type="number" min="1" value={data.drop_number} onChange={(event) => setData('drop_number', event.target.value)} className="form-input" placeholder="auto" />
                                        </Field>
                                        <Field label={labels.finishYear} error={errors.finish_year}>
                                            <input type="number" min="2000" max="2100" value={data.finish_year} onChange={(event) => setData('finish_year', event.target.value)} className="form-input" />
                                        </Field>
                                    </>
                                )}
                                {data.lot_type === 'yarn' && (
                                    <>
                                        <Field label={labels.supplier} error={errors.supplier}>
                                            <input value={data.supplier} onChange={(event) => setData('supplier', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={labels.purchaseOrder} error={errors.purchase_order}>
                                            <input value={data.purchase_order} onChange={(event) => setData('purchase_order', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={labels.purchasePrice} error={errors.purchase_price}>
                                            <input type="number" min="0" step="0.01" value={data.purchase_price} onChange={(event) => setData('purchase_price', event.target.value)} className="form-input" />
                                        </Field>
                                        <Field label={labels.receivedQuantity} error={errors.received_quantity}>
                                            <input type="number" min="0" step="0.01" value={data.received_quantity} onChange={(event) => setData('received_quantity', event.target.value)} className="form-input" />
                                        </Field>
                                    </>
                                )}
                                <Field label={labels.notes} error={errors.notes} wide>
                                    <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input min-h-[90px]" />
                                </Field>
                                <div className="lg:col-span-4">
                                    <button disabled={processing} className="erp-button">{labels.createLot}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold">{labels.list}</h3>
                                {canExport && <a href={route('exports.show', { type: 'lots', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.exportExcel}</a>}
                            </div>
                            <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[180px_minmax(260px,1fr)_auto]">
                                <select value={type} onChange={(event) => setType(event.target.value)} className="form-input">
                                    <option value="">{labels.allTypes}</option>
                                    {Object.entries(lotTypeText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                                <input value={search} onChange={(event) => setSearch(event.target.value)} className="form-input" placeholder={labels.search} />
                                <button className="erp-button">{labels.filter}</button>
                            </form>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5" style={{ color: 'var(--erp-muted)' }}>
                                    <tr>
                                        <Th>{labels.lotNumber}</Th>
                                        <Th>{labels.lotType}</Th>
                                        <Th>{labels.product}</Th>
                                        <Th>{labels.quantity}</Th>
                                        <Th>{labels.sourceIssue}</Th>
                                        <Th>{labels.productionOrder}</Th>
                                        <Th>{labels.traceability}</Th>
                                        <Th>{labels.status}</Th>
                                        <Th></Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {lots.length === 0 && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-500">{labels.empty}</td></tr>}
                                    {lots.map((lot) => (
                                        <Fragment key={lot.id}>
                                            <tr>
                                                <td className="px-4 py-4 font-semibold">{lot.display_number}</td>
                                                <td className="px-4 py-4">{lotTypeText[lot.lot_type] ?? lot.lot_type}</td>
                                                <td className="px-4 py-4">{lot.product ? `${lot.product.code} - ${lot.product.name}` : '-'}</td>
                                                <td className="px-4 py-4">{lot.quantity} {lot.unit}</td>
                                                <td className="px-4 py-4">{lot.source_issue_order?.issue_no ?? '-'}</td>
                                                <td className="px-4 py-4">{lot.production_order?.production_number ?? '-'}</td>
                                                <td className="px-4 py-4">
                                                    <TraceSummary lot={lot} />
                                                </td>
                                                <td className="px-4 py-4">{statusText[lot.status] ?? lot.status}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {canEdit && lot.status === 'open' && <SmallButton onClick={() => changeStatus(lot, 'closed')}>{labels.close}</SmallButton>}
                                                        {canEditClosed && lot.status === 'closed' && <SmallButton onClick={() => changeStatus(lot, 'open')}>{labels.reopen}</SmallButton>}
                                                        {canEdit && lot.status !== 'cancelled' && <SmallButton danger onClick={() => changeStatus(lot, 'cancelled')}>{labels.cancel}</SmallButton>}
                                                        {canDelete && <SmallButton danger onClick={() => destroyLot(lot)}>{labels.delete}</SmallButton>}
                                                        {canPrint && <a href={route('print.lots', lot.id)} target="_blank" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{labels.print}</a>}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="9" className="bg-black/5 px-4 py-3">
                                                    <TraceabilityReport lot={lot} />
                                                    {lot.lot_type === 'dyed_fabric' && (
                                                        <SamplesPanel
                                                            lot={lot}
                                                            form={sampleForms[lot.id] ?? {}}
                                                            canCreate={canCreate && (lot.status !== 'closed' || canEditClosed)}
                                                            canApprove={canApproveSample && (lot.status !== 'closed' || canEditClosed)}
                                                            onChange={updateSampleForm}
                                                            onSubmit={addSample}
                                                            onApprove={approveSample}
                                                        />
                                                    )}
                                                    <Children lots={lot.child_lots ?? []} />
                                                    <HistoryTimeline title={labels.history} items={lot.timeline ?? []} />
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

function TraceSummary({ lot }) {
    return (
        <div className="space-y-1 text-xs">
            {lot.parent_lot && <div>From: {lot.parent_lot.lot_number} ({lotTypes.en[lot.parent_lot.lot_type] ?? lot.parent_lot.lot_type})</div>}
            {lot.supplier && <div>Supplier: {lot.supplier}</div>}
            {lot.purchase_order && <div>PO: {lot.purchase_order}</div>}
            {lot.approved_sample && <div>Approved: {lot.approved_sample.sample_number}</div>}
            {!lot.parent_lot && !lot.supplier && !lot.approved_sample && <div>-</div>}
        </div>
    );
}

function TraceabilityReport({ lot }) {
    const parentChain = [];
    let current = lot.parent_lot;

    while (current) {
        parentChain.unshift(current);
        current = current.parent_lot;
    }

    const yarnLot = lot.lot_type === 'yarn' ? lot : parentChain.find((item) => item.lot_type === 'yarn');
    const rawLot = lot.lot_type === 'raw_fabric' ? lot : parentChain.find((item) => item.lot_type === 'raw_fabric');
    const dyedLot = lot.lot_type === 'dyed_fabric' ? lot : null;
    const customer = lot.production_order?.sales_order?.customer ?? lot.production_order?.customer ?? lot.source_issue_order?.customer;

    const nodes = [
        ['Supplier', yarnLot?.supplier ?? lot.supplier ?? '-'],
        ['Yarn Lot', yarnLot?.display_number ?? yarnLot?.lot_number ?? '-'],
        ['Raw Fabric Lot', rawLot?.display_number ?? rawLot?.lot_number ?? '-'],
        ['Dyed Fabric Lot', dyedLot?.display_number ?? '-'],
        ['Approved Sample', lot.approved_sample?.sample_number ?? '-'],
        ['Production Order', lot.production_order?.production_number ?? '-'],
        ['Sales Order', lot.production_order?.sales_order?.so_number ?? '-'],
        ['Customer', customer?.name_ar ?? customer?.name ?? '-'],
    ];

    return (
        <div className="mb-4 rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold">{labels.traceability}</div>
            <div className="grid gap-2 md:grid-cols-4">
                {nodes.map(([title, value]) => (
                    <div key={title} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                        <div className="font-semibold text-slate-500">{title}</div>
                        <div className="mt-1 text-slate-900">{value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SamplesPanel({ lot, form, canCreate, canApprove, onChange, onSubmit, onApprove }) {
    return (
        <div className="mb-4 rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold">{labels.samples}</div>
            <div className="mb-4 flex flex-wrap gap-2">
                {(lot.samples ?? []).map((sample) => (
                    <span key={sample.id} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                        <span className="font-semibold text-slate-900">{sample.sample_number}</span>
                        {sample.color && <span className="text-slate-600">- {sample.color}</span>}
                        {sample.approved && <ApprovalBadge approved compact />}
                        {!sample.approved && canApprove && (
                            <button type="button" className="ms-2 font-semibold text-slate-900 underline" onClick={() => onApprove(lot, sample)}>{labels.approve}</button>
                        )}
                    </span>
                ))}
            </div>
            {canCreate && (
                <form onSubmit={(event) => onSubmit(event, lot)} className="grid gap-3 md:grid-cols-4">
                    <input value={form.sample_number ?? ''} onChange={(event) => onChange(lot.id, 'sample_number', event.target.value)} className="form-input" placeholder={labels.sampleNumber} />
                    <input value={form.color ?? ''} onChange={(event) => onChange(lot.id, 'color', event.target.value)} className="form-input" placeholder={labels.sampleColor} />
                    <input value={form.recipe ?? ''} onChange={(event) => onChange(lot.id, 'recipe', event.target.value)} className="form-input" placeholder={labels.recipe} />
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.approved ?? false} onChange={(event) => onChange(lot.id, 'approved', event.target.checked)} />
                        {labels.approved}
                    </label>
                    <input value={form.notes ?? ''} onChange={(event) => onChange(lot.id, 'notes', event.target.value)} className="form-input md:col-span-3" placeholder={labels.notes} />
                    <button className="erp-button">{labels.addSample}</button>
                </form>
            )}
        </div>
    );
}

function Children({ lots }) {
    if (lots.length === 0) return null;

    return (
        <div className="mb-4 flex flex-wrap gap-2">
            {lots.map((lot) => (
                <span key={lot.id} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                    Child: {lot.lot_number} - {lotTypes.en[lot.lot_type] ?? lot.lot_type} - {lot.quantity} {lot.unit}
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
