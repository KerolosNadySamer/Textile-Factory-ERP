import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ApprovalBadge, CreditBadge, StatusBadge } from '@/Components/CustomerTrustBadges';
import DocumentFormLayout, { DocumentSectionTitle } from '@/Components/DocumentFormLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const pageLabels = {
    ar: {
        title: 'طلبيات العملاء',
        subtitle: 'كل طلبية تظهر ككارت مغلق مثل الدفتر، وتفتح وحدها عند المراجعة أو البحث.',
        newOrder: 'طلبية عميل جديدة',
        ledger: 'دفتر طلبيات العملاء',
        search: 'بحث برقم الطلبية أو اسم العميل',
        searchPlaceholder: 'اكتب رقم الطلبية أو اسم العميل...',
        filter: 'الحالة',
        allStatuses: 'كل الحالات',
        show: 'بحث',
        resetSearch: 'مسح البحث',
        autoNumber: 'تلقائي بالترتيب',
        soNumber: 'رقم الطلبية',
        customer: 'العميل',
        salesRep: 'المندوب',
        noSalesRep: 'لا يوجد مندوب محدد',
        orderDate: 'تاريخ الطلبية',
        deliveryDate: 'تاريخ التسليم المطلوب',
        priority: 'الأولوية',
        downPayment: 'الدفعة المقدمة 50%',
        customerBalance: 'رصيد العميل المتاح',
        customerCreditUsed: 'سحب من رصيد العميل',
        downPaymentDue: 'المطلوب تحصيله بعد الرصيد',
        collectedAmount: 'قيمة المبلغ المحصل',
        collector: 'تم التحصيل من / اسم المحصل',
        treasuryEmployee: 'إلى الخزنة / اسم المستلم في الخزنة',
        collectionNotes: 'ملاحظات التحصيل من العميل',
        treasuryNotes: 'ملاحظات تسليم المبلغ للخزنة',
        productionNotes: 'ملاحظات الإنتاج',
        bankName: 'اسم البنك',
        paymentMethod: 'طريقة دفع الدفعة',
        paymentStatus: 'حالة تسجيل الدفعة',
        cash: 'نقدي',
        check: 'شيك',
        checkNumber: 'رقم الشيك',
        checkDueDate: 'تاريخ استحقاق الشيك',
        pending_accounting: 'بانتظار الحسابات',
        received: 'تم الاستلام',
        sampleRequired: 'تحتاج عينة',
        customerSampleSent: 'عينة مرسلة من العميل',
        customerSampleLotNo: 'لوط / رقم عينة العميل',
        approvedDyeSample: 'عينة اللون المعتمدة',
        sampleNumber: 'رقم العينة',
        notes: 'ملاحظات',
        product: 'الصنف',
        productCode: 'كود الصنف',
        productName: 'اسم الصنف',
        unit: 'الوحدة',
        discount: 'الخصم',
        color: 'اللون',
        quality: 'الجودة',
        width: 'العرض',
        weight: 'الوزن',
        quantity: 'الكمية',
        unitPrice: 'سعر الوحدة',
        total: 'الإجمالي',
        status: 'الحالة',
        createdBy: 'مدخل البيانات',
        reviewedBy: 'اعتماد مدير المبيعات',
        approvedBy: 'اعتماد المدير العام',
        actions: 'إجراءات',
        addItem: 'إضافة بند',
        remove: 'حذف البند',
        save: 'حفظ الطلبية',
        editOrder: 'تعديل الطلبية',
        updateOrder: 'تحديث الطلبية',
        sendSalesOfficer: 'إرسال لمسؤول المبيعات',
        salesOfficerApprove: 'اعتماد مسؤول المبيعات',
        sendSalesManager: 'إرسال لمدير المبيعات',
        salesManagerApprove: 'اعتماد مدير المبيعات',
        generalManagerApprove: 'اعتماد المدير العام وإرسال للإنتاج والتخطيط',
        reject: 'رفض الطلبية',
        cancel: 'إلغاء الطلبية',
        history: 'سجل الحركة',
        empty: 'لا توجد طلبيات مطابقة. استخدم البحث أو اختر حالة للمراجعة.',
        saved: 'تم حفظ العملية بنجاح.',
        exportExcel: 'تصدير Excel',
        print: 'طباعة',
        rejectionReason: 'سبب الرفض',
        openOrder: 'فتح الطلبية',
        closeOrder: 'إغلاق الطلبية',
        items: 'بنود الطلبية',
        pendingSalesManager: 'بانتظار مدير المبيعات',
        pendingSalesOfficer: 'بانتظار مسؤول المبيعات',
        pendingGeneralManager: 'بانتظار المدير العام',
        readyForPlanning: 'جاهزة للتخطيط والإنتاج',
        inProduction: 'تحت الإنتاج',
        orderHeader: 'بيانات الطلب',
        itemGrid: 'تفاصيل الأصناف',
        notesSection: 'الملاحظات',
        totalsSection: 'الإجماليات',
        approvalsSection: 'الاعتمادات',
        lineNo: 'م',
        duplicateItem: 'نسخ سطر',
        goodsTotal: 'إجمالي البضاعة',
        totalQuantity: 'إجمالي الكمية',
        itemDiscount: 'خصم الأصناف',
        extraDiscount: 'خصم إضافي',
        tax: 'الضريبة',
        shipping: 'الشحن',
        finalTotal: 'الإجمالي النهائي',
        salesOfficer: 'مسؤول المبيعات',
        salesManager: 'مدير المبيعات',
        generalManager: 'المدير العام',
        accounting: 'الحسابات',
        currentApproval: 'حالة الاعتماد الحالية',
        dataEntry: 'منشئ الطلب',
        documentActions: 'إجراءات المستند',
    },
    en: {
        title: 'Customer Orders',
        subtitle: 'Orders are shown as a closed ledger. Open one order at a time for review or approval.',
        newOrder: 'New Customer Order',
        ledger: 'Customer Order Ledger',
        search: 'Search by order number or customer',
        searchPlaceholder: 'Type order number or customer name...',
        filter: 'Status',
        allStatuses: 'All statuses',
        show: 'Search',
        resetSearch: 'Clear search',
        autoNumber: 'Automatic sequence',
        soNumber: 'Order No.',
        customer: 'Customer',
        salesRep: 'Sales Rep',
        noSalesRep: 'No sales rep assigned',
        orderDate: 'Order Date',
        deliveryDate: 'Required Delivery Date',
        priority: 'Priority',
        downPayment: '50% Down Payment',
        customerBalance: 'Available Customer Credit',
        customerCreditUsed: 'Use Customer Credit',
        downPaymentDue: 'Amount Due After Credit',
        collectedAmount: 'Collected Amount',
        collector: 'Collected By / Collector Name',
        treasuryEmployee: 'To Treasury / Receiver Name',
        collectionNotes: 'Customer Collection Notes',
        treasuryNotes: 'Treasury Handover Notes',
        productionNotes: 'Production Notes',
        bankName: 'Bank Name',
        paymentMethod: 'Down Payment Method',
        paymentStatus: 'Payment Registration',
        cash: 'Cash',
        check: 'Check',
        checkNumber: 'Check No.',
        checkDueDate: 'Check Due Date',
        pending_accounting: 'Pending Accounting',
        received: 'Received',
        sampleRequired: 'Sample Required',
        customerSampleSent: 'Customer Sample Sent',
        customerSampleLotNo: 'Customer Sample/Lot No.',
        approvedDyeSample: 'Approved Color Sample',
        sampleNumber: 'Sample No.',
        notes: 'Notes',
        product: 'Product',
        productCode: 'Product Code',
        productName: 'Product Name',
        unit: 'Unit',
        discount: 'Discount',
        color: 'Color',
        quality: 'Quality',
        width: 'Width',
        weight: 'Weight',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        total: 'Total',
        status: 'Status',
        createdBy: 'Data Entry',
        reviewedBy: 'Sales Manager Approval',
        approvedBy: 'General Manager Approval',
        actions: 'Actions',
        addItem: 'Add Item',
        remove: 'Remove Item',
        save: 'Save Order',
        editOrder: 'Edit Order',
        updateOrder: 'Update Order',
        sendSalesOfficer: 'Send to Sales Officer',
        salesOfficerApprove: 'Sales Officer Approve',
        sendSalesManager: 'Send to Sales Manager',
        salesManagerApprove: 'Sales Manager Approve',
        generalManagerApprove: 'GM Approve and Send to Production',
        reject: 'Reject Order',
        cancel: 'Cancel Order',
        history: 'History',
        empty: 'No matching customer orders. Search or choose a status to review.',
        saved: 'Operation saved successfully.',
        exportExcel: 'Export Excel',
        print: 'Print',
        rejectionReason: 'Rejection reason',
        openOrder: 'Open Order',
        closeOrder: 'Close Order',
        items: 'Order Items',
        pendingSalesManager: 'Pending Sales Manager',
        pendingSalesOfficer: 'Pending Sales Officer',
        pendingGeneralManager: 'Pending General Manager',
        readyForPlanning: 'Ready for Planning/Production',
        inProduction: 'In Production',
        orderHeader: 'Order Header',
        itemGrid: 'Item Details',
        notesSection: 'Notes',
        totalsSection: 'Totals',
        approvalsSection: 'Approvals',
        lineNo: '#',
        duplicateItem: 'Copy Row',
        goodsTotal: 'Goods Total',
        totalQuantity: 'Total Quantity',
        itemDiscount: 'Item Discount',
        extraDiscount: 'Extra Discount',
        tax: 'Tax',
        shipping: 'Shipping',
        finalTotal: 'Final Total',
        salesOfficer: 'Sales Officer',
        salesManager: 'Sales Manager',
        generalManager: 'General Manager',
        accounting: 'Accounting',
        currentApproval: 'Current Approval',
        dataEntry: 'Created By',
        documentActions: 'Document Actions',
    },
};

