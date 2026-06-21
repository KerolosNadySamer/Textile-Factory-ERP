import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ApprovalBadge } from '@/Components/CustomerTrustBadges';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'إعداد وتوزيع الأقسام',
        subtitle: 'لوحة واحدة لتكويد الأقسام، ضبط الأعداد المعتمدة، والدخول مباشرة إلى تكويد الموظفين داخل كل قسم.',
        newDepartment: 'تكويد قسم رئيسي جديد',
        newUnit: 'تكويد قسم فرعي جديد',
        departmentName: 'اسم القسم',
        departmentCode: 'رقم القسم',
        autoDepartmentCode: 'يتولد تلقائيًا من الاسم الإنجليزي بدون ترقيم رقمي',
        departmentNameAr: 'اسم القسم عربي',
        departmentNameEn: 'اسم القسم إنجليزي',
        departmentType: 'نوع القسم',
        parentDepartment: 'القسم الرئيسي',
        positionsSetup: 'الوظائف المعتمدة داخل القسم',
        addPosition: 'إضافة وظيفة',
        removePosition: 'حذف الوظيفة',
        positionName: 'اسم الوظيفة',
        positionNameAr: 'اسم الوظيفة عربي',
        positionNameEn: 'اسم الوظيفة إنجليزي',
        positionOrder: 'الترتيب',
        allowSystemLogin: 'يسمح بحساب نظام',
        approvedHeadcount: 'العدد المعتمد',
        departmentApprovedHeadcount: 'عدد موظفي القسم المعتمد',
        departmentApprovedHeadcountHint: 'لا يمكن أن يقل عن مجموع أعداد الوظائف المعتمدة داخل القسم.',
        noWorkerDepartmentsHint: 'الأقسام الإدارية لا تستخدم وظيفة عامل؛ استخدم وظائف إدارية أو تخصصية فقط.',
        totalApprovedHeadcount: 'إجمالي الاعتماد',
        saveDepartment: 'حفظ القسم',
        saveUnit: 'حفظ القسم الفرعي',
        administrative: 'إداري',
        productive: 'إنتاجي',
        service: 'خدمي',
        technical: 'تقني',
        custom: 'مخصص',
        required: 'المعتمد',
        current: 'الحالي',
        vacant: 'العجز',
        surplus: 'الفائض',
        coverage: 'التغطية',
        directManager: 'مدير القسم',
        noManager: 'لم يتم ربط مدير بعد',
        codeEmployees: 'تكويد الموظفين',
        distribute: 'تغطية وتوزيع',
        positions: 'الوظائف',
        subDepartments: 'الأقسام الفرعية',
        update: 'تحديث',
        emptyPositions: 'لا توجد وظائف مفعلة داخل هذا الجزء بعد.',
        emptyUnits: 'لا توجد أقسام فرعية.',
        rootPositions: 'وظائف الإدارة الرئيسية',
        success: 'تم الحفظ بنجاح.',
        positionHint: 'مثال: مدير القسم أو فني صباغة',
        costNature: 'طبيعة التكلفة',
        directCost: 'تكلفة مباشرة',
        indirectCost: 'تكلفة غير مباشرة',
        departmentStatus: 'حالة القسم',
        pendingGeneralManager: 'بانتظار اعتماد المدير العام',
        approveDepartment: 'اعتماد القسم',
        rejectDepartment: 'رفض وحذف القسم',
        addPositionToDepartment: 'تكويد وظيفة داخل القسم',
        draft: 'تحت الإنشاء',
        active: 'نشط',
        paused: 'موقوف',
        cancelled: 'ملغي',
        archived: 'مؤرشف',
        linkedModules: 'الأنظمة المرتبطة',
        systemRole: 'الدور التلقائي لحسابات القسم',
        noSystemRole: 'بدون دور نظام تلقائي',
        createdInfo: 'بيانات الإنشاء',
        createdBy: 'أنشأه',
        createdAt: 'تاريخ ووقت الإنشاء',
        editDepartment: 'تعديل القسم',
        cancelDepartment: 'إلغاء القسم',
        hardDeleteDepartment: 'حذف نهائي',
        cancel: 'إلغاء',
        exportEmployees: 'تصدير الموظفين Excel',
        confirmCancelDepartment: 'سيتم إلغاء القسم وكل التفرعات المرتبطة به دون حذف البيانات التاريخية.',
        confirmHardDelete: 'الحذف النهائي لا يعمل إلا إذا كان القسم بدون موظفين وبدون وظائف وبدون أقسام فرعية. هل تريد المتابعة؟',
        branchCount: 'الأقسام الفرعية',
        employeeCount: 'الموظفون',
        parent: 'الأب',
        operatingPower: 'القوة التشغيلية',
        mainDepartment: 'قسم رئيسي',
        saveChanges: 'حفظ التعديل',
    },
    en: {
        title: 'Department Staffing',
        subtitle: 'One workspace for department coding, approved headcount, and employee coding links.',
        newDepartment: 'Code New Main Department',
        newUnit: 'Code New Subdepartment',
        departmentName: 'Department Name',
        departmentCode: 'Department Code',
        autoDepartmentCode: 'Generated from the English name without numeric sequencing',
        departmentNameAr: 'Arabic Name',
        departmentNameEn: 'English Name',
        departmentType: 'Department Type',
        parentDepartment: 'Main Department',
        positionsSetup: 'Approved Positions',
        addPosition: 'Add Position',
        removePosition: 'Remove Position',
        positionName: 'Position Name',
        positionNameAr: 'Arabic Position Name',
        positionNameEn: 'English Position Name',
        positionOrder: 'Order',
        allowSystemLogin: 'Allow System Login',
        approvedHeadcount: 'Approved Headcount',
        departmentApprovedHeadcount: 'Department Approved Headcount',
        departmentApprovedHeadcountHint: 'Cannot be less than the approved positions inside this department.',
        noWorkerDepartmentsHint: 'Administrative departments do not use worker jobs; use administrative or specialist positions only.',
        totalApprovedHeadcount: 'Total Approved',
        saveDepartment: 'Save Department',
        saveUnit: 'Save Subdepartment',
        administrative: 'Administrative',
        productive: 'Productive',
        service: 'Service',
        technical: 'Technical',
        custom: 'Custom',
        required: 'Approved',
        current: 'Current',
        vacant: 'Vacant',
        surplus: 'Surplus',
        coverage: 'Coverage',
        directManager: 'Department Manager',
        noManager: 'No manager linked yet',
        codeEmployees: 'Code Employees',
        distribute: 'Coverage & Distribution',
        positions: 'Positions',
        subDepartments: 'Subdepartments',
        update: 'Update',
        emptyPositions: 'No active positions here yet.',
        emptyUnits: 'No subdepartments.',
        rootPositions: 'Main Management Positions',
        success: 'Saved successfully.',
        positionHint: 'Example: Department Manager or Dyeing Technician',
        costNature: 'Cost Nature',
        directCost: 'Direct Cost',
        indirectCost: 'Indirect Cost',
        departmentStatus: 'Department Status',
        pendingGeneralManager: 'Pending General Manager Approval',
        approveDepartment: 'Approve Department',
        rejectDepartment: 'Reject & Delete Department',
        addPositionToDepartment: 'Code Position In Department',
        draft: 'Under Construction',
        active: 'Active',
        paused: 'Paused',
        cancelled: 'Cancelled',
        archived: 'Archived',
        linkedModules: 'Linked Modules',
        systemRole: 'Automatic System Role',
        noSystemRole: 'No automatic system role',
        createdInfo: 'Creation Info',
        createdBy: 'Created By',
        createdAt: 'Created At',
        editDepartment: 'Edit Department',
        cancelDepartment: 'Cancel Department',
        hardDeleteDepartment: 'Hard Delete',
        cancel: 'Cancel',
        exportEmployees: 'Export Employees Excel',
        confirmCancelDepartment: 'This will cancel the department and all linked branches without deleting historical data.',
        confirmHardDelete: 'Hard delete works only when the department has no employees, positions, or subdepartments. Continue?',
        branchCount: 'Subdepartments',
        employeeCount: 'Employees',
        parent: 'Parent',
        operatingPower: 'Operating Power',
        mainDepartment: 'Main Department',
        saveChanges: 'Save Changes',
    },
};

