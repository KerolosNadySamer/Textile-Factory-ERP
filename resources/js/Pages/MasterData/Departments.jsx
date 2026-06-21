import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'الأقسام',
        subtitle: 'عرض منظم للهيكل الحالي، المديرين، الوظائف المعتمدة، ونسب التغطية داخل كل قسم.',
        generalManager: 'المدير العام',
        mainDepartments: 'الأقسام الرئيسية',
        departmentLeadership: 'قيادة القسم',
        units: 'الوحدات الداخلية',
        positions: 'الوظائف',
        subStores: 'الفروع الداخلية',
        approved: 'المعتمد',
        current: 'الحالي',
        vacant: 'الشاغر',
        surplus: 'الفائض',
        directManager: 'مدير القسم',
        noManager: 'لم يتم ربط مدير بعد',
        codeEmployees: 'تكويد الموظفين',
        coverage: 'التغطية',
        coverageDetails: 'تفاصيل التغطية',
        staffing: 'تعديل هيكل الأقسام',
        childDepartments: 'الأقسام التابعة',
        emptyPositions: 'لا توجد وظائف مفعلة.',
        emptyUnits: 'لا توجد وحدات داخلية.',
        departmentsCount: 'عدد الأقسام',
        totalApproved: 'إجمالي المعتمد',
        totalCurrent: 'إجمالي الحالي',
        totalVacant: 'إجمالي الشاغر',
        noDepartments: 'لا توجد أقسام مفعلة بعد.',
    },
    en: {
        title: 'Departments',
        subtitle: 'A clean view of the current structure, managers, approved positions, and coverage per department.',
        generalManager: 'General Manager',
        mainDepartments: 'Main Departments',
        departmentLeadership: 'Department Leadership',
        units: 'Internal Units',
        positions: 'Positions',
        subStores: 'Internal Branches',
        approved: 'Approved',
        current: 'Current',
        vacant: 'Vacant',
        surplus: 'Surplus',
        directManager: 'Department Manager',
        noManager: 'No manager linked yet',
        codeEmployees: 'Code Employees',
        coverage: 'Coverage',
        coverageDetails: 'Coverage Details',
        staffing: 'Edit Department Structure',
        childDepartments: 'Child Departments',
        emptyPositions: 'No active positions.',
        emptyUnits: 'No internal units.',
        departmentsCount: 'Departments',
        totalApproved: 'Total Approved',
        totalCurrent: 'Total Current',
        totalVacant: 'Total Vacant',
        noDepartments: 'No active departments yet.',
    },
};

