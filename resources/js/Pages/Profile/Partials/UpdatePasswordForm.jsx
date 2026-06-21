import { useRef } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

const labels = {
    ar: {
        title: 'طلب تغيير كلمة المرور',
        help: 'لا يتم تغيير كلمة المرور مباشرة. يتم إرسال الطلب لمسؤول القسم ثم مدير القسم قبل التنفيذ.',
        password: 'كلمة المرور الجديدة المطلوبة',
        confirm: 'تأكيد كلمة المرور الجديدة',
        reason: 'سبب الطلب',
        submit: 'إرسال طلب الاعتماد',
        sent: 'تم إرسال الطلب.',
    },
    en: {
        title: 'Password Change Request',
        help: 'Password is not changed directly. The request is sent to the department officer and manager before execution.',
        password: 'Requested New Password',
        confirm: 'Confirm New Password',
        reason: 'Request Reason',
        submit: 'Submit Approval Request',
        sent: 'Request sent.',
    },
};

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const { text } = useLanguage(labels);
    const { data, setData, errors, post, reset, processing, recentlySuccessful } = useForm({ password: '', password_confirmation: '', reason: '' });

    const submitRequest = (event) => {
        event.preventDefault();
        post(route('change-requests.password.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header><h2 className="text-lg font-medium text-gray-900">{text.title}</h2><p className="mt-1 text-sm text-gray-600">{text.help}</p></header>
            <form onSubmit={submitRequest} className="mt-6 space-y-6">
                <div><InputLabel htmlFor="password" value={text.password} /><TextInput id="password" ref={passwordInput} value={data.password} onChange={(event) => setData('password', event.target.value)} type="password" className="mt-1 block w-full" autoComplete="new-password" /><InputError message={errors.password} className="mt-2" /></div>
                <div><InputLabel htmlFor="password_confirmation" value={text.confirm} /><TextInput id="password_confirmation" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} type="password" className="mt-1 block w-full" autoComplete="new-password" /><InputError message={errors.password_confirmation} className="mt-2" /></div>
                <div><InputLabel htmlFor="reason" value={text.reason} /><textarea id="reason" value={data.reason} onChange={(event) => setData('reason', event.target.value)} className="form-input mt-1 block min-h-[90px] w-full" required /><InputError message={errors.reason} className="mt-2" /></div>
                <div className="flex items-center gap-4"><PrimaryButton disabled={processing}>{text.submit}</PrimaryButton><Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0"><p className="text-sm text-gray-600">{text.sent}</p></Transition></div>
            </form>
        </section>
    );
}
