import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'الهيكل التنظيمي',
        subtitle: 'عرض رسمي يوضح الإدارة العليا، المدير العام، الإدارات الرئيسية، الأقسام الفرعية، والوظائف المعتمدة.',
        approvedPositions: 'الوظائف المعتمدة',
        topManagement: 'الإدارة العليا',
        generalManager: 'المدير العام',
        departments: 'الإدارات الرئيسية',
        units: 'الأقسام الفرعية',
        subStores: 'المخازن الفرعية',
        jobs: 'الوظائف',
        leadership: 'إدارة القسم',
        approved: 'معتمد',
        current: 'حالي',
        shortage: 'عجز',
        surplus: 'فائض',
        openRequests: 'طلبات مفتوحة',
        noPositions: 'لا توجد وظائف معتمدة داخل هذا الجزء.',
    },
    en: {
        title: 'Organization Structure',
        subtitle: 'Official view for top management, the general manager, main departments, units, and approved jobs.',
        approvedPositions: 'Approved Positions',
        topManagement: 'Top Management',
        generalManager: 'General Manager',
        departments: 'Main Departments',
        units: 'Units',
        subStores: 'Sub Stores',
        jobs: 'Jobs',
        leadership: 'Department Leadership',
        approved: 'Approved',
        current: 'Current',
        shortage: 'Shortage',
        surplus: 'Surplus',
        openRequests: 'Open Requests',
        noPositions: 'No approved positions in this section.',
    },
};

export default function OrganizationStructure({ auth, tree, metrics }) {
    const { isRtl, text } = useLanguage(labels);
    const departments = tree.children ?? [];

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <Link href={route('approved-positions.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                                {text.approvedPositions}
                            </Link>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <Kpi label={text.approved} value={metrics.approved} tone="slate" />
                            <Kpi label={text.current} value={metrics.current} tone="emerald" />
                            <Kpi label={text.shortage} value={metrics.shortage} tone="amber" />
                            <Kpi label={text.surplus} value={metrics.surplus} tone="rose" />
                            <Kpi label={text.openRequests} value={metrics.openRequests} tone="sky" />
                        </div>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex justify-center">
                            <div className="rounded-lg border-2 border-slate-900 bg-slate-900 px-8 py-4 text-center text-white shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">{text.topManagement}</div>
                                <div className="mt-1 text-xl font-black">{text.generalManager}</div>
                            </div>
                        </div>

                        <div className="mx-auto h-8 w-px bg-slate-300" />
                        <div className="mb-5 text-center text-sm font-bold text-slate-500">{text.departments}</div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            {departments.map((department) => (
                                <DepartmentCard key={department.id} department={department} text={text} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DepartmentCard({ department, text }) {
    const units = department.children ?? [];
    const departmentPositions = department.positions ?? [];
    const hasSingleMainUnit = units.length === 1 && units[0].code === 'main';
    const isProductionPlanning = department.code === 'production_planning';

    return (
        <article className={`rounded-lg border bg-white shadow-sm ${isProductionPlanning ? 'border-slate-400 lg:col-span-2' : 'border-slate-200'}`}>
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-black text-slate-950">{department.name}</h4>
                    <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        {units.length} {text.units}
                    </span>
                </div>
            </div>

            <div className="space-y-4 p-5">
                {departmentPositions.length > 0 && !isProductionPlanning && (
                    <ProductionLeadership positions={departmentPositions} text={text} />
                )}

                {hasSingleMainUnit ? (
                    <UnitBody unit={units[0]} text={text} compact />
                ) : isProductionPlanning ? (
                    <ProductionPlanningTree department={department} positions={departmentPositions} text={text} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {units.map((unit) => (
                            <UnitPanel key={unit.id} unit={unit} text={text} />
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}

function ProductionPlanningTree({ department, positions, text }) {
    const nodes = department.children ?? [];

    return (
        <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            {positions.length > 0 && (
                <div className="mb-5">
                    <ProductionLeadership positions={positions} text={text} />
                </div>
            )}

            <div className="flex justify-center">
                <div className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{text.departments}</div>
                    <div className="mt-1 text-lg font-black text-slate-950">{department.name}</div>
                </div>
            </div>

            {nodes.length > 0 && (
                <>
                    <div className="mx-auto h-6 w-px bg-slate-300" />
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {nodes.map((node) => (
                            <TreeNode key={node.id} node={node} text={text} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function TreeNode({ node, text }) {
    const children = node.children ?? [];
    const subNodes = children.filter((child) => child.type !== 'position');
    const positions = [...(node.positions ?? []), ...children.filter((child) => child.type === 'position')];

    return (
        <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-slate-300" />
            <div className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-black text-white">
                {node.name}
            </div>

            {positions.length > 0 && (
                <div className="mt-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{text.jobs}</div>
                    <PositionGrid positions={positions} text={text} />
                </div>
            )}

            {subNodes.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {subNodes.map((child) => (
                        <TreeNode key={child.id} node={child} text={text} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProductionLeadership({ positions, text }) {
    return (
        <section className="rounded-lg border border-slate-300 bg-slate-50 p-4">
            <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h5 className="text-base font-black text-slate-950">{text.leadership}</h5>
            </div>
            <PositionGrid positions={positions} text={text} management />
        </section>
    );
}

function ProductionUnitPanel({ unit, text }) {
    return (
        <section className="min-h-full rounded-lg border border-slate-300 bg-slate-50 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
                <h5 className="text-base font-black text-slate-950">{unit.name}</h5>
                <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{text.jobs}</span>
            </div>
            <div className="p-4">
                <UnitBody unit={unit} text={text} production />
            </div>
        </section>
    );
}

function UnitPanel({ unit, text }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h5 className="font-black text-slate-900">{unit.name}</h5>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{text.jobs}</span>
            </div>
            <UnitBody unit={unit} text={text} />
        </div>
    );
}

function UnitBody({ unit, text, compact = false, production = false, management = false }) {
    const children = unit.children ?? [];
    const subUnits = children.filter((child) => child.type === 'unit');
    const positions = children.filter((child) => child.type === 'position');

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {subUnits.length > 0 && (
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{text.subStores}</div>
                    <div className="flex flex-wrap gap-2">
                        {subUnits.map((unitNode) => (
                            <span key={unitNode.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                {unitNode.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{text.jobs}</div>
                <PositionGrid positions={positions} text={text} production={production} management={management} />
            </div>
        </div>
    );
}

function PositionGrid({ positions, text, production = false, management = false }) {
    if (positions.length === 0) {
        return <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{text.noPositions}</div>;
    }

    return (
        <div className={`grid gap-2 ${production ? 'md:grid-cols-2' : ''} ${management ? 'md:grid-cols-2' : ''}`}>
            {positions.map((position) => (
                <div key={position.id} className="grid min-h-10 gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <span className="min-w-0 text-sm font-semibold text-slate-800">{position.name}</span>
                    <span className="inline-flex min-w-[96px] shrink-0 items-center justify-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800">
                        <span>{text.approved}</span>
                        <span>{position.approvedHeadcount}</span>
                    </span>
                </div>
            ))}
        </div>
    );
}

function Kpi({ label, value, tone }) {
    const tones = {
        slate: 'border-slate-200 bg-white text-slate-950',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        amber: 'border-amber-200 bg-amber-50 text-amber-900',
        rose: 'border-rose-200 bg-rose-50 text-rose-900',
        sky: 'border-sky-200 bg-sky-50 text-sky-900',
    };

    return (
        <div className={`rounded-md border p-4 ${tones[tone] ?? tones.slate}`}>
            <div className="text-sm opacity-75">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
        </div>
    );
}
