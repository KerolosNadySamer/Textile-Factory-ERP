import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, useForm } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'تكويد موظفي القسم',
        subtitle: 'إضافة موظف داخل القسم المحدد فقط مع ربطه تلقائيًا بمسؤول القسم ومدير القسم.',
        back: 'العودة للمستخدمين',
        coverage: 'تغطية الأقسام',
        employeeData: 'بيانات الموظف',
        departmentAccounts: 'حسابات وموظفو القسم',
        autoManagers: 'المتابعون التلقائيون',
        noManagers: 'لم يتم العثور على مسؤول أو مدير مفعل لهذا القسم.',
        employeeCode: 'كود الموظف',
        autoCode: 'تلقائي',
        name: 'الاسم',
        nameAr: 'الاسم العربي',
        nameEn: 'الاسم الإنجليزي',
        phone: 'الهاتف',
        profilePhoto: 'الصورة الشخصية',
        nationalId: 'الرقم القومي',
        educationQualification: 'المؤهل الدراسي',
        hiredAt: 'تاريخ التعيين',
        contractDetails: 'بيانات التعاقد',
        employmentType: 'نوع التعاقد',
        permanentContract: 'دائم',
        partTimeContract: 'جزئي',
        contractStartDate: 'تاريخ بداية العقد',
        contractEndDate: 'تاريخ نهاية العقد',
        contractDurationMonths: 'مدة العقد بالشهور',
        contractNoticeDays: 'تنبيه HR قبل الانتهاء بالأيام',
        basicSalary: 'الراتب الأساسي',
        status: 'الحالة',
        active: 'نشط',
        inactive: 'غير نشط',
        suspended: 'موقوف',
        position: 'الوظيفة',
        noPosition: 'اختر الوظيفة',
        assignedWarehouses: 'المخازن المسؤول عنها',
        address: 'العنوان',
        saveEmployee: 'حفظ الموظف',
        saved: 'تم إرسال طلب تكويد الموظف للاعتماد.',
        nameRequired: 'مطلوب',
        noLogin: 'بدون حساب',
        email: 'البريد',
        role: 'الدور',
        automaticRole: 'الدور التلقائي للقسم',
        noAutomaticRole: 'لا يوجد دور مطابق لهذا القسم',
        requiredHeadcount: 'المطلوب',
        occupiedHeadcount: 'الموجود',
        vacantHeadcount: 'الشاغر',
        managers: 'المسؤولون / المديرون',
        joined: 'تاريخ الإضافة',
        cv: 'CV',
        empty: 'لا يوجد موظفون داخل هذا القسم حتى الآن.',
    },
    en: {
        title: 'Department Employee Coding',
        subtitle: 'Add an employee only inside the selected department and auto-link department officer and manager.',
        back: 'Back to Users',
        coverage: 'Department Coverage',
        employeeData: 'Employee Data',
        departmentAccounts: 'Department Accounts & Employees',
        autoManagers: 'Auto Followers',
        noManagers: 'No active department officer or manager was found for this department.',
        employeeCode: 'Employee Code',
        autoCode: 'Auto',
        name: 'Name',
        nameAr: 'Arabic Name',
        nameEn: 'English Name',
        phone: 'Phone',
        profilePhoto: 'Profile Photo',
        nationalId: 'National ID',
        educationQualification: 'Education Qualification',
        hiredAt: 'Hire Date',
        contractDetails: 'Contract Details',
        employmentType: 'Employment Type',
        permanentContract: 'Permanent',
        partTimeContract: 'Part-time',
        contractStartDate: 'Contract Start Date',
        contractEndDate: 'Contract End Date',
        contractDurationMonths: 'Contract Duration Months',
        contractNoticeDays: 'Notify HR Before Expiry (Days)',
        basicSalary: 'Basic Salary',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        suspended: 'Suspended',
        position: 'Position',
        noPosition: 'Choose position',
        assignedWarehouses: 'Assigned Warehouses',
        address: 'Address',
        saveEmployee: 'Save Employee',
        saved: 'Employee coding request was sent for approval.',
        nameRequired: 'Required',
        noLogin: 'No Login',
        loginEnabled: 'System Login',
        systemAccount: 'Create System Account',
        employeeRecord: 'Employee Record Only',
        email: 'Email',
        password: 'Password',
        passwordConfirmation: 'Confirm Password',
        role: 'Role',
        automaticRole: 'Automatic Department Role',
        noAutomaticRole: 'No matching role for this department',
        requiredHeadcount: 'Required',
        occupiedHeadcount: 'Occupied',
        vacantHeadcount: 'Vacant',
        managers: 'Officers / Managers',
        joined: 'Created At',
        cv: 'CV',
        empty: 'No employees in this department yet.',
        mainDepartment: 'Main Department',
        codingClosed: 'Coding Closed',
        codingClosedHelp: 'This department reached the approved headcount. Add approved vacancies before coding more employees.',
    },
};