const moduleLabels = {
    accounting: { ar: 'الحسابات', en: 'Accounting' },
    cost_accounting: { ar: 'محاسبة التكاليف', en: 'Cost Accounting' },
    sales: { ar: 'المبيعات', en: 'Sales' },
    customers: { ar: 'العملاء', en: 'Customers' },
    purchasing: { ar: 'المشتريات', en: 'Purchasing' },
    suppliers: { ar: 'الموردون', en: 'Suppliers' },
    inventory: { ar: 'المخازن', en: 'Inventory' },
    stock_counts: { ar: 'الجرد', en: 'Stock Counts' },
    production: { ar: 'الإنتاج', en: 'Production' },
    quality: { ar: 'الجودة', en: 'Quality' },
    hr: { ar: 'الموارد البشرية', en: 'HR' },
    it: { ar: 'تكنولوجيا المعلومات', en: 'IT' },
    payroll: { ar: 'المرتبات', en: 'Payroll' },
    reports: { ar: 'التقارير', en: 'Reports' },
};

export default function DepartmentStaffing({ auth, flash, departments = [], mainDepartments = [], moduleOptions = [], roleOptions = [] }) {
    const { language, isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user?.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canCreateDepartment = ['admin', 'general_manager', 'hr'].includes(auth.user?.role?.slug)
        || ['general_manager', 'hr_manager', 'hr_officer'].includes(auth.user?.position?.code);
    const canDeleteDepartment = auth.role === 'admin' || auth.user?.role?.slug === 'admin' || permissions.includes('delete_department');
    const isAdmin = auth.role === 'admin' || auth.user?.role?.slug === 'admin';
    const canHardDeleteDepartment = canDeleteDepartment;
    const canApproveDepartment = ['admin', 'general_manager'].includes(auth.user?.role?.slug) || auth.user?.position?.code === 'general_manager';
    const canCodeDepartmentPositions = ['admin', 'general_manager', 'hr'].includes(auth.user?.role?.slug) || ['general_manager', 'hr_manager', 'hr_officer'].includes(auth.user?.position?.code);
    const totals = departments.reduce((carry, department) => ({
        required: carry.required + Number(department.required ?? 0),
        current: carry.current + Number(department.current ?? 0),
        vacant: carry.vacant + Number(department.vacant ?? 0),
        surplus: carry.surplus + Number(department.surplus ?? 0),
    }), { required: 0, current: 0, vacant: 0, surplus: 0 });

    const coverage = totals.required > 0 ? Math.round(Math.min(totals.current, totals.required) / totals.required * 100) : 0;

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
                            <div className="flex flex-wrap gap-2">
                                <Link href={route('master-data.departments')} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                                    {text.codeEmployees}
                                </Link>
                                <Link href={route('employee-coding-coverage.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                                    {text.distribute}
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-5">
                            <Metric label={text.required} value={totals.required} />
                            <Metric label={text.current} value={totals.current} />
                            <Metric label={text.vacant} value={totals.vacant} tone="danger" />
                            <Metric label={text.surplus} value={totals.surplus} tone="warning" />
                            <Metric label={text.coverage} value={`${coverage}%`} tone="success" />
                        </div>
                    </section>

                    {flash?.success && <Alert tone="success">{flash.success || text.success}</Alert>}
                    {flash?.error && <Alert tone="danger">{flash.error}</Alert>}

                    {canCreateDepartment && (
                        <section className="grid gap-4 lg:grid-cols-2">
                            <NewDepartmentForm text={text} language={language} moduleOptions={moduleOptions} roleOptions={roleOptions} />
                            <NewUnitForm text={text} language={language} departments={mainDepartments} moduleOptions={moduleOptions} roleOptions={roleOptions} />
                        </section>
                    )}

                    <section className="space-y-5">
                        {departments.map((department) => (
                            <DepartmentCard key={department.id} department={department} departments={mainDepartments} text={text} language={language} moduleOptions={moduleOptions} roleOptions={roleOptions} canDeleteDepartment={canDeleteDepartment} canHardDeleteDepartment={canHardDeleteDepartment} canApproveDepartment={canApproveDepartment} canCodeDepartmentPositions={canCodeDepartmentPositions} isAdmin={isAdmin} user={auth.user} />
                        ))}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function NewDepartmentForm({ text, language, moduleOptions, roleOptions }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        department_type: 'administrative',
        cost_nature: 'indirect',
        required_headcount: 0,
        linked_modules: [],
        system_role_id: '',
        positions: [blankPositionRow()],
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('department-staffing.departments.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="erp-panel">
            <h3 className="text-lg font-bold text-slate-950">{text.newDepartment}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label={text.departmentNameAr} error={errors.name_ar} required>
                    <input value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="form-input w-full" required />
                </Field>
                <Field label={text.departmentNameEn} error={errors.name_en} required>
                    <input value={data.name_en} dir="ltr" onChange={(event) => setData('name_en', event.target.value)} className="form-input w-full" required />
                </Field>
                <AutoCodePreview text={text} englishName={data.name_en} />
                <Field label={text.departmentType} error={errors.department_type}>
                    <select value={data.department_type} onChange={(event) => setData('department_type', event.target.value)} className="form-input w-full">
                        <option value="administrative">{text.administrative}</option>
                        <option value="productive">{text.productive}</option>
                        <option value="service">{text.service}</option>
                        <option value="technical">{text.technical}</option>
                    </select>
                </Field>
                <Field label={text.costNature} error={errors.cost_nature}>
                    <select value={data.cost_nature} onChange={(event) => setData('cost_nature', event.target.value)} className="form-input w-full">
                        <option value="direct">{text.directCost}</option>
                        <option value="indirect">{text.indirectCost}</option>
                    </select>
                </Field>
                <Field label={text.departmentApprovedHeadcount} error={errors.required_headcount}>
                    <input type="number" min="0" max="9999" value={data.required_headcount} onChange={(event) => setData('required_headcount', event.target.value)} className="form-input w-full" />
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">{text.departmentApprovedHeadcountHint}</div>
                </Field>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">{text.pendingGeneralManager}</div>
            </div>
            <DepartmentPositionRows
                text={text}
                positions={data.positions}
                errors={errors}
                onChange={(positions) => setData('positions', positions)}
            />
            <ModuleCheckboxes text={text} language={language} moduleOptions={moduleOptions} selected={data.linked_modules} onChange={(next) => setData('linked_modules', next)} />
            <RoleSelect text={text} language={language} roles={roleOptions} value={data.system_role_id} error={errors.system_role_id} onChange={(value) => setData('system_role_id', value)} />
            <button type="submit" disabled={processing} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                {text.saveDepartment}
            </button>
        </form>
    );
}

function NewUnitForm({ text, language, departments, moduleOptions, roleOptions }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        department_id: departments[0]?.id ?? '',
        name_ar: '',
        name_en: '',
        department_type: 'administrative',
        cost_nature: 'indirect',
        required_headcount: 0,
        linked_modules: [],
        system_role_id: '',
        positions: [blankPositionRow()],
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('department-staffing.units.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('name_ar', 'name_en', 'required_headcount', 'linked_modules', 'system_role_id');
                setData('positions', [blankPositionRow()]);
            },
        });
    };

    return (
        <form onSubmit={submit} className="erp-panel">
            <h3 className="text-lg font-bold text-slate-950">{text.newUnit}</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label={text.parentDepartment} error={errors.department_id} required>
                    <select value={data.department_id} onChange={(event) => setData('department_id', event.target.value)} className="form-input w-full" required>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>{departmentOptionLabel(department, language)}</option>
                        ))}
                    </select>
                </Field>
                <Field label={text.departmentNameAr} error={errors.name_ar} required>
                    <input value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="form-input w-full" required />
                </Field>
                <Field label={text.departmentNameEn} error={errors.name_en} required>
                    <input value={data.name_en} dir="ltr" onChange={(event) => setData('name_en', event.target.value)} className="form-input w-full" required />
                </Field>
                <AutoCodePreview text={text} englishName={data.name_en} />
                <Field label={text.departmentType} error={errors.department_type}>
                    <select value={data.department_type} onChange={(event) => setData('department_type', event.target.value)} className="form-input w-full">
                        <option value="administrative">{text.administrative}</option>
                        <option value="productive">{text.productive}</option>
                        <option value="service">{text.service}</option>
                        <option value="technical">{text.technical}</option>
                    </select>
                </Field>
                <Field label={text.costNature} error={errors.cost_nature}>
                    <select value={data.cost_nature} onChange={(event) => setData('cost_nature', event.target.value)} className="form-input w-full">
                        <option value="direct">{text.directCost}</option>
                        <option value="indirect">{text.indirectCost}</option>
                    </select>
                </Field>
                <Field label={text.departmentApprovedHeadcount} error={errors.required_headcount}>
                    <input type="number" min="0" max="9999" value={data.required_headcount} onChange={(event) => setData('required_headcount', event.target.value)} className="form-input w-full" />
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">{text.departmentApprovedHeadcountHint}</div>
                </Field>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">{text.pendingGeneralManager}</div>
            </div>
            <DepartmentPositionRows
                text={text}
                positions={data.positions}
                errors={errors}
                onChange={(positions) => setData('positions', positions)}
            />
            <ModuleCheckboxes text={text} language={language} moduleOptions={moduleOptions} selected={data.linked_modules} onChange={(next) => setData('linked_modules', next)} />
            <RoleSelect text={text} language={language} roles={roleOptions} value={data.system_role_id} error={errors.system_role_id} onChange={(value) => setData('system_role_id', value)} />
            <button type="submit" disabled={processing} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                {text.saveUnit}
            </button>
        </form>
    );
}

