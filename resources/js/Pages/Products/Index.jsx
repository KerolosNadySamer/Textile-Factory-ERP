import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const pageLabels = {
    ar: {
    title: '\u062a\u0643\u0648\u064a\u062f \u0627\u0644\u0623\u0635\u0646\u0627\u0641',
    subtitle: '\u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u062e\u0627\u0645\u0627\u062a \u0648\u0627\u0644\u0623\u0642\u0645\u0634\u0629 \u0648\u0627\u0644\u0643\u064a\u0645\u0627\u0648\u064a\u0627\u062a',
    code: '\u0643\u0648\u062f \u0627\u0644\u0635\u0646\u0641',
    name: '\u0627\u0633\u0645 \u0627\u0644\u0635\u0646\u0641',
    type: '\u0627\u0644\u0646\u0648\u0639',
    quality: '\u0627\u0644\u062c\u0648\u062f\u0629',
    unit: '\u0627\u0644\u0648\u062d\u062f\u0629',
    width: '\u0627\u0644\u0639\u0631\u0636',
    weight: '\u0627\u0644\u0648\u0632\u0646',
    price: '\u0627\u0644\u0633\u0639\u0631',
    tax: '\u0627\u0644\u0636\u0631\u064a\u0628\u0629',
    active: '\u0645\u0641\u0639\u0644',
    status: '\u0627\u0644\u062d\u0627\u0644\u0629',
    save: '\u062d\u0641\u0638 \u0627\u0644\u0635\u0646\u0641',
    update: 'تحديث الصنف',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    actions: 'إجراءات',
    productsList: '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0635\u0646\u0627\u0641',
    yes: '\u0646\u0639\u0645',
    no: '\u0644\u0627',
    exportExcel: 'تصدير Excel',
    importProducts: 'استيراد وتكويد الأصناف تلقائيا',
    importTemplate: 'تحميل نموذج الاستيراد',
    uploadFile: 'ملف Excel / CSV',
    import: 'استيراد',
    duplicateImportTitle: 'تكرار في ملف الأصناف',
    duplicateImportText: 'تم العثور على أكواد أو أسماء أصناف مكررة. اختر هل تريد تكويد كل الصفوف أم الاكتفاء بأول مرة.',
    acceptDuplicates: 'قبول التكرار',
    uniqueOnly: 'استيراد غير المكرر فقط',
    priceList: 'قائمة الأسعار',
    deleteConfirm: 'هل تريد حذف الصنف؟',
    autoCodeHelp: 'اترك الكود فارغا ليتم توليده تلقائيا.',
    },
    en: {
        title: 'Products',
        subtitle: 'Define materials, fabrics, chemicals, and packing items',
        code: 'Product Code',
        name: 'Product Name',
        type: 'Type',
        quality: 'Quality',
        unit: 'Unit',
        width: 'Width',
        weight: 'Weight',
        price: 'Price',
        tax: 'Tax',
        active: 'Active',
        status: 'Status',
        save: 'Save Product',
        update: 'Update Product',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        actions: 'Actions',
        productsList: 'Product List',
        yes: 'Yes',
        no: 'No',
        exportExcel: 'Export Excel',
        importProducts: 'Import Products',
        importTemplate: 'Download Import Template',
        uploadFile: 'Excel / CSV File',
        import: 'Import',
        duplicateImportTitle: 'Repeated Products',
        duplicateImportText: 'Repeated product codes or names were found. Choose whether to code all rows or keep only the first row.',
        acceptDuplicates: 'Accept Duplicates',
        uniqueOnly: 'Unique Only',
        priceList: 'Price List',
        deleteConfirm: 'Delete this product?',
    },
};

const typeLabels = {
    yarn: '\u063a\u0632\u0644',
    raw_fabric: '\u0642\u0645\u0627\u0634 \u062e\u0627\u0645',
    dyed_fabric: '\u0642\u0645\u0627\u0634 \u0645\u0635\u0628\u0648\u063a',
    chemical: '\u0643\u064a\u0645\u0627\u0648\u064a\u0627\u062a',
    packing: '\u062a\u0639\u0628\u0626\u0629',
};

const qualityLabels = {
    premium: '\u0645\u0645\u064a\u0632',
    first: '\u0623\u0648\u0644\u0649',
    second: '\u062b\u0627\u0646\u064a\u0629',
};

