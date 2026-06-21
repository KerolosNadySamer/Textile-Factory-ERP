import { useEffect, useMemo, useState } from 'react';

export default function useLanguage(labels = {}) {
    const getStoredLanguage = () => {
        if (typeof window === 'undefined') {
            return 'ar';
        }

        return localStorage.getItem('erp-language') || 'ar';
    };

    const [language, setLanguage] = useState(getStoredLanguage);

    useEffect(() => {
        const updateLanguage = () => setLanguage(getStoredLanguage());

        window.addEventListener('erp-language-change', updateLanguage);
        window.addEventListener('storage', updateLanguage);

        return () => {
            window.removeEventListener('erp-language-change', updateLanguage);
            window.removeEventListener('storage', updateLanguage);
        };
    }, []);

    const text = useMemo(() => labels[language] ?? labels.ar ?? labels.en ?? {}, [labels, language]);

    return {
        language,
        isRtl: language === 'ar',
        text,
    };
}
