import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { Head, useForm } from '@inertiajs/react';

const labels = {
    ar: { title: 'تأكيد كلمة المرور', help: 'هذه منطقة آمنة. يرجى تأكيد كلمة المرور قبل المتابعة.', password: 'كلمة المرور', submit: 'تأكيد' },
    en: { title: 'Confirm Password', help: 'This is a secure area. Please confirm your password before continuing.', password: 'Password', submit: 'Confirm' },
};

export default function ConfirmPassword() {
    const { text } = useLanguage(labels);
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });
    useEffect(() => () => reset('password'), []);
    const submit = (e) => { e.preventDefault(); post(route('password.confirm')); };

    return (
        <GuestLayout>
            <Head title={text.title} />
            <div className="mb-4 text-sm text-gray-600">{text.help}</div>
            <form onSubmit={submit}>
                <div className="mt-4"><InputLabel htmlFor="password" value={text.password} /><TextInput id="password" type="password" name="password" value={data.password} className="mt-1 block w-full" isFocused onChange={(e) => setData('password', e.target.value)} /><InputError message={errors.password} className="mt-2" /></div>
                <div className="mt-4 flex items-center justify-end"><PrimaryButton className="ms-4" disabled={processing}>{text.submit}</PrimaryButton></div>
            </form>
        </GuestLayout>
    );
}