const unitLabels = {
    kg: '\u0643\u064a\u0644\u0648',
    meter: '\u0645\u062a\u0631',
    piece: '\u0642\u0637\u0639\u0629',
    roll: '\u0631\u0648\u0644',
    carton: '\u0643\u0631\u062a\u0648\u0646\u0629',
};

const translatedOptions = {
    en: {
        typeLabels: {
            yarn: 'Yarn',
            raw_fabric: 'Raw Fabric',
            dyed_fabric: 'Dyed Fabric',
            chemical: 'Chemical',
            packing: 'Packing',
        },
        qualityLabels: {
            premium: 'Premium',
            first: 'First',
            second: 'Second',
        },
        unitLabels: {
            kg: 'Kg',
            meter: 'Meter',
            piece: 'Piece',
            roll: 'Roll',
            carton: 'Carton',
        },
    },
};

export default function ProductsIndex({ auth, flash, products }) {
    const { language, isRtl, text: labels } = useLanguage(pageLabels);
    const optionText = translatedOptions[language] ?? { typeLabels, qualityLabels, unitLabels };
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreateProduct = permissions.includes('create_product');
    const canEditProduct = permissions.includes('edit_product');
    const canDeleteProduct = permissions.includes('delete_product');
    const canExport = permissions.includes('export_reports');
    const canPrint = permissions.includes('print_documents');
    const [editingProduct, setEditingProduct] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        type: 'raw_fabric',
        quality: 'first',
        unit: 'meter',
        width: '',
        weight: '',
        price: '0',
        tax: '0',
        active: true,
    });
    const importForm = useForm({
        file: null,
    });

    const submit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                resetForm();
            },
        };

        if (editingProduct) {
            router.patch(route('products.update', editingProduct.id), data, options);
            return;
        }

        post(route('products.store'), options);
    };

    const resetForm = () => {
        setEditingProduct(null);
        reset('code', 'name', 'width', 'weight', 'price', 'tax');
        setData({
            code: '',
            name: '',
            type: 'raw_fabric',
            quality: 'first',
            unit: 'meter',
            width: '',
            weight: '',
            price: '0',
            tax: '0',
            active: true,
        });
    };

    const editProduct = (product) => {
        setEditingProduct(product);
        setData({
            code: product.code ?? '',
            name: product.name ?? '',
            type: product.type ?? 'raw_fabric',
            quality: product.quality ?? '',
            unit: product.unit ?? 'meter',
            width: product.width ?? '',
            weight: product.weight ?? '',
            price: product.price ?? '0',
            tax: product.tax ?? '0',
            active: Boolean(product.active),
        });
    };

    const deleteProduct = (product) => {
        if (!window.confirm(`${labels.deleteConfirm} ${product.name}`)) {
            return;
        }

        router.delete(route('products.destroy', product.id), {
            preserveScroll: true,
        });
    };

    const importProducts = (event) => {
        event.preventDefault();

        importForm.post(route('products.import'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => importForm.reset('file'),
        });
    };

    const resolveDuplicateImport = (decision) => {
        router.post(route('products.import'), { import_decision: decision }, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{labels.title}</h2>}
        >
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {canCreateProduct && (
                    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="border-b border-slate-200 pb-4">
                            <h3 className="text-lg font-semibold text-slate-950">{labels.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{labels.subtitle}</p>
                        </div>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Field label={labels.code} error={errors.code}>
                                <input value={data.code} onChange={(e) => setData('code', e.target.value)} className="form-input" placeholder={labels.autoCodeHelp ?? ''} />
                            </Field>

                            <Field label={labels.name} error={errors.name}>
                                <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="form-input" required />
                            </Field>

                            <Field label={labels.type} error={errors.type}>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="form-input">
                                    {Object.entries(optionText.typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </Field>

                            <Field label={labels.quality} error={errors.quality}>
                                <select value={data.quality} onChange={(e) => setData('quality', e.target.value)} className="form-input">
                                    <option value="">-</option>
                                    {Object.entries(optionText.qualityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </Field>

                            <Field label={labels.unit} error={errors.unit}>
                                <select value={data.unit} onChange={(e) => setData('unit', e.target.value)} className="form-input">
                                    {Object.entries(optionText.unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </Field>

                            <Field label={labels.width} error={errors.width}>
                                <input type="number" min="0" step="0.01" value={data.width} onChange={(e) => setData('width', e.target.value)} className="form-input" />
                            </Field>

                            <Field label={labels.weight} error={errors.weight}>
                                <input type="number" min="0" step="0.01" value={data.weight} onChange={(e) => setData('weight', e.target.value)} className="form-input" />
                            </Field>

                            <Field label={labels.price} error={errors.price}>
                                <input type="number" min="0" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} className="form-input" required />
                            </Field>

                            <Field label={labels.tax} error={errors.tax}>
                                <input type="number" min="0" max="100" step="0.01" value={data.tax} onChange={(e) => setData('tax', e.target.value)} className="form-input" required />
                            </Field>

                            <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input type="checkbox" checked={data.active} onChange={(e) => setData('active', e.target.checked)} className="rounded border-slate-300 text-slate-900 focus:ring-slate-500" />
                                {labels.active}
                            </label>

                            <div className="lg:col-span-4">
                                <button disabled={processing} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                    {editingProduct ? labels.update : labels.save}
                                </button>
                                {editingProduct && (
                                    <button type="button" onClick={resetForm} className="me-2 rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700">
                                        {labels.cancel}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                    )}

                    {canCreateProduct && (
                        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-950">{labels.importProducts}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{labels.subtitle}</p>
                                </div>
                                <a href={route('products.import-template', { lang: language })} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                                    {labels.importTemplate}
                                </a>
                            </div>

                            {flash?.duplicateProductImport && (
                                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    <div className="font-semibold">{labels.duplicateImportTitle}</div>
                                    <p className="mt-1">
                                        {labels.duplicateImportText} ({flash.duplicateProductImport.duplicate_rows} / {flash.duplicateProductImport.duplicate_names})
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button type="button" onClick={() => resolveDuplicateImport('accept_duplicates')} className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">
                                            {labels.acceptDuplicates}
                                        </button>
                                        <button type="button" onClick={() => resolveDuplicateImport('unique_only')} className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900">
                                            {labels.uniqueOnly}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={importProducts} className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
                                <Field label={labels.uploadFile} error={importForm.errors.file}>
                                    <input
                                        type="file"
                                        accept=".xlsx,.csv"
                                        onChange={(event) => importForm.setData('file', event.target.files[0] ?? null)}
                                        className="block w-full text-sm"
                                        required
                                    />
                                </Field>
                                <button disabled={importForm.processing} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                    {labels.import}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold text-slate-950">{labels.productsList}</h3>
                            <div className="flex flex-wrap gap-2">
                                {canExport && <a href={route('exports.show', { type: 'products', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.exportExcel}</a>}
                                {canPrint && <a href={route('print.price-list')} target="_blank" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.priceList}</a>}
                            </div>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-right">{labels.code}</th>
                                        <th className="px-4 py-3 text-right">{labels.name}</th>
                                        <th className="px-4 py-3 text-right">{labels.type}</th>
                                        <th className="px-4 py-3 text-right">{labels.quality}</th>
                                        <th className="px-4 py-3 text-right">{labels.unit}</th>
                                        <th className="px-4 py-3 text-right">{labels.price}</th>
                                        <th className="px-4 py-3 text-right">{labels.tax}</th>
                                        <th className="px-4 py-3 text-right">{labels.status}</th>
                                        {(canEditProduct || canDeleteProduct) && <th className="px-4 py-3 text-right">{labels.actions}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="px-4 py-4 font-medium text-slate-950">{product.code}</td>
                                            <td className="px-4 py-4">{product.name}</td>
                                            <td className="px-4 py-4">{optionText.typeLabels[product.type] ?? product.type}</td>
                                            <td className="px-4 py-4">{optionText.qualityLabels[product.quality] ?? '-'}</td>
                                            <td className="px-4 py-4">{optionText.unitLabels[product.unit] ?? product.unit}</td>
                                            <td className="px-4 py-4">{product.price}</td>
                                            <td className="px-4 py-4">{product.tax}%</td>
                                            <td className="px-4 py-4">{product.active ? labels.yes : labels.no}</td>
                                            {(canEditProduct || canDeleteProduct) && (
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {canEditProduct && (
                                                            <button type="button" onClick={() => editProduct(product)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">
                                                                {labels.edit}
                                                            </button>
                                                        )}
                                                        {canDeleteProduct && (
                                                            <button type="button" onClick={() => deleteProduct(product)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">
                                                                {labels.delete}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
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
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            {children}
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </div>
    );
}