const statusLabels = {
    ar: {
        draft: 'مسودة',
        sales_officer_review: 'بانتظار مسؤول المبيعات',
        submitted: 'بانتظار مدير المبيعات',
        planning_review: 'بانتظار المدير العام',
        approved: 'معتمدة للإنتاج والتخطيط',
        rejected: 'مرفوضة',
        in_production: 'تحت الإنتاج',
        completed: 'مكتملة',
        delivered: 'تم التسليم',
        cancelled: 'ملغية',
    },
    en: {
        draft: 'Draft',
        sales_officer_review: 'Pending Sales Officer',
        submitted: 'Pending Sales Manager',
        planning_review: 'Pending General Manager',
        approved: 'Approved for Planning/Production',
        rejected: 'Rejected',
        in_production: 'In Production',
        completed: 'Completed',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
    },
};

const priorityLabels = {
    ar: {
        normal: 'عادي',
        urgent: 'عاجل',
        very_urgent: 'عاجل جدًا',
    },
    en: {
        normal: 'Normal',
        urgent: 'Urgent',
        very_urgent: 'Very Urgent',
    },
};

const workflowLabels = {
    ar: {
        workflow: 'دورة العمل',
        readyForInvoice: 'جاهزة للفواتير',
        readyForDelivery: 'جاهزة للشحن',
        invoiceNumber: 'رقم الفاتورة',
        invoiceStatus: 'حالة الفاتورة',
        createInvoice: 'إنشاء فاتورة',
        shippingNumber: 'رقم أمر الشحن',
        shippingStatus: 'حالة الشحن',
        prepareShipping: 'تجهيز الشحن',
        markDelivered: 'تأكيد التسليم',
        closureNotes: 'ملاحظات الإغلاق',
        closeFinalOrder: 'إغلاق الطلبية',
        shippingCompany: 'شركة الشحن',
        vehicleNumber: 'رقم السيارة',
        driverName: 'السائق',
        rollsCount: 'عدد الرولات',
        shippedQuantity: 'كمية الشحن',
        not_invoiced: 'لم تصدر فاتورة',
        invoiced: 'تمت الفوترة',
        not_ready: 'غير جاهز',
        ready: 'جاهز للشحن',
        delivered_shipping: 'تم التسليم',
        closed: 'مغلقة',
        sales_approval: 'اعتماد المبيعات',
        planning: 'التخطيط',
        materials: 'صرف الخامات',
        weaving: 'النسج',
        dyeing: 'الصباغة',
        quality: 'الجودة',
        finished_goods: 'المخزن النهائي',
        invoice: 'الحسابات',
        delivery: 'الشحن',
        closedStep: 'الإغلاق',
    },
    en: {
        workflow: 'Workflow',
        readyForInvoice: 'Ready for Invoice',
        readyForDelivery: 'Ready for Delivery',
        invoiceNumber: 'Invoice No.',
        invoiceStatus: 'Invoice Status',
        createInvoice: 'Create Invoice',
        shippingNumber: 'Shipping Order No.',
        shippingStatus: 'Shipping Status',
        prepareShipping: 'Prepare Shipping',
        markDelivered: 'Mark Delivered',
        closureNotes: 'Closure Notes',
        closeFinalOrder: 'Close Order',
        shippingCompany: 'Shipping Company',
        vehicleNumber: 'Vehicle No.',
        driverName: 'Driver',
        rollsCount: 'Rolls',
        shippedQuantity: 'Shipped Qty',
        not_invoiced: 'Not Invoiced',
        invoiced: 'Invoiced',
        not_ready: 'Not Ready',
        ready: 'Ready',
        delivered_shipping: 'Delivered',
        closed: 'Closed',
        sales_approval: 'Sales Approval',
        planning: 'Planning',
        materials: 'Materials',
        weaving: 'Weaving',
        dyeing: 'Dyeing',
        quality: 'Quality',
        finished_goods: 'Finished Goods',
        invoice: 'Invoice',
        delivery: 'Delivery',
        closedStep: 'Closed',
    },
};

