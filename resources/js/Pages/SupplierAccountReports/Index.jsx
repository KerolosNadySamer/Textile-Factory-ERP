import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge } from '@/Components/CustomerTrustBadges';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'كشف حساب الموردين',
        subtitle: 'اختر المورد لعرض أوامر الشراء كمديونية ومدفوعات المورد كمنصرف.',
        supplier: 'المورد',
        chooseSupplier: 'اختر المورد',
        show: 'عرض الكشف',
        debit: 'مشتريات / مستحق للمورد',
        credit: 'مدفوع للمورد',
        balance: 'الرصيد المستحق',
        paymentForm: 'تسجيل دفعة للمورد',
        purchaseOrder: 'أمر الشراء',
        withoutOrder: 'بدون أمر محدد',
        amount: 'القيمة',
        paymentDate: 'تاريخ الدفع',
        method: 'طريقة الدفع',
        cash: 'نقدي',
        check: 'شيك',
        checkNumber: 'رقم الشيك',
        checkDueDate: 'تاريخ استحقاق الشيك',
        notes: 'ملاحظات',
        savePayment: 'حفظ الدفعة',
        statement: 'كشف الحساب',
        date: 'التاريخ',
        type: 'النوع',
        number: 'رقم المستند',
        description: 'البيان',
        status: 'الحالة',
        purchase: 'شراء',
        payment: 'دفعة',
        paid: 'مدفوع',
        draft: 'مسودة',
        approved: 'معتمد',
        partially_received: 'استلام جزئي',
        received: 'تم الاستلام',
        closed: 'مغلق',
        empty: 'لا توجد حركات لهذا المورد.',
        saved: 'تم تسجيل دفعة المورد بنجاح.',
    },
    en: {
        title: 'Supplier Account Statement',
        subtitle: 'Choose a supplier to see purchase orders as payable and supplier payments as paid out.',
        supplier: 'Supplier',
        chooseSupplier: 'Choose supplier',
        show: 'Show Statement',
        debit: 'Purchases / Payable',
        credit: 'Paid to Supplier',
        balance: 'Outstanding Balance',
        paymentForm: 'Record Supplier Payment',
        purchaseOrder: 'Purchase Order',
        withoutOrder: 'No specific order',
        amount: 'Amount',
        paymentDate: 'Payment Date',
        method: 'Payment Method',
        cash: 'Cash',
        check: 'Check',
        checkNumber: 'Check No.',
        checkDueDate: 'Check Due Date',
        notes: 'Notes',
        savePayment: 'Save Payment',
        statement: 'Statement',
        date: 'Date',
        type: 'Type',
        number: 'Document No.',
        description: 'Description',
        status: 'Status',
        purchase: 'Purchase',
        payment: 'Payment',
        paid: 'Paid',
        draft: 'Draft',
        approved: 'Approved',
        partially_received: 'Partially Received',
        received: 'Received',
        closed: 'Closed',
        empty: 'No transactions for this supplier.',
        saved: 'Supplier payment recorded successfully.',
    },
};

