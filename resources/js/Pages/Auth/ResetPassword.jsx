import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { Head, useForm } from '@inertiajs/react';

const labels = {
    ar: { title: 'إعادة تعيين كلمة المرور', email: 'البريد الإلكتروني', password: 'كلمة المرور', confirm: 'تأكيد كلمة المرور', submit: 'إعادة تعيين كلمة المرور' },
    en: { title: 'Reset Password', email: 'Email', password: 'Password', confirm: 'Confirm Password', submit: 'Reset Password' },
};

export default function ResetPassword({ token, email }) {
    const { text } = useLanguage(labels);
    const { data, setData, post, processing, errors, reset } = useForm({ token, email, password: '', password_confirmation: '' });
    useEffect(() => () => reset('password', 'password_confirmation'), []);
    const submit = (e) => { e.preventDefault(); post(route('password.store')); };

    return (
        <GuestLayout>
            <Head title={text.title} />
            <form onSubmit={submit}>
                <div><InputLabel htmlFor="email" value={text.email} /><TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="username" onChange={(e) => setData('email', e.target.value)} /><InputError message={errors.email} className="mt-2" /></div>
                <div className="mt-4"><InputLabel htmlFor="password" value={text.password} /><TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" autoComplete="new-password" isFocused onChange={(e) => setData('password', e.target.value)} /><InputError message={errors.password} className="mt-2" /></div>
                <div className="mt-4"><InputLabel htmlFor="password_confirmation" value={text.confirm} /><TextInput type="password" name="password_confirmation" value={data.password_confirmation} className="mt-1 block w-full" autoComplete="new-password" onChange={(e) => setData('password_confirmation', e.target.value)} /><InputError message={errors.password_confirmation} className="mt-2" /></div>
                <div className="mt-4 flex items-center justify-end"><PrimaryButton className="ms-4" disabled={processing}>{text.submit}</PrimaryButton></div>
            </form>
        </GuestLayout>
    );
}
