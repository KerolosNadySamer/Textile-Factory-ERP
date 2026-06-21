import GuestLayout from '@/Layouts/GuestLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, useForm } from '@inertiajs/react';

const labels = {
    ar: { title: 'تأكيد البريد الإلكتروني', help: 'شكرًا لتسجيلك. يرجى تأكيد بريدك الإلكتروني من خلال الرابط الذي أرسلناه لك. إذا لم يصلك الرابط يمكننا إرساله مرة أخرى.', sent: 'تم إرسال رابط تأكيد جديد إلى البريد الإلكتروني المسجل.', resend: 'إعادة إرسال رابط التأكيد', logout: 'تسجيل الخروج' },
    en: { title: 'Verify Email', help: 'Thanks for signing up. Please verify your email using the link we sent. If you did not receive it, we can send another one.', sent: 'A new verification link has been sent to the registered email.', resend: 'Resend Verification Link', logout: 'Log Out' },
};

export default function VerifyEmail({ status }) {
    const { text } = useLanguage(labels);
    const { post, processing } = useForm({});
    const submit = (e) => { e.preventDefault(); post(route('verification.send')); };

    return (
        <GuestLayout>
            <Head title={text.title} />
            <div className="mb-4 text-sm text-gray-600">{text.help}</div>
            {status === 'verification-link-sent' && <div className="mb-4 text-sm font-medium text-green-600">{text.sent}</div>}
            <form onSubmit={submit}><div className="mt-4 flex items-center justify-between"><PrimaryButton disabled={processing}>{text.resend}</PrimaryButton><Link href={route('logout')} method="post" as="button" className="rounded-md text-sm text-gray-600 underline hover:text-gray-900">{text.logout}</Link></div></form>
        </GuestLayout>
    );
}
