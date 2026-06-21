import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'تحليل البيانات',
        materialCost: 'تكلفة خامات',
        productionCost: 'تكلفة إنتاج',
        dyeingCost: 'تكلفة صباغة',
        overheadCost: 'مصروفات غير مباشرة',
        salesByCustomer: 'المبيعات حسب العميل',
        salesByProduct: 'المبيعات حسب الصنف',
        salesByColor: 'المبيعات حسب اللون',
        monthlySales: 'طلبات البيع الشهرية',
        fastMoving: 'الأصناف سريعة الحركة',
        slowMoving: 'الأصناف الراكدة',
        suppliersByPo: 'الموردون حسب أوامر الشراء',
        topUnitCost: 'أعلى تكلفة وحدة',
        orderCount: 'عدد الطلبات',
        quantity: 'الكمية',
        month: 'الشهر',
        item: 'البند',
        total: 'الإجمالي',
        issuedQty: 'كمية منصرفة',
        last90Days: 'حركة آخر 90 يوم',
        unitCost: 'تكلفة الوحدة',
        noSalesOrders: 'لا توجد أوامر بيع.',
        noData: 'لا توجد بيانات كافية للتحليل.',
    },
    en: {
        title: 'Data Analysis',
        materialCost: 'Material Cost',
        productionCost: 'Production Cost',
        dyeingCost: 'Dyeing Cost',
        overheadCost: 'Overhead Cost',
        salesByCustomer: 'Sales by Customer',
        salesByProduct: 'Sales by Product',
        salesByColor: 'Sales by Color',
        monthlySales: 'Monthly Sales Orders',
        fastMoving: 'Fast-Moving Items',
        slowMoving: 'Slow-Moving Items',
        suppliersByPo: 'Suppliers by Purchase Orders',
        topUnitCost: 'Top Unit Cost',
        orderCount: 'Order Count',
        quantity: 'Quantity',
        month: 'Month',
        item: 'Item',
        total: 'Total',
        issuedQty: 'Issued Quantity',
        last90Days: 'Last 90 Days Movement',
        unitCost: 'Unit Cost',
        noSalesOrders: 'No sales orders found.',
        noData: 'Not enough data for analysis.',
    },
};

export default function DataAnalysisIndex({ auth, sales, inventory, suppliers, costs }) {
    const { language, isRtl, text } = useLanguage(labels);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Metric title={text.materialCost} value={money(costs.totals.material, language)} />
                        <Metric title={text.productionCost} value={money(costs.totals.production, language)} />
                        <Metric title={text.dyeingCost} value={money(costs.totals.dyeing, language)} />
                        <Metric title={text.overheadCost} value={money(costs.totals.overhead, language)} />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Section title={text.salesByCustomer}><RankedList rows={sales.byCustomer} valueLabel={text.orderCount} text={text} language={language} /></Section>
                        <Section title={text.salesByProduct}><RankedList rows={sales.byProduct} valueLabel={text.quantity} showTotal text={text} language={language} /></Section>
                        <Section title={text.salesByColor}><RankedList rows={sales.byColor} valueLabel={text.quantity} showTotal text={text} language={language} /></Section>
                        <Section title={text.monthlySales}>
                            <SimpleTable headers={[text.month, text.orderCount]} rows={sales.monthly.map((item) => [item.month, item.orders])} empty={text.noSalesOrders} />
                        </Section>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Section title={text.fastMoving}><RankedList rows={inventory.fastMoving} valueLabel={text.issuedQty} text={text} language={language} /></Section>
                        <Section title={text.slowMoving}><RankedList rows={inventory.slowMoving} valueLabel={text.last90Days} text={text} language={language} /></Section>
                        <Section title={text.suppliersByPo}><RankedList rows={suppliers.topByPurchaseOrders} valueLabel={text.orderCount} text={text} language={language} /></Section>
                        <Section title={text.topUnitCost}><RankedList rows={costs.topUnitCost} valueLabel={text.unitCost} showTotal text={text} language={language} /></Section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ title, value }) {
    return <div className="erp-card"><div className="text-sm text-slate-500">{title}</div><div className="mt-3 text-2xl font-bold text-slate-900">{value}</div></div>;
}

function Section({ title, children }) {
    return <div className="erp-card"><h3 className="mb-4 text-lg font-semibold">{title}</h3>{children}</div>;
}

function RankedList({ rows, valueLabel, text, language, showTotal = false }) {
    return (
        <SimpleTable
            headers={showTotal ? [text.item, valueLabel, text.total] : [text.item, valueLabel]}
            rows={rows.map((row) => showTotal ? [row.label ?? '-', number(row.value, language), money(row.total, language)] : [row.label ?? '-', number(row.value, language)])}
            empty={text.noData}
        />
    );
}

function SimpleTable({ headers, rows, empty }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                <thead className="bg-black/5 text-slate-600"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-start font-semibold">{header}</th>)}</tr></thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                    {rows.length === 0 && <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500">{empty}</td></tr>}
                    {rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-4">{cell}</td>)}</tr>)}
                </tbody>
            </table>
        </div>
    );
}

function number(value, language) {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

function money(value, language) {
    return number(value, language);
}
