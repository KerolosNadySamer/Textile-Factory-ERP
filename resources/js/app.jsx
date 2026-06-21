import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Component } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);

        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        console.error(error);
    }

    render() {
        if (this.state.error) {
            return (
                <div dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900">
                    <div className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-white p-5 shadow-sm">
                        <h1 className="text-lg font-bold text-rose-700">حدث خطأ أثناء تحميل الشاشة</h1>
                        <p className="mt-2 text-sm text-slate-600">تم منع ظهور الشاشة البيضاء. برجاء تحديث الصفحة، ولو استمر الخطأ انسخ الرسالة التالية.</p>
                        <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white" dir="ltr">
                            {this.state.error?.message ?? String(this.state.error)}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppErrorBoundary>
                <App {...props} />
            </AppErrorBoundary>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
