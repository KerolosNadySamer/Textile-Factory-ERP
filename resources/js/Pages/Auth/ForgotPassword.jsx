import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { Head, useForm } from '@inertiajs/react';

const labels = {
    ar: { title: 'استرجاع كلمة المرور', help: 'أدخل البريد الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.', submit: 'إرسال رابط إعادة التعيين' },
    en: { title: 'Forgot Password', help: 'Enter your email and we will send you a password reset link.', submit: 'Send Reset Link' },
};

export default function ForgotPassword({ status }) {
    const { text } = useLanguage(labels);
    const { data, setData, post, processing, errors } = useForm({ email: '' });
    const submit = (e) => { e.preventDefault(); post(route('password.email')); };

    return <GuestLayout><Head title={text.title} /><div className="mb-4 text-sm text-gray-600">{text.help}</div>{status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}<form onSubmit={submit}><TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" isFocused onChange={(e) => setData('email', e.target.value)} /><InputError message={errors.email} className="mt-2" /><div className="mt-4 flex items-center justify-end"><PrimaryButton className="ms-4" disabled={processing}>{text.submit}</PrimaryButton></div></form></GuestLayout>;
}
