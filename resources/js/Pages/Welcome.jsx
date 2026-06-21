import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'نظام إدارة المصنع',
        heading: 'نظام إدارة مصنع النسيج',
        subtitle: 'إدارة المبيعات، الإنتاج، المخزون، الجودة، والتكاليف من مكان واحد.',
        dashboard: 'فتح لوحة التحكم',
        login: 'تسجيل دخول',
        createCustomerAccount: 'إنشاء حساب عميل',
        language: 'English',
    },
    en: {
        title: 'Factory Management System',
        heading: 'Textile Factory ERP',
        subtitle: 'Manage sales, production, inventory, quality, and costing from one place.',
        dashboard: 'Open Dashboard',
        login: 'Login',
        createCustomerAccount: 'Create Customer Account',
        language: 'العربية',
    },
};

export default function Welcome({ auth }) {
    const [language, setLanguage] = useState(() => localStorage.getItem('erp-language') || 'ar');
    const [theme] = useState(() => localStorage.getItem('erp-theme') || 'day');
    const text = labels[language] ?? labels.ar;
    const isRtl = language === 'ar';

    useEffect(() => {
        localStorage.setItem('erp-language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        window.dispatchEvent(new CustomEvent('erp-language-change', { detail: language }));
    }, [language, isRtl]);

    return (
        <>
            <Head title={text.title} />
            <main className={`app-shell min-h-screen ${theme === 'night' ? 'theme-night' : 'theme-day'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
                    <div className="rounded-lg border bg-white p-8 shadow-sm">
                        <div className="mb-6 flex justify-end">
                            <button type="button" onClick={() => setLanguage((current) => (current === 'ar' ? 'en' : 'ar'))} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                                {text.language}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-900 text-lg font-bold text-white">ERP</div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-950">{text.heading}</h1>
                                <p className="mt-1 text-sm text-slate-600">{text.subtitle}</p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white">{text.dashboard}</Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white">{text.login}</Link>
                                    <Link href={route('customer-register')} className="rounded-md border border-sky-300 bg-sky-50 px-5 py-2 text-sm font-black text-sky-800">{text.createCustomerAccount}</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
