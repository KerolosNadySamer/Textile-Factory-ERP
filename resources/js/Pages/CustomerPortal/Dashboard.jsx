import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ApprovalBadge, StatusBadge, VerificationBadge } from '@/Components/CustomerTrustBadges';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const statuses = {
    draft: 'مسودة',
    sales_officer_review: 'مراجعة المبيعات والدفع',
    submitted: 'اعتماد مدير المبيعات',
    planning_review: 'اعتماد المدير العام',
    approved: 'تم الاعتماد وجاهزة للتخطيط',
    in_production: 'بدأ التشغيل والإنتاج',
    completed: 'تم الإنتاج',
    delivered: 'تم التسليم',
    closed: 'مغلقة',
    rejected: 'مرفوضة',
    cancelled: 'ملغية',
};

const paymentMethods = {
    vodafone_cash: 'فودافون كاش',
    orange_cash: 'أورنج كاش',
    etisalat_cash: 'اتصالات كاش',
    bank_transfer: 'تحويل بنكي',
};

export default function CustomerPortalDashboard({ auth, flash, customer, canViewFinancials = false, orders = [], purchases = [], products = [], payments = [], messages = [], statement = [], totals = {} }) {
    const canCreateOrder = customer?.active && customer?.data_status === 'approved' && !customer?.archived_at;
    const [items, setItems] = useState([emptyItem(products[0])]);
    const orderForm = useForm({
        required_delivery_date: '',
        priority: 'normal',
        notes: '',
        payment_method: 'vodafone_cash',
        payment_reference: '',
        payment_proof: null,
        items,
    });
    const profileForm = useForm({
        name_ar: customer.name_ar ?? customer.name ?? '',
        name_en: customer.name_en ?? '',
        mobile: customer.mobile ?? '',
        phone: customer.phone ?? '',
        national_id: customer.national_id ?? '',
        national_id_image: null,
        city: customer.city ?? '',
        address: customer.address ?? '',
        tax_number: customer.tax_number ?? '',
        commercial_register: customer.commercial_register ?? '',
    });
    const walletForm = useForm({ amount: '', method: 'vodafone_cash', reference_number: '', proof: null, notes: '' });
    const messageForm = useForm({ sales_order_id: '', message: '' });

    const total = useMemo(() => items.reduce((sum, item) => {
        const product = products.find((current) => String(current.id) === String(item.product_id));
        return sum + (Number(item.quantity) || 0) * (Number(product?.price) || 0);
    }, 0), [items, products]);

    const downPayment = Math.round(total * 50) / 100;

    const updateItem = (index, field, value) => {
        const next = items.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item);
        setItems(next);
        orderForm.setData('items', next);
    };

    const submitOrder = (event) => {
        event.preventDefault();
        orderForm.post(route('customer-portal.orders.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                const next = [emptyItem(products[0])];
                setItems(next);
                orderForm.setData({
                    required_delivery_date: '',
                    priority: 'normal',
                    notes: '',
                    payment_method: 'vodafone_cash',
                    payment_reference: '',
                    payment_proof: null,
                    items: next,
                });
            },
        });
    };

    const submitProfile = (event) => {
        event.preventDefault();
        profileForm.post(route('customer-portal.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => profileForm.reset('national_id_image'),
        });
    };

    const submitWallet = (event) => {
        event.preventDefault();
        walletForm.post(route('customer-portal.wallet-payments.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => walletForm.reset('amount', 'reference_number', 'proof', 'notes'),
        });
    };

    const submitMessage = (event) => {
        event.preventDefault();
        messageForm.post(route('customer-portal.messages.store'), {
            preserveScroll: true,
            onSuccess: () => messageForm.reset('message'),
        });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold text-slate-900">بوابة العميل</h2>}>
            <Head title="بوابة العميل" />
            <div className="py-8" dir="rtl">
                <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:px-8">
                    {flash?.success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{flash.success}</div>}

                    <section className="erp-panel p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-950">{customer.name_ar ?? customer.name}</h3>
                                    <VerificationBadge tier={customer.verification_tier} />
                                </div>
                                <p className="mt-1 text-sm text-slate-600">
                                    كود العميل: {customer.code} · المندوب: {customer.sales_rep?.name ?? 'لم يتم تعيين مندوب بعد'}
                                </p>
                            </div>
                            <ApprovalBadge approved={customer.data_status === 'approved'} archived={customer.archived_at} />
                        </div>
                        {!canCreateOrder && (
                            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                                الحساب مفتوح لقائمة الأسعار والمتابعة، لكن إنشاء الطلبات ينتظر استكمال البيانات ومراجعتها واعتمادها من المبيعات. لو الحساب مؤرشف يجب تحديث البيانات أولا.
                            </div>
                        )}
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="grid gap-5">
                            {!canCreateOrder && <ProfileForm form={profileForm} submit={submitProfile} customer={customer} />}
                            <OrderForm canCreateOrder={canCreateOrder} products={products} items={items} updateItem={updateItem} setItems={setItems} orderForm={orderForm} submitOrder={submitOrder} total={total} downPayment={downPayment} />
                            <OrdersList orders={orders} />
                            <PurchasesList purchases={purchases} canViewFinancials={canViewFinancials} />
                        </div>

                        <div className="grid gap-5">
                            <PriceList products={products} />
                            <Wallet form={walletForm} submit={submitWallet} payments={payments} canViewFinancials={canViewFinancials} />
                            <Statement statement={statement} totals={totals} canViewFinancials={canViewFinancials} />
                            <Chat orders={orders} messages={messages} form={messageForm} submit={submitMessage} />
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ProfileForm({ form, submit, customer }) {
    return (
        <form onSubmit={submit} className="erp-panel p-5">
            <h3 className="text-lg font-black text-slate-950">استكمال بيانات العميل</h3>
            <p className="mt-1 text-sm text-slate-600">هذه البيانات تراجعها المبيعات مع صورة الرقم القومي قبل فتح الطلبات.</p>
            {customer.national_id_image_url && <a href={customer.national_id_image_url} target="_blank" className="mt-2 inline-block text-xs font-bold text-sky-700">عرض صورة الرقم القومي الحالية</a>}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Field label="الاسم عربي" error={form.errors.name_ar}><input value={form.data.name_ar} onChange={(event) => form.setData('name_ar', event.target.value)} className="form-input w-full" required /></Field>
                <Field label="الاسم إنجليزي" error={form.errors.name_en}><input value={form.data.name_en} onChange={(event) => form.setData('name_en', event.target.value)} className="form-input w-full" dir="ltr" /></Field>
                <Field label="الموبايل" error={form.errors.mobile}><input value={form.data.mobile} onChange={(event) => form.setData('mobile', event.target.value)} className="form-input w-full" required /></Field>
                <Field label="الهاتف" error={form.errors.phone}><input value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="form-input w-full" /></Field>
                <Field label="الرقم القومي" error={form.errors.national_id}><input value={form.data.national_id} onChange={(event) => form.setData('national_id', event.target.value)} className="form-input w-full" required /></Field>
                <Field label="صورة البطاقة" error={form.errors.national_id_image}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => form.setData('national_id_image', event.target.files[0] ?? null)} className="block w-full text-sm" required={!customer.national_id_image_url} /></Field>
                <Field label="المدينة" error={form.errors.city}><input value={form.data.city} onChange={(event) => form.setData('city', event.target.value)} className="form-input w-full" required /></Field>
                <Field label="الرقم الضريبي" error={form.errors.tax_number}><input value={form.data.tax_number} onChange={(event) => form.setData('tax_number', event.target.value)} className="form-input w-full" /></Field>
                <Field label="السجل التجاري" error={form.errors.commercial_register}><input value={form.data.commercial_register} onChange={(event) => form.setData('commercial_register', event.target.value)} className="form-input w-full" /></Field>
            </div>
            <Field label="العنوان" error={form.errors.address}><textarea value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} className="form-input mt-3 min-h-[80px] w-full" required /></Field>
            <button disabled={form.processing} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">إرسال البيانات للمراجعة</button>
        </form>
    );
}