function blankPositionRow() {
    return {
        name_ar: '',
        name_en: '',
        approved_headcount: 1,
        allow_system_login: true,
    };
}

function DepartmentPositionRows({ text, positions, errors, onChange }) {
    const updateRow = (index, key, value) => {
        onChange(positions.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
    };

    const addRow = () => {
        onChange([...positions, blankPositionRow()]);
    };

    const removeRow = (index) => {
        const next = positions.filter((_, rowIndex) => rowIndex !== index);
        onChange(next.length > 0 ? next : [blankPositionRow()]);
    };

    return (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h4 className="text-sm font-black text-slate-900">{text.positionsSetup}</h4>
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">{text.positionHint}</div>
                </div>
                <button type="button" onClick={addRow} className="w-fit rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    {text.addPosition}
                </button>
            </div>
            <div className="mt-3 space-y-3">
                {positions.map((position, index) => (
                    <div key={index} className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label={text.positionNameAr} error={errors[`positions.${index}.name_ar`]} compact>
                                <input value={position.name_ar} onChange={(event) => updateRow(index, 'name_ar', event.target.value)} className="form-input w-full" />
                            </Field>
                            <Field label={text.positionNameEn} error={errors[`positions.${index}.name_en`]} compact>
                                <input value={position.name_en} dir="ltr" onChange={(event) => updateRow(index, 'name_en', event.target.value)} className="form-input w-full" />
                            </Field>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-end">
                            <Field label={text.approvedHeadcount} error={errors[`positions.${index}.approved_headcount`]} compact>
                                <input type="number" min="0" value={position.approved_headcount} onChange={(event) => updateRow(index, 'approved_headcount', event.target.value)} className="form-input w-full" />
                            </Field>
                            <label className="flex h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                                <input type="checkbox" checked={Boolean(position.allow_system_login)} onChange={(event) => updateRow(index, 'allow_system_login', event.target.checked)} />
                                {text.allowSystemLogin}
                            </label>
                            <button type="button" onClick={() => removeRow(index)} className="h-10 w-fit rounded-md border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50">
                                {text.removePosition}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AutoCodePreview({ text, englishName }) {
    const preview = englishCodePreview(englishName);

    return (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-bold text-slate-500">{text.departmentCode}</div>
            <div className="mt-1 font-black tracking-wide text-slate-900" dir="ltr">{preview}</div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500">{text.autoDepartmentCode}</div>
        </div>
    );
}

function englishCodePreview(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'department';
}

function ModuleCheckboxes({ text, language, moduleOptions, selected, onChange }) {
    const toggle = (module) => {
        onChange(selected.includes(module)
            ? selected.filter((item) => item !== module)
            : [...selected, module]);
    };

    return (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-black text-slate-800">{text.linkedModules}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
                {moduleOptions.map((module) => (
                    <label key={module} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" checked={selected.includes(module)} onChange={() => toggle(module)} />
                        {moduleLabel(module, language)}
                    </label>
                ))}
            </div>
        </div>
    );
}

function RoleSelect({ text, language, roles, value, error, onChange }) {
    return (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <Field label={text.systemRole} error={error}>
                <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="form-input w-full">
                    <option value="">{text.noSystemRole}</option>
                    {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                            {roleLabel(role, language)} ({role.slug})
                        </option>
                    ))}
                </select>
            </Field>
        </div>
    );
}

function roleLabel(role, language) {
    if (language === 'ar') {
        return role?.name_ar ?? role?.name ?? role?.name_en ?? role?.slug ?? '';
    }

    return role?.name_en ?? role?.name ?? role?.name_ar ?? role?.slug ?? '';
}

function moduleLabel(module, language) {
    return moduleLabels[module]?.[language] ?? moduleLabels[module]?.en ?? String(module).replaceAll('_', ' ');
}

function statusLabel(status, text) {
    return {
        draft: text.draft,
        pending_general_manager: text.pendingGeneralManager,
        active: text.active,
        paused: text.paused,
        cancelled: text.cancelled,
        archived: text.archived,
    }[status] ?? text.active;
}

function localizedPositionName(position, language) {
    if (language === 'ar') {
        return position.name_ar ?? position.name ?? position.name_en ?? '';
    }

    return position.name_en ?? position.name ?? position.name_ar ?? '';
}

function localizedDepartmentName(department, language) {
    if (language === 'ar') {
        return department.name_ar ?? department.name ?? department.name_en ?? '';
    }

    return department.name_en ?? department.name ?? department.name_ar ?? '';
}

function secondaryDepartmentName(department, language) {
    if (language === 'ar') {
        return department.name_en ?? '';
    }

    return department.name_ar ?? department.name ?? '';
}

function departmentOptionLabel(department, language) {
    const primary = localizedDepartmentName(department, language);
    const secondary = secondaryDepartmentName(department, language);

    return secondary && secondary !== primary ? `${primary} - ${secondary}` : primary;
}

function DepartmentName({ department, language, size = 'lg', center = false }) {
    const primary = localizedDepartmentName(department, language);
    const secondary = secondaryDepartmentName(department, language);
    const primaryClass = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-xl';

    return (
        <div className={center ? 'text-center' : ''}>
            <div className={`min-w-0 font-black text-slate-950 ${primaryClass}`}>
                <span>{primary}</span>
                {secondary && secondary !== primary && (
                    <span className="ms-2 align-middle text-xs font-bold text-slate-500" dir={language === 'ar' ? 'ltr' : 'rtl'}>
                        {secondary}
                    </span>
                )}
            </div>
        </div>
    );
}

function departmentTreeStats(department) {
    const children = department.child_departments ?? [];
    const childStats = children.reduce((carry, child) => {
        const stats = departmentTreeStats(child);

        return {
            branches: carry.branches + stats.branches,
            employees: carry.employees + stats.employees,
        };
    }, { branches: children.length, employees: 0 });

    return {
        branches: childStats.branches,
        employees: childStats.employees + Number(department.current ?? 0),
    };
}

function departmentActionSummary(department, text) {
    const stats = departmentTreeStats(department);

    return `${text.branchCount}: ${stats.branches}\n${text.employeeCount}: ${stats.employees}`;
}

function DepartmentCard({ department, departments, text, language, moduleOptions, roleOptions, canDeleteDepartment, canHardDeleteDepartment, canApproveDepartment, canCodeDepartmentPositions, isAdmin = false, user = null }) {
    const [editing, setEditing] = useState(false);
    const canRequestChange = canRequestDepartmentChange(department, user);
    const ui = {
        edit: text.editDepartment,
        cancelDepartment: text.cancelDepartment,
        hardDeleteDepartment: text.hardDeleteDepartment,
        cancel: text.cancel,
        exportEmployees: text.exportEmployees,
    };

    const cancelTree = () => {
        const name = localizedDepartmentName(department, language);

        if (window.confirm(`${text.confirmCancelDepartment}\n\n${name}\n${departmentActionSummary(department, text)}`)) {
            router.patch(route('department-staffing.departments.cancel-tree', department.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const hardDelete = () => {
        const name = localizedDepartmentName(department, language);

        if (window.confirm(`${text.confirmHardDelete}\n\n${name}`)) {
            router.delete(route('department-staffing.departments.destroy', department.id), {
                preserveScroll: true,
            });
        }
    };

    const approveDepartment = () => {
        router.patch(route('department-staffing.departments.approve', department.id), {}, { preserveScroll: true });
    };

    const rejectDepartment = () => {
        const name = localizedDepartmentName(department, language);

        if (window.confirm(`${text.rejectDepartment}\n\n${name}`)) {
            router.patch(route('department-staffing.departments.reject', department.id), {}, { preserveScroll: true });
        }
    };

    return (
        <article className="erp-panel">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <DepartmentName department={department} language={language} />
                        {department.status === 'active' && <ApprovalBadge approved compact />}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{department.code}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                        {text.directManager}: <span className="font-semibold text-slate-800">{department.direct_manager?.name ?? text.noManager}</span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-500">
                        {text.createdInfo}: {text.createdAt}: {department.created_at ?? '-'} · {text.createdBy}: {department.creator?.name ?? '-'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        {department.parent && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{text.parent}: {departmentOptionLabel(department.parent, language)}</span>}
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">{department.type}</span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800">{department.cost_nature === 'direct' ? text.directCost : text.indirectCost}</span>
                        <span className={`rounded-full px-2.5 py-1 ${department.active ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{statusLabel(department.status, text)}</span>
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-white">
                            {text.systemRole}: {department.system_role ? roleLabel(department.system_role, language) : text.noSystemRole}
                        </span>
                        {(department.linked_modules ?? []).map((module) => (
                            <span key={module} className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-800">{moduleLabel(module, language)}</span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canEditDepartmentDetails(department, canApproveDepartment, user) && <button type="button" onClick={() => setEditing((current) => !current)} className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                        {editing ? ui.cancel : ui.edit}
                    </button>}
                    <Link href={route('employee-coding.department', department.id)} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                        {text.codeEmployees}
                    </Link>
                    <a href={route('exports.show', { type: 'employees', department_id: department.id, lang: language })} className="rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100">
                        {ui.exportEmployees}
                    </a>
                    <Link href={route('employee-coding-coverage.index')} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        {text.distribute}
                    </Link>
                    {canDeleteDepartment && (
                        <button type="button" onClick={cancelTree} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">
                            {ui.cancelDepartment}
                        </button>
                    )}
                    {canHardDeleteDepartment && (
                        <button type="button" onClick={hardDelete} className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100">
                            {ui.hardDeleteDepartment}
                        </button>
                    )}
                    {department.status === 'pending_general_manager' && canApproveDepartment && (
                        <>
                            <button type="button" onClick={approveDepartment} className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                                {text.approveDepartment}
                            </button>
                            <button type="button" onClick={rejectDepartment} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100">
                                {text.rejectDepartment}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {editing && (
                <EditDepartmentForm
                    department={department}
                    departments={departments}
                    text={text}
                    language={language}
                    moduleOptions={moduleOptions}
                    roleOptions={roleOptions}
                    onDone={() => setEditing(false)}
                />
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-5">
                <Metric label={text.required} value={department.required} />
                <Metric label={text.current} value={department.current} />
                <Metric label={text.vacant} value={department.vacant} tone="danger" />
                <Metric label={text.surplus} value={department.surplus} tone="warning" />
                <Metric label={text.operatingPower} value={`${department.coverage}%`} tone="success" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full ${department.coverage >= 90 ? 'bg-emerald-600' : department.coverage >= 60 ? 'bg-amber-500' : 'bg-rose-600'}`}
                    style={{ width: `${Math.max(0, Math.min(100, Number(department.coverage ?? 0)))}%` }}
                />
            </div>

            <StaffingDepartmentTree
                department={department}
                departments={departments}
                text={text}
                language={language}
                moduleOptions={moduleOptions}
                roleOptions={roleOptions}
                canDeleteDepartment={canDeleteDepartment}
                canHardDeleteDepartment={canHardDeleteDepartment}
                canApproveDepartment={canApproveDepartment}
                canCodeDepartmentPositions={canCodeDepartmentPositions}
                isAdmin={isAdmin}
                user={user}
            />
            {canEditDepartmentPositions(department, canCodeDepartmentPositions, isAdmin) && (
                <AddDepartmentPositionForm department={department} text={text} />
            )}
        </article>
    );
}

function StaffingDepartmentTree({ department, departments, text, language, moduleOptions, roleOptions, canDeleteDepartment, canHardDeleteDepartment, canApproveDepartment, canCodeDepartmentPositions, isAdmin = false, user = null }) {
    const units = department.units ?? [];
    const children = department.child_departments ?? [];
    const branchCount = units.length + children.length;
    const canRequestChange = canRequestDepartmentChange(department, user);

    return (
        <div className="mt-5 overflow-hidden rounded-lg border border-teal-200 bg-teal-50/60 px-4 pb-5 pt-4">
                <StaffingTreeBox
                    title={localizedDepartmentName(department, language)}
                    subtitle={secondaryDepartmentName(department, language)}
                    code={department.code}
                    manager={department.direct_manager?.name ?? text.noManager}
                    text={text}
                tone="root"
            />

            <StaffingPositionTree positions={department.positions ?? []} text={text} language={language} root isAdmin={isAdmin} canRequestChange={canRequestChange} />

            {branchCount === 0 ? (
                <div className="mt-5 rounded-md bg-white px-4 py-3 text-sm text-slate-500">{text.emptyUnits}</div>
            ) : (
                <div className="relative mt-8 pt-8">
                    <div className="absolute start-1/2 top-0 h-8 w-px -translate-x-1/2 bg-teal-400" />
                    {branchCount > 1 && <div className="absolute start-0 end-0 top-8 hidden h-px bg-teal-300 xl:block" />}
                    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                        {units.map((unit) => (
                            <StaffingUnitTreeNode key={unit.id} unit={unit} text={text} language={language} isAdmin={isAdmin} canRequestChange={canRequestChange} />
                        ))}
                        {children.map((child) => (
                            <StaffingDepartmentTreeNode
                                key={child.id}
                                department={child}
                                departments={departments}
                                text={text}
                                language={language}
                                moduleOptions={moduleOptions}
                                roleOptions={roleOptions}
                                canDeleteDepartment={canDeleteDepartment}
                                canHardDeleteDepartment={canHardDeleteDepartment}
                                canApproveDepartment={canApproveDepartment}
                                canCodeDepartmentPositions={canCodeDepartmentPositions}
                                isAdmin={isAdmin}
                                user={user}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StaffingDepartmentTreeNode({ department, departments, text, language, moduleOptions, roleOptions, canDeleteDepartment, canHardDeleteDepartment, canApproveDepartment, canCodeDepartmentPositions, isAdmin = false, user = null }) {
    const [editing, setEditing] = useState(false);
    const units = department.units ?? [];
    const children = department.child_departments ?? [];
    const branchCount = units.length + children.length;
    const canRequestChange = canRequestDepartmentChange(department, user);

    const cancelTree = () => {
        const name = localizedDepartmentName(department, language);

        if (window.confirm(`${text.confirmCancelDepartment}\n\n${name}\n${departmentActionSummary(department, text)}`)) {
            router.patch(route('department-staffing.departments.cancel-tree', department.id), {}, {
                preserveScroll: true,
            });
        }
    };

    const approveDepartment = () => {
        router.patch(route('department-staffing.departments.approve', department.id), {}, { preserveScroll: true });
    };

    const rejectDepartment = () => {
        const name = localizedDepartmentName(department, language);

        if (window.confirm(`${text.rejectDepartment}\n\n${name}`)) {
            router.patch(route('department-staffing.departments.reject', department.id), {}, { preserveScroll: true });
        }
    };

    const hardDelete = () => {
        const name = localizedDepartmentName(department, language);

        if (window.confirm(`${text.confirmHardDelete}\n\n${name}`)) {
            router.delete(route('department-staffing.departments.destroy', department.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="relative min-w-0 pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:-translate-x-1/2 before:bg-teal-300">
            <div className="min-w-0 overflow-hidden rounded-lg border border-teal-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                    <div>
                        <StaffingTreeBox
                            title={localizedDepartmentName(department, language)}
                            subtitle={secondaryDepartmentName(department, language)}
                            code={department.code}
                            manager={department.direct_manager?.name ?? text.noManager}
                            text={text}
                            compact
                        />
                        {department.status === 'active' && <ApprovalBadge approved compact />}
                        <div className="mt-2 inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                            {text.systemRole}: {department.system_role ? roleLabel(department.system_role, language) : text.noSystemRole}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canEditDepartmentDetails(department, canApproveDepartment, user) && <button type="button" onClick={() => setEditing((current) => !current)} className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                            {editing ? text.cancel : text.editDepartment}
                        </button>}
                        <Link href={route('employee-coding.department', department.id)} className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                            {text.codeEmployees}
                        </Link>
                        {canDeleteDepartment && (
                            <button type="button" onClick={cancelTree} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">
                                {text.cancelDepartment}
                            </button>
                        )}
                        {canHardDeleteDepartment && (
                            <button type="button" onClick={hardDelete} className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100">
                                {text.hardDeleteDepartment}
                            </button>
                        )}
                        {department.status === 'pending_general_manager' && canApproveDepartment && (
                            <>
                                <button type="button" onClick={approveDepartment} className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                                    {text.approveDepartment}
                                </button>
                                <button type="button" onClick={rejectDepartment} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100">
                                    {text.rejectDepartment}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {editing && (
                    <EditDepartmentForm
                        department={department}
                        departments={departments}
                        text={text}
                        language={language}
                        moduleOptions={moduleOptions}
                        roleOptions={roleOptions}
                        onDone={() => setEditing(false)}
                    />
                )}

                <StaffingPositionTree positions={department.positions ?? []} text={text} language={language} isAdmin={isAdmin} canRequestChange={canRequestChange} />
                {canEditDepartmentPositions(department, canCodeDepartmentPositions, isAdmin) && (
                    <AddDepartmentPositionForm department={department} text={text} />
                )}

                {branchCount > 0 && (
                    <div className="relative mt-5 grid gap-3 pt-6">
                        <div className="absolute start-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
                        {units.map((unit) => (
                            <StaffingUnitTreeNode key={unit.id} unit={unit} text={text} language={language} isAdmin={isAdmin} canRequestChange={canRequestChange} />
                        ))}
                        {children.map((child) => (
                            <StaffingDepartmentTreeNode
                                key={child.id}
                                department={child}
                                departments={departments}
                                text={text}
                                language={language}
                                moduleOptions={moduleOptions}
                                roleOptions={roleOptions}
                                canDeleteDepartment={canDeleteDepartment}
                                canHardDeleteDepartment={canHardDeleteDepartment}
                                canApproveDepartment={canApproveDepartment}
                                canCodeDepartmentPositions={canCodeDepartmentPositions}
                                isAdmin={isAdmin}
                                user={user}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StaffingUnitTreeNode({ unit, text, language, isAdmin = false, canRequestChange = false }) {
    const children = unit.children ?? [];

    return (
        <div className="relative min-w-0 pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:-translate-x-1/2 before:bg-teal-300">
            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <StaffingTreeBox title={unit.name} code={unit.code} text={text} compact />
                <StaffingPositionTree positions={unit.positions ?? []} text={text} language={language} isAdmin={isAdmin} canRequestChange={canRequestChange} />

                {children.length > 0 && (
                    <div className="relative mt-5 grid gap-2 pt-6 sm:grid-cols-2">
                        <div className="absolute start-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
                        {children.length > 1 && <div className="absolute start-0 end-0 top-6 hidden h-px bg-slate-200 sm:block" />}
                        {children.map((child) => (
                            <div key={child.id ?? child.code} className="relative min-w-0 pt-5 before:absolute before:start-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-slate-200">
                                <StaffingTreeBox title={child.name} code={child.code} text={text} compact muted />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StaffingTreeBox({ title, subtitle, code, manager, text, tone = 'default', compact = false, muted = false }) {
    const toneClass = tone === 'root'
        ? 'border-teal-300 bg-white shadow-sm'
        : muted
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-200 bg-white';

    return (
        <div className={`mx-auto min-w-0 overflow-hidden rounded-md border px-3 py-2 text-center ${compact ? 'w-full' : 'max-w-xl'} ${toneClass}`}>
            <div className={`${compact ? 'text-sm' : 'text-base'} truncate font-black text-slate-950`}>{title}</div>
            {subtitle && subtitle !== title && <div className="mt-1 truncate text-[11px] font-bold text-slate-500">{subtitle}</div>}
            {code && <div className="mt-1 truncate text-xs font-bold text-slate-500">{code}</div>}
            {manager && (
                <div className="mt-2 truncate text-xs font-semibold text-slate-600">
                    {text.directManager}: <span className="text-slate-900">{manager}</span>
                </div>
            )}
        </div>
    );
}

function StaffingPositionTree({ positions, text, language, root = false, isAdmin = false, canRequestChange = false }) {
    if (!positions.length) {
        return <div className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-slate-500">{text.emptyPositions}</div>;
    }

    return (
        <div className={`${root ? 'mx-auto max-w-4xl' : ''} relative mt-5 pt-6`}>
            <div className="absolute start-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
            {positions.length > 1 && <div className="absolute start-0 end-0 top-6 hidden h-px bg-slate-200 sm:block" />}
            <div className="grid min-w-0 gap-3">
                {positions.map((position) => (
                    <div key={position.department_position_id ?? position.id} className="relative min-w-0 pt-5 before:absolute before:start-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-slate-200">
                        <PositionRow position={position} text={text} language={language} isAdmin={isAdmin} canRequestChange={canRequestChange} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function UnitCard({ unit, text, language }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="font-bold text-slate-950">{unit.name}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{unit.code}</div>
                </div>
                <Link href={route('employee-coding.department', { department: unit.department_id, unit: unit.code })} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
                    {text.codeEmployees}
                </Link>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-5">
                <Metric label={text.required} value={unit.required} compact />
                <Metric label={text.current} value={unit.current} compact />
                <Metric label={text.vacant} value={unit.vacant} tone="danger" compact />
                <Metric label={text.surplus} value={unit.surplus} tone="warning" compact />
                <Metric label={text.operatingPower} value={`${unit.coverage}%`} tone="success" compact />
            </div>

            <div className="mt-4">
                {unit.positions.length === 0
                    ? <div className="rounded-md bg-white px-4 py-3 text-sm text-slate-500">{text.emptyPositions}</div>
                    : <PositionGrid positions={unit.positions} text={text} language={language} />}
            </div>
        </div>
    );
}

function AddDepartmentPositionForm({ department, text }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name_ar: '',
        name_en: '',
        approved_headcount: 1,
        allow_system_login: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('department-staffing.departments.positions.store', department.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-black text-slate-800">{text.addPositionToDepartment}</div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_170px_auto] md:items-start">
                <Field label={text.positionNameAr} error={errors.name_ar} required>
                    <input value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="form-input w-full" required />
                </Field>
                <Field label={text.positionNameEn} error={errors.name_en}>
                    <input value={data.name_en} dir="ltr" onChange={(event) => setData('name_en', event.target.value)} className="form-input w-full" />
                </Field>
                <Field label={text.approvedHeadcount} error={errors.approved_headcount} required>
                    <input type="number" min="0" value={data.approved_headcount} onChange={(event) => setData('approved_headcount', event.target.value)} className="form-input w-full" required />
                </Field>
                <label className="mt-6 flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                    <input type="checkbox" checked={Boolean(data.allow_system_login)} onChange={(event) => setData('allow_system_login', event.target.checked)} />
                    {text.allowSystemLogin}
                </label>
                <button type="submit" disabled={processing} className="mt-6 h-10 rounded-md bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                    {text.addPosition}
                </button>
            </div>
        </form>
    );
}

function canEditDepartmentPositions(department, canCodeDepartmentPositions, isAdmin = false) {
    if (!canCodeDepartmentPositions) {
        return false;
    }

    if (['cancelled', 'archived'].includes(department.status)) {
        return false;
    }

    return department.status !== 'active' || isAdmin;
}

function canEditDepartmentDetails(department, canApproveDepartment = false, user = null) {
    if (['cancelled', 'archived'].includes(department.status)) {
        return false;
    }

    return department.status !== 'active' || canApproveDepartment || canRequestDepartmentChange(department, user);
}

function canRequestDepartmentChange(department, user = null) {
    if (!department || !user) {
        return false;
    }

    if (String(department.direct_manager?.id ?? '') === String(user.id ?? '')) {
        return true;
    }

    const positionCode = String(user.position?.code ?? '').toLowerCase();
    const positionName = String(user.position?.name ?? '').toLowerCase();

    return String(user.department_id ?? '') === String(department.id ?? '')
        && (positionCode.endsWith('_manager')
            || positionCode === 'department_manager'
            || positionName.includes('manager')
            || String(user.position?.name ?? '').includes('مدير'));
}

function EditDepartmentForm({ department, departments, text, language, moduleOptions, roleOptions, onDone }) {
    const { data, setData, patch, processing, errors } = useForm({
        name_ar: department.name_ar ?? department.name ?? '',
        name_en: department.name_en ?? '',
        parent_id: department.parent?.id ?? '',
        department_type: department.type ?? 'administrative',
        cost_nature: department.cost_nature ?? 'indirect',
        required_headcount: department.own_required ?? department.required ?? 0,
        status: department.status ?? (department.active ? 'active' : 'paused'),
        linked_modules: department.linked_modules ?? [],
        system_role_id: department.system_role_id ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        patch(route('department-staffing.departments.update', department.id), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };

    const parentOptions = departments.filter((item) => item.id !== department.id);

    return (
        <form onSubmit={submit} className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <Field label={text.departmentNameAr} error={errors.name_ar} required>
                    <input value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="form-input w-full" required />
                </Field>
                <Field label={text.departmentNameEn} error={errors.name_en} required>
                    <input value={data.name_en} dir="ltr" onChange={(event) => setData('name_en', event.target.value)} className="form-input w-full" required />
                </Field>
                <Field label={text.parentDepartment} error={errors.parent_id}>
                    <select value={data.parent_id} onChange={(event) => setData('parent_id', event.target.value)} className="form-input w-full">
                        <option value="">{text.mainDepartment}</option>
                        {parentOptions.map((item) => (
                            <option key={item.id} value={item.id}>{departmentOptionLabel(item, language)}</option>
                        ))}
                    </select>
                </Field>
                <Field label={text.departmentType} error={errors.department_type}>
                    <select value={data.department_type} onChange={(event) => setData('department_type', event.target.value)} className="form-input w-full">
                        <option value="administrative">{text.administrative}</option>
                        <option value="productive">{text.productive}</option>
                        <option value="service">{text.service}</option>
                        <option value="technical">{text.technical}</option>
                        <option value="custom">{text.custom}</option>
                    </select>
                </Field>
                <Field label={text.costNature} error={errors.cost_nature}>
                    <select value={data.cost_nature} onChange={(event) => setData('cost_nature', event.target.value)} className="form-input w-full">
                        <option value="direct">{text.directCost}</option>
                        <option value="indirect">{text.indirectCost}</option>
                    </select>
                </Field>
                <Field label={text.departmentApprovedHeadcount} error={errors.required_headcount}>
                    <input type="number" min="0" max="9999" value={data.required_headcount} onChange={(event) => setData('required_headcount', event.target.value)} className="form-input w-full" />
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">{text.departmentApprovedHeadcountHint}</div>
                </Field>
                <Field label={text.departmentStatus} error={errors.active}>
                    <select value={data.status} onChange={(event) => setData('status', event.target.value)} className="form-input w-full">
                        <option value="draft">{text.draft}</option>
                        <option value="active">{text.active}</option>
                        <option value="paused">{text.paused}</option>
                        <option value="cancelled">{text.cancelled}</option>
                        <option value="archived">{text.archived}</option>
                    </select>
                </Field>
            </div>
            <ModuleCheckboxes text={text} language={language} moduleOptions={moduleOptions} selected={data.linked_modules} onChange={(next) => setData('linked_modules', next)} />
            <RoleSelect text={text} language={language} roles={roleOptions} value={data.system_role_id} error={errors.system_role_id} onChange={(value) => setData('system_role_id', value)} />
            <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" disabled={processing} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                    {text.saveChanges}
                </button>
                <button type="button" onClick={onDone} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    {text.cancel}
                </button>
            </div>
        </form>
    );
}

function PositionGrid({ positions, text, language, isAdmin = false, canRequestChange = false }) {
    return (
        <div className="mt-3 grid gap-3">
            {positions.map((position) => (
                <PositionRow key={position.department_position_id} position={position} text={text} language={language} isAdmin={isAdmin} canRequestChange={canRequestChange} />
            ))}
        </div>
    );
}

function PositionRow({ position, text, language, isAdmin = false, canRequestChange = false }) {
    const locked = position.approved_locked && !isAdmin && !canRequestChange;
    const { data, setData, patch, processing, errors } = useForm({
        approved_headcount: position.approved ?? 0,
        allow_system_login: Boolean(position.allow_system_login),
        sort_order: position.sort_order ?? 0,
    });

    const submit = (event) => {
        event.preventDefault();
        patch(route('department-staffing.positions.update', position.department_position_id), {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 lg:grid-cols-[minmax(220px,1fr)_96px_repeat(4,minmax(118px,130px))_170px_auto] lg:items-center">
            <div className="min-w-0">
                <div className="font-semibold text-slate-950">{localizedPositionName(position, language)}</div>
                <div className="mt-1 text-xs text-slate-500">{position.code}</div>
                {position.is_worker && <div className="mt-1 text-[11px] font-bold text-amber-700">{text.noWorkerDepartmentsHint}</div>}
            </div>
            <SmallStat label={text.positionOrder}>
                <input type="number" min="0" value={data.sort_order} onChange={(event) => setData('sort_order', event.target.value)} className="form-input h-9 w-full text-center text-sm" disabled={locked} />
            </SmallStat>
            <SmallStat label={text.required}>
                <input type="number" min="0" value={data.approved_headcount} onChange={(event) => setData('approved_headcount', event.target.value)} className="form-input h-9 w-full text-center text-sm" disabled={locked} />
                {errors.approved_headcount && <div className="mt-1 text-xs text-red-600">{errors.approved_headcount}</div>}
            </SmallStat>
            <SmallStat label={text.current} value={position.current} />
            <SmallStat label={text.vacant} value={position.vacant} tone="danger" />
            <SmallStat label={text.surplus} value={position.surplus} tone="warning" />
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input type="checkbox" checked={data.allow_system_login} onChange={(event) => setData('allow_system_login', event.target.checked)} disabled={locked} />
                {text.allowSystemLogin}
            </label>
            {locked ? <ApprovalBadge approved compact /> : <button type="submit" disabled={processing} className="h-9 rounded-md border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {text.update}
            </button>}
        </form>
    );
}

function Metric({ label, value, tone = 'default', compact = false }) {
    const colors = {
        default: 'border-slate-200 bg-white text-slate-950',
        danger: 'border-rose-200 bg-rose-50 text-rose-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    };

    return (
        <div className={`rounded-md border px-3 py-2 ${colors[tone] ?? colors.default}`}>
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className={`${compact ? 'text-lg' : 'text-2xl'} mt-1 font-black`}>{value}</div>
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

function SmallStat({ label, value, tone = 'default', children }) {
    const toneClass = tone === 'danger' ? 'text-rose-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-950';

    return (
        <div className="min-w-[108px] rounded-md border border-slate-100 bg-slate-50/60 px-2 py-1.5">
            <div className="min-h-[28px] whitespace-normal text-[11px] font-bold leading-3 text-slate-500">{label}</div>
            {children ?? <div className={`mt-1 text-sm font-black ${toneClass}`}>{value}</div>}
        </div>
    );
}

function Alert({ tone = 'success', children }) {
    const colors = tone === 'danger'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800';

    return <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${colors}`}>{children}</div>;
}

function Field({ label, error, required = false, strong = false, compact = false, children }) {
    const labelClass = strong
        ? 'block text-sm font-black text-slate-900'
        : compact
            ? 'block text-xs font-bold text-slate-700'
            : 'block text-sm font-medium text-slate-700';

    return (
        <label className={labelClass}>
            <span className={compact ? 'mb-1 block text-slate-600' : strong ? 'mb-1 block rounded-sm bg-white px-1 py-0.5' : ''}>{label} {required && <span className="text-red-600">*</span>}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </label>
    );
}
