import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ApprovalBadge, StatusBadge, VerificationBadge } from '@/Components/CustomerTrustBadges';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'كشف حساب العملاء',
        subtitle: 'اختر العميل لعرض الطلبيات كمسحوبات والمدفوعات كتحصيلات واردة.',
        customer: 'العميل',
        chooseCustomer: 'اختر العميل',
        search: 'عرض الكشف',
        debit: 'مسحوبات / طلبيات',
        credit: 'مدفوعات',
        balance: 'الرصيد',
        pendingPayments: 'وارد معلق',
        statement: 'كشف الحساب',
        pendingList: 'دفعات تحت الحساب بانتظار الحسابات',
        date: 'التاريخ',
        type: 'النوع',
        number: 'رقم المستند',
        description: 'البيان',
        method: 'طريقة الدفع',
        status: 'الحالة',
        actions: 'إجراءات',
        paymentDate: 'تاريخ الاستلام',
        checkNumber: 'رقم الشيك',
        bankName: 'اسم البنك',
        checkDueDate: 'تاريخ استحقاق الشيك',
        notes: 'ملاحظات',
        receive: 'تسجيل الوارد',
        cash: 'نقدي',
        check: 'شيك',
        payment: 'دفعة',
        withdrawal: 'طلبية',
        credit_usage: 'استخدام رصيد',
        customer_credit: 'رصيد عميل',
        pending_accounting: 'بانتظار الحسابات',
        received: 'تم الاستلام',
        empty: 'لا توجد حركات لهذا العميل.',
        noPending: 'لا توجد دفعات معلقة لهذا العميل.',
        saved: 'تم تسجيل الوارد بنجاح.',
    },
    en: {
        title: 'Customer Account Statement',
        subtitle: 'Choose a customer to see orders as withdrawals/debits and payments as receipts.',
        customer: 'Customer',
        chooseCustomer: 'Choose customer',
        search: 'Show Statement',
        debit: 'Withdrawals / Orders',
        credit: 'Payments',
        balance: 'Balance',
        pendingPayments: 'Pending Receipts',
        statement: 'Statement',
        pendingList: 'Down Payments Pending Accounting',
        date: 'Date',
        type: 'Type',
        number: 'Document No.',
        description: 'Description',
        method: 'Payment Method',
        status: 'Status',
        actions: 'Actions',
        paymentDate: 'Receipt Date',
        checkNumber: 'Check No.',
        bankName: 'Bank Name',
        checkDueDate: 'Check Due Date',
        notes: 'Notes',
        receive: 'Receive',
        cash: 'Cash',
        check: 'Check',
        payment: 'Payment',
        withdrawal: 'Order',
        credit_usage: 'Credit Used',
        customer_credit: 'Customer Credit',
        pending_accounting: 'Pending Accounting',
        received: 'Received',
        empty: 'No transactions for this customer.',
        noPending: 'No pending payments for this customer.',
        saved: 'Receipt recorded successfully.',
    },
};

