import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import useLanguage from '@/lib/useLanguage';
import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

const labels = {
    ar: {
        title: 'بيانات الملف الشخصي',
        help: 'حدّث بيانات التواصل الخاصة بك.',
        photo: 'الصورة الشخصية',
        name: 'الاسم',
        nameAr: 'الاسم العربي',
        nameEn: 'الاسم الإنجليزي',
        email: 'البريد الإلكتروني',
        emailLocked: 'تغيير البريد الإلكتروني يتم من خلال إدارة النظام.',
        phone: 'الهاتف',
        save: 'حفظ',
        saved: 'تم الحفظ.',
    },
    en: {
        title: 'Profile Information',
        help: 'Update your contact information.',
        photo: 'Profile Photo',
        name: 'Name',
        nameAr: 'Arabic Name',
        nameEn: 'English Name',
        email: 'Email',
        emailLocked: 'Email changes are managed by system administration.',
        phone: 'Phone',
        save: 'Save',
        saved: 'Saved.',
    },
};

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;
    const { text } = useLanguage(labels);
    const displayName = user.name_ar ?? user.name ?? user.name_en ?? '';
    const { data, setData, post, transform, errors, processing, recentlySuccessful } = useForm({
        name_ar: user.name_ar ?? user.name ?? '',
        name_en: user.name_en ?? '',
        email: user.email,
        phone: user.phone ?? '',
        profile_photo: null,
    });

    const submit = (e) => {
        e.preventDefault();
        transform((currentData) => ({ ...currentData, _method: 'patch' }));
        post(route('profile.update'), { forceFormData: true, preserveScroll: true, onFinish: () => transform((currentData) => currentData) });
    };

    return (
        <section className={className}>
            <header><h2 className="text-lg font-medium text-gray-900">{text.title}</h2><p className="mt-1 text-sm text-gray-600">{text.help}</p></header>
            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel value={text.photo} />
                    <div className="mt-2 flex items-center gap-4">
                        {user.profile_photo_url ? <img src={user.profile_photo_url} alt={displayName} className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-white">{displayName?.charAt(0)?.toUpperCase()}</div>}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setData('profile_photo', e.target.files[0] ?? null)} className="block text-sm" />
                    </div>
                    <InputError className="mt-2" message={errors.profile_photo} />
                </div>
                <div><InputLabel htmlFor="name_ar" value={text.nameAr} /><TextInput id="name_ar" className="mt-1 block w-full" value={data.name_ar} onChange={(e) => setData('name_ar', e.target.value)} required isFocused autoComplete="name" /><InputError className="mt-2" message={errors.name_ar} /></div>
                <div><InputLabel htmlFor="name_en" value={text.nameEn} /><TextInput id="name_en" className="mt-1 block w-full text-left" value={data.name_en} onChange={(e) => setData('name_en', e.target.value)} dir="ltr" autoComplete="name" /><InputError className="mt-2" message={errors.name_en} /></div>
                <div><InputLabel htmlFor="email" value={text.email} /><TextInput id="email" type="email" className="mt-1 block w-full" value={user.email ?? ''} disabled autoComplete="username" /><p className="mt-1 text-sm text-gray-500">{text.emailLocked}</p></div>
                <div><InputLabel htmlFor="phone" value={text.phone} /><TextInput id="phone" type="tel" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} autoComplete="tel" /><InputError className="mt-2" message={errors.phone} /></div>
                <div className="flex items-center gap-4"><PrimaryButton disabled={processing}>{text.save}</PrimaryButton><Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0"><p className="text-sm text-gray-600">{text.saved}</p></Transition></div>
            </form>
        </section>
    );
}
