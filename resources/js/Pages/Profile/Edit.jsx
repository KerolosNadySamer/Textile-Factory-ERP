import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';

const labels = {
    ar: { title: 'الملف الشخصي' },
    en: { title: 'Profile' },
};

export default function Edit({ auth, mustVerifyEmail, status }) {
    const { isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-12" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="erp-card"><UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} className="max-w-xl" /></div>
                    <div className="erp-card"><UpdatePasswordForm className="max-w-xl" /></div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