export default function SupplierAccountReports({ auth, flash, suppliers = [], selectedSupplier = null, purchaseOrders = [], statement = [], filters = {}, totals = {} }) {
    const { isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canPay = permissions.includes('edit_finance');
    const [supplierId, setSupplierId] = useState(filters.supplier_id ?? selectedSupplier?.id ?? '');
    const paymentForm = useForm({
        supplier_id: filters.supplier_id ?? selectedSupplier?.id ?? '',
        purchase_order_id: '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        method: 'cash',
        check_number: '',
        check_due_date: '',
        notes: '',
    });

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(route('supplier-account-reports.index'), { supplier_id: supplierId }, { preserveState: true, preserveScroll: true });
    };

    const submitPayment = (event) => {
        event.preventDefault();
        paymentForm.setData('supplier_id', selectedSupplier?.id ?? supplierId);
        paymentForm.post(route('supplier-account-reports.payments.store'), {
            preserveScroll: true,
            onSuccess: () => paymentForm.reset('purchase_order_id', 'amount', 'check_number', 'check_due_date', 'notes'),
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[320px_auto]">
                                <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="form-input" required>
                                    <option value="">{text.chooseSupplier}</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>{supplier.code} - {supplier.name}</option>
                                    ))}
                                </select>
                                <button type="submit" className="erp-button">{text.show}</button>
                            </form>
                        </div>
                        {flash?.success && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{text.saved}</div>}
                    </section>

                    {selectedSupplier && (
                        <>
                            <section className="grid gap-3 md:grid-cols-3">
                                <Metric label={text.debit} value={formatMoney(totals.debit)} />
                                <Metric label={text.credit} value={formatMoney(totals.credit)} />
                                <Metric label={text.balance} value={formatMoney(totals.balance)} />
                            </section>

                            {canPay && (
                                <section className="erp-card">
                                    <h3 className="text-lg font-semibold text-slate-950">{text.paymentForm}</h3>
                                    <form onSubmit={submitPayment} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Field label={text.purchaseOrder} error={paymentForm.errors.purchase_order_id}>
                                            <select value={paymentForm.data.purchase_order_id} onChange={(event) => paymentForm.setData('purchase_order_id', event.target.value)} className="form-input">
                                                <option value="">{text.withoutOrder}</option>
                                                {purchaseOrders.map((order) => (
                                                    <option key={order.id} value={order.id}>{order.po_number} - {formatMoney(order.subtotal)}</option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field label={text.amount} error={paymentForm.errors.amount}>
                                            <input type="number" min="0.01" step="0.01" value={paymentForm.data.amount} onChange={(event) => paymentForm.setData('amount', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={text.paymentDate} error={paymentForm.errors.payment_date}>
                                            <input type="date" value={paymentForm.data.payment_date} onChange={(event) => paymentForm.setData('payment_date', event.target.value)} className="form-input" required />
                                        </Field>
                                        <Field label={text.method} error={paymentForm.errors.method}>
                                            <select value={paymentForm.data.method} onChange={(event) => paymentForm.setData('method', event.target.value)} className="form-input">
                                                <option value="cash">{text.cash}</option>
                                                <option value="check">{text.check}</option>
                                            </select>
                                        </Field>
                                        {paymentForm.data.method === 'check' && (
                                            <>
                                                <Field label={text.checkNumber} error={paymentForm.errors.check_number}>
                                                    <input value={paymentForm.data.check_number} onChange={(event) => paymentForm.setData('check_number', event.target.value)} className="form-input" required />
                                                </Field>
                                                <Field label={text.checkDueDate} error={paymentForm.errors.check_due_date}>
                                                    <input type="date" value={paymentForm.data.check_due_date} onChange={(event) => paymentForm.setData('check_due_date', event.target.value)} className="form-input" required />
                                                </Field>
                                            </>
                                        )}
                                        <div className="lg:col-span-2">
                                            <Field label={text.notes} error={paymentForm.errors.notes}>
                                                <input value={paymentForm.data.notes} onChange={(event) => paymentForm.setData('notes', event.target.value)} className="form-input" />
                                            </Field>
                                        </div>
                                        <div className="lg:col-span-4">
                                            <button type="submit" disabled={paymentForm.processing} className="erp-button">{text.savePayment}</button>
                                        </div>
                                    </form>
                                </section>
                            )}

                            <section className="erp-card">
                                <h3 className="text-lg font-semibold text-slate-950">{text.statement}: {selectedSupplier.name}</h3>
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                {[text.date, text.type, text.number, text.description, text.debit, text.credit, text.method, text.status].map((header) => <th key={header} className="px-4 py-3 text-start font-bold">{header}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {statement.length === 0 && <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                            {statement.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="px-4 py-3">{row.date ?? '-'}</td>
                                                    <td className="px-4 py-3">{text[row.type] ?? row.type}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-900">{row.number}</td>
                                                    <td className="px-4 py-3">{row.description}</td>
                                                    <td className="px-4 py-3">{row.debit ? formatMoney(row.debit) : '-'}</td>
                                                    <td className="px-4 py-3">{row.credit ? formatMoney(row.credit) : '-'}</td>
                                                    <td className="px-4 py-3">{row.method ? (text[row.method] ?? row.method) : '-'}</td>
                                                    <td className="px-4 py-3"><StatusBadge status={row.status} label={text[row.status] ?? row.status} compact /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
        </div>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            <span>{label}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </label>
    );
}

function formatMoney(value) {
    return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
