import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'لوحة التحكم',
        customers: 'العملاء',
        suppliers: 'الموردون',
        products: 'الأصناف',
        openSalesOrders: 'طلبات بيع مفتوحة',
        openProductionOrders: 'أوامر إنتاج مفتوحة',
        openLots: 'لوطات مفتوحة',
        inventoryValue: 'قيمة المخزون',
        operationalModules: 'وحدات التشغيل',
        managementKpi: 'مؤشرات الإدارة',
        topCustomers: 'أعلى العملاء',
        topProducts: 'أعلى الأصناف',
        monthlySales: 'المبيعات الشهرية',
        productionEfficiency: 'كفاءة الإنتاج',
        open: 'فتح',
    },
    en: {
        title: 'Dashboard',
        customers: 'Customers',
        suppliers: 'Suppliers',
        products: 'Products',
        openSalesOrders: 'Open Sales Orders',
        openProductionOrders: 'Open Production Orders',
        openLots: 'Open Lots',
        inventoryValue: 'Inventory Value',
        operationalModules: 'Operational Modules',
        managementKpi: 'Management KPI',
        topCustomers: 'Top Customers',
        topProducts: 'Top Products',
        monthlySales: 'Monthly Sales',
        productionEfficiency: 'Production Efficiency',
        open: 'Open',
    },
};

const fixedDashboardLabels = {
    ar: {
        title: 'لوحة التحكم',
        customers: 'العملاء',
        suppliers: 'الموردون',
        products: 'الأصناف',
        openSalesOrders: 'طلبات بيع مفتوحة',
        openProductionOrders: 'أوامر إنتاج مفتوحة',
        openLots: 'لوطات مفتوحة',
        inventoryValue: 'قيمة المخزون',
        operationalModules: 'وحدات التشغيل',
        managementKpi: 'مؤشرات الإدارة',
        topCustomers: 'أعلى العملاء',
        topProducts: 'أعلى الأصناف',
        monthlySales: 'المبيعات الشهرية',
        productionEfficiency: 'كفاءة الإنتاج',
        open: 'فتح',
        noData: 'لا توجد بيانات حتى الآن.',
        closed: 'مغلق',
        active: 'نشط',
        employeesWithoutAccounts: 'موظفون بدون حساب نظام',
        accountRequestHelp: 'راجع الموظفين الذين تم تعيينهم كسجلات فقط واطلب إنشاء حساب دخول لهم عند الحاجة.',
        openUsers: 'فتح المستخدمين',
        employeeAccountStatus: 'حالة حسابات الموظفين',
        totalEmployees: 'إجمالي الموظفين',
        activeSystemUsers: 'لديهم حسابات نشطة',
        suspendedAccounts: 'حسابات موقوفة',
        pendingAccountRequests: 'طلبات إنشاء حساب',
        accountAgingAlerts: 'تنبيهات تأخر إنشاء الحساب',
        over7Days: 'أكثر من 7 أيام',
        over30Days: 'أكثر من 30 يوم',
        daysWithoutAccount: 'يوم بدون حساب',
    },
    en: {
        ...labels.en,
        noData: 'No data yet.',
        closed: 'Closed',
        active: 'Active',
        employeesWithoutAccounts: 'Employees without system accounts',
        accountRequestHelp: 'Review employee-only records and request a login account when needed.',
        openUsers: 'Open users',
        employeeAccountStatus: 'Employee Account Status',
        totalEmployees: 'Total Employees',
        activeSystemUsers: 'Active System Users',
        suspendedAccounts: 'Suspended Accounts',
        pendingAccountRequests: 'Account Creation Requests',
        accountAgingAlerts: 'Account Creation Aging Alerts',
        over7Days: 'Over 7 days',
        over30Days: 'Over 30 days',
        daysWithoutAccount: 'days without account',
    },
};

