import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ApprovalBadge, StatusBadge, VerificationBadge } from '@/Components/CustomerTrustBadges';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { Fragment, useEffect, useState } from 'react';

const pageLabels = {
    ar: {
        title: 'العملاء',
        subtitle: 'بيانات العملاء الأساسية قبل طلبات البيع والإنتاج.',
        code: 'كود العميل',
        internalSequence: 'التسلسل الداخلي',
        barcode: 'الباركود',
        nameAr: 'الاسم العربي',
        nameEn: 'الاسم الإنجليزي',
        mobile: 'الموبايل',
        phone: 'الهاتف',
        email: 'البريد الإلكتروني',
        salesRep: 'مندوب المبيعات',
        noSalesRep: 'بدون مندوب',
        profilePhoto: 'صورة العميل',
        taxNumber: 'الرقم الضريبي',
        commercialRegister: 'السجل التجاري',
        creditLimit: 'حد الائتمان',
        paymentTerms: 'شروط الدفع',
        city: 'المدينة',
        address: 'العنوان',
        notes: 'ملاحظات',
        active: 'نشط',
        inactive: 'غير نشط',
        save: 'حفظ العميل',
        update: 'تحديث العميل',
        cancel: 'إلغاء',
        list: 'قائمة العملاء',
        incompleteList: 'كشف العملاء ناقصي البيانات',
        incompleteHelp: 'هؤلاء العملاء لا يظهرون مع بيانات العملاء المكتملة أو المعتمدة حتى يتم استكمال بياناتهم.',
        missingFields: 'البيانات الناقصة',
        notifyIncomplete: 'إرسال تنبيه متابعة',
        noIncomplete: 'لا يوجد عملاء ناقصي البيانات.',
        status: 'الحالة',
        dataStatus: 'حالة البيانات',
        pendingReview: 'بانتظار الاعتماد',
        approvedData: 'معتمدة',
        approveData: 'اعتماد البيانات',
        rejectData: 'إرجاع للتعديل',
        createdBy: 'أنشئ بواسطة',
        updatedBy: 'آخر تعديل بواسطة',
        actions: 'إجراءات',
        edit: 'تعديل',
        delete: 'حذف',
        history: 'التايملاين',
        empty: 'لا يوجد عملاء حتى الآن.',
        importCustomers: 'استيراد العملاء',
        importHelp: 'ارفع ملف CSV أو XLSX. اترك الكود فارغًا للتكويد التلقائي.',
        importFile: 'ملف العملاء',
        duplicateImportTitle: 'تكرار أسماء في ملف الاستيراد',
        duplicateImportText: 'تم العثور على أسماء عملاء مكررة. اختر هل تريد تكويد كل الصفوف أم الاكتفاء بأول مرة لكل اسم.',
        acceptDuplicates: 'قبول التكرار',
        uniqueOnly: 'تكويد مرة واحدة',
        upload: 'رفع',
        template: 'تحميل نموذج الاستيراد',
        auto: 'تلقائي',
        confirmDelete: (name) => `حذف العميل ${name}؟`,
    },
    en: {
        title: 'Customers',
        subtitle: 'Customer master data before sales orders and production.',
        code: 'Customer Code',
        internalSequence: 'Internal Sequence',
        barcode: 'Barcode',
        nameAr: 'Arabic Name',
        nameEn: 'English Name',
        mobile: 'Mobile',
        phone: 'Phone',
        email: 'Email',
        salesRep: 'Sales Rep',
        noSalesRep: 'No Sales Rep',
        profilePhoto: 'Customer Photo',
        taxNumber: 'Tax Number',
        commercialRegister: 'Commercial Register',
        creditLimit: 'Credit Limit',
        paymentTerms: 'Payment Terms',
        city: 'City',
        address: 'Address',
        notes: 'Notes',
        active: 'Active',
        inactive: 'Inactive',
        save: 'Save Customer',
        update: 'Update Customer',
        cancel: 'Cancel',
        list: 'Customer List',
        incompleteList: 'Incomplete Customer Data',
        incompleteHelp: 'These customers are separated from complete or approved customer records until their data is completed.',
        missingFields: 'Missing Fields',
        notifyIncomplete: 'Send Follow-up Alert',
        noIncomplete: 'No incomplete customers.',
        status: 'Status',
        dataStatus: 'Data Status',
        pendingReview: 'Pending Approval',
        approvedData: 'Approved',
        approveData: 'Approve Data',
        rejectData: 'Return For Correction',
        createdBy: 'Created By',
        updatedBy: 'Updated By',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        history: 'Timeline',
        empty: 'No customers yet.',
        importCustomers: 'Import Customers',
        importHelp: 'Upload CSV or XLSX. Leave code empty for automatic coding.',
        importFile: 'Customer File',
        duplicateImportTitle: 'Repeated Customer Names',
        duplicateImportText: 'Repeated customer names were found. Choose whether to code all rows or keep only the first row for each name.',
        acceptDuplicates: 'Accept Duplicates',
        uniqueOnly: 'Code Once Only',
        upload: 'Upload',
        template: 'Download Import Template',
        auto: 'Auto',
        confirmDelete: (name) => `Delete customer ${name}?`,
    },
};

