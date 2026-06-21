import { useEffect, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

export default function Guest({ children }) {
    const { company = {} } = usePage().props;
    const [language, setLanguage] = useState(() => localStorage.getItem('erp-language') || 'ar');
    const [theme] = useState(() => localStorage.getItem('erp-theme') || 'day');
    const isRtl = language === 'ar';
    const companyName = isRtl
        ? (company.company_name_ar ?? 'شركة أسود للصباغة والتجهيز والنسيج')
        : (company.company_name_en ?? 'Aswad Dyeing, Finishing & Weaving Co.');

    useEffect(() => {
        localStorage.setItem('erp-language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        window.dispatchEvent(new CustomEvent('erp-language-change', { detail: language }));
    }, [language, isRtl]);

    return (
        <div className={`app-shell flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0 ${theme === 'night' ? 'theme-night' : 'theme-day'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <button type="button" onClick={() => setLanguage((current) => (current === 'ar' ? 'en' : 'ar'))} className="mb-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                {isRtl ? 'English' : 'العربية'}
            </button>
            <div className="text-center">
                <Link href="/"><ApplicationLogo className="h-20 w-20 fill-current text-gray-500" /></Link>
                <div className="mt-3 text-lg font-semibold text-slate-900">{companyName}</div>
            </div>
            <div className="mt-6 w-full overflow-hidden rounded-lg border bg-white px-6 py-4 shadow-md sm:max-w-md">{children}</div>
        </div>
    );
}
