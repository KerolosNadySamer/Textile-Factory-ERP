import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'دفتر حركة المخزون',
        newEntry: 'تسجيل حركة مخزون',
        list: 'حركات المخزون',
        date: 'التاريخ',
        documentType: 'نوع المستند',
        documentNumber: 'رقم المستند',
        lot: 'اللوط',
        product: 'الصنف',
        inQty: 'كمية واردة',
        outQty: 'كمية صادرة',
        quantity: 'الكمية',
        balance: 'الرصيد',
        unitCost: 'تكلفة الوحدة',
        totalCost: 'إجمالي التكلفة',
        department: 'القسم',
        user: 'المستخدم',
        notes: 'ملاحظات',
        filter: 'فلترة',
        all: 'الكل',
        lots: 'اللوطات',
        products: 'الأصناف',
        documents: 'المستندات',
        empty: 'لا توجد حركات مخزون حتى الآن.',
        create: 'حفظ الحركة',
        saved: 'تم الحفظ بنجاح.',
        exportExcel: 'تصدير Excel',
        movementHintIn: 'هذا المستند وارد للمخزون.',
        movementHintOut: 'هذا المستند صادر من المخزون.',
        movementHintBoth: 'التسوية تسمح بتسجيل وارد أو صادر، وليس الاثنين معًا.',
        lotTypes: {
            yarn: 'غزل',
            raw_fabric: 'خام',
            dyed_fabric: 'مصبوغ',
        },
    },
    en: {
        title: 'Inventory Ledger',
        newEntry: 'Record Movement',
        list: 'Ledger Entries',
        date: 'Date',
        documentType: 'Document Type',
        documentNumber: 'Document Number',
        lot: 'Lot',
        product: 'Product',
        inQty: 'In Qty',
        outQty: 'Out Qty',
        quantity: 'Quantity',
        balance: 'Balance',
        unitCost: 'Unit Cost',
        totalCost: 'Total Cost',
        department: 'Department',
        user: 'User',
        notes: 'Notes',
        filter: 'Filter',
        all: 'All',
        lots: 'Lots',
        products: 'Products',
        documents: 'Documents',
        empty: 'No ledger entries recorded yet.',
        create: 'Save Movement',
        saved: 'Saved successfully.',
        exportExcel: 'Export Excel',
        movementHintIn: 'This document receives stock into inventory.',
        movementHintOut: 'This document issues stock out of inventory.',
        movementHintBoth: 'Adjustment allows either an in quantity or an out quantity, not both.',
        lotTypes: {
            yarn: 'Yarn',
            raw_fabric: 'Raw Fabric',
            dyed_fabric: 'Dyed Fabric',
        },
    },
};

const documentTypeLabels = {
    ar: {
        yarn_purchase: 'وارد شراء غزل',
        issue_to_production: 'صرف للإنتاج',
        raw_fabric_receipt: 'وارد قماش خام',
        send_to_dyeing: 'صرف للصباغة',
        dyed_fabric_receipt: 'وارد قماش مصبوغ',
        physical_inventory_adjustment: 'تسوية جرد فعلي',
        adjustment: 'تسوية',
        purchase: 'شراء',
        sale: 'بيع',
        sales: 'مبيعات',
        production: 'إنتاج',
        issue: 'صرف',
        receipt: 'استلام',
        goods_receipt: 'إذن استلام',
        purchase_order: 'أمر شراء',
        sales_order: 'طلب بيع',
        production_order: 'أمر إنتاج',
        issue_order: 'إذن صرف',
        stock_count: 'جرد مخزون',
    },
    en: {
        yarn_purchase: 'Yarn Purchase',
        issue_to_production: 'Issue To Production',
        raw_fabric_receipt: 'Raw Fabric Receipt',
        send_to_dyeing: 'Send To Dyeing',
        dyed_fabric_receipt: 'Dyed Fabric Receipt',
        physical_inventory_adjustment: 'Physical Inventory Adjustment',
        adjustment: 'Adjustment',
        purchase: 'Purchase',
        sale: 'Sale',
        sales: 'Sales',
        production: 'Production',
        issue: 'Issue',
        receipt: 'Receipt',
        goods_receipt: 'Goods Receipt',
        purchase_order: 'Purchase Order',
        sales_order: 'Sales Order',
        production_order: 'Production Order',
        issue_order: 'Issue Order',
        stock_count: 'Stock Count',
    },
};