const statuses = ['draft', 'sales_officer_review', 'submitted', 'planning_review', 'approved', 'rejected', 'in_production', 'completed', 'delivered', 'closed', 'cancelled'];
const workflowSteps = ['sales_approval', 'planning', 'materials', 'weaving', 'dyeing', 'quality', 'finished_goods', 'invoice', 'delivery', 'closed'];

function emptyItem(product) {
    return {
        product_id: product?.id ?? '',
        color: '',
        quality: product?.quality ?? '',
        width: product?.width ?? '',
        weight: product?.weight ?? '',
        quantity: '1',
        unit_price: product?.price ?? '0',
    };
}

export default function SalesOrdersIndex({ auth, flash, salesOrders = [], customers = [], products = [], collectors = [], treasuryEmployees = [], filters = {}, metrics = {} }) {
    const { language, isRtl, text: labels } = useLanguage(pageLabels);
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const statusText = statusLabels[language] ?? statusLabels.en;
    const priorityText = priorityLabels[language] ?? priorityLabels.en;
    const workflowText = workflowLabels[language] ?? workflowLabels.en;
    const statusLabel = (value) => statusText[value] ?? workflowText[value] ?? value;
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_sales_order');
    const canEdit = permissions.includes('edit_sales_order');
    const canReview = ['admin'].includes(auth.user.role?.slug) || auth.user.position?.code === 'sales_manager';
    const canSalesOfficerReview = ['admin'].includes(auth.user.role?.slug) || (auth.user.department?.code === 'sales' && ['sales_officer', 'sales_manager'].includes(auth.user.position?.code));
    const canApprove = permissions.includes('approve_sales_order');
    const canFinance = permissions.includes('edit_finance') || ['admin'].includes(auth.user.role?.slug);
    const canExport = permissions.includes('export_reports');
    const canPrint = permissions.includes('print_documents');
    const [openOrderId, setOpenOrderId] = useState(filters.search && salesOrders.length === 1 ? salesOrders[0].id : null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [editingOrder, setEditingOrder] = useState(null);
    const [items, setItems] = useState([emptyItem(products[0])]);
    const { data, setData, post, processing, errors, reset } = useForm({
        so_number: '',
        customer_id: customers[0]?.id ?? '',
        order_date: new Date().toISOString().slice(0, 10),
        required_delivery_date: '',
        sample_required: false,
        customer_sample_sent: false,
        customer_sample_lot_no: '',
        priority: 'normal',
        customer_credit_used: '0',
        down_payment_collected_amount: '',
        down_payment_collected_by: collectors[0]?.id ?? '',
        down_payment_treasury_received_by: treasuryEmployees[0]?.id ?? '',
        down_payment_collection_notes: '',
        down_payment_treasury_notes: '',
        down_payment_method: 'cash',
        down_payment_check_number: '',
        down_payment_bank_name: '',
        down_payment_check_due_date: '',
        notes: '',
        production_notes: '',
        items,
    });

    useEffect(() => {
        setSearch(filters.search ?? '');
        setStatus(filters.status ?? '');
        if (focusId) {
            setOpenOrderId(focusId);
            scrollToFocusedRow(focusId);
        } else if (filters.search && salesOrders.length === 1) {
            setOpenOrderId(salesOrders[0].id);
        }
    }, [filters.search, filters.status, focusId, salesOrders]);

    const metricCards = [
        [labels.pendingSalesOfficer, metrics.pendingSalesOfficer ?? 0],
        [labels.pendingSalesManager, metrics.pendingSalesManager ?? 0],
        [labels.pendingGeneralManager, metrics.pendingGeneralManager ?? 0],
        [labels.readyForPlanning, metrics.readyForPlanning ?? 0],
        [workflowText.readyForInvoice, metrics.readyForInvoice ?? 0],
        [workflowText.readyForDelivery, metrics.readyForDelivery ?? 0],
    ];

    const totalFor = (order) => order.items.reduce((sum, item) => sum + Number(item.total_price), 0).toFixed(2);
    const selectedCustomer = customers.find((customer) => String(customer.id) === String(data.customer_id));
    const availableCustomerCredit = Number(selectedCustomer?.credit_balance ?? 0);
    const downPaymentPreview = (items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0) * 0.5).toFixed(2);
    const automaticCustomerCredit = Math.min(availableCustomerCredit, Number(downPaymentPreview));
    const usableCustomerCredit = Math.min(Number(data.customer_credit_used) || 0, availableCustomerCredit, Number(downPaymentPreview));
    const downPaymentDuePreview = Math.max(Number(downPaymentPreview) - usableCustomerCredit, 0).toFixed(2);
    const documentTotals = totalsForItems(items);

    useEffect(() => {
        const nextCredit = automaticCustomerCredit.toFixed(2);
        if (data.customer_credit_used !== nextCredit) {
            setData('customer_credit_used', nextCredit);
        }
    }, [automaticCustomerCredit, data.customer_credit_used, setData]);

    const setOrderItem = (index, field, value) => {
        const next = items.map((item, itemIndex) => {
            if (itemIndex !== index) {
                return item;
            }

            const changed = { ...item, [field]: value };

            if (field === 'product_id') {
                const product = products.find((current) => Number(current.id) === Number(value));
                changed.quality = product?.quality ?? '';
                changed.width = product?.width ?? '';
                changed.weight = product?.weight ?? '';
                changed.unit_price = product?.price ?? '0';
            }

            return changed;
        });

        setItems(next);
        setData('items', next);
    };

    const addItem = () => {
        const next = [...items, emptyItem(products[0])];
        setItems(next);
        setData('items', next);
    };

    const removeItem = (index) => {
        const next = items.filter((_, itemIndex) => itemIndex !== index);
        setItems(next);
        setData('items', next);
    };

    const duplicateItem = (index) => {
        const next = [
            ...items.slice(0, index + 1),
            { ...items[index] },
            ...items.slice(index + 1),
        ];
        setItems(next);
        setData('items', next);
    };

    const submit = (event) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                const nextItems = [emptyItem(products[0])];
                setEditingOrder(null);
                reset();
                setItems(nextItems);
                setData({
                    so_number: '',
                    customer_id: customers[0]?.id ?? '',
                    order_date: new Date().toISOString().slice(0, 10),
                    required_delivery_date: '',
                    sample_required: false,
                    customer_sample_sent: false,
                    customer_sample_lot_no: '',
                    priority: 'normal',
                    customer_credit_used: '0',
                    down_payment_collected_amount: '',
                    down_payment_collected_by: collectors[0]?.id ?? '',
                    down_payment_treasury_received_by: treasuryEmployees[0]?.id ?? '',
                    down_payment_collection_notes: '',
                    down_payment_treasury_notes: '',
                    down_payment_method: 'cash',
                    down_payment_check_number: '',
                    down_payment_bank_name: '',
                    down_payment_check_due_date: '',
                    notes: '',
                    production_notes: '',
                    items: nextItems,
                });
            },
        };

        if (editingOrder) {
            router.patch(route('sales-orders.update', editingOrder.id), data, options);
            return;
        }

        post(route('sales-orders.store'), options);
    };

    const editOrder = (order) => {
        const nextItems = order.items.map((item) => ({
            product_id: item.product_id,
            color: item.color ?? '',
            quality: item.quality ?? '',
            width: item.width ?? '',
            weight: item.weight ?? '',
            quantity: item.quantity ?? '1',
            unit_price: item.unit_price ?? '0',
        }));

        setEditingOrder(order);
        setItems(nextItems);
        setData({
            so_number: order.so_number ?? '',
            customer_id: order.customer_id ?? '',
            order_date: order.order_date ?? new Date().toISOString().slice(0, 10),
            required_delivery_date: order.required_delivery_date ?? '',
            sample_required: Boolean(order.sample_required),
            customer_sample_sent: Boolean(order.customer_sample_sent),
            customer_sample_lot_no: order.customer_sample_lot_no ?? '',
            priority: order.priority ?? 'normal',
            customer_credit_used: order.customer_credit_used ?? '0',
            down_payment_collected_amount: order.down_payment_collected_amount ?? '',
            down_payment_collected_by: order.down_payment_collected_by ?? collectors[0]?.id ?? '',
            down_payment_treasury_received_by: order.down_payment_treasury_received_by ?? treasuryEmployees[0]?.id ?? '',
            down_payment_collection_notes: order.down_payment_collection_notes ?? '',
            down_payment_treasury_notes: order.down_payment_treasury_notes ?? '',
            down_payment_method: order.down_payment_method ?? 'cash',
            down_payment_check_number: order.down_payment_check_number ?? '',
            down_payment_bank_name: order.down_payment_bank_name ?? '',
            down_payment_check_due_date: order.down_payment_check_due_date ?? '',
            notes: order.notes ?? '',
            production_notes: order.production_notes ?? '',
            items: nextItems,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const searchLedger = (event) => {
        event.preventDefault();
        router.get(route('sales-orders.index'), { search, status }, { preserveState: true, preserveScroll: true });
    };

    const clearSearch = () => {
        setSearch('');
        setStatus('');
        router.get(route('sales-orders.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const changeStatus = (order, nextStatus) => {
        const payload = { status: nextStatus };

        if (nextStatus === 'rejected') {
            const reason = window.prompt(labels.rejectionReason);
            if (!reason) {
                return;
            }
            payload.rejection_reason = reason;
        }

        router.patch(route('sales-orders.status', order.id), payload, { preserveScroll: true });
    };

    const createInvoice = (order) => {
        const invoiceNumber = window.prompt(workflowText.invoiceNumber, order.invoice_number || `INV-${order.so_number}`);
        if (invoiceNumber === null) return;
        router.patch(route('sales-orders.invoice', order.id), { invoice_number: invoiceNumber }, { preserveScroll: true });
    };

    const prepareShipping = (order) => {
        const shippingNumber = window.prompt(workflowText.shippingNumber, order.shipping_number || `SHIP-${order.so_number}`);
        if (shippingNumber === null) return;
        const shippingCompany = window.prompt(workflowText.shippingCompany, order.shipping_company || '') ?? '';
        const vehicleNumber = window.prompt(workflowText.vehicleNumber, order.vehicle_number || '') ?? '';
        const driverName = window.prompt(workflowText.driverName, order.driver_name || '') ?? '';
        const shippedQuantity = window.prompt(workflowText.shippedQuantity, order.shipped_quantity || '') ?? '';
        const rollsCount = window.prompt(workflowText.rollsCount, order.rolls_count || '') ?? '';

        router.patch(route('sales-orders.prepare-shipping', order.id), {
            shipping_number: shippingNumber,
            shipping_company: shippingCompany,
            vehicle_number: vehicleNumber,
            driver_name: driverName,
            shipped_quantity: shippedQuantity,
            rolls_count: rollsCount,
        }, { preserveScroll: true });
    };

    const markDelivered = (order) => {
        router.patch(route('sales-orders.deliver', order.id), {}, { preserveScroll: true });
    };

    const closeFinalOrder = (order) => {
        const closureNotes = window.prompt(workflowText.closureNotes, order.closure_notes || '');
        if (closureNotes === null) return;
        router.patch(route('sales-orders.close', order.id), { closure_notes: closureNotes }, { preserveScroll: true });
    };

    const sendCustomerMessage = (order) => {
        const message = window.prompt('اكتب رسالة للعميل');
        if (!message || message.trim() === '') return;
        router.post(route('sales-orders.messages.store', order.id), { message }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{labels.title}</h2>}>
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{labels.title}</h3>
                                <p className="mt-1 max-w-3xl text-sm text-slate-500">{labels.subtitle}</p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[36rem]">
                                {metricCards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
                            </div>
                        </div>
                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                {labels.saved}
                            </div>
                        )}
                    </section>

                    {canCreate && (
                        <DocumentFormLayout
                            title={editingOrder ? labels.editOrder : labels.newOrder}
                            subtitle={`${labels.orderHeader} / ${labels.itemGrid} / ${labels.totalsSection} / ${labels.approvalsSection}`}
                            onSubmit={submit}
                            aside={(
                                <CreditBadge label={labels.customerBalance} value={formatMoney(availableCustomerCredit)} />
                            )}
                            header={{
                                title: labels.orderHeader,
                                content: (
                                    <>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                        <Field label={labels.soNumber} error={errors.so_number}>
                                            <input value={editingOrder?.so_number ?? labels.autoNumber} className="form-input bg-slate-50 font-bold" disabled />
                                        </Field>
                                        <Field label={labels.orderDate} error={errors.order_date}>
                                            <input type="date" value={data.order_date} onChange={(event) => setData('order_date', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={labels.customer} error={errors.customer_id}>
                                            <select value={data.customer_id} onChange={(event) => setData('customer_id', event.target.value)} className="form-input" required>
                                                {customers.map((customer) => (
                                                    <option key={customer.id} value={customer.id}>{customer.code} - {customer.name_ar ?? customer.name}</option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field label={labels.deliveryDate} error={errors.required_delivery_date}>
                                            <input type="date" value={data.required_delivery_date} onChange={(event) => setData('required_delivery_date', event.target.value)} className="form-input" />
                                        </Field>
                                        <Field label={labels.priority} error={errors.priority}>
                                            <select value={data.priority} onChange={(event) => setData('priority', event.target.value)} className="form-input">
                                                {Object.entries(priorityText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </Field>
                                        <Field label={labels.salesRep}>
                                            <input value={selectedCustomer?.sales_rep?.name ?? labels.noSalesRep} className="form-input bg-slate-50" disabled />
                                        </Field>
                                        <Field label={labels.status}>
                                            <input value={editingOrder ? statusLabel(editingOrder.status) : statusText.draft} className="form-input bg-slate-50" disabled />
                                        </Field>
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                        <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                                            <input type="checkbox" checked={data.sample_required} onChange={(event) => setData('sample_required', event.target.checked)} className="rounded border-slate-300" />
                                            {labels.sampleRequired}
                                        </label>
                                        <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                                            <input type="checkbox" checked={data.customer_sample_sent} onChange={(event) => setData('customer_sample_sent', event.target.checked)} className="rounded border-slate-300" />
                                            {labels.customerSampleSent}
                                        </label>
                                        <Field label={labels.customerSampleLotNo} error={errors.customer_sample_lot_no}>
                                            <input value={data.customer_sample_lot_no} onChange={(event) => setData('customer_sample_lot_no', event.target.value)} className="form-input" />
                                        </Field>
                                        <Field label={labels.paymentMethod} error={errors.down_payment_method}>
                                            <select value={data.down_payment_method} onChange={(event) => setData('down_payment_method', event.target.value)} className="form-input" required>
                                                <option value="cash">{labels.cash}</option>
                                                <option value="check">{labels.check}</option>
                                            </select>
                                        </Field>
                                        <Field label={labels.paymentStatus}>
                                            <input value={Number(downPaymentDuePreview) > 0 ? labels.pending_accounting : labels.received} className="form-input bg-slate-50" disabled />
                                        </Field>
                                    </div>
                                    {data.down_payment_method === 'check' && (
                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                            <Field label={labels.checkNumber} error={errors.down_payment_check_number}>
                                                <input value={data.down_payment_check_number} onChange={(event) => setData('down_payment_check_number', event.target.value)} className="form-input" required />
                                            </Field>
                                            <Field label={labels.bankName} error={errors.down_payment_bank_name}>
                                                <input value={data.down_payment_bank_name} onChange={(event) => setData('down_payment_bank_name', event.target.value)} className="form-input" required />
                                            </Field>
                                            <Field label={labels.checkDueDate} error={errors.down_payment_check_due_date}>
                                                <input type="date" value={data.down_payment_check_due_date} onChange={(event) => setData('down_payment_check_due_date', event.target.value)} className="form-input" required />
                                            </Field>
                                        </div>
                                    )}
                                    </>
                                ),
                            }}
                            details={{
                                title: labels.itemGrid,
                                actions: <button type="button" onClick={addItem} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{labels.addItem}</button>,
                                content: (
                                    <EditableItemsGrid
                                        labels={labels}
                                        items={items}
                                        products={products}
                                        setOrderItem={setOrderItem}
                                        duplicateItem={duplicateItem}
                                        removeItem={removeItem}
                                    />
                                ),
                            }}
                            notes={{
                                title: labels.notesSection,
                                content: (
                                    <>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <Field label={labels.notes} error={errors.notes}>
                                                <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input min-h-[96px]" />
                                            </Field>
                                            <Field label={labels.productionNotes} error={errors.production_notes}>
                                                <textarea value={data.production_notes} onChange={(event) => setData('production_notes', event.target.value)} className="form-input min-h-[96px]" />
                                            </Field>
                                            <Field label={labels.collectionNotes} error={errors.down_payment_collection_notes}>
                                                <textarea value={data.down_payment_collection_notes} onChange={(event) => setData('down_payment_collection_notes', event.target.value)} className="form-input min-h-[84px]" />
                                            </Field>
                                            <Field label={labels.treasuryNotes} error={errors.down_payment_treasury_notes}>
                                                <textarea value={data.down_payment_treasury_notes} onChange={(event) => setData('down_payment_treasury_notes', event.target.value)} className="form-input min-h-[84px]" />
                                            </Field>
                                        </div>

                                        {Number(downPaymentDuePreview) > 0 && (
                                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                <Field label={labels.collectedAmount} error={errors.down_payment_collected_amount}>
                                                    <input type="number" min={downPaymentDuePreview} step="0.01" value={data.down_payment_collected_amount} onChange={(event) => setData('down_payment_collected_amount', event.target.value)} className="form-input" required />
                                                </Field>
                                                <Field label={labels.collector} error={errors.down_payment_collected_by}>
                                                    <select value={data.down_payment_collected_by} onChange={(event) => setData('down_payment_collected_by', event.target.value)} className="form-input" required>
                                                        <option value="">-</option>
                                                        {collectors.map((collector) => <option key={collector.id} value={collector.id}>{collector.name}</option>)}
                                                    </select>
                                                </Field>
                                                <Field label={labels.treasuryEmployee} error={errors.down_payment_treasury_received_by}>
                                                    <select value={data.down_payment_treasury_received_by} onChange={(event) => setData('down_payment_treasury_received_by', event.target.value)} className="form-input" required>
                                                        <option value="">-</option>
                                                        {treasuryEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                                                    </select>
                                                </Field>
                                            </div>
                                        )}
                                    </>
                                ),
                            }}
                            totals={{
                                title: labels.totalsSection,
                                content: (
                                        <div className="mt-3 space-y-2">
                                            <TotalLine label={labels.totalQuantity} value={documentTotals.quantity} />
                                            <TotalLine label={labels.goodsTotal} value={formatMoney(documentTotals.goods)} />
                                            <TotalLine label={labels.itemDiscount} value={formatMoney(0)} muted />
                                            <TotalLine label={labels.extraDiscount} value={formatMoney(0)} muted />
                                            <TotalLine label={labels.tax} value={formatMoney(0)} muted />
                                            <TotalLine label={labels.shipping} value={formatMoney(0)} muted />
                                            <TotalLine label={labels.finalTotal} value={formatMoney(documentTotals.final)} strong />
                                            <TotalLine label={labels.downPayment} value={formatMoney(downPaymentPreview)} />
                                            <TotalLine label={labels.customerCreditUsed} value={formatMoney(data.customer_credit_used)} />
                                            <TotalLine label={labels.downPaymentDue} value={formatMoney(downPaymentDuePreview)} strong />
                                        </div>
                                ),
                            }}
                            workflow={{
                                title: labels.approvalsSection,
                                content: (
                                            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                                                <ApprovalBox label={labels.dataEntry} value={auth.user?.name ?? '-'} />
                                                <ApprovalBox label={labels.salesOfficer} value={statusText.sales_officer_review} />
                                                <ApprovalBox label={labels.salesManager} value={statusText.submitted} />
                                                <ApprovalBox label={labels.generalManager} value={statusText.planning_review} />
                                                <ApprovalBox label={labels.currentApproval} value={editingOrder ? statusLabel(editingOrder.status) : statusText.draft} />
                                            </div>
                                ),
                            }}
                            actions={(
                                <>
                                    <button disabled={processing} className="erp-button">{editingOrder ? labels.updateOrder : labels.save}</button>
                                    {canExport && <a href={route('exports.show', { type: 'sales-orders', lang: language })} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{labels.exportExcel}</a>}
                                </>
                            )}
                        />
                    )}

                    <section className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{labels.ledger}</h3>
                                <p className="mt-1 text-sm text-slate-500">{labels.search}</p>
                            </div>
                            {canExport && <a href={route('exports.show', { type: 'sales-orders', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.exportExcel}</a>}
                        </div>

                        <form onSubmit={searchLedger} className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={labels.searchPlaceholder} className="form-input" />
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-input">
                                <option value="">{labels.allStatuses}</option>
                                {statuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
                            </select>
                            <button type="submit" className="erp-button">{labels.show}</button>
                            <button type="button" onClick={clearSearch} className="control-pill">{labels.resetSearch}</button>
                        </form>

                        <div className="mt-5 space-y-3">
                            {salesOrders.length === 0 && (
                                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{labels.empty}</div>
                            )}
                            {salesOrders.map((order) => {
                                const open = Number(openOrderId) === Number(order.id);
                                const focused = isFocused(order.id, focusId);

                                return (
                                    <article key={order.id} id={`focus-${order.id}`} className={`rounded-md border bg-white shadow-sm ${focused ? 'scroll-mt-28 border-amber-500 bg-amber-50/70 outline outline-2 outline-amber-500' : 'border-slate-200'}`}>
                                        <button type="button" onClick={() => setOpenOrderId(open ? null : order.id)} className="grid w-full gap-3 px-4 py-4 text-start md:grid-cols-[160px_1fr_150px_150px_140px] md:items-center">
                                            <div>
                                                <div className="text-xs font-bold text-slate-500">{labels.soNumber}</div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-lg font-black text-slate-950">{order.so_number}</span>
                                                    {['approved', 'in_production', 'completed', 'delivered', 'closed'].includes(order.status) && <ApprovalBadge approved compact />}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500">{labels.customer}</div>
                                                <div className="font-semibold text-slate-900">{order.customer?.name_ar ?? order.customer?.name}</div>
                                            </div>
                                            <StatusBadge status={order.status} label={statusLabel(order.status)} compact />
                                            <div className="text-sm font-semibold text-slate-700">{labels.total}: {totalFor(order)}</div>
                                            <div className="text-xs font-semibold text-slate-500">{open ? labels.closeOrder : labels.openOrder}</div>
                                        </button>

                                        {open && (
                                            <div className="border-t border-slate-200 bg-slate-50">
                                                <div className="border-b border-slate-200 bg-white px-4 py-4">
                                                    <SectionTitle>{labels.orderHeader}</SectionTitle>
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                                        <Info label={labels.soNumber} value={order.so_number} />
                                                        <Info label={labels.orderDate} value={order.order_date} />
                                                        <Info label={labels.customer} value={order.customer?.name_ar ?? order.customer?.name} />
                                                        <Info label={labels.salesRep} value={order.customer?.sales_rep?.name ?? labels.noSalesRep} />
                                                        <Info label={labels.deliveryDate} value={order.required_delivery_date ?? '-'} />
                                                        <Info label={labels.status} value={<StatusBadge status={order.status} label={statusLabel(order.status)} compact />} />
                                                        <Info label={labels.priority} value={priorityText[order.priority] ?? order.priority} />
                                                        <Info label={labels.paymentMethod} value={labels[order.down_payment_method] ?? order.down_payment_method ?? '-'} />
                                                        <Info label={labels.paymentStatus} value={<StatusBadge status={order.down_payment_status} label={labels[order.down_payment_status] ?? order.down_payment_status ?? '-'} compact />} />
                                                        <Info label={workflowText.invoiceNumber} value={order.invoice_number ?? '-'} />
                                                        <Info label={workflowText.invoiceStatus} value={<StatusBadge status={order.invoice_status} label={workflowText[order.invoice_status] ?? order.invoice_status ?? '-'} compact />} />
                                                        <Info label={workflowText.shippingNumber} value={order.shipping_number ?? '-'} />
                                                        <Info label={workflowText.shippingStatus} value={<StatusBadge status={order.shipping_status} label={workflowText[order.shipping_status === 'delivered' ? 'delivered_shipping' : order.shipping_status] ?? order.shipping_status ?? '-'} compact />} />
                                                        <Info label={labels.collector} value={order.collector?.name ?? '-'} />
                                                        <Info label={labels.treasuryEmployee} value={order.treasury_receiver?.name ?? '-'} />
                                                        <Info label={labels.approvedDyeSample} value={order.approved_dye_sample?.sample_no ?? '-'} />
                                                    </div>
                                                </div>

                                                <div className="border-b border-slate-200 bg-white px-4 py-4">
                                                    <SectionTitle>{workflowText.workflow}</SectionTitle>
                                                    <WorkflowProgress workflow={order.workflow} labels={workflowText} />
                                                </div>

                                                <div className="border-b border-slate-200 bg-white px-4 py-4">
                                                    <SectionTitle>{labels.itemGrid}</SectionTitle>
                                                    <ReadOnlyItemsGrid labels={labels} items={order.items} />
                                                </div>

                                                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                                                    <div className="border-b border-slate-200 bg-white px-4 py-4 lg:border-b-0 lg:border-e">
                                                        <SectionTitle>{labels.notesSection}</SectionTitle>
                                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                            <Info label={labels.notes} value={order.notes ?? '-'} />
                                                            <Info label={labels.productionNotes} value={order.production_notes ?? '-'} />
                                                            <Info label={labels.collectionNotes} value={order.down_payment_collection_notes ?? '-'} />
                                                            <Info label={labels.treasuryNotes} value={order.down_payment_treasury_notes ?? '-'} />
                                                        </div>
                                                    </div>
                                                    <div className="bg-white px-4 py-4">
                                                        <SectionTitle>{labels.totalsSection}</SectionTitle>
                                                        <div className="mt-3 space-y-2">
                                                            <TotalLine label={labels.totalQuantity} value={order.items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)} />
                                                            <TotalLine label={labels.goodsTotal} value={formatMoney(totalFor(order))} />
                                                            <TotalLine label={labels.itemDiscount} value={formatMoney(0)} muted />
                                                            <TotalLine label={labels.extraDiscount} value={formatMoney(0)} muted />
                                                            <TotalLine label={labels.tax} value={formatMoney(0)} muted />
                                                            <TotalLine label={labels.shipping} value={formatMoney(0)} muted />
                                                            <TotalLine label={labels.finalTotal} value={formatMoney(totalFor(order))} strong />
                                                            <TotalLine label={labels.downPayment} value={formatMoney(Number(order.down_payment_amount ?? 0) + Number(order.customer_credit_used ?? 0))} />
                                                            <TotalLine label={labels.customerCreditUsed} value={formatMoney(order.customer_credit_used ?? 0)} />
                                                            <TotalLine label={labels.downPaymentDue} value={formatMoney(order.down_payment_amount ?? Number(totalFor(order)) * 0.5)} strong />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-200 px-4 py-4">
                                                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                                                        <div>
                                                            <SectionTitle>{labels.approvalsSection}</SectionTitle>
                                                            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                                                                <ApprovalBox label={labels.dataEntry} value={order.creator?.name ?? '-'} />
                                                                <ApprovalBox label={labels.salesOfficer} value={statusText.sales_officer_review} />
                                                                <ApprovalBox label={labels.salesManager} value={order.reviewer?.name ?? '-'} />
                                                                <ApprovalBox label={labels.generalManager} value={order.approver?.name ?? '-'} />
                                                                <ApprovalBox label={labels.currentApproval} value={statusLabel(order.status)} />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['draft', 'rejected'].includes(order.status) && canEdit && <SmallButton onClick={() => editOrder(order)}>{labels.editOrder}</SmallButton>}
                                                            {['draft', 'rejected'].includes(order.status) && canCreate && <SmallButton onClick={() => changeStatus(order, 'sales_officer_review')}>{labels.sendSalesOfficer}</SmallButton>}
                                                            {order.status === 'sales_officer_review' && canSalesOfficerReview && <SmallButton onClick={() => changeStatus(order, 'submitted')}>{labels.salesOfficerApprove}</SmallButton>}
                                                            {order.status === 'submitted' && canReview && <SmallButton onClick={() => changeStatus(order, 'planning_review')}>{labels.salesManagerApprove}</SmallButton>}
                                                            {order.status === 'planning_review' && canApprove && <SmallButton onClick={() => changeStatus(order, 'approved')}>{labels.generalManagerApprove}</SmallButton>}
                                                            {order.workflow?.ready_for_invoice && canFinance && <SmallButton onClick={() => createInvoice(order)}>{workflowText.createInvoice}</SmallButton>}
                                                            {order.workflow?.ready_for_delivery && canEdit && order.shipping_status !== 'ready' && <SmallButton onClick={() => prepareShipping(order)}>{workflowText.prepareShipping}</SmallButton>}
                                                            {order.shipping_status === 'ready' && canEdit && <SmallButton onClick={() => markDelivered(order)}>{workflowText.markDelivered}</SmallButton>}
                                                            {order.workflow?.ready_for_close && (canFinance || canApprove) && <SmallButton onClick={() => closeFinalOrder(order)}>{workflowText.closeFinalOrder}</SmallButton>}
                                                            {(canEdit || canSalesOfficerReview || canReview) && <SmallButton onClick={() => sendCustomerMessage(order)}>رسالة للعميل</SmallButton>}
                                                            {order.status === 'sales_officer_review' && canSalesOfficerReview && <SmallButton danger onClick={() => changeStatus(order, 'rejected')}>{labels.reject}</SmallButton>}
                                                            {order.status === 'submitted' && canReview && <SmallButton danger onClick={() => changeStatus(order, 'rejected')}>{labels.reject}</SmallButton>}
                                                            {order.status === 'planning_review' && canApprove && <SmallButton danger onClick={() => changeStatus(order, 'rejected')}>{labels.reject}</SmallButton>}
                                                            {canPrint && <a href={route('print.sales-orders', order.id)} target="_blank" className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{labels.print}</a>}
                                                        </div>
                                                    </div>
                                                    <HistoryTimeline title={labels.history} items={order.timeline ?? []} />
                                                    <HistoryTimeline title="محادثات العميل والمندوب" items={(order.messages ?? []).map((message) => ({
                                                        id: `message-${message.id}`,
                                                        event: message.sender?.name ?? '-',
                                                        description: message.message,
                                                        created_at: message.created_at,
                                                        user: message.sender,
                                                        department: null,
                                                    }))} />
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
        </div>
    );
}

function WorkflowProgress({ workflow, labels }) {
    const completed = workflow?.completed ?? {};
    const current = workflow?.current_step;

    return (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {workflowSteps.map((step) => {
                const done = Boolean(completed[step]);
                const active = current === step;
                const labelKey = step === 'closed' ? 'closedStep' : step;

                return (
                    <div key={step} className={`rounded-md border px-3 py-2 text-xs font-bold ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : active ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                        <div>{labels[labelKey] ?? step}</div>
                        <div className="mt-1 text-[11px] font-semibold opacity-75">{done ? 'Done' : active ? 'Current' : 'Pending'}</div>
                    </div>
                );
            })}
        </div>
    );
}

function SectionTitle({ children }) {
    return <DocumentSectionTitle>{children}</DocumentSectionTitle>;
}

function TotalLine({ label, value, strong = false, muted = false }) {
    return (
        <div className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${strong ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'} ${muted ? 'opacity-60' : ''}`}>
            <span className="text-xs font-bold">{label}</span>
            <span className={`${strong ? 'text-base' : 'text-sm'} font-black`}>{value}</span>
        </div>
    );
}

function ApprovalBox({ label, value }) {
    return (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
            <div className="text-[11px] font-bold text-slate-500">{label}</div>
            <div className="mt-1 truncate text-sm font-black text-slate-900">{value}</div>
        </div>
    );
}

function EditableItemsGrid({ labels, items, products, setOrderItem, duplicateItem, removeItem }) {
    return (
        <div className="rounded-md border border-slate-200">
            <div className="divide-y divide-slate-100 bg-white">
                {items.map((item, index) => (
                    <div key={index} className="grid min-w-0 gap-3 px-3 py-3 md:grid-cols-3 xl:grid-cols-6">
                        <GridCell label={labels.lineNo}>
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">{index + 1}</div>
                        </GridCell>
                        <GridCell label={labels.productCode}>
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-900">{productFor(products, item.product_id)?.code ?? '-'}</div>
                        </GridCell>
                        <GridCell label={labels.productName} className="md:col-span-2 xl:col-span-2">
                            <select value={item.product_id} onChange={(event) => setOrderItem(index, 'product_id', event.target.value)} className="form-input w-full min-w-0" required>
                                {products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
                            </select>
                        </GridCell>
                        <GridCell label={labels.color}>
                            <input value={item.color} onChange={(event) => setOrderItem(index, 'color', event.target.value)} className="form-input w-full min-w-0" required />
                        </GridCell>
                        <GridCell label={labels.quality}>
                            <input value={item.quality} onChange={(event) => setOrderItem(index, 'quality', event.target.value)} className="form-input w-full min-w-0" />
                        </GridCell>
                        <GridCell label={labels.width}>
                            <input type="number" value={item.width} onChange={(event) => setOrderItem(index, 'width', event.target.value)} className="form-input w-full min-w-0" />
                        </GridCell>
                        <GridCell label={labels.weight}>
                            <input type="number" value={item.weight} onChange={(event) => setOrderItem(index, 'weight', event.target.value)} className="form-input w-full min-w-0" />
                        </GridCell>
                        <GridCell label={labels.unit}>
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-900">{productFor(products, item.product_id)?.unit ?? '-'}</div>
                        </GridCell>
                        <GridCell label={labels.quantity}>
                            <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => setOrderItem(index, 'quantity', event.target.value)} className="form-input w-full min-w-0" required />
                        </GridCell>
                        <GridCell label={labels.unitPrice}>
                            <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => setOrderItem(index, 'unit_price', event.target.value)} className="form-input w-full min-w-0" required />
                        </GridCell>
                        <GridCell label={labels.discount}>
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-500">{formatMoney(0)}</div>
                        </GridCell>
                        <GridCell label={labels.total}>
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-900">{formatMoney(lineTotal(item))}</div>
                        </GridCell>
                        <GridCell label={labels.actions} className="md:col-span-3 xl:col-span-2">
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                <button type="button" onClick={() => duplicateItem(index)} className="rounded-md border border-slate-300 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{labels.duplicateItem}</button>
                                <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="rounded-md border border-rose-300 bg-rose-50 px-2 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-40">{labels.remove}</button>
                            </div>
                        </GridCell>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReadOnlyItemsGrid({ labels, items }) {
    return (
        <div className="mt-3 rounded-md border border-slate-200">
            <div className="divide-y divide-slate-100 bg-white">
                {items.map((item, index) => (
                    <div key={item.id ?? index} className="grid min-w-0 gap-3 px-3 py-3 md:grid-cols-3 xl:grid-cols-6">
                        <ReadOnlyGridCell label={labels.lineNo}>{index + 1}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.productCode}>{item.product?.code ?? '-'}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.productName} className="md:col-span-2 xl:col-span-2">{item.product?.name ?? '-'}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.color}>{item.color}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.quality}>{item.quality ?? '-'}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.width}>{item.width ?? '-'}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.weight}>{item.weight ?? '-'}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.unit}>{item.product?.unit ?? '-'}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.quantity}>{item.quantity}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.unitPrice}>{item.unit_price}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.discount}>{formatMoney(0)}</ReadOnlyGridCell>
                        <ReadOnlyGridCell label={labels.total}>{item.total_price}</ReadOnlyGridCell>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GridCell({ label, className = '', children }) {
    return (
        <div className={`min-w-0 ${className}`}>
            <div className="mb-1 text-[11px] font-black text-slate-500 xl:hidden">{label}</div>
            {children}
        </div>
    );
}

function ReadOnlyGridCell({ label, className = '', children }) {
    return (
        <div className={`min-w-0 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 xl:bg-transparent xl:px-0 ${className}`}>
            <div className="mb-1 text-[11px] font-black text-slate-500 xl:hidden">{label}</div>
            <div className="truncate">{children}</div>
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

function Info({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function Th({ children }) {
    return <th className="px-3 py-2 text-start text-xs font-bold">{children}</th>;
}

function Td({ children }) {
    return <td className="px-3 py-3 text-slate-700">{children}</td>;
}

function SmallButton({ children, onClick, danger = false }) {
    return <button type="button" onClick={onClick} className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${danger ? 'bg-red-700' : 'bg-slate-800'}`}>{children}</button>;
}

function HistoryTimeline({ title, items }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mt-5">
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

function formatMoney(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineTotal(item) {
    return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

function productFor(products, productId) {
    return products.find((product) => String(product.id) === String(productId));
}

function totalsForItems(items) {
    const quantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const goods = items.reduce((sum, item) => sum + lineTotal(item), 0);

    return {
        quantity: Number(quantity.toFixed(2)),
        goods,
        final: goods,
    };
}

function isFocused(id, focusId) {
    return focusId && String(id) === String(focusId);
}

function scrollToFocusedRow(focusId) {
    if (!focusId) return;
    window.setTimeout(() => {
        document.getElementById(`focus-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
}