export default function Departments({ auth, generalManager, departments = [] }) {
    const { language, isRtl, text } = useLanguage(labels);
    const totals = departmentTotals(departments);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="erp-page">
                    <section className="erp-panel p-6">
                        <div className="erp-panel-heading">
                            <div>
                                <h3 className="erp-panel-title">{text.title}</h3>
                                <p className="erp-panel-subtitle">{text.subtitle}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link href={route('department-coding.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800">
                                    {text.staffing}
                                </Link>
                                <Link href={route('employee-coding-coverage.index')} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                                    {text.coverageDetails}
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <Metric label={text.departmentsCount} value={totals.departments} />
                            <Metric label={text.totalApproved} value={totals.required} />
                            <Metric label={text.totalCurrent} value={totals.current} />
                            <Metric label={text.totalVacant} value={totals.vacant} tone="danger" />
                            <ManagerCard label={text.generalManager} manager={localizedName(generalManager, language) || text.generalManager} />
                        </div>
                    </section>

                    <section className="erp-panel p-6">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{text.mainDepartments}</h3>
                            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{departments.length}</span>
                        </div>

                        {departments.length === 0 ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                                {text.noDepartments}
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {departments.map((department) => (
                                    <DepartmentCard key={department.id ?? department.code} department={department} text={text} language={language} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DepartmentCard({ department, text, language }) {
    const positions = department.positions ?? [];
    const units = department.units ?? [];
    const children = department.child_departments ?? [];
    const coverage = Math.max(0, Math.min(100, Math.round(Number(department.coverage ?? 0))));

    return (
        <article className="overflow-hidden rounded-lg border border-teal-300 bg-white shadow-sm ring-1 ring-teal-100">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="border-b border-teal-200 bg-teal-50 px-5 py-4 lg:border-e lg:border-b-0">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                        <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h4 className="max-w-full truncate text-xl font-black text-slate-950">{localizedName(department, language)}</h4>
                                <span className="inline-flex h-7 max-w-full items-center justify-center truncate rounded-md bg-white px-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{department.code}</span>
                            </div>
                            <div className="mt-2 max-w-full truncate text-xs font-semibold text-slate-500">
                                {text.directManager}: <span className="text-slate-800">{department.direct_manager?.name ?? text.noManager}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('employee-coding.department', department.id)} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                                {text.codeEmployees}
                            </Link>
                            <Link href={route('employee-coding-coverage.index')} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                {text.coverageDetails}
                            </Link>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_72px] sm:items-center">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className={coverage >= 90 ? 'h-full bg-emerald-600' : coverage >= 60 ? 'h-full bg-amber-500' : 'h-full bg-rose-600'} style={{ width: `${coverage}%` }} />
                        </div>
                        <div className="h-9 rounded-md bg-white px-2 py-1 text-center ring-1 ring-slate-200">
                            <div className="text-sm font-black text-slate-950">{coverage}%</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-teal-50/40 p-4">
                    <Metric label={text.approved} value={department.required ?? 0} compact />
                    <Metric label={text.current} value={department.current ?? 0} compact />
                    <Metric label={text.vacant} value={department.vacant ?? 0} tone="danger" compact />
                    <Metric label={text.surplus} value={department.surplus ?? 0} tone="warning" compact />
                </div>
            </div>

            <ProductionPlanningTree department={department} text={text} language={language} />
        </article>
    );
}

function ProductionPlanningTree({ department, text, language }) {
    const positions = department.positions ?? [];
    const units = department.units ?? [];
    const children = department.child_departments ?? [];
    const branchCount = units.length + children.length;

    return (
        <div className="p-5">
            <div className="overflow-hidden rounded-lg border border-teal-200 bg-teal-50/60 px-4 pb-5 pt-4">
                <TreeBox
                    title={localizedName(department, language)}
                    code={department.code}
                    manager={department.direct_manager?.name ?? text.noManager}
                    text={text}
                    tone="root"
                />

                <PositionTreeGroup positions={positions} text={text} language={language} root />

                {branchCount > 0 && (
                    <div className="relative mt-8 pt-8">
                        <div className="absolute start-1/2 top-0 h-8 w-px -translate-x-1/2 bg-teal-400" />
                        {branchCount > 1 && <div className="absolute start-0 end-0 top-8 hidden h-px bg-teal-300 lg:block" />}
                        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                            {units.map((unit) => (
                                <UnitTreeNode key={unit.id ?? unit.code} unit={unit} text={text} language={language} />
                            ))}
                            {children.map((child) => (
                                <DepartmentTreeNode key={child.id ?? child.code} department={child} text={text} language={language} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function UnitTreeNode({ unit, text, language }) {
    const children = unit.children ?? [];
    const positions = unit.positions ?? [];

    return (
        <div className="relative min-w-0 pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:-translate-x-1/2 before:bg-teal-300">
            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <TreeBox title={unit.name} code={unit.code} text={text} compact />
                    <Link href={route('employee-coding.department', { department: unit.department_id, unit: unit.code })} className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800">
                        {text.codeEmployees}
                    </Link>
                </div>

                <PositionTreeGroup positions={positions} text={text} language={language} />

                {children.length > 0 && (
                    <div className="relative mt-5 grid gap-3 pt-6 sm:grid-cols-2">
                        <div className="absolute start-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
                        {children.length > 1 && <div className="absolute start-0 end-0 top-6 hidden h-px bg-slate-200 sm:block" />}
                        {children.map((child) => (
                            <div key={child.id ?? child.code} className="relative min-w-0 pt-5 before:absolute before:start-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-slate-200">
                                <TreeBox title={child.name} code={child.code} text={text} compact muted />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DepartmentTreeNode({ department, text, language }) {
    const units = department.units ?? [];
    const children = department.child_departments ?? [];
    const branchCount = units.length + children.length;

    return (
        <div className="relative min-w-0 pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:-translate-x-1/2 before:bg-teal-300">
            <div className="min-w-0 overflow-hidden rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
                <TreeBox
                    title={localizedName(department, language)}
                    code={department.code}
                    manager={department.direct_manager?.name ?? text.noManager}
                    text={text}
                />

                <PositionTreeGroup positions={department.positions ?? []} text={text} language={language} />

                {branchCount > 0 && (
                    <div className="relative mt-5 grid gap-3 pt-6">
                        <div className="absolute start-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
                        {units.map((unit) => (
                            <UnitTreeNode key={unit.id ?? unit.code} unit={unit} text={text} language={language} />
                        ))}
                        {children.map((child) => (
                            <DepartmentTreeNode key={child.id ?? child.code} department={child} text={text} language={language} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TreeBox({ title, code, manager, text, tone = 'default', compact = false, muted = false }) {
    const toneClass = tone === 'root'
        ? 'border-teal-300 bg-white shadow-sm'
        : muted
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-200 bg-white';

    return (
        <div className={`mx-auto min-w-0 overflow-hidden rounded-md border px-3 py-2 text-center ${compact ? 'w-full' : 'max-w-xl'} ${toneClass}`}>
            <div className={`${compact ? 'text-sm' : 'text-base'} truncate font-black text-slate-950`}>{title}</div>
            {code && <div className="mt-1 truncate text-xs font-bold text-slate-500">{code}</div>}
            {manager && (
                <div className="mt-2 truncate text-xs font-semibold text-slate-600">
                    {text.directManager}: <span className="text-slate-900">{manager}</span>
                </div>
            )}
        </div>
    );
}

function UnitCard({ unit, text, language }) {
    const children = unit.children ?? [];
    const positions = unit.positions ?? [];

    return (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                    <h5 className="truncate text-sm font-black text-slate-950">{unit.name}</h5>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{unit.code}</div>
                </div>
                <Link href={route('employee-coding.department', { department: unit.department_id, unit: unit.code })} className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800">
                    {text.codeEmployees}
                </Link>
            </div>

            {children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {children.map((child) => (
                        <span key={child.id ?? child.code} className="max-w-full truncate rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                            {child.name}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3">
                {positions.length > 0 ? <PositionGrid positions={positions} text={text} language={language} /> : <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-500">{text.emptyPositions}</div>}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h5 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">{title}</h5>
            {children}
        </section>
    );
}

function PositionGrid({ positions, text, language }) {
    return (
        <div className="grid gap-2">
            {positions.map((position) => (
                <div key={position.id} className="grid min-h-11 gap-2 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-2 sm:grid-cols-[minmax(0,1fr)_108px] sm:items-center">
                    <span className="truncate text-sm font-semibold text-slate-800">{localizedName(position, language)}</span>
                    <div className="grid grid-cols-3 gap-1">
                        <Chip tone="success" title={text.approved}>{position.approved}</Chip>
                        <Chip tone="info" title={text.current}>{position.current ?? 0}</Chip>
                        <Chip tone="danger" title={text.vacant}>{position.vacant ?? 0}</Chip>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PositionTreeGroup({ positions, text, language, root = false }) {
    if (!positions.length) {
        return <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{text.emptyPositions}</div>;
    }

    return (
        <div className={`${root ? 'mx-auto max-w-4xl' : ''} relative mt-5 pt-6`}>
            <div className="absolute start-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
            {positions.length > 1 && <div className="absolute start-0 end-0 top-6 hidden h-px bg-slate-200 sm:block" />}
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {positions.map((position) => (
                    <div key={position.id} className="relative min-w-0 pt-5 before:absolute before:start-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-slate-200">
                        <div className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="truncate text-xs font-black text-slate-800">{localizedName(position, language)}</div>
                            <div className="mt-2 grid grid-cols-3 gap-1">
                                <Chip tone="success" title={text.approved}>{position.approved}</Chip>
                                <Chip tone="info" title={text.current}>{position.current ?? 0}</Chip>
                                <Chip tone="danger" title={text.vacant}>{position.vacant ?? 0}</Chip>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Metric({ label, value, tone = 'default', compact = false }) {
    const colors = {
        default: 'border-slate-200 bg-white text-slate-950',
        danger: 'border-rose-200 bg-rose-50 text-rose-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
    };

    return (
        <div className={`min-h-16 overflow-hidden rounded-md border px-3 py-2 ${colors[tone] ?? colors.default}`}>
            <div className="truncate text-xs font-bold text-slate-500">{label}</div>
            <div className={`${compact ? 'text-lg' : 'text-2xl'} mt-1 font-black`}>{value}</div>
        </div>
    );
}

function ManagerCard({ label, manager }) {
    return (
        <div className="min-h-16 overflow-hidden rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-white">
            <div className="truncate text-xs font-bold text-slate-300">{label}</div>
            <div className="mt-1 truncate text-lg font-black">{manager}</div>
        </div>
    );
}

function Chip({ title, tone = 'default', children }) {
    const colors = {
        success: 'bg-emerald-50 text-emerald-800',
        info: 'bg-sky-50 text-sky-800',
        danger: 'bg-rose-50 text-rose-800',
        default: 'bg-slate-100 text-slate-700',
    };

    return (
        <span title={title} className={`inline-flex h-7 min-w-0 items-center justify-center rounded-md px-2 text-xs font-black ${colors[tone] ?? colors.default}`}>
            {children}
        </span>
    );
}

function localizedName(item, language) {
    if (!item) {
        return '';
    }

    if (language === 'ar') {
        return item.name_ar ?? item.name ?? item.name_en ?? '';
    }

    return item.name_en ?? item.name ?? item.name_ar ?? '';
}

function isProductionPlanningDepartment(department) {
    const value = [
        department?.code,
        department?.name,
        department?.name_ar,
        department?.name_en,
    ].filter(Boolean).join(' ').toLowerCase();

    return value.includes('production_planning')
        || value.includes('production')
        || value.includes('planning')
        || value.includes('انتاج')
        || value.includes('إنتاج')
        || value.includes('تخطيط');
}

function departmentTotals(departments) {
    return flattenDepartments(departments).reduce((carry, department) => ({
        departments: carry.departments + 1,
        required: carry.required + Number(department.required ?? 0),
        current: carry.current + Number(department.current ?? 0),
        vacant: carry.vacant + Number(department.vacant ?? 0),
    }), { departments: 0, required: 0, current: 0, vacant: 0 });
}

function flattenDepartments(departments) {
    return departments.flatMap((department) => [
        department,
        ...flattenDepartments(department.child_departments ?? []),
    ]);
}

