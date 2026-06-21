import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, useForm } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'تسجيل دخول',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        remember: 'تذكرني',
        submit: 'تسجيل دخول',
        createCustomerAccount: 'إنشاء حساب عميل',
    },
    en: {
        title: 'Login',
        email: 'Email',
        password: 'Password',
        remember: 'Remember me',
        submit: 'Login',
        createCustomerAccount: 'Create Customer Account',
    },
};

export default function Login({ status }) {
    const { text } = useLanguage(labels);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => () => reset('password'), []);

    const submit = (event) => {
        event.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title={text.title} />
            <h1 className="mb-5 text-center text-lg font-black text-slate-950">{text.title}</h1>
            {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value={text.email} />
                    <TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="username" isFocused onChange={(event) => setData('email', event.target.value)} />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value={text.password} />
                    <TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" autoComplete="current-password" onChange={(event) => setData('password', event.target.value)} />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox name="remember" checked={data.remember} onChange={(event) => setData('remember', event.target.checked)} />
                        <span className="ms-2 text-sm text-gray-600">{text.remember}</span>
                    </label>
                </div>

                <div className="mt-5 grid gap-3">
                    <PrimaryButton className="justify-center" disabled={processing}>{text.submit}</PrimaryButton>
                    <Link href={route('customer-register')} className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-center text-sm font-black text-sky-800 hover:bg-sky-100">
                        {text.createCustomerAccount}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
