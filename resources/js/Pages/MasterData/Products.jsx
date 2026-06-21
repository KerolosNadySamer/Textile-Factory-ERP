import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'الأصناف',
        system: 'نظام أكواد الأصناف',
        add: 'إضافة صنف',
        code: 'الكود',
        name: 'الاسم',
        type: 'النوع',
        quality: 'الجودة',
        unit: 'الوحدة',
        price: 'السعر',
        sampleName: 'قماش خام تجريبي',
        raw: 'خام',
        first: 'أول',
        meter: 'متر',
    },
    en: {
        title: 'Products',
        system: 'Product Code System',
        add: 'Add Product',
        code: 'Code',
        name: 'Name',
        type: 'Type',
        quality: 'Quality',
        unit: 'Unit',
        price: 'Price',
        sampleName: 'Sample Raw Fabric',
        raw: 'Raw',
        first: 'First',
        meter: 'Meter',
    },
};

export default function Products({ auth }) {
    const { isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="erp-card">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{text.system}</h3>
                            <button className="erp-button">{text.add}</button>
                        </div>
                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead className="bg-black/5 text-slate-600">
                                    <tr>{[text.code, text.name, text.type, text.quality, text.unit, text.price].map((header) => <th key={header} className="px-4 py-3 text-start">{header}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    <tr>
                                        <td className="px-4 py-4">000001</td>
                                        <td className="px-4 py-4">{text.sampleName}</td>
                                        <td className="px-4 py-4">{text.raw}</td>
                                        <td className="px-4 py-4">{text.first}</td>
                                        <td className="px-4 py-4">{text.meter}</td>
                                        <td className="px-4 py-4">0.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
