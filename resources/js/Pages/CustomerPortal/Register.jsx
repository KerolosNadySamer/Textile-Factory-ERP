import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function CustomerPortalRegister() {
    const { data, setData, post, processing, errors } = useForm({
        name_ar: '',
        name_en: '',
        mobile: '',
        email: '',
        city: '',
        address: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('customer-register.store'), { forceFormData: true });
    };

    return (
        <GuestLayout>
            <Head title="إنشاء حساب عميل" />
            <form onSubmit={submit} className="space-y-4" dir="rtl">
                <div className="text-center">
                    <h1 className="text-lg font-bold text-slate-900">إنشاء حساب عميل</h1>
                    <p className="mt-1 text-sm text-slate-600">
                        يمكنك الدخول بعد إنشاء الحساب مباشرة لمشاهدة قائمة الأسعار. قبل أول طلبية ستكمل بياناتك وترفع صورة البطاقة، ثم يتم اعتمادها من المبيعات.
                    </p>
                </div>

                <Field id="name_ar" label="اسم العميل عربي" error={errors.name_ar}>
                    <TextInput id="name_ar" value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="mt-1 block w-full" required autoFocus />
                </Field>

                <Field id="name_en" label="اسم العميل إنجليزي" error={errors.name_en}>
                    <TextInput id="name_en" value={data.name_en} onChange={(event) => setData('name_en', event.target.value)} className="mt-1 block w-full" dir="ltr" />
                </Field>

                <Field id="mobile" label="الموبايل" error={errors.mobile}>
                    <TextInput id="mobile" value={data.mobile} onChange={(event) => setData('mobile', event.target.value)} className="mt-1 block w-full" required />
                </Field>

                <Field id="email" label="البريد الإلكتروني" error={errors.email}>
                    <TextInput id="email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="mt-1 block w-full" required dir="ltr" />
                </Field>

                <Field id="city" label="المدينة" error={errors.city}>
                    <TextInput id="city" value={data.city} onChange={(event) => setData('city', event.target.value)} className="mt-1 block w-full" />
                </Field>

                <div>
                    <InputLabel htmlFor="address" value="العنوان" />
                    <textarea id="address" value={data.address} onChange={(event) => setData('address', event.target.value)} className="form-input mt-1 block min-h-[80px] w-full" />
                    <InputError message={errors.address} className="mt-2" />
                </div>

                <Field id="password" label="كلمة المرور" error={errors.password}>
                    <TextInput id="password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className="mt-1 block w-full" required />
                </Field>

                <Field id="password_confirmation" label="تأكيد كلمة المرور" error={errors.password_confirmation}>
                    <TextInput id="password_confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} className="mt-1 block w-full" required />
                </Field>

                <div className="flex items-center justify-between gap-3">
                    <Link href={route('login')} className="text-sm font-semibold text-slate-600 underline">تسجيل دخول</Link>
                    <PrimaryButton disabled={processing}>إنشاء حساب</PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

function Field({ id, label, error, children }) {
    return (
        <div>
            <InputLabel htmlFor={id} value={label} />
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}