export default function CustomerAccountReports({ auth, flash, customers = [], selectedCustomer = null, payments = [], statement = [], filters = {}, totals = {} }) {
    const { isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canReceive = permissions.includes('edit_finance');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? selectedCustomer?.id ?? '');
    const receiveForm = useForm({
        payment_date: new Date().toISOString().slice(0, 10),
        method: 'cash',
        check_number: '',
        bank_name: '',
        check_due_date: '',
        notes: '',
    });

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(route('customer-account-reports.index'), { customer_id: customerId }, { preserveState: true, preserveScroll: true });
    };

    const receivePayment = (payment) => {
        receiveForm.patch(route('customer-account-reports.payments.receive', payment.id), {
            preserveScroll: true,
            onSuccess: () => receiveForm.reset('check_number', 'bank_name', 'check_due_date', 'notes'),
        });
    };

    const pendingPayments = payments.filter((payment) => ['payment', 'wallet_deposit'].includes(payment.transaction_type) && payment.status === 'pending_accounting');

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
                                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="form-input" required>
                                    <option value="">{text.chooseCustomer}</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>{customer.code} - {customer.name_ar ?? customer.name}</option>
                                    ))}
                                </select>
                                <button type="submit" className="erp-button">{text.search}</button>
                            </form>
                        </div>
                        {flash?.success && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{text.saved}</div>}
                    </section>

                    {selectedCustomer && (
                        <>
                            <section className="erp-card">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="text-xs font-black text-slate-500">{text.customer}</div>
                                        <h3 className="mt-1 text-lg font-black text-slate-950">{selectedCustomer.code} - {selectedCustomer.name_ar ?? selectedCustomer.name}</h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ApprovalBadge approved={selectedCustomer.data_status === 'approved'} archived={selectedCustomer.archived_at} />
                                        <VerificationBadge tier={selectedCustomer.verification_tier} showEmpty />
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-3 md:grid-cols-4">
                                <Metric label={text.debit} value={formatMoney(totals.debit)} />
                                <Metric label={text.credit} value={formatMoney(totals.credit)} />
                                <Metric label={text.balance} value={formatMoney(totals.balance)} />
                                <Metric label={text.pendingPayments} value={formatMoney(totals.pendingPayments)} />
                            </section>

                            <section className="erp-card">
                                <h3 className="text-lg font-semibold text-slate-950">{text.pendingList}</h3>
                                <div className="mt-4 space-y-3">
                                    {pendingPayments.length === 0 && <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{text.noPending}</div>}
                                    {pendingPayments.map((payment) => (
                                        <div key={payment.id} className="rounded-md border border-slate-200 p-4">
                                            <div className="grid gap-3 md:grid-cols-5">
                                                <Info label={text.number} value={payment.payment_number} />
                                                <Info label={text.debit} value={payment.sales_order?.so_number ?? '-'} />
                                                <Info label={text.credit} value={formatMoney(payment.amount)} />
                                                <Info label={text.method} value={text[payment.method] ?? payment.method} />
                                                <Info label={text.status} value={<StatusBadge status={payment.status} label={text[payment.status] ?? payment.status} compact />} />
                                            </div>
                                            {payment.proof_url && (
                                                <a href={payment.proof_url} target="_blank" className="mt-3 inline-flex rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800">
                                                    فتح صورة التحويل
                                                </a>
                                            )}
                                            {canReceive && (
                                                <div className="mt-4 grid gap-3 md:grid-cols-5">
                                                    <Field label={text.paymentDate} error={receiveForm.errors.payment_date}>
                                                        <input type="date" value={receiveForm.data.payment_date} onChange={(event) => receiveForm.setData('payment_date', event.target.value)} className="form-input" />
                                                    </Field>
                                                    <Field label={text.method} error={receiveForm.errors.method}>
                                                        <select value={receiveForm.data.method} onChange={(event) => receiveForm.setData('method', event.target.value)} className="form-input">
                                                            <option value="cash">{text.cash}</option>
                                                            <option value="check">{text.check}</option>
                                                            <option value="vodafone_cash">فودافون كاش</option>
                                                            <option value="orange_cash">أورنج كاش</option>
                                                            <option value="etisalat_cash">اتصالات كاش</option>
                                                            <option value="bank_transfer">تحويل بنكي</option>
                                                        </select>
                                                    </Field>
                                                    {receiveForm.data.method === 'check' && (
                                                        <>
                                                            <Field label={text.checkNumber} error={receiveForm.errors.check_number}>
                                                                <input value={receiveForm.data.check_number} onChange={(event) => receiveForm.setData('check_number', event.target.value)} className="form-input" />
                                                            </Field>
                                                            <Field label={text.bankName} error={receiveForm.errors.bank_name}>
                                                                <input value={receiveForm.data.bank_name} onChange={(event) => receiveForm.setData('bank_name', event.target.value)} className="form-input" />
                                                            </Field>
                                                            <Field label={text.checkDueDate} error={receiveForm.errors.check_due_date}>
                                                                <input type="date" value={receiveForm.data.check_due_date} onChange={(event) => receiveForm.setData('check_due_date', event.target.value)} className="form-input" />
                                                            </Field>
                                                        </>
                                                    )}
                                                    <div className="flex items-end">
                                                        <button type="button" onClick={() => receivePayment(payment)} disabled={receiveForm.processing} className="erp-button">{text.receive}</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="erp-card">
                                <h3 className="text-lg font-semibold text-slate-950">{text.statement}: {selectedCustomer.name_ar ?? selectedCustomer.name}</h3>
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

function Info({ label, value }) {
    return (
        <div className="rounded-md bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
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
