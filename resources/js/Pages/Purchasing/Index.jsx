import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

const pageLabels = {
    ar: {
        title: 'المشتريات',
        suppliers: 'الموردون',
        purchaseRequests: 'طلبات الشراء',
        purchaseOrders: 'أوامر الشراء',
        goodsReceipts: 'استلام البضاعة',
        createSupplier: 'إضافة مورد',
        importSuppliers: 'استيراد الموردين',
        importSupplierTemplate: 'تحميل نموذج الاستيراد',
        supplierImportFile: 'ملف الموردين',
        duplicateImportTitle: 'تكرار أسماء في ملف الموردين',
        duplicateImportText: 'تم العثور على أسماء موردين مكررة. اختر هل تريد تكويد كل الصفوف أم الاكتفاء بأول مرة لكل اسم.',
        acceptDuplicates: 'قبول التكرار',
        uniqueOnly: 'تكويد مرة واحدة',
        upload: 'رفع',
        createPr: 'إنشاء طلب شراء',
        createPo: 'إنشاء أمر شراء',
        createGrn: 'إنشاء استلام بضاعة',
        code: 'الكود',
        name: 'الاسم',
        mobile: 'الموبايل',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        address: 'العنوان',
        taxNumber: 'الرقم الضريبي',
        commercialRegister: 'السجل التجاري',
        paymentTerms: 'شروط الدفع',
        status: 'الحالة',
        notes: 'ملاحظات',
        date: 'التاريخ',
        priority: 'الأولوية',
        product: 'الصنف',
        qty: 'الكمية',
        unit: 'الوحدة',
        supplier: 'المورد',
        purchaseRequest: 'طلب الشراء',
        orderDate: 'تاريخ الأمر',
        expectedDate: 'التاريخ المتوقع',
        unitPrice: 'سعر الوحدة',
        purchaseOrder: 'أمر الشراء',
        purchaseOrderLine: 'بند أمر الشراء',
        orderedQty: 'كمية الأمر',
        receiptDate: 'تاريخ الاستلام',
        batchNumber: 'رقم التشغيلة',
        lotNumber: 'رقم اللوط',
        receivedQty: 'الكمية المستلمة',
        approve: 'اعتماد',
        reject: 'رفض',
        rejectReason: 'سبب الرفض',
        save: 'حفظ',
        empty: 'لا توجد سجلات حتى الآن.',
        saved: 'تم الحفظ بنجاح.',
        exportExcel: 'تصدير Excel',
        print: 'طباعة',
        number: 'الرقم',
        party: 'الطرف',
        items: 'البنود',
        noPurchaseOrderItems: 'لا توجد بنود متاحة في أمر الشراء.',
        statusLabels: {
            draft: 'مسودة',
            submitted: 'مرسل',
            approved: 'معتمد',
            partially_received: 'مستلم جزئيًا',
            received: 'مستلم',
            rejected: 'مرفوض',
        },
        priorityLabels: {
            low: 'منخفضة',
            normal: 'عادية',
            high: 'عالية',
            urgent: 'عاجلة',
        },
        supplierStatusLabels: {
            active: 'نشط',
            inactive: 'غير نشط',
        },
    },
    en: {
        title: 'Purchasing',
        suppliers: 'Suppliers',
        purchaseRequests: 'Purchase Requests',
        purchaseOrders: 'Purchase Orders',
        goodsReceipts: 'Goods Receipts',
        createSupplier: 'Create Supplier',
        importSuppliers: 'Import Suppliers',
        importSupplierTemplate: 'Download Import Template',
        supplierImportFile: 'Supplier File',
        duplicateImportTitle: 'Repeated Supplier Names',
        duplicateImportText: 'Repeated supplier names were found. Choose whether to code all rows or keep only the first row for each name.',
        acceptDuplicates: 'Accept Duplicates',
        uniqueOnly: 'Code Once Only',
        upload: 'Upload',
        createPr: 'Create Purchase Request',
        createPo: 'Create Purchase Order',
        createGrn: 'Create Goods Receipt',
        code: 'Code',
        name: 'Name',
        mobile: 'Mobile',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        taxNumber: 'Tax Number',
        commercialRegister: 'Commercial Register',
        paymentTerms: 'Payment Terms',
        status: 'Status',
        notes: 'Notes',
        date: 'Date',
        priority: 'Priority',
        product: 'Product',
        qty: 'Qty',
        unit: 'Unit',
        supplier: 'Supplier',
        purchaseRequest: 'Purchase Request',
        orderDate: 'Order Date',
        expectedDate: 'Expected Date',
        unitPrice: 'Unit Price',
        purchaseOrder: 'Purchase Order',
        purchaseOrderLine: 'Purchase Order Line',
        orderedQty: 'Ordered Qty',
        receiptDate: 'Receipt Date',
        batchNumber: 'Batch Number',
        lotNumber: 'Lot Number',
        receivedQty: 'Received Qty',
        approve: 'Approve',
        reject: 'Reject',
        rejectReason: 'Rejection reason',
        save: 'Save',
        empty: 'No records yet.',
        saved: 'Saved successfully.',
        exportExcel: 'Export Excel',
        print: 'Print',
        number: 'Number',
        party: 'Party',
        items: 'Items',
        noPurchaseOrderItems: 'No available lines in this purchase order.',
        statusLabels: {
            draft: 'Draft',
            submitted: 'Submitted',
            approved: 'Approved',
            partially_received: 'Partially received',
            received: 'Received',
            rejected: 'Rejected',
        },
        priorityLabels: {
            low: 'Low',
            normal: 'Normal',
            high: 'High',
            urgent: 'Urgent',
        },
        supplierStatusLabels: {
            active: 'Active',
            inactive: 'Inactive',
        },
    },
};

