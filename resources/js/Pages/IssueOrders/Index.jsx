import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { Fragment, useState } from 'react';

const labels = {
    title: 'أذون الصرف',
    subtitle: 'رقم إذن الصرف هو نفس رقم اللوط، ويتم حفظه تلقائيًا في الحقلين.',
    newIssue: 'إذن صرف جديد',
    issueNo: 'رقم إذن الصرف',
    lotNo: 'رقم اللوط',
    customer: 'اسم العميل',
    product: 'نوع القماش',
    fabricType: 'وصف نوع القماش',
    color: 'اللون',
    quantity: 'الكمية',
    unit: 'الوحدة',
    date: 'التاريخ',
    notes: 'ملاحظات',
    save: 'حفظ الإذن',
    update: 'تحديث الإذن',
    cancel: 'إلغاء',
    search: 'بحث',
    searchPlaceholder: 'ابحث برقم الإذن أو اللوط أو العميل أو اللون',
    clear: 'مسح',
    list: 'قائمة أذون الصرف',
    stockPending: 'خصم المخزون لم يتم تنفيذه لأن نظام أرصدة المخزون غير موجود بعد. تم حفظ الإذن واللوط فقط.',
    stockDeducted: 'تم خصم المخزون',
    stockNotDeducted: 'لم يخصم',
    createdBy: 'أنشأه',
    history: 'سجل الحركة',
    actions: 'إجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    empty: 'لا توجد أذون صرف حتى الآن.',
    noSetup: 'يجب إضافة عميل وصنف قماش مفعل قبل إنشاء إذن صرف.',
};

const unitLabels = {
    kg: 'كيلو',
    meter: 'متر',
    piece: 'قطعة',
    roll: 'رول',
    carton: 'كرتونة',
};

const productTypeLabels = {
    raw_fabric: 'قماش خام',
    dyed_fabric: 'قماش مصبوغ',
};

const fixedIssueLabels = {
    ar: {
        title: 'أذون الصرف',
        subtitle: 'رقم إذن الصرف هو نفس رقم اللوط، ويتم حفظه تلقائيًا في الحقلين.',
        newIssue: 'إذن صرف جديد',
        issueNo: 'رقم إذن الصرف',
        lotNo: 'رقم اللوط',
        customer: 'اسم العميل',
        product: 'نوع القماش',
        fabricType: 'وصف نوع القماش',
        color: 'اللون',
        quantity: 'الكمية',
        unit: 'الوحدة',
        date: 'التاريخ',
        notes: 'ملاحظات',
        save: 'حفظ الإذن',
        update: 'تحديث الإذن',
        cancel: 'إلغاء',
        search: 'بحث',
        searchPlaceholder: 'ابحث برقم الإذن أو اللوط أو العميل أو اللون',
        clear: 'مسح',
        list: 'قائمة أذون الصرف',
        stockPending: 'خصم المخزون لم يتم تنفيذه لأن نظام أرصدة المخزون غير موجود بعد. تم حفظ الإذن واللوط فقط.',
        stockDeducted: 'تم خصم المخزون',
        stockNotDeducted: 'لم يخصم',
        createdBy: 'أنشأه',
        history: 'سجل الحركة',
        actions: 'إجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        print: 'طباعة',
        saved: 'تم حفظ العملية بنجاح.',
        deleteConfirm: 'حذف إذن الصرف',
        empty: 'لا توجد أذون صرف حتى الآن.',
        noSetup: 'يجب إضافة عميل وصنف قماش مفعل قبل إنشاء إذن صرف.',
    },
    en: {
        title: 'Issue Orders',
        subtitle: 'The issue order number is also saved as the lot number automatically.',
        newIssue: 'New Issue Order',
        issueNo: 'Issue Order No.',
        lotNo: 'Lot No.',
        customer: 'Customer',
        product: 'Fabric Product',
        fabricType: 'Fabric Type Description',
        color: 'Color',
        quantity: 'Quantity',
        unit: 'Unit',
        date: 'Date',
        notes: 'Notes',
        save: 'Save Issue Order',
        update: 'Update Issue Order',
        cancel: 'Cancel',
        search: 'Search',
        searchPlaceholder: 'Search by issue number, lot, customer, or color',
        clear: 'Clear',
        list: 'Issue Orders List',
        stockPending: 'Inventory deduction has not run because stock balances are not available yet. The issue order and lot were saved only.',
        stockDeducted: 'Stock deducted',
        stockNotDeducted: 'Not deducted',
        createdBy: 'Created by',
        history: 'Timeline',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        print: 'Print',
        saved: 'Operation saved successfully.',
        deleteConfirm: 'Delete issue order',
        empty: 'No issue orders yet.',
        noSetup: 'Add an active customer and fabric product before creating an issue order.',
    },
};

const translatedUnitLabels = {
    ar: {
        kg: 'كيلو',
        meter: 'متر',
        piece: 'قطعة',
        roll: 'رول',
        carton: 'كرتونة',
    },
    en: {
        kg: 'Kilogram',
        meter: 'Meter',
        piece: 'Piece',
        roll: 'Roll',
        carton: 'Carton',
    },
};

