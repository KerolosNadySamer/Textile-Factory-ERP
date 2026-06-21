import { useEffect, useRef, useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import SystemAssistant from '@/Components/SystemAssistant';
import { Link, useForm, usePage } from '@inertiajs/react';

const labels = {
    ar: {
        dashboard: 'لوحة التحكم',
        operations: 'التشغيل',
        warehouseTracking: 'المخازن والتتبع',
        masterData: 'الملفات الأساسية',
        administration: 'الإدارة',
        users: 'أكواد الموظفين',
        userProvisioning: 'متابعة حسابات الموظفين',
        departmentCoding: 'تكويد الموظفين حسب القسم',
        newDepartmentCoding: 'تكويد الأقسام والوظائف',
        departmentStaffing: 'تكويد الأقسام والوظائف',
        employeeCodingCoverage: 'تغطية وتكويد الموظفين',
        organizationStructure: 'الهيكل التنظيمي',
        approvedPositions: 'الوظائف المعتمدة',
        careerPlanning: 'المسار الوظيفي والتعاقب',
        customers: 'العملاء',
        salesOrders: 'طلبيات العملاء',
        products: 'الأصناف',
        issueOrders: 'أذون الصرف',
        productionOrders: 'أوامر الإنتاج',
        weavingProduction: 'إنتاج النسيج',
        dyeingOrders: 'أوامر الصباغة',
        lots: 'اللوطات',
        inventoryLedger: 'دفتر حركة المخزون',
        purchasing: 'المشتريات',
        costAccounting: 'محاسبة التكاليف',
        dyeSamples: 'عينات الصباغة',
        warehouses: 'المخازن',
        departments: 'الأقسام',
        units: 'الوحدات',
        physicalInventory: 'الجرد الفعلي',
        systemBackups: 'النسخ الاحتياطي',
        search: 'بحث عام',
        notifications: 'الإشعارات',
        myPermissions: 'صلاحياتي',
        myMonthlyReviews: 'تقييماتي الشهرية',
        myPayroll: 'راتبي',
        payroll: 'الرواتب',
        customerAccountReports: 'كشف حساب العملاء',
        customerPortal: 'بوابة العميل',
        supplierAccountReports: 'كشف حساب الموردين',
        monthlyReviews: 'التقييمات الشهرية',
        pendingApprovals: 'الاعتمادات المعلقة',
        departmentHiringRequests: 'طلبات موظفين جدد',
        recruitmentOnboarding: 'ترشيح الترقيات',
        changeRequests: 'طلبات التغيير',
        pilotFeedback: 'ملاحظات التشغيل',
        governance: 'مركز الحوكمة',
        dataAnalysis: 'تحليل البيانات',
        language: 'English',
        night: 'ليلي',
        day: 'صباحي',
        profile: 'الملف الشخصي',
        switchUser: 'تغيير المستخدم',
        switchHistory: 'سجل تغيير المستخدم',
        logout: 'تسجيل الخروج',
    },
    en: {
        dashboard: 'Dashboard',
        operations: 'Operations',
        warehouseTracking: 'Warehouse & Tracking',
        masterData: 'Master Data',
        administration: 'Administration',
        users: 'Employee Codes',
        userProvisioning: 'User Provisioning',
        departmentCoding: 'Employee Coding by Department',
        newDepartmentCoding: 'Department & Position Coding',
        departmentStaffing: 'Department & Position Coding',
        employeeCodingCoverage: 'Employee Coding Coverage',
        organizationStructure: 'Organization Structure',
        approvedPositions: 'Approved Positions',
        careerPlanning: 'Career & Succession',
        customers: 'Customers',
        salesOrders: 'Customer Orders',
        products: 'Products',
        issueOrders: 'Issue Orders',
        productionOrders: 'Production Orders',
        weavingProduction: 'Weaving Production',
        dyeingOrders: 'Dyeing Orders',
        lots: 'Lots',
        inventoryLedger: 'Inventory Ledger',
        purchasing: 'Purchasing',
        costAccounting: 'Cost Accounting',
        dyeSamples: 'Dye Samples',
        warehouses: 'Warehouses',
        departments: 'Departments',
        units: 'Units',
        physicalInventory: 'Physical Inventory',
        systemBackups: 'System Backup',
        search: 'Global Search',
        notifications: 'Notifications',
        myPermissions: 'My Permissions',
        myMonthlyReviews: 'My Monthly Reviews',
        myPayroll: 'My Payroll',
        payroll: 'Payroll',
        customerAccountReports: 'Customer Statements',
        customerPortal: 'Customer Portal',
        supplierAccountReports: 'Supplier Statements',
        monthlyReviews: 'Monthly Reviews',
        pendingApprovals: 'Pending Approvals',
        departmentHiringRequests: 'New Employee Requests',
        recruitmentOnboarding: 'Promotion Nominations',
        changeRequests: 'Change Requests',
        pilotFeedback: 'Pilot Feedback',
        governance: 'Governance Center',
        dataAnalysis: 'Data Analysis',
        language: 'Arabic',
        night: 'Night',
        day: 'Day',
        profile: 'Profile',
        switchUser: 'Switch User',
        switchHistory: 'User Switch History',
        logout: 'Log Out',
    },
};

const fixedLabels = {
    ar: {
        dashboard: 'لوحة التحكم',
        sales: 'المبيعات',
        planningProduction: 'التخطيط والإنتاج',
        warehouseTracking: 'المخازن والتتبع',
        masterData: 'الملفات الأساسية',
        administration: 'الإدارة والنظام',
        users: 'أكواد الموظفين',
        userProvisioning: 'متابعة حسابات الموظفين',
        departmentCoding: 'تكويد الموظفين حسب القسم',
        newDepartmentCoding: 'تكويد الأقسام والوظائف',
        departmentStaffing: 'تكويد الأقسام والوظائف',
        employeeCodingCoverage: 'تغطية وتكويد الموظفين',
        organizationStructure: 'الهيكل التنظيمي',
        approvedPositions: 'الوظائف المعتمدة',
        careerPlanning: 'المسار الوظيفي والتعاقب',
        customers: 'العملاء',
        salesOrders: 'طلبيات العملاء',
        products: 'الأصناف',
        issueOrders: 'أذون الصرف',
        productionOrders: 'أوامر الإنتاج',
        weavingProduction: 'إنتاج النسيج',
        dyeingOrders: 'أوامر الصباغة',
        lots: 'اللوطات',
        inventoryLedger: 'دفتر حركة المخزون',
        purchasing: 'المشتريات',
        costAccounting: 'محاسبة التكاليف',
        dyeSamples: 'عينات الصباغة',
        warehouses: 'المخازن',
        departments: 'الأقسام',
        units: 'الوحدات',
        physicalInventory: 'الجرد الفعلي',
        systemBackups: 'النسخ الاحتياطي',
        search: 'بحث عام',
        notifications: 'الإشعارات',
        myPermissions: 'صلاحياتي',
        myMonthlyReviews: 'تقييماتي الشهرية',
        myPayroll: 'راتبي',
        payroll: 'الرواتب',
        customerAccountReports: 'كشف حساب العملاء',
        customerPortal: 'بوابة العميل',
        supplierAccountReports: 'كشف حساب الموردين',
        monthlyReviews: 'التقييمات الشهرية',
        pendingApprovals: 'الاعتمادات المعلقة',
        departmentHiringRequests: 'طلبات موظفين جدد',
        recruitmentOnboarding: 'ترشيح الترقيات',
        changeRequests: 'طلبات التغيير',
        pilotFeedback: 'ملاحظات التشغيل',
        governance: 'مركز الحوكمة',
        dataAnalysis: 'تحليل البيانات',
        language: 'English',
        night: 'ليلي',
        day: 'صباحي',
        profile: 'الملف الشخصي',
        switchUser: 'تغيير المستخدم',
        switchHistory: 'سجل تغيير المستخدم',
        logout: 'تسجيل الخروج',
        provisioningAlert: 'يوجد :count موظفين لم يتم إنشاء حسابات لهم بعد',
        reviewProvisioning: 'متابعة',
        switchLanguage: 'تغيير اللغة',
        switchTheme: 'تغيير الوضع',
    },
    en: {
        dashboard: 'Dashboard',
        sales: 'Sales',
        planningProduction: 'Planning & Production',
        warehouseTracking: 'Warehouse & Tracking',
        masterData: 'Master Data',
        administration: 'Administration & System',
        users: 'Employee Codes',
        userProvisioning: 'User Provisioning',
        departmentCoding: 'Employee Coding by Department',
        newDepartmentCoding: 'Department & Position Coding',
        departmentStaffing: 'Department & Position Coding',
        employeeCodingCoverage: 'Employee Coding Coverage',
        organizationStructure: 'Organization Structure',
        approvedPositions: 'Approved Positions',
        careerPlanning: 'Career & Succession',
        customers: 'Customers',
        salesOrders: 'Customer Orders',
        products: 'Products',
        issueOrders: 'Issue Orders',
        productionOrders: 'Production Orders',
        weavingProduction: 'Weaving Production',
        dyeingOrders: 'Dyeing Orders',
        lots: 'Lots',
        inventoryLedger: 'Inventory Ledger',
        purchasing: 'Purchasing',
        costAccounting: 'Cost Accounting',
        dyeSamples: 'Dye Samples',
        warehouses: 'Warehouses',
        departments: 'Departments',
        units: 'Units',
        physicalInventory: 'Physical Inventory',
        systemBackups: 'System Backup',
        search: 'Global Search',
        notifications: 'Notifications',
        myPermissions: 'My Permissions',
        myMonthlyReviews: 'My Monthly Reviews',
        myPayroll: 'My Payroll',
        payroll: 'Payroll',
        customerAccountReports: 'Customer Statements',
        customerPortal: 'Customer Portal',
        supplierAccountReports: 'Supplier Statements',
        monthlyReviews: 'Monthly Reviews',
        pendingApprovals: 'Pending Approvals',
        departmentHiringRequests: 'New Employee Requests',
        recruitmentOnboarding: 'Promotion Nominations',
        changeRequests: 'Change Requests',
        pilotFeedback: 'Pilot Feedback',
        governance: 'Governance Center',
        dataAnalysis: 'Data Analysis',
        language: 'Arabic',
        night: 'Night',
        day: 'Day',
        profile: 'Profile',
        switchUser: 'Switch User',
        switchHistory: 'User Switch History',
        logout: 'Log Out',
        provisioningAlert: ':count employees still do not have system accounts',
        reviewProvisioning: 'Review',
        switchLanguage: 'Switch language',
        switchTheme: 'Switch theme',
    },
};

export default function Authenticated({ user, header, children }) {
    const pageProps = usePage().props;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showSwitchUser, setShowSwitchUser] = useState(false);
    const [language, setLanguage] = useState(() => localStorage.getItem('erp-language') || 'ar');
    const [theme, setTheme] = useState(() => localStorage.getItem('erp-theme') || 'day');
    const permissions = user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const text = fixedLabels[language] ?? fixedLabels.ar;
    const notifications = pageProps.notifications ?? {};
    const provisioningAlert = pageProps.provisioningAlert ?? {};
    const company = pageProps.company ?? {};
    const unreadCount = notifications.unreadCount ?? 0;
    const employeesWithoutAccounts = provisioningAlert.employeesWithoutAccounts ?? 0;
    const isRtl = language === 'ar';
    const userDisplayName = language === 'ar'
        ? (user.name_ar ?? user.name ?? user.name_en ?? '')
        : (user.name_en ?? user.name ?? user.name_ar ?? '');
    const initials = userDisplayName?.trim()?.charAt(0)?.toUpperCase() ?? 'U';
    const isCustomer = user.role?.slug === 'customer';

    const hasPermission = (permission) => {
        const required = Array.isArray(permission) ? permission : [permission];

        return required.some((item) => permissions.includes(item));
    };
    const canSeeHrEmployeeTools = hasPermission('view_users')
        || ['admin', 'general_manager', 'hr'].includes(user.role?.slug)
        || ['hr_manager', 'hr_officer'].includes(user.position?.code);
    const canSeeDepartmentHiringRequests = canSeeHrEmployeeTools
        || ['admin', 'general_manager', 'hr'].includes(user.role?.slug)
        || [
            'general_manager',
            'department_manager',
            'sales_manager',
            'planning_manager',
            'section_head',
            'accounting_manager',
            'purchasing_manager',
            'sales_officer',
            'department_officer',
            'planning_officer',
            'assistant_section_head',
            'purchasing_officer',
            'admin_assistant',
        ].includes(user.position?.code)
        || hasPermission(['view_recruitment_onboarding', 'create_recruitment_request', 'manage_recruitment_requests']);

    useEffect(() => {
        localStorage.setItem('erp-language', language);
        document.documentElement.lang = language;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        window.dispatchEvent(new CustomEvent('erp-language-change', { detail: language }));
    }, [language, isRtl]);

    useEffect(() => {
        localStorage.setItem('erp-theme', theme);
        document.documentElement.dataset.erpTheme = theme;
        window.dispatchEvent(new CustomEvent('erp-theme-change', { detail: theme }));
    }, [theme]);

    useEffect(() => {
        if (isCustomer) {
            return;
        }

        rememberRecentUser(user.id);
    }, [user.id, isCustomer]);

    const navGroups = (isCustomer ? [{
            label: text.customerPortal,
            links: [
                { label: text.customerPortal, href: route('customer-portal.index'), active: route().current('customer-portal.*') },
            ],
        }] : [
        {
            label: text.sales,
            links: [
                { label: text.customers, href: route('master-data.customers'), active: route().current('master-data.customers'), show: hasPermission('view_customers') },
                { label: text.salesOrders, href: route('sales-orders.index'), active: route().current('sales-orders.index'), show: hasPermission('view_sales_orders') },
                { label: text.dyeSamples, href: route('dye-samples.index'), active: route().current('dye-samples.index'), show: hasPermission('view_dye_samples') },
            ],
        },
        {
            label: text.planningProduction,
            links: [
                { label: text.productionOrders, href: route('production-orders.index'), active: route().current('production-orders.index'), show: hasPermission('view_production_orders') },
                { label: text.weavingProduction, href: route('weaving-production.index'), active: route().current('weaving-production.*'), show: hasPermission('view_weaving_production') },
                { label: text.dyeingOrders, href: route('dyeing-orders.index'), active: route().current('dyeing-orders.*'), show: hasPermission('view_dyeing_orders') },
                { label: text.issueOrders, href: route('issue-orders.index'), active: route().current('issue-orders.index'), show: hasPermission('view_issue_orders') },
                { label: text.lots, href: route('lots.index'), active: route().current('lots.index'), show: hasPermission('view_lots') },
            ],
        },
        {
            label: text.warehouseTracking,
            links: [
                { label: text.purchasing, href: route('purchasing.index'), active: route().current('purchasing.index'), show: hasPermission('view_purchasing') },
                { label: text.inventoryLedger, href: route('inventory-ledger.index'), active: route().current('inventory-ledger.index'), show: hasPermission('view_inventory_ledger') },
                { label: text.physicalInventory, href: route('physical-inventory.index'), active: route().current('physical-inventory.index'), show: hasPermission('view_physical_inventory') },
                { label: text.costAccounting, href: route('cost-accounting.index'), active: route().current('cost-accounting.index'), show: hasPermission('view_cost_accounting') },
            ],
        },
        {
            label: text.masterData,
            links: [
                { label: text.products, href: route('products.index'), active: route().current('products.index'), show: hasPermission('view_products') },
                { label: text.warehouses, href: route('master-data.warehouses'), active: route().current('master-data.warehouses'), show: hasPermission('view_warehouses') },
                { label: text.departments, href: route('master-data.departments'), active: route().current('master-data.departments'), show: hasPermission('view_departments') },
                { label: text.units, href: route('master-data.units'), active: route().current('master-data.units'), show: hasPermission('view_units') },
            ],
        },
        {
            label: text.administration,
            links: [
                { label: text.users, href: route('users.index'), active: route().current('users.index'), show: canSeeHrEmployeeTools },
                { label: text.userProvisioning, href: route('user-provisioning-monitor.index'), active: route().current('user-provisioning-monitor.index'), show: canSeeHrEmployeeTools },
                { label: text.departmentStaffing, href: route('department-coding.index'), active: route().current('department-coding.index') || route().current('department-staffing.index'), show: canSeeHrEmployeeTools || hasPermission('view_departments') },
                { label: text.organizationStructure, href: route('organization-structure.index'), active: route().current('organization-structure.index'), show: canSeeHrEmployeeTools || hasPermission('view_departments') },
                { label: text.approvedPositions, href: route('approved-positions.index'), active: route().current('approved-positions.index'), show: canSeeHrEmployeeTools || hasPermission('view_departments') },
                { label: text.careerPlanning, href: route('career-planning.index'), active: route().current('career-planning.*'), show: canSeeHrEmployeeTools },
                { label: text.systemBackups, href: route('system-backups.index'), active: route().current('system-backups.index'), show: user.role?.slug === 'admin' || hasPermission('manage_system_backups') },
                { label: text.governance, href: route('governance.index'), active: route().current('governance.index'), show: hasPermission('view_governance_center') },
                { label: text.dataAnalysis, href: route('data-analysis.index'), active: route().current('data-analysis.index'), show: hasPermission('view_data_analysis') },
                { label: text.myMonthlyReviews, href: route('employee-monthly-reviews.mine'), active: route().current('employee-monthly-reviews.mine'), show: user.role?.slug !== 'admin' },
                { label: text.myPayroll, href: route('payroll.mine'), active: route().current('payroll.mine'), show: user.role?.slug !== 'admin' },
                { label: text.monthlyReviews, href: route('employee-monthly-reviews.index'), active: route().current('employee-monthly-reviews.index'), show: canSeeHrEmployeeTools },
                { label: text.payroll, href: route('payroll.index'), active: route().current('payroll.index'), show: hasPermission(['view_finance', 'edit_finance']) || canSeeHrEmployeeTools },
                { label: text.customerAccountReports, href: route('customer-account-reports.index'), active: route().current('customer-account-reports.*'), show: hasPermission(['view_finance', 'edit_finance']) },
                { label: text.supplierAccountReports, href: route('supplier-account-reports.index'), active: route().current('supplier-account-reports.*'), show: hasPermission(['view_finance', 'edit_finance']) },
                { label: text.pendingApprovals, href: route('pending-approvals.index'), active: route().current('pending-approvals.index'), show: hasPermission('view_change_requests') },
                { label: text.departmentHiringRequests, href: route('department-hiring-requests.index'), active: route().current('department-hiring-requests.*'), show: canSeeDepartmentHiringRequests },
                { label: text.recruitmentOnboarding, href: route('recruitment-onboarding.index'), active: route().current('recruitment-onboarding.index'), show: hasPermission('view_recruitment_onboarding') },
                { label: text.changeRequests, href: route('change-requests.index'), active: route().current('change-requests.index') },
                { label: text.pilotFeedback, href: route('pilot-feedback.index'), active: route().current('pilot-feedback.*') },
                { label: text.switchHistory, href: route('user-switch-history.index'), active: route().current('user-switch-history.index'), show: hasPermission('view_audit_logs') },
            ],
        },
    ]).map((group) => ({
        ...group,
        links: group.links.filter((link) => link.show ?? true),
    })).filter((group) => group.links.length > 0);

    const allLinks = navGroups.flatMap((group) => group.links);
    const companyName = language === 'ar'
        ? (company.company_name_ar ?? 'شركة أسود للصباغة والتجهيز والنسيج')
        : (company.company_name_en ?? 'Aswad Dyeing, Finishing & Weaving Co.');

    return (
        <div className={`app-shell min-h-screen ${theme === 'night' ? 'theme-night' : 'theme-day'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <nav className="app-nav border-b">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
                        <div className="flex min-w-0 items-center gap-4">
                            <Link href="/">
                                <div className="flex items-center gap-3">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-slate-800" />
                                    <span className="hidden max-w-[260px] text-sm font-semibold leading-tight text-slate-900 lg:inline">
                                        {companyName}
                                    </span>
                                </div>
                            </Link>

                            <div className="hidden items-center gap-2 lg:flex">
                                {!isCustomer && (
                                    <Link href={route('dashboard')} className={`nav-group-button ${route().current('dashboard') ? 'nav-group-button-active' : ''}`}>
                                        {text.dashboard}
                                    </Link>
                                )}
                                {navGroups.map((group) => (
                                    <NavGroup key={group.label} group={group} />
                                ))}
                            </div>
                        </div>

                        <div className="hidden items-center gap-2 sm:flex">
                            {!isCustomer && <GlobalSearch placeholder={text.search} />}
                            <LanguageSwitch language={language} label={text.switchLanguage} onChange={setLanguage} />
                            <IconControl
                                as="button"
                                type="button"
                                title={text.switchTheme}
                                ariaLabel={text.switchTheme}
                                tone={theme === 'day' ? 'moon' : 'sun'}
                                onClick={() => setTheme((current) => (current === 'day' ? 'night' : 'day'))}
                            >
                                {theme === 'day' ? <MoonIcon /> : <SunIcon />}
                            </IconControl>
                            <IconControl as={Link} href={route('notifications.index')} title={text.notifications} ariaLabel={text.notifications} tone="notifications" active={route().current('notifications.index')}>
                                <BellIcon />
                                {unreadCount > 0 && <span className="absolute -end-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-sm">{unreadCount}</span>}
                            </IconControl>
                            <UserMenu user={user} text={text} initials={initials} userDisplayName={userDisplayName} onSwitchUser={() => setShowSwitchUser(true)} isCustomer={isCustomer} />
                        </div>

                        <div className="-ms-2 flex items-center lg:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="control-pill"
                            >
                                ≡
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' lg:hidden'}>
                    <div className="space-y-1 px-4 pb-3 pt-2">
                        {!isCustomer && (
                            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                                {text.dashboard}
                            </ResponsiveNavLink>
                        )}
                        {navGroups.map((group) => (
                            <div key={group.label} className="border-t pt-2" style={{ borderColor: 'var(--erp-border)' }}>
                                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--erp-muted)' }}>
                                    {group.label}
                                </div>
                                {group.links.map((link) => (
                                    <ResponsiveNavLink key={link.href} href={link.href} active={link.active} className={link.highlight ? 'responsive-nav-link-highlight' : ''}>
                                        {link.label}
                                    </ResponsiveNavLink>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="border-t px-4 pb-4 pt-4" style={{ borderColor: 'var(--erp-border)' }}>
                        <div className="text-base font-medium text-slate-900">{userDisplayName}</div>
                        <div className="text-sm font-medium text-slate-500">{user.email}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <LanguageSwitch language={language} label={text.switchLanguage} onChange={setLanguage} />
                            <IconControl
                                as="button"
                                type="button"
                                title={text.switchTheme}
                                ariaLabel={text.switchTheme}
                                tone={theme === 'day' ? 'moon' : 'sun'}
                                onClick={() => setTheme((current) => (current === 'day' ? 'night' : 'day'))}
                            >
                                {theme === 'day' ? <MoonIcon /> : <SunIcon />}
                            </IconControl>
                            <Link href={route('profile.edit')} className="control-pill">{text.profile}</Link>
                            {!isCustomer && <button type="button" onClick={() => setShowSwitchUser(true)} className="control-pill">{text.switchUser}</button>}
                            <Link href={route('logout')} method="post" as="button" className="control-pill">{text.logout}</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {!isCustomer && employeesWithoutAccounts > 0 && (
                <div className="border-b border-amber-200 bg-amber-50">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <div className="font-semibold">
                            {text.provisioningAlert.replace(':count', employeesWithoutAccounts)}
                        </div>
                        <Link href={route('user-provisioning-monitor.index')} className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-800">
                            {text.reviewProvisioning}
                        </Link>
                    </div>
                </div>
            )}

            {header && (
                <header className="app-header border-b">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main className="app-main">{children}</main>

            <SystemAssistant />
            {!isCustomer && <SwitchUserModal open={showSwitchUser} onClose={() => setShowSwitchUser(false)} language={language} currentUser={user} />}
        </div>
    );
}

function LanguageSwitch({ language, label, onChange }) {
    return (
        <div className="language-switch" role="group" aria-label={label} title={label}>
            <button
                type="button"
                className={language === 'ar' ? 'language-switch-option language-switch-option-active' : 'language-switch-option'}
                onClick={() => onChange('ar')}
            >
                عربي
            </button>
            <button
                type="button"
                className={language === 'en' ? 'language-switch-option language-switch-option-active' : 'language-switch-option'}
                onClick={() => onChange('en')}
            >
                EN
            </button>
        </div>
    );
}

function NavGroup({ group }) {
    const isActive = group.links.some((link) => link.active);

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button type="button" className={`nav-group-button ${isActive ? 'nav-group-button-active' : ''}`}>
                    {group.label}
                    <span className="ms-2 text-xs">⌄</span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="left" contentClasses="nav-dropdown-panel border p-2">
                {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className={`nav-dropdown-link ${link.active ? 'nav-dropdown-link-active' : ''} ${link.highlight ? 'nav-dropdown-link-highlight' : ''}`}>
                        {link.label}
                    </Link>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}

function IconControl({ as: Component = 'button', children, title, ariaLabel, tone = 'default', active = false, className = '', ...props }) {
    return (
        <Component
            {...props}
            data-tone={tone}
            title={title}
            aria-label={ariaLabel ?? title}
            className={`icon-control ${active ? 'icon-control-active' : ''} ${className}`}
        >
            {children}
        </Component>
    );
}

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3a6.5 6.5 0 0 0 8.8 8.8A8.5 8.5 0 1 1 12 3" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
        </svg>
    );
}

function GlobalSearch({ placeholder }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            fetch(route('global-search', { q: query }), { signal: controller.signal })
                .then((response) => response.json())
                .then((payload) => {
                    setResults(payload);
                    setOpen(true);
                })
                .catch(() => {});
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return (
        <div className="relative hidden md:block">
            <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setOpen(true)}
                className="form-input h-10 w-64"
                placeholder={placeholder}
            />
            {open && results.length > 0 && (
                <div className="absolute end-0 z-50 mt-2 w-80 rounded-md border bg-white p-2 shadow-lg" style={{ borderColor: 'var(--erp-border)' }}>
                    {results.map((result, index) => (
                        <a
                            key={`${result.type}-${result.number}-${index}`}
                            href={result.url}
                            className="block rounded px-3 py-2 text-sm hover:bg-slate-100"
                        >
                            <span className="block text-xs font-semibold uppercase text-slate-500">{result.type}</span>
                            <span className="block font-semibold text-slate-900">{result.number}</span>
                            <span className="block truncate text-xs text-slate-600">{result.title}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

function UserMenu({ user, text, initials, userDisplayName, onSwitchUser, isCustomer = false }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button type="button" className="nav-group-button">
                    {user.profile_photo_url ? (
                        <img src={user.profile_photo_url} alt={userDisplayName} className="me-2 h-8 w-8 rounded-full object-cover" />
                    ) : (
                        <span className="me-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">{initials}</span>
                    )}
                    <span className="max-w-[140px] truncate">{userDisplayName}</span>
                    <span className="ms-2 text-xs">⌄</span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" contentClasses="nav-dropdown-panel border p-2">
                {!isCustomer && <Link href={route('my-permissions.index')} className="nav-dropdown-link">{text.myPermissions}</Link>}
                <Link href={route('profile.edit')} className="nav-dropdown-link">{text.profile}</Link>
                {!isCustomer && <button type="button" onClick={onSwitchUser} className="nav-dropdown-link w-full text-start">{text.switchUser}</button>}
                <Link href={route('logout')} method="post" as="button" className="nav-dropdown-link w-full text-start">{text.logout}</Link>
            </Dropdown.Content>
        </Dropdown>
    );
}

function SwitchUserModal({ open, onClose, language, currentUser }) {
    const isRtl = language === 'ar';
    const text = isRtl ? {
        title: 'تغيير المستخدم',
        subtitle: 'اختر المستخدم الجديد ثم أدخل كلمة المرور الخاصة به.',
        recent: 'آخر 10 مستخدمين على هذا الجهاز',
        allUsers: 'المستخدمون النشطون',
        password: 'كلمة المرور',
        passwordPlaceholder: 'كلمة مرور المستخدم الجديد',
        passwordHelp: 'اكتب كلمة مرور الحساب المحدد للانتقال إليه.',
        chooseFirst: 'اختر حسابًا أولًا لكتابة كلمة المرور.',
        switch: 'تغيير المستخدم',
        cancel: 'إلغاء',
        loading: 'جاري تحميل المستخدمين...',
        empty: 'لا توجد حسابات نشطة متاحة للتبديل.',
        loadError: 'تعذر تحميل الحسابات المتاحة. حاول مرة أخرى.',
    } : {
        title: 'Switch User',
        subtitle: 'Choose the next user and enter that user password.',
        recent: 'Last 10 users on this device',
        allUsers: 'Active users',
        password: 'Password',
        passwordPlaceholder: 'New user password',
        passwordHelp: 'Enter the selected account password to switch.',
        chooseFirst: 'Choose an account first to enter the password.',
        switch: 'Switch User',
        cancel: 'Cancel',
        loading: 'Loading users...',
        empty: 'No active accounts are available to switch to.',
        loadError: 'Could not load available accounts. Please try again.',
    };
    const [users, setUsers] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const passwordInput = useRef(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        user_id: '',
        password: '',
        device_id: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        const deviceId = getDeviceId();
        setData('device_id', deviceId);
        setLoading(true);
        setLoadError('');

        fetch(route('user-switch.candidates'), {
            headers: {
                'X-Device-Id': deviceId,
                'X-Recent-User-Ids': getRecentUserIds().join(','),
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load user switch candidates.');
                }

                return response.json();
            })
            .then((payload) => {
                setUsers(payload.users ?? []);
                setRecentUsers(payload.recentUsers ?? []);
            })
            .catch(() => {
                setUsers([]);
                setRecentUsers([]);
                setLoadError(text.loadError);
            })
            .finally(() => setLoading(false));
    }, [open]);

    const close = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('user-switch.store'), {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    if (!open) {
        return null;
    }

    const selectedUser = users.find((item) => String(item.id) === String(data.user_id));
    const chooseUser = (id) => {
        setData((current) => ({ ...current, user_id: id, password: '' }));
        window.setTimeout(() => passwordInput.current?.focus(), 0);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-lg border shadow-xl" style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-card)', color: 'var(--erp-text)' }}>
                <div className="border-b px-5 py-4" style={{ borderColor: 'var(--erp-border)' }}>
                    <h2 className="text-lg font-semibold">{text.title}</h2>
                    <p className="mt-1 text-sm" style={{ color: 'var(--erp-muted)' }}>{text.subtitle}</p>
                </div>

                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                    <div className="border-b p-5" style={{ borderColor: 'var(--erp-border)' }}>
                        <div className={`rounded-md border p-4 ${selectedUser ? 'border-red-200 bg-red-50/70' : ''}`} style={!selectedUser ? { borderColor: 'var(--erp-border)' } : undefined}>
                            {selectedUser ? (
                                <div className="mb-3 rounded-md p-3 text-sm" style={{ background: 'var(--erp-soft)' }}>
                                    {selectedUser.name} - {selectedUser.department ?? selectedUser.role ?? selectedUser.email}
                                </div>
                            ) : (
                                <p className="mb-3 text-sm" style={{ color: 'var(--erp-muted)' }}>{text.chooseFirst}</p>
                            )}
                            <label className="text-sm font-semibold">{text.password}</label>
                            <input
                                ref={passwordInput}
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                className="form-input"
                                placeholder={text.passwordPlaceholder}
                                autoComplete="current-password"
                                required
                                disabled={!selectedUser}
                            />
                            <p className="mt-1 text-xs" style={{ color: 'var(--erp-muted)' }}>{text.passwordHelp}</p>
                            {errors.user_id && <div className="mt-1 text-sm text-red-600">{errors.user_id}</div>}
                            {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                    {loading ? (
                        <div className="rounded-md border p-4 text-sm" style={{ borderColor: 'var(--erp-border)' }}>{text.loading}</div>
                    ) : loadError ? (
                        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{loadError}</div>
                    ) : users.length === 0 ? (
                        <div className="rounded-md border p-4 text-sm" style={{ borderColor: 'var(--erp-border)' }}>{text.empty}</div>
                    ) : (
                        <>
                            {recentUsers.length > 0 && (
                                <UserChoiceGroup title={text.recent} users={recentUsers} value={data.user_id} onChange={chooseUser} />
                            )}
                            <UserChoiceGroup title={text.allUsers} users={users} value={data.user_id} onChange={chooseUser} />
                        </>
                    )}
                    </div>

                    <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: 'var(--erp-border)' }}>
                        <button type="button" onClick={close} className="control-pill">{text.cancel}</button>
                        <button type="submit" className="erp-button" disabled={processing || !data.user_id || !data.password || String(data.user_id) === String(currentUser.id)}>
                            {text.switch}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UserChoiceGroup({ title, users, value, onChange }) {
    return (
        <div>
            <div className="mb-2 text-sm font-semibold">{title}</div>
            <div className="grid gap-2 sm:grid-cols-2">
                {users.map((user) => (
                    <label
                        key={user.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition ${String(value) === String(user.id) ? 'ring-2 ring-red-700' : ''}`}
                        style={{ borderColor: 'var(--erp-border)', background: 'var(--erp-control)' }}
                    >
                        <input type="radio" name="switch_user_id" value={user.id} checked={String(value) === String(user.id)} onChange={() => onChange(user.id)} />
                        <span className="min-w-0">
                            <span className="block truncate font-semibold">{user.name}</span>
                            <span className="block truncate text-xs" style={{ color: 'var(--erp-muted)' }}>
                                {user.department ?? user.position ?? user.role ?? user.email}
                            </span>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function getDeviceId() {
    const key = 'erp-device-id';
    let deviceId = localStorage.getItem(key);

    if (!deviceId) {
        deviceId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(key, deviceId);
    }

    return deviceId;
}

function getRecentUserIds() {
    try {
        return JSON.parse(localStorage.getItem('erp-recent-user-ids') ?? '[]');
    } catch {
        return [];
    }
}

function rememberRecentUser(userId) {
    const ids = [userId, ...getRecentUserIds().filter((id) => String(id) !== String(userId))].slice(0, 10);
    localStorage.setItem('erp-recent-user-ids', JSON.stringify(ids));
}