const priorities = ['low', 'normal', 'high', 'urgent'];
const supplierStatuses = ['active', 'inactive'];

export default function PurchasingIndex({ auth, flash, suppliers, purchaseRequests, purchaseOrders, goodsReceipts, products, approvedPurchaseOrders }) {
    const { language, isRtl, text: labels } = useLanguage(pageLabels);
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const focusType = new URLSearchParams(window.location.search).get('focus_type');
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canManageSuppliers = permissions.includes('manage_suppliers');
    const canCreatePr = permissions.includes('create_purchase_request');
    const canCreatePo = permissions.includes('create_purchase_order');
    const canApprovePo = permissions.includes('approve_purchase_order');
    const canCreateGrn = permissions.includes('create_goods_receipt');
    const canApproveGrn = permissions.includes('approve_goods_receipt');
    const canRejectGrn = permissions.includes('reject_goods_receipt');
    const canExport = permissions.includes('export_reports') && (
        ['admin', 'general_manager'].includes(auth.user.role?.slug)
        || (auth.user.department?.code === 'purchasing' && ['purchasing_manager', 'purchasing_officer'].includes(auth.user.position?.code))
    );
    const canPrint = permissions.includes('print_documents');

    const firstApprovedPo = approvedPurchaseOrders[0];
    const firstApprovedPoItem = firstApprovedPo?.items?.[0];

    const supplierForm = useForm({
        code: '',
        name: '',
        mobile: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        commercial_register: '',
        payment_terms: '',
        status: 'active',
        notes: '',
    });
    const supplierImportForm = useForm({ file: null });

    const prForm = useForm({
        request_date: new Date().toISOString().slice(0, 10),
        priority: 'normal',
        notes: '',
        items: [{ product_id: products[0]?.id ?? '', required_qty: '', unit: products[0]?.unit ?? 'kg', notes: '' }],
    });

    const poForm = useForm({
        supplier_id: suppliers[0]?.id ?? '',
        purchase_request_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        expected_date: '',
        notes: '',
        items: [{ product_id: products[0]?.id ?? '', qty: '', unit: products[0]?.unit ?? 'kg', unit_price: '' }],
    });

    const grnForm = useForm({
        supplier_id: firstApprovedPo?.supplier_id ?? suppliers[0]?.id ?? '',
        purchase_order_id: firstApprovedPo?.id ?? '',
        receipt_date: new Date().toISOString().slice(0, 10),
        notes: '',
        items: [lineToGrnItem(firstApprovedPoItem, products[0])],
    });

    const selectedPo = useMemo(
        () => approvedPurchaseOrders.find((order) => String(order.id) === String(grnForm.data.purchase_order_id)),
        [approvedPurchaseOrders, grnForm.data.purchase_order_id],
    );

    const selectedPoItem = useMemo(
        () => selectedPo?.items?.find((item) => String(item.id) === String(grnForm.data.items[0]?.purchase_order_item_id)),
        [selectedPo, grnForm.data.items],
    );

    useEffect(() => {
        scrollToFocusedRow(focusId);
    }, [focusId]);

    const updateOneItem = (form, field, value) => {
        form.setData('items', [{ ...form.data.items[0], [field]: value }]);
    };

    const updateItemProduct = (form, qtyField, productId) => {
        const product = products.find((item) => String(item.id) === String(productId));
        form.setData('items', [{ ...form.data.items[0], product_id: productId, [qtyField]: form.data.items[0][qtyField], unit: product?.unit ?? form.data.items[0].unit }]);
    };

    const choosePoForGrn = (poId) => {
        const po = approvedPurchaseOrders.find((order) => String(order.id) === String(poId));
        const firstItem = po?.items?.[0];

        grnForm.setData({
            ...grnForm.data,
            purchase_order_id: poId,
            supplier_id: po?.supplier_id ?? '',
            items: [lineToGrnItem(firstItem, products[0])],
        });
    };

    const choosePoItemForGrn = (itemId) => {
        const item = selectedPo?.items?.find((line) => String(line.id) === String(itemId));
        grnForm.setData('items', [lineToGrnItem(item, products[0], grnForm.data.items[0])]);
    };

    const submitSupplier = (event) => {
        event.preventDefault();
        supplierForm.post(route('purchasing.suppliers.store'), { preserveScroll: true, onSuccess: () => supplierForm.reset() });
    };

    const submitSupplierImport = (event) => {
        event.preventDefault();
        supplierImportForm.post(route('purchasing.suppliers.import'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => supplierImportForm.reset('file'),
        });
    };

    const resolveSupplierDuplicateImport = (decision) => {
        router.post(route('purchasing.suppliers.import'), { import_decision: decision }, {
            preserveScroll: true,
        });
    };

    const submitPr = (event) => {
        event.preventDefault();
        prForm.post(route('purchasing.purchase-requests.store'), { preserveScroll: true, onSuccess: () => prForm.reset('notes', 'items') });
    };

    const submitPo = (event) => {
        event.preventDefault();
        poForm.post(route('purchasing.purchase-orders.store'), { preserveScroll: true, onSuccess: () => poForm.reset('expected_date', 'notes', 'items') });
    };

    const submitGrn = (event) => {
        event.preventDefault();
        grnForm.post(route('purchasing.goods-receipts.store'), { preserveScroll: true, onSuccess: () => grnForm.reset('notes', 'items') });
    };

    const rejectGoodsReceipt = (item) => {
        const reason = window.prompt(labels.rejectReason);

        if (!reason) {
            return;
        }

        router.patch(route('purchasing.goods-receipts.reject', item.id), { rejection_reason: reason }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{labels.title}</h2>}>
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{labels.saved}</div>}

                    {canManageSuppliers && (
                        <>
                            <Panel title={labels.importSuppliers ?? 'استيراد الموردين'}>
                                <div className="mb-4">
                                    <a href={route('purchasing.suppliers.import-template', { lang: language })} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
                                        {labels.importSupplierTemplate ?? 'تحميل نموذج الاستيراد'}
                                    </a>
                                </div>
                                <form onSubmit={submitSupplierImport} className="flex flex-col gap-3 md:flex-row md:items-end">
                                    <Field label={labels.supplierImportFile ?? 'ملف الموردين'} error={supplierImportForm.errors.file}>
                                        <input type="file" accept=".csv,.xlsx" onChange={(event) => supplierImportForm.setData('file', event.target.files[0] ?? null)} className="form-input" required />
                                    </Field>
                                    <button disabled={supplierImportForm.processing} className="erp-button">{labels.upload ?? 'رفع'}</button>
                                </form>
                                {flash?.duplicateSupplierImport && (
                                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        <div className="font-semibold">{labels.duplicateImportTitle}</div>
                                        <div className="mt-1">
                                            {labels.duplicateImportText} ({flash.duplicateSupplierImport.duplicate_rows} / {flash.duplicateSupplierImport.duplicate_names})
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button type="button" onClick={() => resolveSupplierDuplicateImport('accept_duplicates')} className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">
                                                {labels.acceptDuplicates}
                                            </button>
                                            <button type="button" onClick={() => resolveSupplierDuplicateImport('unique_only')} className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900">
                                                {labels.uniqueOnly}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Panel>
                            <Panel title={labels.createSupplier}>
                                <form onSubmit={submitSupplier} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Field label={labels.code} error={supplierForm.errors.code}><input className="form-input" value={supplierForm.data.code} onChange={(event) => supplierForm.setData('code', event.target.value)} required /></Field>
                                    <Field label={labels.name} error={supplierForm.errors.name}><input className="form-input" value={supplierForm.data.name} onChange={(event) => supplierForm.setData('name', event.target.value)} required /></Field>
                                    <Field label={labels.mobile} error={supplierForm.errors.mobile}><input className="form-input" value={supplierForm.data.mobile} onChange={(event) => supplierForm.setData('mobile', event.target.value)} /></Field>
                                    <Field label={labels.phone} error={supplierForm.errors.phone}><input className="form-input" value={supplierForm.data.phone} onChange={(event) => supplierForm.setData('phone', event.target.value)} /></Field>
                                    <Field label={labels.email} error={supplierForm.errors.email}><input type="email" className="form-input" value={supplierForm.data.email} onChange={(event) => supplierForm.setData('email', event.target.value)} /></Field>
                                    <Field label={labels.taxNumber} error={supplierForm.errors.tax_number}><input className="form-input" value={supplierForm.data.tax_number} onChange={(event) => supplierForm.setData('tax_number', event.target.value)} /></Field>
                                    <Field label={labels.commercialRegister} error={supplierForm.errors.commercial_register}><input className="form-input" value={supplierForm.data.commercial_register} onChange={(event) => supplierForm.setData('commercial_register', event.target.value)} /></Field>
                                    <Field label={labels.status} error={supplierForm.errors.status}><select className="form-input" value={supplierForm.data.status} onChange={(event) => supplierForm.setData('status', event.target.value)}>{supplierStatuses.map((item) => <option key={item} value={item}>{labels.supplierStatusLabels[item] ?? item}</option>)}</select></Field>
                                    <Field label={labels.paymentTerms} error={supplierForm.errors.payment_terms}><input className="form-input" value={supplierForm.data.payment_terms} onChange={(event) => supplierForm.setData('payment_terms', event.target.value)} /></Field>
                                    <Field label={labels.address} error={supplierForm.errors.address} wide><textarea className="form-input min-h-[80px]" value={supplierForm.data.address} onChange={(event) => supplierForm.setData('address', event.target.value)} /></Field>
                                    <Field label={labels.notes} error={supplierForm.errors.notes}><textarea className="form-input min-h-[80px]" value={supplierForm.data.notes} onChange={(event) => supplierForm.setData('notes', event.target.value)} /></Field>
                                    <Submit disabled={supplierForm.processing} label={labels.save} />
                                </form>
                            </Panel>
                        </>
                    )}

                    {canCreatePr && (
                        <Panel title={labels.createPr}>
                            <form onSubmit={submitPr} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={labels.date} error={prForm.errors.request_date}><input type="date" className="form-input" value={prForm.data.request_date} onChange={(event) => prForm.setData('request_date', event.target.value)} required /></Field>
                                <Field label={labels.priority} error={prForm.errors.priority}><select className="form-input" value={prForm.data.priority} onChange={(event) => prForm.setData('priority', event.target.value)}>{priorities.map((item) => <option key={item} value={item}>{labels.priorityLabels[item] ?? item}</option>)}</select></Field>
                                <ItemFields labels={labels} form={prForm} products={products} qtyName="required_qty" updateProduct={(productId) => updateItemProduct(prForm, 'required_qty', productId)} updateItem={(field, value) => updateOneItem(prForm, field, value)} />
                                <Field label={labels.notes} error={prForm.errors.notes} wide><textarea className="form-input min-h-[80px]" value={prForm.data.notes} onChange={(event) => prForm.setData('notes', event.target.value)} /></Field>
                                <Submit disabled={prForm.processing} label={labels.save} />
                            </form>
                        </Panel>
                    )}

                    {canCreatePo && (
                        <Panel title={labels.createPo}>
                            <form onSubmit={submitPo} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={labels.supplier} error={poForm.errors.supplier_id}><SupplierSelect suppliers={suppliers} value={poForm.data.supplier_id} onChange={(value) => poForm.setData('supplier_id', value)} /></Field>
                                <Field label={labels.purchaseRequest} error={poForm.errors.purchase_request_id}><select className="form-input" value={poForm.data.purchase_request_id} onChange={(event) => poForm.setData('purchase_request_id', event.target.value)}><option value="">-</option>{purchaseRequests.map((item) => <option key={item.id} value={item.id}>{item.pr_number}</option>)}</select></Field>
                                <Field label={labels.orderDate} error={poForm.errors.order_date}><input type="date" className="form-input" value={poForm.data.order_date} onChange={(event) => poForm.setData('order_date', event.target.value)} required /></Field>
                                <Field label={labels.expectedDate} error={poForm.errors.expected_date}><input type="date" className="form-input" value={poForm.data.expected_date} onChange={(event) => poForm.setData('expected_date', event.target.value)} /></Field>
                                <ItemFields labels={labels} form={poForm} products={products} qtyName="qty" withPrice updateProduct={(productId) => updateItemProduct(poForm, 'qty', productId)} updateItem={(field, value) => updateOneItem(poForm, field, value)} />
                                <Field label={labels.notes} error={poForm.errors.notes} wide><textarea className="form-input min-h-[80px]" value={poForm.data.notes} onChange={(event) => poForm.setData('notes', event.target.value)} /></Field>
                                <Submit disabled={poForm.processing} label={labels.save} />
                            </form>
                        </Panel>
                    )}

                    {canCreateGrn && (
                        <Panel title={labels.createGrn}>
                            <form onSubmit={submitGrn} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={labels.purchaseOrder} error={grnForm.errors.purchase_order_id}><select className="form-input" value={grnForm.data.purchase_order_id} onChange={(event) => choosePoForGrn(event.target.value)} required><option value="">-</option>{approvedPurchaseOrders.map((item) => <option key={item.id} value={item.id}>{item.po_number} - {item.supplier?.name}</option>)}</select></Field>
                                <Field label={labels.purchaseOrderLine} error={grnForm.errors['items.0.purchase_order_item_id']}><select className="form-input" value={grnForm.data.items[0]?.purchase_order_item_id ?? ''} onChange={(event) => choosePoItemForGrn(event.target.value)} required><option value="">{labels.noPurchaseOrderItems}</option>{(selectedPo?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.product?.code} - {item.product?.name} / {item.qty} {item.unit}</option>)}</select></Field>
                                <Field label={labels.supplier} error={grnForm.errors.supplier_id}><SupplierSelect suppliers={suppliers} value={grnForm.data.supplier_id} onChange={(value) => grnForm.setData('supplier_id', value)} /></Field>
                                <Field label={labels.receiptDate} error={grnForm.errors.receipt_date}><input type="date" className="form-input" value={grnForm.data.receipt_date} onChange={(event) => grnForm.setData('receipt_date', event.target.value)} required /></Field>
                                <Field label={labels.product} error={grnForm.errors['items.0.product_id']}><input className="form-input bg-slate-100" value={selectedPoItem?.product ? `${selectedPoItem.product.code} - ${selectedPoItem.product.name}` : ''} readOnly /></Field>
                                <Field label={labels.orderedQty}><input className="form-input bg-slate-100" value={selectedPoItem ? `${selectedPoItem.qty} ${selectedPoItem.unit}` : ''} readOnly /></Field>
                                <Field label={labels.batchNumber} error={grnForm.errors['items.0.batch_number']}><input className="form-input" value={grnForm.data.items[0]?.batch_number ?? ''} onChange={(event) => updateOneItem(grnForm, 'batch_number', event.target.value)} /></Field>
                                <Field label={labels.lotNumber} error={grnForm.errors['items.0.lot_number']}><input className="form-input" value={grnForm.data.items[0]?.lot_number ?? ''} onChange={(event) => updateOneItem(grnForm, 'lot_number', event.target.value)} required /></Field>
                                <Field label={labels.receivedQty} error={grnForm.errors['items.0.received_qty']}><input type="number" min="0.01" step="0.01" className="form-input" value={grnForm.data.items[0]?.received_qty ?? ''} onChange={(event) => updateOneItem(grnForm, 'received_qty', event.target.value)} required /></Field>
                                <Field label={labels.unit} error={grnForm.errors['items.0.unit']}><input className="form-input bg-slate-100" value={grnForm.data.items[0]?.unit ?? ''} readOnly required /></Field>
                                <Field label={labels.unitPrice} error={grnForm.errors['items.0.unit_price']}><input className="form-input bg-slate-100" value={grnForm.data.items[0]?.unit_price ?? ''} readOnly required /></Field>
                                <Field label={labels.notes} error={grnForm.errors.notes} wide><textarea className="form-input min-h-[80px]" value={grnForm.data.notes} onChange={(event) => grnForm.setData('notes', event.target.value)} /></Field>
                                <Submit disabled={grnForm.processing || !selectedPoItem} label={labels.save} />
                            </form>
                        </Panel>
                    )}

                    <Panel title={labels.suppliers} action={canExport && (
                        <div className="flex flex-wrap gap-2">
                            <a href={route('exports.show', { type: 'suppliers', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.exportExcel}</a>
                            <a href={route('exports.show', { type: 'suppliers', format: 'pdf', lang: language })} target="_blank" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">PDF</a>
                        </div>
                    )}><SimpleTable labels={labels} rows={suppliers} columns={[labels.code, labels.name, labels.mobile, labels.status]} render={(item) => [item.code, item.name, item.mobile ?? '-', labels.supplierStatusLabels[item.status] ?? item.status]} /></Panel>
                    <Panel title={labels.purchaseRequests}><DocumentTable labels={labels} rows={purchaseRequests} numberKey="pr_number" partyKey="requester" itemQtyKey="required_qty" canApprove={false} focusId={focusType === 'purchase_request' ? focusId : null} /></Panel>
                    <Panel title={labels.purchaseOrders}><DocumentTable labels={labels} rows={purchaseOrders} numberKey="po_number" partyKey="supplier" itemQtyKey="qty" canApprove={canApprovePo} approve={(item) => router.patch(route('purchasing.purchase-orders.approve', item.id), {}, { preserveScroll: true })} printRoute={canPrint ? 'print.purchase-orders' : null} focusId={focusType === 'purchase_order' ? focusId : null} /></Panel>
                    <Panel title={labels.goodsReceipts}><DocumentTable labels={labels} rows={goodsReceipts} numberKey="grn_number" partyKey="supplier" itemQtyKey="received_qty" canApprove={canApproveGrn} approve={(item) => router.patch(route('purchasing.goods-receipts.approve', item.id), {}, { preserveScroll: true })} canReject={canRejectGrn} reject={rejectGoodsReceipt} printRoute={canPrint ? 'print.goods-receipts' : null} /></Panel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function lineToGrnItem(line, fallbackProduct, current = {}) {
    return {
        purchase_order_item_id: line?.id ?? '',
        product_id: line?.product_id ?? fallbackProduct?.id ?? '',
        batch_number: current.batch_number ?? '',
        lot_number: current.lot_number ?? '',
        received_qty: current.received_qty ?? line?.qty ?? '',
        unit: line?.unit ?? fallbackProduct?.unit ?? 'kg',
        unit_price: line?.unit_price ?? '',
    };
}

function Panel({ title, children, action = null }) {
    return <div className="erp-card"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h3 className="text-lg font-semibold">{title}</h3>{action}</div>{children}</div>;
}

function Field({ label, error, children, wide = false }) {
    return <div className={wide ? 'lg:col-span-2' : ''}><label className="block text-sm font-medium">{label}</label>{children}{error && <div className="mt-1 text-sm text-red-600">{error}</div>}</div>;
}

function Submit({ disabled, label }) {
    return <div className="lg:col-span-4"><button disabled={disabled} className="erp-button">{label}</button></div>;
}

function SupplierSelect({ suppliers, value, onChange }) {
    return <select className="form-input" value={value} onChange={(event) => onChange(event.target.value)} required><option value="">-</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>)}</select>;
}

function ItemFields({ labels, form, products, qtyName, withPrice = false, updateProduct, updateItem }) {
    const item = form.data.items[0];

    return (
        <>
            <Field label={labels.product} error={form.errors[`items.0.product_id`]}><select className="form-input" value={item.product_id} onChange={(event) => updateProduct(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}</select></Field>
            <Field label={labels.qty} error={form.errors[`items.0.${qtyName}`]}><input type="number" min="0.01" step="0.01" className="form-input" value={item[qtyName]} onChange={(event) => updateItem(qtyName, event.target.value)} required /></Field>
            <Field label={labels.unit} error={form.errors['items.0.unit']}><input className="form-input" value={item.unit} onChange={(event) => updateItem('unit', event.target.value)} required /></Field>
            {withPrice && <Field label={labels.unitPrice} error={form.errors['items.0.unit_price']}><input type="number" min="0" step="0.01" className="form-input" value={item.unit_price} onChange={(event) => updateItem('unit_price', event.target.value)} required /></Field>}
        </>
    );
}

function SimpleTable({ labels, rows, columns, render }) {
    if (rows.length === 0) return <div className="py-8 text-center text-sm text-slate-500">{labels.empty}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                <thead className="bg-black/5"><tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-start font-semibold">{column}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>{rows.map((row) => <tr key={row.id}>{render(row).map((cell, index) => <td key={index} className="px-4 py-4">{cell}</td>)}</tr>)}</tbody>
            </table>
        </div>
    );
}

function DocumentTable({ labels, rows, numberKey, partyKey, itemQtyKey, canApprove, approve, canReject = false, reject, printRoute = null, focusId = null }) {
    if (rows.length === 0) return <div className="py-8 text-center text-sm text-slate-500">{labels.empty}</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                <thead className="bg-black/5"><tr><th className="px-4 py-3 text-start font-semibold">{labels.number}</th><th className="px-4 py-3 text-start font-semibold">{labels.party}</th><th className="px-4 py-3 text-start font-semibold">{labels.status}</th><th className="px-4 py-3 text-start font-semibold">{labels.items}</th><th className="px-4 py-3 text-start font-semibold"></th></tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                    {rows.map((row) => {
                        const focused = isFocused(row.id, focusId);

                        return (
                        <tr key={row.id} id={`focus-${row.id}`} className={focused ? focusRowClass() : ''}>
                            <td className="px-4 py-4 font-semibold">{row[numberKey]}</td>
                            <td className="px-4 py-4">{row[partyKey]?.name ?? '-'}</td>
                            <td className="px-4 py-4">{labels.statusLabels[row.status] ?? row.status}</td>
                            <td className="px-4 py-4"><div className="flex flex-wrap gap-2">{(row.items ?? []).map((item) => <span key={item.id} className="rounded-md border border-slate-200 px-2 py-1 text-xs">{item.product?.code} - {item[itemQtyKey]} {item.unit}</span>)}</div></td>
                            <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                    {canApprove && row.status === 'draft' && <button type="button" onClick={() => approve(row)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{labels.approve}</button>}
                                    {canReject && row.status === 'draft' && <button type="button" onClick={() => reject(row)} className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700">{labels.reject}</button>}
                                    {printRoute && <a href={route(printRoute, row.id)} target="_blank" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{labels.print}</a>}
                                </div>
                            </td>
                        </tr>
                    );})}
                </tbody>
            </table>
        </div>
    );
}

function isFocused(id, focusId) {
    return focusId && String(id) === String(focusId);
}

function focusRowClass() {
    return 'scroll-mt-28 bg-amber-100/80 outline outline-2 outline-amber-500';
}

function scrollToFocusedRow(focusId) {
    if (!focusId) return;
    window.setTimeout(() => {
        document.getElementById(`focus-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
}