const translatedProductTypeLabels = {
    ar: {
        raw_fabric: 'قماش خام',
        dyed_fabric: 'قماش مصبوغ',
    },
    en: {
        raw_fabric: 'Raw fabric',
        dyed_fabric: 'Dyed fabric',
    },
};

export default function IssueOrdersIndex({ auth, flash, issueOrders, customers, products, filters, inventoryReady }) {
    const { language, isRtl, text: labels } = useLanguage(fixedIssueLabels);
    const unitText = translatedUnitLabels[language] ?? translatedUnitLabels.en;
    const productTypeText = translatedProductTypeLabels[language] ?? translatedProductTypeLabels.en;
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_issue_order');
    const canEdit = permissions.includes('edit_issue_order');
    const canDelete = permissions.includes('delete_issue_order');
    const canPrint = permissions.includes('print_documents');
    const [editingIssue, setEditingIssue] = useState(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const { data, setData, post, processing, errors, reset } = useForm({
        issue_no: '',
        customer_id: customers[0]?.id ?? '',
        product_id: products[0]?.id ?? '',
        fabric_type: products[0] ? productLabel(products[0], productTypeText) : '',
        color: '',
        quantity: '',
        unit: products[0]?.unit ?? 'meter',
        issue_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const ready = customers.length > 0 && products.length > 0;

    const clearForm = () => {
        setEditingIssue(null);
        reset('issue_no', 'color', 'quantity', 'notes');
        setData({
            issue_no: '',
            customer_id: customers[0]?.id ?? '',
            product_id: products[0]?.id ?? '',
            fabric_type: products[0] ? productLabel(products[0], productTypeText) : '',
            color: '',
            quantity: '',
            unit: products[0]?.unit ?? 'meter',
            issue_date: new Date().toISOString().slice(0, 10),
            notes: '',
        });
    };

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: clearForm,
        };

        if (editingIssue) {
            router.patch(route('issue-orders.update', editingIssue.id), data, options);
            return;
        }

        post(route('issue-orders.store'), options);
    };

    const chooseProduct = (productId) => {
        const product = products.find((item) => Number(item.id) === Number(productId));

        setData((current) => ({
            ...current,
            product_id: productId,
            fabric_type: product ? productLabel(product, productTypeText) : current.fabric_type,
            unit: product?.unit ?? current.unit,
        }));
    };

    const editIssue = (issue) => {
        setEditingIssue(issue);
        setData({
            issue_no: issue.issue_no ?? '',
            customer_id: issue.customer_id ?? '',
            product_id: issue.product_id ?? '',
            fabric_type: issue.fabric_type ?? '',
            color: issue.color ?? '',
            quantity: issue.quantity ?? '',
            unit: issue.unit ?? 'meter',
            issue_date: issue.issue_date?.slice(0, 10) ?? '',
            notes: issue.notes ?? '',
        });
    };

    const deleteIssue = (issue) => {
        if (!window.confirm(`${labels.deleteConfirm} ${issue.issue_no}?`)) {
            return;
        }

        router.delete(route('issue-orders.destroy', issue.id), {
            preserveScroll: true,
            onSuccess: () => {
                if (editingIssue?.id === issue.id) {
                    clearForm();
                }
            },
        });
    };

    const runSearch = (event) => {
        event.preventDefault();

        router.get(route('issue-orders.index'), { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearch('');
        router.get(route('issue-orders.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{labels.title}</h2>}>
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {(canCreate || editingIssue) && (
                        <div className="erp-card mb-6">
                            <div className="border-b pb-4" style={{ borderColor: 'var(--erp-border)' }}>
                                <h3 className="text-lg font-semibold">{editingIssue ? labels.update : labels.newIssue}</h3>
                                <p className="mt-1 text-sm" style={{ color: 'var(--erp-muted)' }}>{labels.subtitle}</p>
                            </div>

                            {!inventoryReady && (
                                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                    {labels.stockPending}
                                </div>
                            )}

                            {flash?.success && (
                                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                    {labels.saved}
                                </div>
                            )}

                            {!ready ? (
                                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                    {labels.noSetup}
                                </div>
                            ) : (
                                <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Field label={labels.issueNo} error={errors.issue_no}>
                                        <input value={data.issue_no} onChange={(event) => setData('issue_no', event.target.value)} className="form-input" required />
                                        <div className="mt-1 text-xs" style={{ color: 'var(--erp-muted)' }}>
                                            {labels.lotNo}: {data.issue_no || '-'}
                                        </div>
                                    </Field>

                                    <Field label={labels.customer} error={errors.customer_id}>
                                        <select value={data.customer_id} onChange={(event) => setData('customer_id', event.target.value)} className="form-input" required>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label={labels.product} error={errors.product_id}>
                                        <select value={data.product_id} onChange={(event) => chooseProduct(event.target.value)} className="form-input" required>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.id}>{productLabel(product, productTypeText)}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label={labels.fabricType} error={errors.fabric_type}>
                                        <input value={data.fabric_type} onChange={(event) => setData('fabric_type', event.target.value)} className="form-input" required />
                                    </Field>

                                    <Field label={labels.color} error={errors.color}>
                                        <input value={data.color} onChange={(event) => setData('color', event.target.value)} className="form-input" required />
                                    </Field>

                                    <Field label={labels.quantity} error={errors.quantity}>
                                        <input type="number" min="0.01" step="0.01" value={data.quantity} onChange={(event) => setData('quantity', event.target.value)} className="form-input" required />
                                    </Field>

                                    <Field label={labels.unit} error={errors.unit}>
                                        <select value={data.unit} onChange={(event) => setData('unit', event.target.value)} className="form-input">
                                            {Object.entries(unitText).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label={labels.date} error={errors.issue_date}>
                                        <input type="date" value={data.issue_date} onChange={(event) => setData('issue_date', event.target.value)} className="form-input" required />
                                    </Field>

                                    <Field label={labels.notes} error={errors.notes} wide>
                                        <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input min-h-[92px]" />
                                    </Field>

                                    <div className="lg:col-span-4">
                                        <button disabled={processing} className="erp-button">
                                            {editingIssue ? labels.update : labels.save}
                                        </button>
                                        {editingIssue && (
                                            <button type="button" onClick={clearForm} className="me-2 rounded-md border border-slate-300 px-5 py-2 text-sm font-medium">
                                                {labels.cancel}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="erp-card">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold">{labels.list}</h3>
                            <form onSubmit={runSearch} className="flex w-full gap-2 md:w-auto">
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="form-input mt-0 md:w-80"
                                    placeholder={labels.searchPlaceholder}
                                />
                                <button type="submit" className="erp-button">{labels.search}</button>
                                {filters.search && (
                                    <button type="button" onClick={clearSearch} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
                                        {labels.clear}
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5" style={{ color: 'var(--erp-muted)' }}>
                                    <tr>
                                        <Th>{labels.issueNo}</Th>
                                        <Th>{labels.lotNo}</Th>
                                        <Th>{labels.customer}</Th>
                                        <Th>{labels.product}</Th>
                                        <Th>{labels.color}</Th>
                                        <Th>{labels.quantity}</Th>
                                        <Th>{labels.date}</Th>
                                        <Th>{labels.stockDeducted}</Th>
                                        <Th>{labels.createdBy}</Th>
                                        {(canEdit || canDelete || canPrint) && <Th>{labels.actions}</Th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {issueOrders.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="px-4 py-8 text-center" style={{ color: 'var(--erp-muted)' }}>
                                                {labels.empty}
                                            </td>
                                        </tr>
                                    )}

                                    {issueOrders.map((issue) => (
                                        <Fragment key={issue.id}>
                                        <tr>
                                            <td className="px-4 py-4 font-semibold">{issue.issue_no}</td>
                                            <td className="px-4 py-4">{issue.lot_no}</td>
                                            <td className="px-4 py-4">{issue.customer?.name ?? '-'}</td>
                                            <td className="px-4 py-4">
                                                <div>{issue.fabric_type}</div>
                                                <div className="text-xs" style={{ color: 'var(--erp-muted)' }}>{issue.product?.code} - {issue.product?.name}</div>
                                            </td>
                                            <td className="px-4 py-4">{issue.color}</td>
                                            <td className="px-4 py-4">{issue.quantity} {unitText[issue.unit] ?? issue.unit}</td>
                                            <td className="px-4 py-4">{issue.issue_date}</td>
                                            <td className="px-4 py-4">{issue.stock_deducted ? labels.stockDeducted : labels.stockNotDeducted}</td>
                                            <td className="px-4 py-4">{issue.creator?.name ?? '-'}</td>
                                            {(canEdit || canDelete || canPrint) && (
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {canEdit && (
                                                            <button type="button" onClick={() => editIssue(issue)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                                                                {labels.edit}
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button type="button" onClick={() => deleteIssue(issue)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">
                                                                {labels.delete}
                                                            </button>
                                                        )}
                                                        {canPrint && (
                                                            <a href={route('print.issue-orders', issue.id)} target="_blank" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                                                                {labels.print}
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                        <tr>
                                            <td colSpan={canEdit || canDelete || canPrint ? 10 : 9} className="bg-black/5 px-4 py-3">
                                                <HistoryTimeline title={labels.history} items={issue.timeline ?? []} />
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

function productLabel(product, productTypeText = translatedProductTypeLabels.en) {
    return `${product.code} - ${product.name} (${productTypeText[product.type] ?? product.type})`;
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

function HistoryTimeline({ title, items }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div>
            <div className="mb-2 text-xs font-semibold text-slate-600">{title}</div>
            <div className="grid gap-2 md:grid-cols-2">
                {items.map((item) => (
                    <div key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                        <div className="font-semibold text-slate-900">{item.event}</div>
                        <div className="mt-1 text-slate-600">{item.description}</div>
                        <div className="mt-2 text-slate-500">
                            {item.user?.name ?? '-'} - {item.department?.name ?? '-'} - {new Date(item.created_at).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