export default function DepartmentEmployeeCoding({ auth, flash, department, selectedUnit, autoManagers, departmentRole, roles, employees, warehouses }) {
    const { isRtl, language, text } = useLanguage(labels);
    const isWarehouseDepartment = department.code === 'warehouse' || selectedUnit?.code === 'warehouse';
    const roleLabel = (role) => role?.[`name_${language}`] ?? role?.name ?? role?.slug ?? text.role;
    const employeeName = (employee) => language === 'ar'
        ? (employee?.name_ar ?? employee?.name ?? employee?.name_en ?? '')
        : (employee?.name_en ?? employee?.name ?? employee?.name_ar ?? '');
    const defaultRoleId = departmentRole?.id ?? '';
    const positionLabel = (position) => `${position.name} - ${text.requiredHeadcount}: ${position.required_headcount ?? 0} - ${text.occupiedHeadcount}: ${position.employees_count ?? 0} - ${text.vacantHeadcount}: ${position.vacant_headcount ?? 0}`;
    const codingClosed = Boolean(department.coding_closed);
    const accountText = {
        loginEnabled: text.loginEnabled ?? (isRtl ? 'حساب دخول للنظام' : 'System Login'),
        systemAccount: text.systemAccount ?? (isRtl ? 'إنشاء حساب نظام' : 'Create System Account'),
        employeeRecord: text.employeeRecord ?? (isRtl ? 'سجل موظف فقط' : 'Employee Record Only'),
        password: text.password ?? (isRtl ? 'كلمة المرور' : 'Password'),
        passwordConfirmation: text.passwordConfirmation ?? (isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'),
    };
    const { data, setData, post, processing, errors, reset } = useForm({
        employee_code: '',
        name_ar: '',
        name_en: '',
        login_enabled: false,
        email: '',
        phone: '',
        profile_photo: null,
        national_id: '',
        education_qualification: '',
        address: '',
        hired_at: '',
        employment_type: 'permanent',
        contract_start_date: '',
        contract_duration_months: 6,
        contract_end_date: '',
        contract_expiry_notice_days: 180,
        basic_salary: '',
        status: 'active',
        password: '',
        password_confirmation: '',
        role_id: defaultRoleId,
        department_id: department.id,
        coding_department_id: department.id,
        position_id: '',
        manager_ids: autoManagers.map((manager) => manager.id),
        warehouse_ids: [],
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('users.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => reset('employee_code', 'name_ar', 'name_en', 'email', 'phone', 'profile_photo', 'national_id', 'education_qualification', 'address', 'hired_at', 'employment_type', 'contract_start_date', 'contract_duration_months', 'contract_end_date', 'contract_expiry_notice_days', 'basic_salary', 'password', 'password_confirmation', 'position_id', 'warehouse_ids'),
        });
    };
    const setLoginEnabled = (loginEnabled) => {
        setData((current) => ({
            ...current,
            login_enabled: loginEnabled,
            email: loginEnabled ? current.email : '',
            password: loginEnabled ? current.password : '',
            password_confirmation: loginEnabled ? current.password_confirmation : '',
            role_id: defaultRoleId,
        }));
    };

    const setEmploymentType = (employmentType) => {
        setData((current) => ({
            ...current,
            employment_type: employmentType,
            contract_start_date: employmentType === 'part_time' ? (current.contract_start_date || current.hired_at) : '',
            contract_duration_months: employmentType === 'part_time' ? (current.contract_duration_months || 6) : 6,
            contract_end_date: employmentType === 'part_time'
                ? (current.contract_end_date || addMonthsToDate(current.contract_start_date || current.hired_at, Number(current.contract_duration_months || 6)))
                : '',
            contract_expiry_notice_days: employmentType === 'part_time' ? (current.contract_expiry_notice_days || 180) : 180,
        }));
    };

    const setContractStartDate = (value) => {
        setData((current) => ({
            ...current,
            contract_start_date: value,
            contract_end_date: value ? addMonthsToDate(value, Number(current.contract_duration_months || 6)) : '',
        }));
    };

    const setContractDurationMonths = (value) => {
        setData((current) => ({
            ...current,
            contract_duration_months: value,
            contract_end_date: current.contract_start_date ? addMonthsToDate(current.contract_start_date, Number(value || 6)) : current.contract_end_date,
        }));
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={`${text.title} - ${department.name}`} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-950">{department.name}</h3>
                                {selectedUnit && (
                                    <div className="mt-1 text-xs font-bold text-slate-500">
                                        {(text.mainDepartment ?? (isRtl ? 'القسم الرئيسي' : 'Main Department'))}: {department.main_name}
                                    </div>
                                )}
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={route('employee-coding-coverage.index')} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">{text.coverage}</Link>
                                <Link href={route('users.index')} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">{text.back}</Link>
                            </div>
                        </div>

                        <div className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-950">{text.autoManagers}: </span>
                            {autoManagers.length ? autoManagers.map((manager) => `${employeeName(manager)}${manager.position ? ` (${manager.position})` : ''}`).join(' - ') : text.noManagers}
                        </div>

                        {codingClosed && (
                            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                                {(text.codingClosed ?? (isRtl ? 'تم إغلاق التكويد' : 'Coding Closed'))}: {text.codingClosedHelp ?? (isRtl ? 'اكتمل العدد المعتمد لهذا القسم. أضف شواغر معتمدة قبل تكويد موظفين جدد.' : 'This department reached the approved headcount. Add approved vacancies before coding more employees.')}
                            </div>
                        )}
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">{text.employeeData}</h3>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                {flash.success || text.saved}
                            </div>
                        )}

                        {flash?.error && (
                            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {flash.error}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Field label={text.employeeCode} error={errors.employee_code}>
                                <input value={data.employee_code} placeholder={text.autoCode} onChange={(event) => setData('employee_code', event.target.value)} className="form-input w-full" />
                            </Field>
                            <Field label={text.nameAr} error={errors.name_ar} required>
                                <input value={data.name_ar} onChange={(event) => setData('name_ar', event.target.value)} className="form-input w-full" required disabled={codingClosed} />
                            </Field>
                            <Field label={text.nameEn} error={errors.name_en}>
                                <input value={data.name_en} onChange={(event) => setData('name_en', event.target.value)} className="form-input w-full" dir="ltr" disabled={codingClosed} />
                            </Field>
                            <Field label={text.phone} error={errors.phone}>
                                <input type="tel" value={data.phone} onChange={(event) => setData('phone', event.target.value)} className="form-input w-full" dir="ltr" />
                            </Field>
                            <Field label={accountText.loginEnabled} error={errors.login_enabled}>
                                <select value={data.login_enabled ? '1' : '0'} onChange={(event) => setLoginEnabled(event.target.value === '1')} className="form-input w-full">
                                    <option value="0">{accountText.employeeRecord}</option>
                                    <option value="1">{accountText.systemAccount}</option>
                                </select>
                            </Field>
                            {data.login_enabled && (
                                <>
                                    <Field label={text.email} error={errors.email} required>
                                        <input type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className="form-input w-full" dir="ltr" required />
                                    </Field>
                                    <Field label={accountText.password} error={errors.password} required>
                                        <input type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className="form-input w-full" autoComplete="new-password" required />
                                    </Field>
                                    <Field label={accountText.passwordConfirmation} error={errors.password_confirmation} required>
                                        <input type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} className="form-input w-full" autoComplete="new-password" required />
                                    </Field>
                                    <Field label={text.automaticRole} error={errors.role_id} required>
                                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                                            {departmentRole ? `${roleLabel(departmentRole)} (${departmentRole.slug})` : text.noAutomaticRole}
                                        </div>
                                    </Field>
                                </>
                            )}
                            <Field label={text.profilePhoto} error={errors.profile_photo}>
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setData('profile_photo', event.target.files[0] ?? null)} className="mt-1 block w-full text-sm" />
                            </Field>
                            <Field label={text.nationalId} error={errors.national_id}>
                                <input value={data.national_id} onChange={(event) => setData('national_id', event.target.value)} className="form-input w-full" />
                            </Field>
                            <Field label={text.educationQualification} error={errors.education_qualification}>
                                <input value={data.education_qualification} onChange={(event) => setData('education_qualification', event.target.value)} className="form-input w-full" />
                            </Field>
                            <Field label={text.hiredAt} error={errors.hired_at}>
                                <input type="date" value={data.hired_at} onChange={(event) => setData('hired_at', event.target.value)} className="form-input w-full" />
                            </Field>
                            <div className="md:col-span-2 lg:col-span-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                                <div className="mb-3 text-sm font-black text-emerald-900">{text.contractDetails}</div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                    <Field label={text.employmentType} error={errors.employment_type} required>
                                        <select value={data.employment_type} onChange={(event) => setEmploymentType(event.target.value)} className="form-input w-full">
                                            <option value="permanent">{text.permanentContract}</option>
                                            <option value="part_time">{text.partTimeContract}</option>
                                        </select>
                                    </Field>
                                    <Field label={text.contractStartDate} error={errors.contract_start_date} required={data.employment_type === 'part_time'}>
                                        <input type="date" value={data.contract_start_date} onChange={(event) => setContractStartDate(event.target.value)} disabled={data.employment_type !== 'part_time'} required={data.employment_type === 'part_time'} className="form-input w-full" />
                                    </Field>
                                    <Field label={text.contractDurationMonths} error={errors.contract_duration_months} required={data.employment_type === 'part_time'}>
                                        <input type="number" min="1" max="60" value={data.contract_duration_months} onChange={(event) => setContractDurationMonths(event.target.value)} disabled={data.employment_type !== 'part_time'} required={data.employment_type === 'part_time'} className="form-input w-full" />
                                    </Field>
                                    <Field label={text.contractEndDate} error={errors.contract_end_date} required={data.employment_type === 'part_time'}>
                                        <input type="date" value={data.contract_end_date} onChange={(event) => setData('contract_end_date', event.target.value)} disabled={data.employment_type !== 'part_time'} required={data.employment_type === 'part_time'} className="form-input w-full" />
                                    </Field>
                                    <Field label={text.contractNoticeDays} error={errors.contract_expiry_notice_days}>
                                        <input type="number" min="1" max="365" value={data.contract_expiry_notice_days} onChange={(event) => setData('contract_expiry_notice_days', event.target.value)} disabled={data.employment_type !== 'part_time'} className="form-input w-full" />
                                    </Field>
                                </div>
                            </div>
                            <Field label={text.basicSalary} error={errors.basic_salary}>
                                <input type="number" min="0" step="0.01" value={data.basic_salary} onChange={(event) => setData('basic_salary', event.target.value)} className="form-input w-full" />
                            </Field>
                            <Field label={text.status} error={errors.status}>
                                <select value={data.status} onChange={(event) => setData('status', event.target.value)} className="form-input w-full">
                                    <option value="active">{text.active}</option>
                                    <option value="inactive">{text.inactive}</option>
                                    <option value="suspended">{text.suspended}</option>
                                </select>
                            </Field>
                            <Field label={text.position} error={errors.position_id}>
                                <select value={data.position_id} onChange={(event) => setData('position_id', event.target.value)} className="form-input w-full">
                                    <option value="">{text.noPosition}</option>
                                    {department.positions.map((position) => (
                                            <option key={position.id} value={position.id} disabled={codingClosed || (position.vacant_headcount ?? 0) <= 0}>
                                            {positionLabel(position)}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            {department.positions.length > 0 && (
                                <div className="md:col-span-2 lg:col-span-4">
                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {department.positions.map((position) => (
                                            <div key={position.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                                <div className="font-semibold text-slate-900">{position.name}</div>
                                                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                                                    <span>{text.requiredHeadcount}: <b className="text-slate-950">{position.required_headcount ?? 0}</b></span>
                                                    <span>{text.occupiedHeadcount}: <b className="text-slate-950">{position.employees_count ?? 0}</b></span>
                                                    <span>{text.vacantHeadcount}: <b className={position.vacant_headcount > 0 ? 'text-rose-700' : 'text-emerald-700'}>{position.vacant_headcount ?? 0}</b></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isWarehouseDepartment && (
                                <div className="md:col-span-2 lg:col-span-4">
                                    <div className="block text-sm font-medium text-slate-700">{text.assignedWarehouses}</div>
                                    <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                        {warehouses.map((warehouse) => (
                                            <label key={warehouse.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={data.warehouse_ids.includes(warehouse.id)}
                                                    onChange={() => setData('warehouse_ids', data.warehouse_ids.includes(warehouse.id) ? data.warehouse_ids.filter((id) => id !== warehouse.id) : [...data.warehouse_ids, warehouse.id])}
                                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                />
                                                <span>{warehouse.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.warehouse_ids && <div className="mt-1 text-sm text-red-600">{errors.warehouse_ids}</div>}
                                </div>
                            )}

                            <div className="md:col-span-2 lg:col-span-4">
                                <Field label={text.address} error={errors.address}>
                                    <textarea value={data.address} onChange={(event) => setData('address', event.target.value)} className="form-input w-full" rows="2" />
                                </Field>
                            </div>

                            <div className="md:col-span-2 lg:col-span-4">
                                <button type="submit" disabled={processing || codingClosed} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                    {text.saveEmployee}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">{text.departmentAccounts}</h3>
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-start">{text.employeeCode}</th>
                                        <th className="px-4 py-3 text-start">{text.name}</th>
                                        <th className="px-4 py-3 text-start">{text.email}</th>
                                        <th className="px-4 py-3 text-start">{text.position}</th>
                                        <th className="px-4 py-3 text-start">{text.managers}</th>
                                        <th className="px-4 py-3 text-start">{text.status}</th>
                                        <th className="px-4 py-3 text-start">{text.joined}</th>
                                        <th className="px-4 py-3 text-start">{text.cv}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {employees.length === 0 && <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {employees.map((employee) => (
                                        <tr key={employee.id}>
                                            <td className="px-4 py-4">{employee.employee_code ?? text.autoCode}</td>
                                            <td className="px-4 py-4 font-semibold text-slate-950">{employeeName(employee)}</td>
                                            <td className="px-4 py-4">{employee.login_enabled ? (employee.email ?? '-') : text.noLogin}</td>
                                            <td className="px-4 py-4">{employee.position?.name ?? '-'}</td>
                                            <td className="px-4 py-4">{employee.managers?.length ? employee.managers.map((manager) => employeeName(manager)).join(' - ') : (employeeName(employee.manager) || '-')}</td>
                                            <td className="px-4 py-4">{text[employee.status] ?? employee.status}</td>
                                            <td className="px-4 py-4">{new Date(employee.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                                            <td className="px-4 py-4">
                                                <Link href={route('users.cv', employee.id)} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                                    {text.cv}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function addMonthsToDate(value, months) {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const originalDay = date.getDate();

    date.setMonth(date.getMonth() + Number(months || 6));

    if (date.getDate() !== originalDay) {
        date.setDate(0);
    }

    const paddedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const paddedDay = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${paddedMonth}-${paddedDay}`;
}

function Field({ label, error, required = false, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            <span>{label} {required && <span className="text-red-600">*</span>}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </label>
    );
}
