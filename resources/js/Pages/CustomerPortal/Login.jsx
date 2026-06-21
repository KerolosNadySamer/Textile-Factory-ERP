import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function CustomerLogin({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        login_context: 'customer',
    });

    useEffect(() => () => reset('password'), []);

    const submit = (event) => {
        event.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="دخول العملاء" />
            <div className="mb-5 text-center" dir="rtl">
                <h1 className="text-lg font-black text-slate-950">دخول العملاء</h1>
                <p className="mt-1 text-sm font-semibold text-slate-600">هذه الشاشة مخصصة لحسابات العملاء ومتابعة الطلبيات.</p>
            </div>
            {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

            <form onSubmit={submit} dir="rtl">
                <input type="hidden" name="login_context" value={data.login_context} />
                <div>
                    <InputLabel htmlFor="email" value="البريد الإلكتروني" />
                    <TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="username" isFocused onChange={(event) => setData('email', event.target.value)} />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="كلمة المرور" />
                    <TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" autoComplete="current-password" onChange={(event) => setData('password', event.target.value)} />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox name="remember" checked={data.remember} onChange={(event) => setData('remember', event.target.checked)} />
                        <span className="ms-2 text-sm text-gray-600">تذكرني</span>
                    </label>
                </div>

                <div className="mt-5 grid gap-3">
                    <PrimaryButton className="justify-center" disabled={processing}>دخول بوابة العميل</PrimaryButton>
                    <Link href={route('customer-register')} className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-center text-sm font-black text-sky-800 hover:bg-sky-100">
                        إنشاء حساب عميل جديد
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