const emptyCustomer = {
    code: '',
    name_ar: '',
    name_en: '',
    mobile: '',
    phone: '',
    email: '',
    sales_rep_id: '',
    profile_photo: null,
    tax_number: '',
    commercial_register: '',
    national_id: '',
    national_id_image: null,
    credit_limit: '0',
    payment_terms: '',
    city: '',
    address: '',
    status: 'active',
    notes: '',
};

export default function Customers({ auth, flash, customers, incompleteCustomers = [], salesReps, filters = {} }) {
    const { language, isRtl, text: labels } = useLanguage(pageLabels);
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreate = permissions.includes('create_customer');
    const canEdit = permissions.includes('edit_customer');
    const canDelete = permissions.includes('delete_customer');
    const isAdmin = auth.user.role?.slug === 'admin';
    const canForwardIncomplete = canEdit && (
        ['admin', 'general_manager'].includes(auth.user.role?.slug)
        || (auth.user.department?.code === 'sales' && auth.user.position?.code === 'sales_manager')
    );
    const canExport = permissions.includes('export_reports') && (
        ['admin', 'general_manager'].includes(auth.user.role?.slug)
        || (
            auth.user.department?.code === 'sales'
            && ['sales_manager', 'sales_officer'].includes(auth.user.position?.code)
            && (permissions.includes('export_own_customers') || permissions.includes('export_partial_data'))
        )
    );
    const [editingCustomer, setEditingCustomer] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm(emptyCustomer);
    const importForm = useForm({ file: null });

    const changeSalesRepFilter = (salesRepId) => {
        router.get(route('master-data.customers'), { sales_rep_id: salesRepId || undefined }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        scrollToFocusedRow(focusId);
    }, [focusId]);

    const clearForm = () => {
        setEditingCustomer(null);
        reset();
        setData(emptyCustomer);
    };

    const submit = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, forceFormData: true, onSuccess: clearForm };

        if (editingCustomer) {
            router.post(route('customers.update', editingCustomer.id), {
                ...data,
                _method: 'patch',
            }, options);
            return;
        }

        post(route('customers.store'), options);
    };

    const submitImport = (event) => {
        event.preventDefault();
        importForm.post(route('customers.import'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => importForm.reset('file'),
        });
    };

    const resolveDuplicateImport = (decision) => {
        router.post(route('customers.import'), { import_decision: decision }, {
            preserveScroll: true,
        });
    };

    const editCustomer = (customer) => {
        setEditingCustomer(customer);
        setData({
            code: customer.code ?? '',
            name_ar: customer.name_ar ?? customer.name ?? '',
            name_en: customer.name_en ?? '',
            mobile: customer.mobile ?? '',
            phone: customer.phone ?? '',
            email: customer.email ?? '',
            sales_rep_id: customer.sales_rep_id ?? '',
            profile_photo: null,
            tax_number: customer.tax_number ?? '',
            commercial_register: customer.commercial_register ?? '',
            national_id: customer.national_id ?? '',
            national_id_image: null,
            credit_limit: customer.credit_limit ?? '0',
            payment_terms: customer.payment_terms ?? '',
            city: customer.city ?? '',
            address: customer.address ?? '',
            status: customer.status ?? (customer.active ? 'active' : 'inactive'),
            notes: customer.notes ?? '',
        });
    };

    const deleteCustomer = (customer) => {
        if (!window.confirm(labels.confirmDelete(customer.name_ar ?? customer.name))) {
            return;
        }

        router.delete(route('customers.destroy', customer.id), { preserveScroll: true });
    };

    const approveCustomerData = (customer) => {
        router.patch(route('customers.approve-data', customer.id), {}, { preserveScroll: true });
    };

    const notifyIncompleteCustomer = (customer) => {
        router.patch(route('customers.notify-incomplete-data', customer.id), {}, { preserveScroll: true });
    };

    const activatePortalAccount = (customer) => {
        router.patch(route('customers.activate-portal-account', customer.id), {}, { preserveScroll: true });
    };

    const createPortalAccount = (customer) => {
        const email = window.prompt('اكتب البريد الإلكتروني لحساب العميل', customer.email ?? '');

        if (!email || email.trim() === '') {
            return;
        }

        const password = window.prompt('اكتب كلمة مرور مؤقتة للعميل');

        if (!password || password.trim() === '') {
            return;
        }

        const passwordConfirmation = window.prompt('أعد كتابة كلمة المرور للتأكيد');

        if (password !== passwordConfirmation) {
            window.alert('كلمة المرور وتأكيدها غير متطابقين.');
            return;
        }

        router.post(route('customers.portal-account.store', customer.id), {
            email,
            password,
            password_confirmation: passwordConfirmation,
        }, { preserveScroll: true });
    };

    const rejectCustomerData = (customer) => {
        const reason = window.prompt(labels.rejectionReason ?? 'اكتب سبب الإرجاع للتعديل');

        if (!reason || reason.trim() === '') {
            return;
        }

        router.patch(route('customers.reject-data', customer.id), { reason }, { preserveScroll: true });
    };

    const archiveCustomer = (customer) => {
        const reason = window.prompt('اكتب سبب أرشفة العميل', 'لم يطلب منذ مدة أو يحتاج تحديث بيانات');
        router.patch(route('customers.archive', customer.id), { reason: reason ?? '' }, { preserveScroll: true });
    };

    const restoreCustomer = (customer) => {
        router.patch(route('customers.restore', customer.id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{labels.title}</h2>}>
            <Head title={labels.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {canCreate && (
                        <div className="erp-card mb-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">{labels.importCustomers}</h3>
                                    <p className="mt-1 text-sm" style={{ color: 'var(--erp-muted)' }}>{labels.importHelp}</p>
                                </div>
                                <a href={route('customers.import-template', { lang: language })} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
                                    {labels.template}
                                </a>
                            </div>
                            <form onSubmit={submitImport} className="mt-5 flex flex-col gap-3 md:flex-row md:items-end">
                                <Field label={labels.importFile} error={importForm.errors.file}>
                                    <input type="file" accept=".csv,.xlsx" onChange={(event) => importForm.setData('file', event.target.files[0] ?? null)} className="form-input" required />
                                </Field>
                                <button disabled={importForm.processing} className="erp-button">{labels.upload}</button>
                            </form>
                            {flash?.duplicateImport && (
                                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    <div className="font-semibold">{labels.duplicateImportTitle}</div>
                                    <div className="mt-1">
                                        {labels.duplicateImportText} ({flash.duplicateImport.duplicate_rows} / {flash.duplicateImport.duplicate_names})
                                    </div>
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
                        </div>
                    )}

                    {(canCreate || editingCustomer) && (
                        <div className="erp-card mb-6">
                            <div className="border-b pb-4" style={{ borderColor: 'var(--erp-border)' }}>
                                <h3 className="text-lg font-semibold">{editingCustomer ? labels.update : labels.save}</h3>
                                <p className="mt-1 text-sm" style={{ color: 'var(--erp-muted)' }}>{labels.subtitle}</p>
                            </div>

                            {flash?.success && (
                                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{flash.success}</div>
                            )}

                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Field label={labels.code} error={errors.code}>
                                    <input value={data.code} onChange={(event) => setData('code', event.target.value)} className="form-input" placeholder={labels.auto} />
                                </Field>
                                <Field label={labels.nameAr} error={errors.name_ar}>
                                    <input value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="form-input" required />
                                </Field>
                                <Field label={labels.nameEn} error={errors.name_en}>
                                    <input value={data.name_en} onChange={(event) => setData('name_en', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.mobile} error={errors.mobile}>
                                    <input value={data.mobile} onChange={(event) => setData('mobile', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.phone} error={errors.phone}>
                                    <input value={data.phone} onChange={(event) => setData('phone', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.email} error={errors.email}>
                                    <input type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.salesRep} error={errors.sales_rep_id}>
                                    <select value={data.sales_rep_id} onChange={(event) => setData('sales_rep_id', event.target.value)} className="form-input">
                                        <option value="">{labels.noSalesRep}</option>
                                        {salesReps.map((rep) => (
                                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label={labels.profilePhoto} error={errors.profile_photo}>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setData('profile_photo', event.target.files[0] ?? null)} className="block w-full text-sm" />
                                </Field>
                                <Field label={labels.taxNumber} error={errors.tax_number}>
                                    <input value={data.tax_number} onChange={(event) => setData('tax_number', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.commercialRegister} error={errors.commercial_register}>
                                    <input value={data.commercial_register} onChange={(event) => setData('commercial_register', event.target.value)} className="form-input" />
                                </Field>
                                <Field label="الرقم القومي" error={errors.national_id}>
                                    <input value={data.national_id} onChange={(event) => setData('national_id', event.target.value)} className="form-input" />
                                </Field>
                                <Field label="صورة الرقم القومي" error={errors.national_id_image}>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setData('national_id_image', event.target.files[0] ?? null)} className="block w-full text-sm" />
                                </Field>
                                <Field label={labels.creditLimit} error={errors.credit_limit}>
                                    <input type="number" min="0" step="0.01" value={data.credit_limit} onChange={(event) => setData('credit_limit', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.paymentTerms} error={errors.payment_terms}>
                                    <input value={data.payment_terms} onChange={(event) => setData('payment_terms', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.city} error={errors.city}>
                                    <input value={data.city} onChange={(event) => setData('city', event.target.value)} className="form-input" />
                                </Field>
                                <Field label={labels.status} error={errors.status}>
                                    <select value={data.status} onChange={(event) => setData('status', event.target.value)} className="form-input">
                                        <option value="active">{labels.active}</option>
                                        <option value="inactive">{labels.inactive}</option>
                                    </select>
                                </Field>
                                <Field label={labels.address} error={errors.address} wide>
                                    <textarea value={data.address} onChange={(event) => setData('address', event.target.value)} className="form-input min-h-[90px]" />
                                </Field>
                                <Field label={labels.notes} error={errors.notes} wide>
                                    <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} className="form-input min-h-[90px]" />
                                </Field>

                                <div className="lg:col-span-4">
                                    <button disabled={processing} className="erp-button">{editingCustomer ? labels.update : labels.save}</button>
                                    {editingCustomer && (
                                        <button type="button" onClick={clearForm} className="me-2 rounded-md border border-slate-300 px-5 py-2 text-sm font-medium">
                                            {labels.cancel}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    <IncompleteCustomersPanel
                        customers={incompleteCustomers}
                        labels={labels}
                        canEdit={canEdit}
                        canForward={canForwardIncomplete}
                        onEdit={editCustomer}
                        onNotify={notifyIncompleteCustomer}
                    />

                    <div className="erp-card">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h3 className="text-lg font-semibold">{labels.list}</h3>
                            <select value={filters.sales_rep_id ?? ''} onChange={(event) => changeSalesRepFilter(event.target.value)} className="form-input min-w-[180px] text-xs">
                                <option value="">{labels.allSalesReps ?? 'All Sales Reps'}</option>
                                {salesReps.map((rep) => (
                                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                                ))}
                            </select>
                            {canExport && <a href={route('exports.show', { type: 'customers', format: 'pdf', lang: language })} target="_blank" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">PDF</a>}
                            {canExport && <a href={route('exports.show', { type: 'customers', lang: language })} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold">{labels.exportExcel ?? 'تصدير Excel'}</a>}
                        </div>
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5" style={{ color: 'var(--erp-muted)' }}>
                                    <tr>
                                        <Th>{labels.code}</Th>
                                        <Th>{labels.internalSequence}</Th>
                                        <Th>{labels.barcode}</Th>
                                        <Th>{labels.profilePhoto}</Th>
                                        <Th>{labels.nameAr}</Th>
                                        <Th>{labels.mobile}</Th>
                                        <Th>التوثيق</Th>
                                        <Th>{labels.salesRep}</Th>
                                        <Th>{labels.email}</Th>
                                        <Th>{labels.creditLimit}</Th>
                                        <Th>{labels.status}</Th>
                                        <Th>{labels.dataStatus}</Th>
                                        <Th>{labels.createdBy}</Th>
                                        <Th>{labels.updatedBy}</Th>
                                        {(canEdit || canDelete) && <Th>{labels.actions}</Th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {customers.length === 0 && (
                                        <tr>
                                            <td colSpan={canEdit || canDelete ? 15 : 14} className="px-4 py-8 text-center" style={{ color: 'var(--erp-muted)' }}>{labels.empty}</td>
                                        </tr>
                                    )}
                                    {customers.map((customer) => {
                                        const focused = isFocused(customer.id, focusId);

                                        return (
                                        <Fragment key={customer.id}>
                                            <tr id={`focus-${customer.id}`} className={focused ? focusRowClass() : ''}>
                                                <td className="px-4 py-4 font-semibold">{customer.code}</td>
                                                <td className="px-4 py-4">{customer.internal_sequence ?? '-'}</td>
                                                <td className="px-4 py-4">{customer.barcode ?? customer.code}</td>
                                                <td className="px-4 py-4">
                                                    {customer.profile_photo_url ? (
                                                        <img src={customer.profile_photo_url} alt={customer.name_ar ?? customer.name} className="h-10 w-10 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
                                                            {(customer.name_ar ?? customer.name ?? 'C').charAt(0)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">{customer.name_ar ?? customer.name}</td>
                                                <td className="px-4 py-4">{customer.mobile || customer.phone || '-'}</td>
                                                <td className="px-4 py-4">
                                                    <VerificationBadge tier={customer.verification_tier} showEmpty compact />
                                                    {customer.national_id_image_url && (
                                                        <a href={customer.national_id_image_url} target="_blank" className="mt-1 block text-xs font-bold text-sky-700">صورة البطاقة</a>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">{customer.sales_rep?.name ?? customer.salesRep?.name ?? '-'}</td>
                                                <td className="px-4 py-4">{customer.email || '-'}</td>
                                                <td className="px-4 py-4">{customer.credit_limit ?? '0.00'}</td>
                                                <td className="px-4 py-4">{customer.archived_at ? 'مؤرشف' : (customer.status === 'active' ? labels.active : labels.inactive)}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <ApprovalBadge approved={customer.data_status === 'approved'} archived={customer.archived_at} compact />
                                                        <StatusBadge status={customer.data_status} label={dataStatusLabel(customer.data_status, labels)} compact />
                                                    </div>
                                                    {String(customer.data_status ?? '').startsWith('rejected_') && (
                                                        <div className="mt-2 max-w-[220px] text-xs text-slate-600">
                                                            <div>{customer.data_rejection_reason ?? '-'}</div>
                                                            <div>{customer.data_rejecter?.name ?? customer.dataRejecter?.name ?? '-'}</div>
                                                        </div>
                                                    )}
                                                    {!String(customer.data_status ?? '').startsWith('rejected_') && approvalDetail(customer) && (
                                                        <div className="mt-2 max-w-[220px] text-xs text-slate-600">{approvalDetail(customer)}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">{customer.creator?.name ?? '-'}</td>
                                                <td className="px-4 py-4">{customer.updater?.name ?? '-'}</td>
                                                {(canEdit || canDelete) && (
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {canEdit && (customer.data_status !== 'approved' || isAdmin) && <button type="button" onClick={() => editCustomer(customer)} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white">{labels.edit}</button>}
                                                            {canEdit && isAdmin && customer.data_status === 'pending_admin' && <button type="button" onClick={() => activatePortalAccount(customer)} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white">تفعيل حساب العميل</button>}
                                                            {canEdit && !hasPortalAccount(customer) && <button type="button" onClick={() => createPortalAccount(customer)} className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white">فتح حساب دخول للعميل</button>}
                                                            {hasPortalAccount(customer) && <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">حساب عميل مربوط</span>}
                                                            {canEdit && customer.data_status !== 'approved' && customer.data_status !== 'pending_admin' && !String(customer.data_status ?? '').startsWith('rejected_') && <button type="button" onClick={() => approveCustomerData(customer)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">{labels.approveData}</button>}
                                                            {canEdit && customer.data_status !== 'approved' && customer.data_status !== 'pending_admin' && !String(customer.data_status ?? '').startsWith('rejected_') && <button type="button" onClick={() => rejectCustomerData(customer)} className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">{labels.rejectData ?? 'Return'}</button>}
                                                            {canEdit && !customer.archived_at && <button type="button" onClick={() => archiveCustomer(customer)} className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white">أرشفة</button>}
                                                            {canEdit && customer.archived_at && <button type="button" onClick={() => restoreCustomer(customer)} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white">خروج من الأرشيف</button>}
                                                            {canDelete && <button type="button" onClick={() => deleteCustomer(customer)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">{labels.delete}</button>}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                            <tr>
                                                <td colSpan={canEdit || canDelete ? 15 : 14} className="bg-black/5 px-4 py-3">
                                                    <HistoryTimeline title={labels.history} items={customer.timeline ?? []} />
                                                </td>
                                            </tr>
                                        </Fragment>
                                    );})}
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

function IncompleteCustomersPanel({ customers, labels, canEdit, canForward, onEdit, onNotify }) {
    return (
        <div className="erp-card mb-6 border border-sky-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-sky-100 bg-sky-50/80 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-sky-950">{labels.incompleteList}</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">{labels.incompleteHelp}</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm">
                    {customers.length}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <Th>{labels.code}</Th>
                            <Th>{labels.nameAr}</Th>
                            <Th>{labels.mobile}</Th>
                            <Th>{labels.salesRep}</Th>
                            <Th>{labels.dataStatus}</Th>
                            <Th>{labels.missingFields}</Th>
                            {(canEdit || canForward) && <Th>{labels.actions}</Th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={canEdit || canForward ? 7 : 6} className="px-4 py-6 text-center text-sm font-medium text-slate-600">
                                    {labels.noIncomplete}
                                </td>
                            </tr>
                        )}

                        {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-sky-50/50">
                                <td className="px-4 py-3 font-semibold text-sky-900">{customer.code}</td>
                                <td className="px-4 py-3 text-slate-800">{customer.name_ar ?? customer.name}</td>
                                <td className="px-4 py-3 text-slate-700">{customer.mobile ?? customer.phone ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-700">{customer.sales_rep?.name ?? customer.salesRep?.name ?? '-'}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={customer.data_status ?? 'pending_review'} label={dataStatusLabel(customer.data_status, labels)} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex max-w-md flex-wrap gap-1.5">
                                        {(customer.missing_fields ?? []).map((field) => (
                                            <span key={field} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                {(canEdit || canForward) && (
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            {canEdit && (
                                                <button type="button" onClick={() => onEdit(customer)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                                    {labels.edit}
                                                </button>
                                            )}
                                            {canForward && (
                                                <button type="button" onClick={() => onNotify(customer)} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800">
                                                    {labels.notifyIncomplete}
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
    );
}

function Th({ children }) {
    return <th className="px-4 py-3 text-start font-semibold">{children}</th>;
}

function hasPortalAccount(customer) {
    const accounts = customer.portal_users ?? customer.portalUsers ?? [];

    return accounts.some((account) => account.login_enabled && account.status === 'active');
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

function dataStatusLabel(status, labels) {
    if (status === 'pending_admin') {
        return 'بانتظار تفعيل الأدمن';
    }

    if (status === 'pending_sales_manager') {
        return labels.pendingSalesManager ?? 'Pending Sales Manager';
    }

    if (status === 'rejected_sales_officer') {
        return labels.rejectedSalesOfficer ?? 'مرجعة من مسؤول المبيعات';
    }

    if (status === 'rejected_sales_manager') {
        return labels.rejectedSalesManager ?? 'مرجعة من مدير المبيعات';
    }

    if (status === 'pending_review' || status === 'pending_sales_officer') {
        return labels.pendingReview ?? 'Pending Sales Officer';
    }

    return labels.approvedData;
}

function approvalDetail(customer) {
    if (customer.data_status === 'pending_sales_manager') {
        return customer.sales_officer_approver?.name ?? customer.salesOfficerApprover?.name ?? null;
    }

    if (customer.data_status === 'approved') {
        return customer.sales_manager_approver?.name
            ?? customer.salesManagerApprover?.name
            ?? customer.data_reviewer?.name
            ?? customer.dataReviewer?.name
            ?? null;
    }

    return null;
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