function OrderForm({ canCreateOrder, products, items, updateItem, setItems, orderForm, submitOrder, total, downPayment }) {
    const addItem = () => {
        const next = [...items, emptyItem(products[0])];
        setItems(next);
        orderForm.setData('items', next);
    };

    const removeItem = (index) => {
        const next = items.filter((_, itemIndex) => itemIndex !== index);
        const safeNext = next.length ? next : [emptyItem(products[0])];
        setItems(safeNext);
        orderForm.setData('items', safeNext);
    };

    return (
        <form onSubmit={submitOrder} className="erp-panel p-5">
            <h3 className="text-lg font-black text-slate-950">طلبية جديدة</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Field label="تاريخ التسليم المطلوب" error={orderForm.errors.required_delivery_date}><input type="date" value={orderForm.data.required_delivery_date} onChange={(event) => orderForm.setData('required_delivery_date', event.target.value)} className="form-input w-full" disabled={!canCreateOrder} /></Field>
                <Field label="الأولوية" error={orderForm.errors.priority}><select value={orderForm.data.priority} onChange={(event) => orderForm.setData('priority', event.target.value)} className="form-input w-full" disabled={!canCreateOrder}><option value="normal">عادي</option><option value="urgent">عاجل</option><option value="very_urgent">عاجل جدا</option></select></Field>
                <Field label="وسيلة الدفع" error={orderForm.errors.payment_method}><select value={orderForm.data.payment_method} onChange={(event) => orderForm.setData('payment_method', event.target.value)} className="form-input w-full" disabled={!canCreateOrder}>{Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            </div>

            <div className="mt-4 grid gap-3">
                {items.map((item, index) => {
                    const product = products.find((current) => String(current.id) === String(item.product_id));

                    return (
                        <div key={index} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_130px_120px_120px_auto] md:items-end">
                            <Field label="الصنف" error={orderForm.errors[`items.${index}.product_id`]}><select value={item.product_id} onChange={(event) => updateItem(index, 'product_id', event.target.value)} className="form-input w-full" disabled={!canCreateOrder}>{products.map((current) => <option key={current.id} value={current.id}>{current.code} - {current.name}</option>)}</select></Field>
                            <Field label="اللون" error={orderForm.errors[`items.${index}.color`]}><input value={item.color} onChange={(event) => updateItem(index, 'color', event.target.value)} className="form-input w-full" required disabled={!canCreateOrder} /></Field>
                            <Field label="الكمية" error={orderForm.errors[`items.${index}.quantity`]}><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} className="form-input w-full" required disabled={!canCreateOrder} /></Field>
                            <Field label="السعر"><input value={product?.price ?? '0.00'} className="form-input w-full bg-slate-50 font-bold" disabled /></Field>
                            <button type="button" onClick={() => removeItem(index)} className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800" disabled={!canCreateOrder}>حذف</button>
                        </div>
                    );
                })}
            </div>

            <button type="button" onClick={addItem} className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700" disabled={!canCreateOrder}>إضافة صنف</button>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Field label="رقم التحويل/المرجع" error={orderForm.errors.payment_reference}><input value={orderForm.data.payment_reference} onChange={(event) => orderForm.setData('payment_reference', event.target.value)} className="form-input w-full" disabled={!canCreateOrder} /></Field>
                <Field label="صورة التحويل" error={orderForm.errors.payment_proof}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => orderForm.setData('payment_proof', event.target.files[0] ?? null)} className="block w-full text-sm" disabled={!canCreateOrder} required /></Field>
                <div className="rounded-md bg-slate-900 px-4 py-3 text-white"><div className="text-xs font-bold opacity-80">إجمالي الطلبية</div><div className="text-xl font-black">{money(total)}</div><div className="mt-1 text-xs">المقدم المطلوب 50%: {money(downPayment)}</div></div>
            </div>

            <Field label="ملاحظات" error={orderForm.errors.notes}><textarea value={orderForm.data.notes} onChange={(event) => orderForm.setData('notes', event.target.value)} className="form-input mt-3 min-h-[80px] w-full" disabled={!canCreateOrder} /></Field>
            <button disabled={!canCreateOrder || orderForm.processing} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">إرسال الطلبية للمبيعات</button>
        </form>
    );
}

