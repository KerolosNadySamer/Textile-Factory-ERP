import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, useForm } from '@inertiajs/react';

const labels = {
    ar: { title: 'إنشاء حساب', name: 'الاسم', email: 'البريد الإلكتروني', password: 'كلمة المرور', confirm: 'تأكيد كلمة المرور', hasAccount: 'لديك حساب بالفعل؟', submit: 'إنشاء حساب' },
    en: { title: 'Register', name: 'Name', email: 'Email', password: 'Password', confirm: 'Confirm Password', hasAccount: 'Already registered?', submit: 'Register' },
};

export default function Register() {
    const { text } = useLanguage(labels);
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', password: '', password_confirmation: '' });
    useEffect(() => () => reset('password', 'password_confirmation'), []);
    const submit = (e) => { e.preventDefault(); post(route('register')); };

    return (
        <GuestLayout>
            <Head title={text.title} />
            <form onSubmit={submit}>
                <div><InputLabel htmlFor="name" value={text.name} /><TextInput id="name" name="name" value={data.name} className="mt-1 block w-full" autoComplete="name" isFocused onChange={(e) => setData('name', e.target.value)} required /><InputError message={errors.name} className="mt-2" /></div>
                <div className="mt-4"><InputLabel htmlFor="email" value={text.email} /><TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="username" onChange={(e) => setData('email', e.target.value)} required /><InputError message={errors.email} className="mt-2" /></div>
                <div className="mt-4"><InputLabel htmlFor="password" value={text.password} /><TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" autoComplete="new-password" onChange={(e) => setData('password', e.target.value)} required /><InputError message={errors.password} className="mt-2" /></div>
                <div className="mt-4"><InputLabel htmlFor="password_confirmation" value={text.confirm} /><TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} className="mt-1 block w-full" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} required /><InputError message={errors.password_confirmation} className="mt-2" /></div>
                <div className="mt-4 flex items-center justify-end"><Link href={route('login')} className="rounded-md text-sm text-gray-600 underline hover:text-gray-900">{text.hasAccount}</Link><PrimaryButton className="ms-4" disabled={processing}>{text.submit}</PrimaryButton></div>
            </form>
        </GuestLayout>
    );
}