const movementDirections = {
    yarn_purchase: 'in',
    raw_fabric_receipt: 'in',
    dyed_fabric_receipt: 'in',
    purchase: 'in',
    receipt: 'in',
    goods_receipt: 'in',
    issue_to_production: 'out',
    send_to_dyeing: 'out',
    sale: 'out',
    sales: 'out',
    issue: 'out',
    adjustment: 'both',
    physical_inventory_adjustment: 'both',
    stock_count: 'both',
};

export default function InventoryLedgerIndex({ auth, flash, entries, lots, products, departments, filters, documentTypes }) {
    const { language, isRtl, text } = useLanguage(labels);
    const documentTypeText = {
        ...documentTypes,
        ...(documentTypeLabels[language] ?? documentTypeLabels.en),
    };
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const isGeneralManager = auth.user.role?.slug === 'general_manager';
    const canCreate = permissions.includes('create_inventory_ledger_entry') && !isGeneralManager;
    const canExport = permissions.includes('export_reports');
    const [filterData, setFilterData] = useState({
        lot_id: filters.lot_id ?? '',
        product_id: filters.product_id ?? '',
        document_type: filters.document_type ?? '',
    });
    const { data, setData, post, processing, errors, reset } = useForm({
        entry_date: new Date().toISOString().slice(0, 10),
        document_type: Object.keys(documentTypes)[0] ?? 'adjustment',
        document_number: '',
        lot_id: lots[0]?.id ?? '',
        product_id: lots[0]?.product_id ?? '',
        in_qty: '',
        out_qty: '',
        unit_cost: '',
        department_id: auth.user.department_id ?? '',
        notes: '',
    });

    const selectedLot = useMemo(() => lots.find((lot) => String(lot.id) === String(data.lot_id)), [data.lot_id, lots]);
    const movementDirection = movementDirections[data.document_type] ?? 'both';
    const showInQty = movementDirection === 'in' || movementDirection === 'both';
    const showOutQty = movementDirection === 'out' || movementDirection === 'both';
    const movementHint = movementDirection === 'in' ? text.movementHintIn : movementDirection === 'out' ? text.movementHintOut : text.movementHintBoth;

    const submit = (event) => {
        event.preventDefault();
        post(route('inventory-ledger.store'), {
            preserveScroll: true,
            onSuccess: () => reset('document_number', 'in_qty', 'out_qty', 'unit_cost', 'notes'),
        });
    };

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(route('inventory-ledger.index'), filterData, { preserveState: true, preserveScroll: true });
    };

    const updateDocumentType = (documentType) => {
        const direction = movementDirections[documentType] ?? 'both';

        setData((current) => ({
            ...current,
            document_type: documentType,
            in_qty: direction === 'out' ? '' : current.in_qty,
            out_qty: direction === 'in' ? '' : current.out_qty,
        }));
    };

    const updateLot = (lotId) => {
        const lot = lots.find((item) => String(item.id) === String(lotId));

        setData({
            ...data,
            lot_id: lotId,
            product_id: lot?.product_id ?? data.product_id,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{text.saved}</div>
                    )}

                    {canCreate && (
                        <div className="erp-card mb-6">
                            <h3 className="text-lg font-semibold">{text.newEntry}</h3>
                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={text.date} error={errors.entry_date}>
                                    <input type="date" value={data.entry_date} onChange={(event) => setData('entry_date', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={text.documentType} error={errors.document_type}>
                                    <select value={data.document_type} onChange={(event) => updateDocumentType(event.target.value)} className="form-input">
                                        {Object.entries(documentTypes).map(([value, label]) => (
                                            <option key={value} value={value}>{documentTypeText[value] ?? label}</option>
                                        ))}
                                    </select>
                                    <div className="mt-1 text-xs text-slate-500">{movementHint}</div>
                                </Field>
                                <Field label={text.documentNumber} error={errors.document_number}>
                                    <input value={data.document_number} onChange={(event) => setData('document_number', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={text.lot} error={errors.lot_id}>
                                    <select value={data.lot_id} onChange={(event) => updateLot(event.target.value)} className="form-input" required>
                                        <option value="">-</option>
                                        {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number} - {text.lotTypes[lot.lot_type] ?? lot.lot_type} - {lot.status}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.product} error={errors.product_id}>
                                    <select value={data.product_id} onChange={(event) => setData('product_id', event.target.value)} className="form-input" required>
                                        <option value="">-</option>
                                        {products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
                                    </select>
                                </Field>
                                {showInQty && (
                                    <Field label={movementDirection === 'in' ? text.quantity : text.inQty} error={errors.in_qty}>
                                        <input type="number" min="0" step="0.01" value={data.in_qty} onChange={(event) => setData('in_qty', event.target.value)} className="form-input" placeholder={selectedLot?.product?.unit ?? ''} required={movementDirection === 'in'} />
                                    </Field>
                                )}
                                {showOutQty && (
                                    <Field label={movementDirection === 'out' ? text.quantity : text.outQty} error={errors.out_qty}>
                                        <input type="number" min="0" step="0.01" value={data.out_qty} onChange={(event) => setData('out_qty', event.target.value)} className="form-input" placeholder={selectedLot?.product?.unit ?? ''} required={movementDirection === 'out'} />
                                    </Field>
                                )}
                                <Field label={text.unitCost} error={errors.unit_cost}>
                                    <input type="number" min="0" step="0.01" value={data.unit_cost} onChange={(event) => setData('unit_cost', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={text.department} error={errors.department_id}>
                                    <select value={data.department_id} onChange={(event) => setData('department_id', event.target.value)} className="form-input">
                                        <option value="">-</option>
                                        {departments.map((department) => <option key={department.id} value={department.id}>{department.code} - {department.name}</option>)}
                                    </select>
                                </Field>
                                <Field label={text.notes} error={errors.notes} wide>
                                    <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input min-h-[90px]" />
                                </Field>
                                <div className="lg:col-span-4">
                                    <button disabled={processing} className="erp-button">{text.create}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold">{text.list}</h3>
                                {canExport && <a href={route('exports.show', { type: 'inventory-ledger', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{text.exportExcel}</a>}
                            </div>
                            <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[180px_180px_220px_auto]">
                                <select value={filterData.lot_id} onChange={(event) => setFilterData((current) => ({ ...current, lot_id: event.target.value }))} className="form-input">
                                    <option value="">{text.all} {text.lots}</option>
                                    {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number}</option>)}
                                </select>
                                <select value={filterData.product_id} onChange={(event) => setFilterData((current) => ({ ...current, product_id: event.target.value }))} className="form-input">
                                    <option value="">{text.all} {text.products}</option>
                                    {products.map((product) => <option key={product.id} value={product.id}>{product.code}</option>)}
                                </select>
                                <select value={filterData.document_type} onChange={(event) => setFilterData((current) => ({ ...current, document_type: event.target.value }))} className="form-input">
                                    <option value="">{text.all} {text.documents}</option>
                                    {Object.entries(documentTypes).map(([value, label]) => <option key={value} value={value}>{documentTypeText[value] ?? label}</option>)}
                                </select>
                                <button className="erp-button">{text.filter}</button>
                            </form>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5" style={{ color: 'var(--erp-muted)' }}>
                                    <tr>
                                        <Th>{text.date}</Th>
                                        <Th>{text.documentType}</Th>
                                        <Th>{text.documentNumber}</Th>
                                        <Th>{text.lot}</Th>
                                        <Th>{text.product}</Th>
                                        <Th>{text.inQty}</Th>
                                        <Th>{text.outQty}</Th>
                                        <Th>{text.balance}</Th>
                                        <Th>{text.unitCost}</Th>
                                        <Th>{text.totalCost}</Th>
                                        <Th>{text.department}</Th>
                                        <Th>{text.user}</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {entries.length === 0 && <tr><td colSpan="12" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {entries.map((entry) => (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-4">{entry.entry_date}</td>
                                            <td className="px-4 py-4">{documentTypeText[entry.document_type] ?? entry.document_type}</td>
                                            <td className="px-4 py-4 font-semibold">{entry.document_number}</td>
                                            <td className="px-4 py-4">{entry.lot?.display_number ?? entry.lot?.lot_number ?? '-'}</td>
                                            <td className="px-4 py-4">{entry.product ? `${entry.product.code} - ${entry.product.name}` : '-'}</td>
                                            <td className="px-4 py-4 text-emerald-700">{entry.in_qty}</td>
                                            <td className="px-4 py-4 text-red-700">{entry.out_qty}</td>
                                            <td className="px-4 py-4 font-semibold">{entry.balance}</td>
                                            <td className="px-4 py-4">{entry.unit_cost ?? '-'}</td>
                                            <td className="px-4 py-4">{entry.total_cost ?? '-'}</td>
                                            <td className="px-4 py-4">{entry.department?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{entry.user?.name ?? '-'}</td>
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