function Wallet({ form, submit, payments, canViewFinancials }) {
    return (
        <section className="erp-panel p-5">
            <h3 className="text-base font-black text-slate-950">شحن محفظة العميل</h3>
            {!canViewFinancials && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                    شحن المحفظة يظهر بعد اعتماد بيانات الحساب من المبيعات.
                </div>
            )}
            <form onSubmit={submit} className="mt-3 grid gap-3">
                <Field label="المبلغ" error={form.errors.amount}><input type="number" min="1" step="0.01" value={form.data.amount} onChange={(event) => form.setData('amount', event.target.value)} className="form-input w-full" required disabled={!canViewFinancials} /></Field>
                <Field label="وسيلة الدفع" error={form.errors.method}><select value={form.data.method} onChange={(event) => form.setData('method', event.target.value)} className="form-input w-full" disabled={!canViewFinancials}>{Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                <Field label="رقم المرجع" error={form.errors.reference_number}><input value={form.data.reference_number} onChange={(event) => form.setData('reference_number', event.target.value)} className="form-input w-full" disabled={!canViewFinancials} /></Field>
                <Field label="صورة الدفع" error={form.errors.proof}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => form.setData('proof', event.target.files[0] ?? null)} className="block w-full text-sm" required disabled={!canViewFinancials} /></Field>
                <button disabled={form.processing || !canViewFinancials} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">إرسال للمراجعة</button>
            </form>
            <div className="mt-3 max-h-[180px] space-y-2 overflow-auto">
                {payments.filter((payment) => payment.transaction_type === 'wallet_deposit').map((payment) => (
                    <div key={payment.id} className="rounded-md bg-slate-50 px-3 py-2 text-xs">
                        <div className="font-bold">{payment.payment_number} · {money(payment.amount)}</div>
                        <div className="mt-1 text-slate-600">{paymentMethods[payment.method] ?? payment.method} · {payment.status}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function OrdersList({ orders }) {
    return (
        <section className="erp-panel p-5">
            <h3 className="text-lg font-black text-slate-950">تتبع الطلبيات</h3>
            <div className="mt-4 grid gap-3">
                {orders.length === 0 && <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">لا توجد طلبيات بعد.</div>}
                {orders.map((order) => (
                    <article key={order.id} className="rounded-md border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="font-black text-slate-950">طلبية رقم {order.so_number}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                    <StatusBadge status={order.status} label={statuses[order.status] ?? order.status} compact />
                                    <span>الإجمالي {money(order.order_total)}</span>
                                </div>
                            </div>
                            <ApprovalBadge approved={['approved', 'in_production', 'completed', 'delivered', 'closed'].includes(order.status)} />
                        </div>
                        <Progress status={order.status} />
                        <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">{(order.timeline ?? []).map((item) => <div key={item.id} className="rounded-md bg-slate-50 px-3 py-2"><div className="font-bold text-slate-900">{item.event}</div><div className="mt-1 text-slate-600">{item.description}</div></div>)}</div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function PurchasesList({ purchases, canViewFinancials }) {
    return (
        <section className="erp-panel p-5">
            <h3 className="text-lg font-black text-slate-950">مسحوبات العميل</h3>
            <p className="mt-1 text-sm text-slate-600">الصنف واللون والكمية وسعر الشراء الفعلي، وتستخدمها المبيعات عند مراجعة مستوى الائتمان.</p>
            {!canViewFinancials && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                    المسحوبات لا تظهر إلا بعد اعتماد بيانات الحساب من المبيعات.
                </div>
            )}
            {canViewFinancials && purchases.length === 0 && (
                <div className="mt-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">لا توجد مسحوبات حتى الآن.</div>
            )}
            {canViewFinancials && purchases.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-3 py-2 text-start font-bold">الطلبية</th>
                                <th className="px-3 py-2 text-start font-bold">الصنف</th>
                                <th className="px-3 py-2 text-start font-bold">اللون</th>
                                <th className="px-3 py-2 text-start font-bold">الكمية</th>
                                <th className="px-3 py-2 text-start font-bold">سعر الشراء</th>
                                <th className="px-3 py-2 text-start font-bold">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {purchases.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-3 py-2 font-bold text-slate-900">{item.order_number}</td>
                                    <td className="px-3 py-2">{item.product_code ? `${item.product_code} - ` : ''}{item.product_name ?? '-'}</td>
                                    <td className="px-3 py-2">{item.color ?? '-'}</td>
                                    <td className="px-3 py-2">{money(item.quantity)}</td>
                                    <td className="px-3 py-2">{money(item.unit_price)}</td>
                                    <td className="px-3 py-2 font-bold">{money(item.total_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

function Progress({ status }) {
    const steps = ['sales_officer_review', 'submitted', 'planning_review', 'approved', 'in_production', 'completed', 'delivered'];
    const currentIndex = Math.max(steps.indexOf(status), 0);
    return <div className="mt-4 grid gap-2 md:grid-cols-4 xl:grid-cols-7">{steps.map((step, index) => <div key={step} className={`rounded-md border px-2 py-2 text-xs font-bold ${index <= currentIndex ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{statuses[step]}</div>)}</div>;
}

function PriceList({ products }) {
    return (
        <section className="erp-panel p-5">
            <h3 className="text-base font-black text-slate-950">قائمة الأسعار</h3>
            <div className="mt-3 max-h-[320px] overflow-auto rounded-md border border-slate-200">
                {products.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0"><div><div className="font-bold text-slate-900">{product.code} - {product.name}</div><div className="text-xs text-slate-500">{product.quality ?? '-'} · {product.unit ?? '-'}</div></div><div className="font-black text-slate-950">{money(product.price)}</div></div>)}
            </div>
        </section>
    );
}

function Statement({ statement, totals, canViewFinancials }) {
    return (
        <section className="erp-panel p-5">
            <h3 className="text-base font-black text-slate-950">كشف الحساب</h3>
            {!canViewFinancials && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                    كشف الحساب لا يظهر إلا بعد مراجعة واعتماد بيانات العميل من مسؤول المبيعات ثم مدير المبيعات.
                </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><Box label="مدين" value={money(totals.debit ?? 0)} /><Box label="مدفوع" value={money(totals.credit ?? 0)} /><Box label="الرصيد" value={money(totals.balance ?? 0)} /></div>
            <div className="mt-3 max-h-[260px] overflow-auto space-y-2">{statement.map((row, index) => <div key={index} className="rounded-md border border-slate-200 px-3 py-2 text-xs"><div className="font-bold">{row.number} · {row.type === 'order' ? 'طلبية' : row.type === 'wallet_deposit' ? 'شحن محفظة' : 'دفعة'}</div><div className="mt-1 text-slate-600">{row.date ?? '-'} · {row.status}</div><div className="mt-1">مدين {money(row.debit)} · دائن {money(row.credit)}</div></div>)}</div>
        </section>
    );
}

function Chat({ orders, messages, form, submit }) {
    return (
        <section className="erp-panel p-5">
            <h3 className="text-base font-black text-slate-950">محادثة المندوب</h3>
            <div className="mt-3 max-h-[260px] space-y-2 overflow-auto rounded-md bg-slate-50 p-3">{messages.length === 0 && <div className="text-sm text-slate-500">لا توجد رسائل بعد.</div>}{messages.map((message) => <div key={message.id} className="rounded-md bg-white px-3 py-2 text-sm shadow-sm"><div className="text-xs font-bold text-slate-500">{message.sender?.name ?? '-'}</div><div className="mt-1 text-slate-900">{message.message}</div></div>)}</div>
            <form onSubmit={submit} className="mt-3 grid gap-2"><select value={form.data.sales_order_id} onChange={(event) => form.setData('sales_order_id', event.target.value)} className="form-input text-sm"><option value="">رسالة عامة</option>{orders.map((order) => <option key={order.id} value={order.id}>طلبية {order.so_number}</option>)}</select><textarea value={form.data.message} onChange={(event) => form.setData('message', event.target.value)} className="form-input min-h-[80px] text-sm" placeholder="اكتب رسالتك للمندوب..." required /><button disabled={form.processing} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white">إرسال</button></form>
        </section>
    );
}

function Field({ label, error, children }) {
    return <label className="block text-sm font-bold text-slate-700">{label}<div className="mt-1">{children}</div>{error && <div className="mt-1 text-xs text-rose-600">{error}</div>}</label>;
}

function Box({ label, value }) {
    return <div className="rounded-md bg-slate-50 px-2 py-2"><div className="font-bold text-slate-500">{label}</div><div className="mt-1 font-black text-slate-950">{value}</div></div>;
}

function emptyItem(product) {
    return { product_id: product?.id ?? '', color: '', quantity: '1' };
}

function money(value) {
    return Number(value || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