export default function Dashboard({ auth, metrics, kpis }) {
    const { isRtl, text } = useLanguage(fixedDashboardLabels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const can = (permission) => (Array.isArray(permission) ? permission : [permission]).some((item) => permissions.includes(item));
    const cards = [
        [text.customers, metrics.customers, route('master-data.customers'), can('view_customers')],
        [text.suppliers, metrics.suppliers, route('purchasing.index'), can('view_purchasing')],
        [text.products, metrics.products, route('products.index'), can('view_products')],
        [text.openSalesOrders, metrics.openSalesOrders, route('sales-orders.index'), can('view_sales_orders')],
        [text.openProductionOrders, metrics.openProductionOrders, route('production-orders.index'), can('view_production_orders')],
        [text.openLots, metrics.openLots, route('lots.index'), can('view_lots')],
        [text.inventoryValue, formatMoney(metrics.inventoryValue), route('inventory-ledger.index'), can('view_inventory_ledger')],
    ].filter((card) => card[3]);
    const showAccountRequests = can(['view_users', 'create_user', 'edit_user'])
        || ['admin', 'general_manager', 'hr'].includes(auth.user.role?.slug)
        || ['general_manager', 'admin_assistant', 'sales_manager', 'sales_officer', 'planning_manager', 'planning_officer', 'section_head', 'assistant_section_head', 'accounting_manager', 'purchasing_manager', 'purchasing_officer', 'hr_manager', 'hr_officer'].includes(auth.user.position?.code);
    const showDepartmentCoding = showAccountRequests || can('view_departments');
    const accountCards = [
        [text.totalEmployees, metrics.totalEmployees],
        [text.activeSystemUsers, metrics.activeSystemUsers],
        [text.employeesWithoutAccounts, metrics.employeesWithoutAccounts],
        [text.suspendedAccounts, metrics.suspendedAccounts],
        [text.pendingAccountRequests, metrics.pendingAccountRequests],
    ];

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {showDepartmentCoding && (
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <DashboardAction
                                href={route('department-coding.index')}
                                icon={<DepartmentsIcon />}
                                title={isRtl ? 'تكويد الأقسام' : 'Department Coding'}
                                description={isRtl ? 'إنشاء الأقسام الرئيسية والفرعية وضبط الوظائف والأعداد المعتمدة.' : 'Create main and sub departments, positions, and approved headcount.'}
                                action={isRtl ? 'فتح التكويد' : 'Open coding'}
                            />
                        </section>
                    )}

                    {showDepartmentCoding && (
                        <Panel title={isRtl ? 'قوة تشغيل الأقسام' : 'Department Operating Strength'}>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {(kpis.departmentStrength ?? []).map((department) => (
                                    <DepartmentStrength key={department.id} department={department} isRtl={isRtl} />
                                ))}
                            </div>
                            {(!kpis.departmentStrength || kpis.departmentStrength.length === 0) && (
                                <div className="py-4 text-sm text-slate-500">{text.noData}</div>
                            )}
                        </Panel>
                    )}

                    {showAccountRequests && (
                        <section className="erp-card">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-950">{text.employeeAccountStatus}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{text.accountRequestHelp}</p>
                                </div>
                                {can('view_users') && (
                                    <Link href={route('department-coding.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                                        {text.openUsers}
                                    </Link>
                                )}
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {accountCards.map(([label, value]) => (
                                    <Kpi key={label} label={label} value={value} />
                                ))}
                            </div>

                            {(metrics.employeesWithoutAccountsOver7Days > 0 || metrics.employeesWithoutAccountsOver30Days > 0) && (
                                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex flex-wrap gap-2 text-sm font-semibold text-amber-900">
                                        <span>{text.accountAgingAlerts}</span>
                                        <span className="rounded-full bg-white px-2 py-0.5">{text.over7Days}: {metrics.employeesWithoutAccountsOver7Days}</span>
                                        <span className="rounded-full bg-white px-2 py-0.5">{text.over30Days}: {metrics.employeesWithoutAccountsOver30Days}</span>
                                    </div>
                                    <SimpleList
                                        rows={kpis.employeesWithoutAccountsAging}
                                        emptyText={text.noData}
                                        render={(row) => `${row.employee_code ?? '-'} - ${row.name} - ${daysSince(row.created_at)} ${text.daysWithoutAccount}`}
                                    />
                                </div>
                            )}
                        </section>
                    )}

                    {showAccountRequests && metrics.employeesWithoutAccounts > 0 && (
                        <section className="erp-card">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="text-sm font-medium text-slate-500">{text.employeesWithoutAccounts}</div>
                                    <div className="mt-2 text-3xl font-semibold text-slate-950">{metrics.employeesWithoutAccounts}</div>
                                    <p className="mt-2 max-w-2xl text-sm text-slate-500">{text.accountRequestHelp}</p>
                                </div>
                                {can('view_users') && (
                                    <Link href={route('department-coding.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                                        {text.openUsers}
                                    </Link>
                                )}
                            </div>
                            <SimpleList
                                rows={kpis.employeesWithoutAccounts}
                                emptyText={text.noData}
                                render={(row) => `${row.employee_code ?? '-'} - ${row.name} - ${row.department?.name ?? row.position?.name ?? '-'}`}
                            />
                        </section>
                    )}

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {cards.map(([title, value, href]) => (
                            <Link key={title} href={href} className="erp-card block">
                                <div className="text-sm font-medium text-slate-500">{title}</div>
                                <div className="mt-3 text-3xl font-semibold text-slate-950">{value}</div>
                                <div className="mt-4 text-sm font-semibold" style={{ color: 'var(--erp-accent)' }}>{text.open}</div>
                            </Link>
                        ))}
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Panel title={text.topCustomers}>
                            <SimpleList rows={kpis.topCustomers} emptyText={text.noData} render={(row) => `${row.code} - ${row.name_ar ?? row.name} (${row.sales_orders_count})`} />
                        </Panel>
                        <Panel title={text.topProducts}>
                            <SimpleList rows={kpis.topProducts} emptyText={text.noData} render={(row) => `${row.code} - ${row.name}: ${Number(row.sold_qty).toFixed(2)}`} />
                        </Panel>
                        <Panel title={text.monthlySales}>
                            <SimpleList rows={kpis.monthlySales} emptyText={text.noData} render={(row) => `${row.month}: ${row.orders}`} />
                        </Panel>
                        <Panel title={text.productionEfficiency}>
                            <div className="grid grid-cols-2 gap-3">
                                <Kpi label={text.closed} value={kpis.productionEfficiency.closed} />
                                <Kpi label={text.active} value={kpis.productionEfficiency.active} />
                            </div>
                        </Panel>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Panel({ title, children }) {
    return <div className="erp-card"><h3 className="mb-4 text-lg font-semibold">{title}</h3>{children}</div>;
}

function SimpleList({ rows, render, emptyText }) {
    if (!rows || rows.length === 0) return <div className="py-4 text-sm text-slate-500">{emptyText}</div>;
    return <div className="space-y-2">{rows.map((row, index) => <div key={row.id ?? row.month ?? index} className="rounded-md border border-slate-200 px-3 py-2 text-sm">{render(row)}</div>)}</div>;
}

function Kpi({ label, value }) {
    return <div className="rounded-md border border-slate-200 p-4"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}

function DepartmentStrength({ department, isRtl }) {
    const percent = Math.max(0, Math.min(100, Number(department.strength ?? 0)));
    const tone = percent >= 90 ? 'bg-emerald-600' : percent >= 60 ? 'bg-amber-500' : 'bg-rose-600';

    return (
        <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="font-black text-slate-950">{department.name}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{department.code}</div>
                </div>
                <div className="text-2xl font-black text-slate-950">{percent}%</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                <span>{isRtl ? 'معتمد' : 'Approved'}: {department.approved}</span>
                <span>{isRtl ? 'حالي' : 'Current'}: {department.current}</span>
                <span>{isRtl ? 'عجز' : 'Vacant'}: {department.vacant}</span>
            </div>
        </div>
    );
}

function DashboardAction({ href, icon, title, description, action }) {
    return (
        <Link href={href} className="erp-card group block transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-base font-black text-slate-950">{title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                    <div className="mt-3 text-sm font-bold text-emerald-700">{action}</div>
                </div>
            </div>
        </Link>
    );
}

function DepartmentsIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v4" />
            <path d="M6 11V7h12v4" />
            <rect x="3" y="11" width="6" height="5" rx="1.2" />
            <rect x="15" y="11" width="6" height="5" rx="1.2" />
            <rect x="9" y="17" width="6" height="4" rx="1.2" />
        </svg>
    );
}

function formatMoney(value) {
    return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function daysSince(dateValue) {
    if (!dateValue) {
        return 0;
    }

    const createdAt = new Date(dateValue);
    const diff = Date.now() - createdAt.getTime();

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
