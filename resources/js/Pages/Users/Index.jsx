import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const pageLabels = {
    ar: {
    title: '\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A',
    subtitle: '\u062A\u062D\u062F\u064A\u062F \u062F\u0648\u0631 \u0643\u0644 \u0645\u0648\u0638\u0641 \u062F\u0627\u062E\u0644 \u0627\u0644\u0645\u0635\u0646\u0639',
    basicEmployeeData: '\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629',
    basicEmployeeDataHint: '\u0623\u062F\u062E\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0648\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A \u0648\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0648\u0638\u0641 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0646\u0645\u0648\u0630\u062C.',
    departmentLockedHint: '\u062A\u0645 \u0641\u062A\u062D \u0627\u0644\u062A\u0643\u0648\u064A\u062F \u0644\u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 \u0641\u0642\u0637 \u0644\u0645\u0646\u0639 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u0648\u0638\u0641 \u062F\u0627\u062E\u0644 \u0642\u0633\u0645 \u062E\u0637\u0623.',
    name: '\u0627\u0644\u0627\u0633\u0645',
    nameAr: 'الاسم العربي',
    nameEn: 'الاسم الإنجليزي',
    employeeCode: '\u0643\u0648\u062F \u0627\u0644\u0645\u0648\u0638\u0641',
    email: '\u0627\u0644\u0628\u0631\u064A\u062F',
    loginEnabled: '\u062D\u0633\u0627\u0628 \u062F\u062E\u0648\u0644 \u0644\u0644\u0646\u0638\u0627\u0645',
    systemAccount: '\u0645\u0633\u062A\u062E\u062F\u0645 \u0646\u0638\u0627\u0645',
    employeeRecord: '\u0633\u062C\u0644 \u0645\u0648\u0638\u0641 \u0628\u062F\u0648\u0646 \u062F\u062E\u0648\u0644',
    noLogin: '\u0628\u062F\u0648\u0646 \u062D\u0633\u0627\u0628',
    phone: '\u0627\u0644\u0647\u0627\u062A\u0641',
    profilePhoto: '\u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629',
    nationalId: '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u0648\u0645\u064A',
    educationQualification: '\u0627\u0644\u0645\u0624\u0647\u0644 \u0627\u0644\u062F\u0631\u0627\u0633\u064A',
    address: '\u0627\u0644\u0639\u0646\u0648\u0627\u0646',
    hiredAt: '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0639\u064A\u064A\u0646',
    contractDetails: 'بيانات التعاقد',
    employmentType: 'نوع التعاقد',
    permanentContract: 'دائم',
    partTimeContract: 'جزئي',
    contractStartDate: 'تاريخ بداية العقد',
    contractEndDate: 'تاريخ نهاية العقد',
    contractDurationMonths: 'مدة العقد بالشهور',
    contractNoticeDays: 'التنبيه قبل الانتهاء بالأيام',
    basicSalary: '\u0627\u0644\u0631\u0627\u062A\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064A',
    status: '\u0627\u0644\u062D\u0627\u0644\u0629',
    manager: '\u0627\u0644\u0645\u062F\u064A\u0631\u0648\u0646 / \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0648\u0646',
    managerHint: '\u064A\u0645\u0643\u0646 \u0627\u062E\u062A\u064A\u0627\u0631 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0645\u062F\u064A\u0631 \u0644\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F\u0627\u062A',
    assignedWarehouses: '\u0627\u0644\u0645\u062E\u0627\u0632\u0646 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0639\u0646\u0647\u0627',
    warehouseHint: '\u064A\u0645\u0643\u0646 \u0627\u062E\u062A\u064A\u0627\u0631 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0645\u062E\u0632\u0646 \u0644\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u062E\u0632\u0646',
    role: '\u0627\u0644\u062F\u0648\u0631',
    department: '\u0627\u0644\u0642\u0633\u0645',
    position: '\u0627\u0644\u0648\u0638\u064A\u0641\u0629',
    joined: '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0636\u0627\u0641\u0629',
    noRole: '\u0628\u062F\u0648\u0646 \u062F\u0648\u0631',
    noDepartment: '\u0628\u062F\u0648\u0646 \u0642\u0633\u0645',
    noPosition: '\u0628\u062F\u0648\u0646 \u0648\u0638\u064A\u0641\u0629',
    createTitle: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641',
    editTitle: '\u062a\u0639\u062f\u064a\u0644 \u0645\u0648\u0638\u0641',
    password: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
    passwordConfirmation: '\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
    create: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628',
    saveEmployee: '\u062D\u0641\u0638 \u0627\u0644\u0645\u0648\u0638\u0641',
    autoCode: '\u062A\u0644\u0642\u0627\u0626\u064A',
    active: '\u0646\u0634\u0637',
    inactive: '\u063A\u064A\u0631 \u0646\u0634\u0637',
    suspended: '\u0645\u0648\u0642\u0648\u0641',
    archived: 'مؤرشف',
    archive: 'أرشفة',
    restore: 'خروج من الأرشيف',
    noManager: '\u0628\u062F\u0648\u0646 \u0645\u062F\u064A\u0631',
    required: '\u0645\u0637\u0644\u0648\u0628',
    actions: '\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    employeeCv: '\u0627\u0644\u0633\u064A\u0631\u0629 \u0627\u0644\u0648\u0638\u064A\u0641\u064A\u0629',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    delete: '\u062d\u0630\u0641',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    saveChanges: '\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644',
    confirmDelete: '\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0638\u0641\u061f',
    pendingAccountsTitle: 'موظفون بدون حساب دخول',
    pendingAccountsSubtitle: 'الموظفون الموجودون كسجلات تعيين فقط. اختر موظفًا لإرسال طلب إنشاء حساب نظام له.',
    requestAccount: 'طلب إنشاء حساب',
    noPendingAccounts: 'لا يوجد موظفون بدون حساب دخول حاليًا.',
    coverageTitle: 'تغطية الأقسام وتكويد الموظفين',
    coverageHint: 'اضغط على أي قسم لبدء تعيين موظف، أو افتح سجل الأقسام لتعديل الوظائف، أو استخدم شاشة التحويل لنقل موظف لقسم آخر.',
    departmentRecords: 'سجل الأقسام',
    transferCoverageDetails: 'تحويل موظف / تفاصيل التغطية',
    employees: 'موظفون',
    jobs: 'وظائف',
    vacant: 'شاغر',
    adminStaff: 'إداريون',
    workers: 'عمال',
    remainingJobTypes: 'أنواع الوظائف المتبقية',
    noVisibleGaps: 'لا يوجد عجز ظاهر',
    },
    en: {
        title: 'Users & Permissions',
        subtitle: 'Assign each employee role inside the factory',
        basicEmployeeData: 'Basic Employee Data',
        basicEmployeeDataHint: 'Enter the name, contact details, national ID, address, and employee photo in one form.',
        departmentLockedHint: 'Coding is locked to this department to prevent saving the employee under the wrong department.',
        name: 'Name',
        nameAr: 'Arabic Name',
        nameEn: 'English Name',
        employeeCode: 'Employee Code',
        email: 'Email',
        loginEnabled: 'System Login',
        systemAccount: 'System User',
        employeeRecord: 'Employee Record Without Login',
        noLogin: 'No Login',
        phone: 'Phone',
        profilePhoto: 'Profile Photo',
        nationalId: 'National ID',
        educationQualification: 'Education Qualification',
        address: 'Address',
        hiredAt: 'Hire Date',
        contractDetails: 'Contract Details',
        employmentType: 'Employment Type',
        permanentContract: 'Permanent',
        partTimeContract: 'Part-time',
        contractStartDate: 'Contract Start Date',
        contractEndDate: 'Contract End Date',
        contractDurationMonths: 'Contract Duration Months',
        contractNoticeDays: 'Notify Before Expiry (Days)',
        basicSalary: 'Basic Salary',
        status: 'Status',
        manager: 'Managers / Followers',
        managerHint: 'Select more than one manager for follow-up and approvals',
        assignedWarehouses: 'Assigned Warehouses',
        warehouseHint: 'A storekeeper can be assigned to more than one warehouse',
        role: 'Role',
        department: 'Department',
        position: 'Position',
        joined: 'Created At',
        noRole: 'No Role',
        noDepartment: 'No Department',
        noPosition: 'No Position',
        createTitle: 'Add Employee',
        editTitle: 'Edit Employee',
        password: 'Password',
        passwordConfirmation: 'Confirm Password',
        create: 'Create Account',
        saveEmployee: 'Save Employee',
        autoCode: 'Auto',
        active: 'Active',
        inactive: 'Inactive',
        suspended: 'Suspended',
        archived: 'Archived',
        archive: 'Archive',
        restore: 'Restore',
        noManager: 'No Manager',
        required: 'Required',
        actions: 'Actions',
        employeeCv: 'Employee CV',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        saveChanges: 'Save Changes',
        confirmDelete: 'Do you want to delete this employee?',
        pendingAccountsTitle: 'Employees without login accounts',
        pendingAccountsSubtitle: 'Employee records that do not have a system login yet. Choose an employee to request account creation.',
        requestAccount: 'Request Account',
        noPendingAccounts: 'No employees without login accounts right now.',
        coverageTitle: 'Department Coverage & Employee Coding',
        coverageHint: 'Select a department to start employee coding, edit department positions, or open the transfer workflow.',
        departmentRecords: 'Department Records',
        transferCoverageDetails: 'Transfer / Coverage Details',
        employees: 'Employees',
        jobs: 'Jobs',
        vacant: 'Vacant',
        adminStaff: 'Admin Staff',
        workers: 'Workers',
        remainingJobTypes: 'Remaining job types',
        noVisibleGaps: 'No visible gaps',
    },
};

export default function UsersIndex({ auth, flash, users, roles, departments, managers, warehouses, codingDepartmentId = null }) {
    const { language, isRtl, text } = useLanguage(pageLabels);
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const can = (permission) => {
        const required = Array.isArray(permission) ? permission : [permission];

        return required.some((item) => permissions.includes(item));
    };
    const canEditUsers = can('edit_user');
    const canDeleteUsers = can('delete_user');
    const canViewEmployeeCv = can('view_users');
    const canArchiveUsers = canEditUsers && (auth.user.role?.slug === 'admin' || auth.user.role?.slug === 'hr' || auth.user.department?.code === 'hr');
    const canEditUserRecord = (user) => canEditUsers && (user.role?.slug !== 'admin' || String(user.id) === String(auth.user.id));
    const roleLabel = (role) => role?.[`name_${language}`] ?? role?.name ?? role?.slug ?? text.noRole;
    const departmentLabel = (department) => language === 'ar'
        ? (department?.name_ar ?? department?.name ?? department?.name_en ?? '')
        : (department?.name_en ?? department?.name ?? department?.name_ar ?? '');
    const positionLabel = (position) => language === 'ar'
        ? (position?.name_ar ?? position?.name ?? position?.name_en ?? '')
        : (position?.name_en ?? position?.name ?? position?.name_ar ?? '');
    const employeeName = (employee) => language === 'ar'
        ? (employee?.name_ar ?? employee?.name ?? employee?.name_en ?? '')
        : (employee?.name_en ?? employee?.name ?? employee?.name_ar ?? '');
    const defaultRoleId = roles.find((role) => role.slug !== 'admin')?.id ?? roles[0]?.id ?? '';
    const [editingUser, setEditingUser] = useState(null);
    const codingDepartment = departments.find((department) => String(department.id) === String(codingDepartmentId)) ?? null;
    const isDepartmentCodingMode = Boolean(codingDepartment);

    const emptyForm = {
        employee_code: '',
        name_ar: '',
        name_en: '',
        email: '',
        login_enabled: false,
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
        contract_expiry_notice_days: 30,
        basic_salary: '',
        status: 'active',
        password: '',
        password_confirmation: '',
        role_id: defaultRoleId,
        department_id: codingDepartment?.id ?? '',
        coding_department_id: codingDepartment?.id ?? '',
        position_id: '',
        manager_ids: [],
        warehouse_ids: [],
    };

    const { data, setData, post, processing, errors, reset } = useForm(emptyForm);

    useEffect(() => {
        scrollToFocusedRow(focusId);
    }, [focusId]);

    const selectedDepartment = useMemo(
        () => departments.find((department) => String(department.id) === String(data.department_id)),
        [departments, data.department_id],
    );

    const availablePositions = selectedDepartment?.positions ?? [];
    const selectedPosition = useMemo(
        () => availablePositions.find((position) => String(position.id) === String(data.position_id)),
        [availablePositions, data.position_id],
    );
    const showWarehouseAssignments = selectedDepartment?.code === 'warehouse' || selectedPosition?.code === 'storekeeper' || data.warehouse_ids.length > 0;
    const availableManagers = useMemo(
        () => managers.filter((manager) => !editingUser || String(manager.id) !== String(editingUser.id)),
        [editingUser, managers],
    );
    const departmentCoverage = useMemo(
        () => departments.map((department) => {
            const departmentUsers = users.filter((user) => String(user.department_id) === String(department.id) && user.role?.slug !== 'admin');
            const positions = department.positions ?? [];
            const positionCoverage = positions.map((position) => {
                const requiredHeadcount = Math.max(0, Number(position.required_headcount ?? 0));
                const occupiedHeadcount = departmentUsers.filter((user) => String(user.position_id) === String(position.id)).length;

                return {
                    ...position,
                    requiredHeadcount,
                    occupiedHeadcount,
                    vacantHeadcount: Math.max(0, requiredHeadcount - occupiedHeadcount),
                };
            });
            const positionsRequiredHeadcount = positionCoverage.reduce((sum, position) => sum + position.requiredHeadcount, 0);
            const adminHeadcount = positionCoverage
                .filter((position) => classifyDepartmentPosition(position) === 'admin')
                .reduce((sum, position) => sum + position.requiredHeadcount, 0);
            const workerHeadcount = positionCoverage
                .filter((position) => classifyDepartmentPosition(position) === 'worker')
                .reduce((sum, position) => sum + position.requiredHeadcount, 0);
            const departmentRequiredHeadcount = Math.max(0, Number(department.required_headcount ?? 0));
            const generalRequiredHeadcount = Math.max(0, departmentRequiredHeadcount - positionsRequiredHeadcount);
            const visiblePositionCoverage = generalRequiredHeadcount > 0
                ? [
                    ...positionCoverage,
                    {
                        id: `department-general-${department.id}`,
                        name: language === 'ar' ? 'احتياج عام للقسم' : 'General department need',
                        requiredHeadcount: generalRequiredHeadcount,
                        occupiedHeadcount: Math.min(Math.max(0, departmentUsers.length - positionCoverage.reduce((sum, position) => sum + position.occupiedHeadcount, 0)), generalRequiredHeadcount),
                        vacantHeadcount: Math.max(0, departmentRequiredHeadcount - departmentUsers.length),
                    },
                ]
                : positionCoverage;
            const requiredHeadcount = Math.max(departmentRequiredHeadcount, positionsRequiredHeadcount);
            const occupiedHeadcount = Math.min(departmentUsers.length, requiredHeadcount);
            const vacantHeadcount = Math.max(0, requiredHeadcount - occupiedHeadcount);
            const vacantPositions = visiblePositionCoverage.filter((position) => position.vacantHeadcount > 0);
            const coveragePercent = requiredHeadcount > 0 ? Math.round((occupiedHeadcount / requiredHeadcount) * 100) : 0;

            return {
                ...department,
                employeeCount: departmentUsers.length,
                positionsCount: requiredHeadcount,
                jobTitlesCount: positions.length,
                coveredPositions: visiblePositionCoverage.filter((position) => position.occupiedHeadcount > 0).length,
                occupiedHeadcount,
                vacantHeadcount,
                adminHeadcount,
                workerHeadcount,
                vacantPositions,
                coveragePercent,
            };
        }),
        [departments, users, language],
    );

    const clearForm = () => {
        setEditingUser(null);
        setData({
            ...emptyForm,
            department_id: codingDepartment?.id ?? '',
            coding_department_id: codingDepartment?.id ?? '',
        });
        reset('password', 'password_confirmation');
    };

    const startCreateInDepartment = (department) => {
        router.visit(route('employee-coding.department', department.id), {
            preserveScroll: false,
        });
    };

    const startEdit = (user) => {
        setEditingUser(user);
        setData({
            employee_code: user.employee_code ?? '',
            name_ar: user.name_ar ?? user.name ?? '',
            name_en: user.name_en ?? '',
            email: user.email ?? '',
            login_enabled: user.login_enabled ?? false,
            phone: user.phone ?? '',
            profile_photo: null,
            national_id: user.national_id ?? '',
            education_qualification: user.education_qualification ?? '',
            address: user.address ?? '',
            hired_at: user.hired_at ?? '',
            employment_type: user.employment_type ?? 'permanent',
            contract_start_date: user.contract_start_date ?? '',
            contract_duration_months: user.contract_duration_months ?? 6,
            contract_end_date: user.contract_end_date ?? '',
            contract_expiry_notice_days: user.contract_expiry_notice_days ?? 30,
            basic_salary: user.basic_salary ?? '',
            status: user.status ?? 'active',
            password: '',
            password_confirmation: '',
            role_id: user.role_id ?? defaultRoleId,
            department_id: user.department_id ?? '',
            coding_department_id: '',
            position_id: user.position_id ?? '',
            manager_ids: user.managers?.length ? user.managers.map((manager) => manager.id) : (user.manager_id ? [user.manager_id] : []),
            warehouse_ids: user.warehouses?.map((warehouse) => warehouse.id) ?? [],
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateRole = (user, roleId) => {
        router.patch(route('users.update-role', user.id), { role_id: roleId }, {
            preserveScroll: true,
        });
    };

    const toggleWarehouse = (warehouseId) => {
        setData('warehouse_ids', data.warehouse_ids.includes(warehouseId)
            ? data.warehouse_ids.filter((id) => id !== warehouseId)
            : [...data.warehouse_ids, warehouseId]);
    };

    const toggleManager = (managerId) => {
        setData('manager_ids', data.manager_ids.includes(managerId)
            ? data.manager_ids.filter((id) => id !== managerId)
            : [...data.manager_ids, managerId]);
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
            contract_expiry_notice_days: employmentType === 'part_time' ? (current.contract_expiry_notice_days || 30) : 30,
        }));
    };

    const setContractStartDate = (value) => {
        setData((current) => ({
            ...current,
            contract_start_date: value,
            contract_end_date: value ? addMonthsToDate(value, Number(current.contract_duration_months || 6)) : '',
        }));
    };

    const setContractDuration = (value) => {
        setData((current) => ({
            ...current,
            contract_duration_months: value,
            contract_end_date: current.contract_start_date ? addMonthsToDate(current.contract_start_date, Number(value || 6)) : current.contract_end_date,
        }));
    };

    const deleteUser = (user) => {
        if (! window.confirm(text.confirmDelete)) {
            return;
        }

        router.delete(route('users.destroy', user.id), {
            preserveScroll: true,
        });
    };

    const archiveUser = (user) => {
        const reason = window.prompt('اكتب سبب أرشفة الموظف', 'غير نشط أو موقوف');
        router.patch(route('users.archive', user.id), { reason: reason ?? '' }, { preserveScroll: true });
    };

    const restoreUser = (user) => {
        router.patch(route('users.restore', user.id), {}, { preserveScroll: true });
    };

    const createUser = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => clearForm(),
        };

        if (editingUser) {
            router.post(route('users.update', editingUser.id), {
                ...data,
                _method: 'patch',
            }, options);
            return;
        }

        clearForm();
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}
        >
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {canViewEmployeeCv && (
                        <div className="erp-panel mb-6 overflow-hidden">
                            <div className="p-6">
                                <div className="erp-panel-heading">
                                    <div>
                                        <h3 className="erp-panel-title">{text.coverageTitle}</h3>
                                        <p className="erp-panel-subtitle">{text.coverageHint}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={route('master-data.departments')}
                                            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                        >
                                            {text.departmentRecords}
                                        </Link>
                                        <Link
                                            href={route('employee-coding-coverage.index')}
                                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                                        >
                                            {text.transferCoverageDetails}
                                        </Link>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {departmentCoverage.map((department) => (
                                        <button
                                            key={department.id}
                                            type="button"
                                            onClick={() => startCreateInDepartment(department)}
                                            className="department-coverage-card text-start"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="department-coverage-icon">
                                                        {(departmentLabel(department) || department.code || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-950">{departmentLabel(department)}</div>
                                                        <div className="mt-1 text-xs text-slate-500">{department.code}</div>
                                                    </div>
                                                </div>
                                                <div className="department-coverage-percent">{department.coveragePercent}%</div>
                                            </div>

                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                                <div className="department-coverage-bar" style={{ width: `${department.coveragePercent}%` }} />
                                            </div>

                                            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                                <div className="department-coverage-mini">
                                                    <div className="text-xs text-slate-500">{text.employees}</div>
                                                    <div className="mt-1 font-bold text-slate-950">{department.employeeCount}</div>
                                                </div>
                                                <div className="department-coverage-mini">
                                                    <div className="text-xs text-slate-500">{text.jobs}</div>
                                                    <div className="mt-1 font-bold text-slate-950">{department.positionsCount}</div>
                                                </div>
                                                <div className="department-coverage-mini">
                                                    <div className="text-xs text-slate-500">{text.vacant}</div>
                                                    <div className="mt-1 font-bold text-slate-950">{department.vacantHeadcount}</div>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                                                <div className="department-coverage-mini">
                                                    <div className="text-xs text-slate-500">{text.adminStaff}</div>
                                                    <div className="mt-1 font-bold text-slate-950">{department.adminHeadcount}</div>
                                                </div>
                                                <div className="department-coverage-mini">
                                                    <div className="text-xs text-slate-500">{text.workers}</div>
                                                    <div className="mt-1 font-bold text-slate-950">{department.workerHeadcount}</div>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                                                    <span>{text.remainingJobTypes}</span>
                                                    <span>{department.vacantPositions.length}</span>
                                                </div>
                                                <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                                                    {department.vacantPositions.length ? department.vacantPositions.map((position) => (
                                                        <span key={position.id} className="department-coverage-chip inline-flex items-center gap-2">
                                                            <span>{positionLabel(position)}</span>
                                                            <span className="rounded-full bg-white/80 px-2 py-0.5 font-black text-slate-900">{position.vacantHeadcount}</span>
                                                        </span>
                                                    )) : (
                                                        <span className="text-xs text-slate-500">{text.noVisibleGaps}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {editingUser && (
                    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <form onSubmit={createUser} className="p-6">
                            <div className="flex flex-col gap-1 border-b border-slate-200 pb-4">
                                <h3 className="text-lg font-semibold text-slate-950">{editingUser ? text.editTitle : text.createTitle}</h3>
                                <p className="text-sm text-slate-500">
                                    {isDepartmentCodingMode && !editingUser
                                        ? `${text.departmentLockedHint} ${codingDepartment?.name ?? ''}`
                                        : text.subtitle}
                                </p>
                            </div>

                            {flash?.success && (
                                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                    {flash.success}
                                </div>
                            )}

                            {flash?.error && (
                                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                    {flash.error}
                                </div>
                            )}

                            <div className="employee-basic-panel mt-5 rounded-2xl border p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">{text.basicEmployeeData}</h3>
                                        <p className="mt-1 text-sm text-slate-500">{text.basicEmployeeDataHint}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label htmlFor="employee_code" className="block text-sm font-medium text-slate-700">{text.employeeCode}</label>
                                    <input
                                        id="employee_code"
                                        name="employee_code"
                                        value={data.employee_code}
                                        placeholder={text.autoCode}
                                        onChange={(event) => setData('employee_code', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.employee_code && <div className="mt-1 text-sm text-red-600">{errors.employee_code}</div>}
                                </div>

                                <div>
                                    <label htmlFor="name_ar" className="block text-sm font-medium text-slate-700">{text.nameAr} <span className="text-red-600">{text.required}</span></label>
                                    <input
                                        id="name_ar"
                                        name="name_ar"
                                        value={data.name_ar}
                                        autoComplete="name"
                                        onChange={(event) => setData('name_ar', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        required
                                    />
                                    {errors.name_ar && <div className="mt-1 text-sm text-red-600">{errors.name_ar}</div>}
                                </div>

                                <div>
                                    <label htmlFor="name_en" className="block text-sm font-medium text-slate-700">{text.nameEn}</label>
                                    <input
                                        id="name_en"
                                        name="name_en"
                                        value={data.name_en}
                                        autoComplete="name"
                                        dir="ltr"
                                        onChange={(event) => setData('name_en', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 text-left shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.name_en && <div className="mt-1 text-sm text-red-600">{errors.name_en}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.loginEnabled}</label>
                                    <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                        {data.login_enabled ? text.systemAccount : text.employeeRecord}
                                    </div>
                                    {errors.login_enabled && <div className="mt-1 text-sm text-red-600">{errors.login_enabled}</div>}
                                </div>

                                {data.login_enabled && (
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">{text.email} <span className="text-red-600">{text.required}</span></label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={data.email}
                                        autoComplete="email"
                                        dir="ltr"
                                        onChange={(event) => setData('email', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 text-left shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        required
                                    />
                                    {errors.email && <div className="mt-1 text-sm text-red-600">{errors.email}</div>}
                                </div>
                                )}

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{text.phone}</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={data.phone}
                                        autoComplete="tel"
                                        inputMode="tel"
                                        dir="ltr"
                                        onChange={(event) => setData('phone', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 text-left shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.phone && <div className="mt-1 text-sm text-red-600">{errors.phone}</div>}
                                </div>

                                <div>
                                    <label htmlFor="profile_photo" className="block text-sm font-medium text-slate-700">{text.profilePhoto}</label>
                                    <input
                                        id="profile_photo"
                                        name="profile_photo"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) => setData('profile_photo', event.target.files[0] ?? null)}
                                        className="mt-1 block w-full text-sm"
                                    />
                                    {errors.profile_photo && <div className="mt-1 text-sm text-red-600">{errors.profile_photo}</div>}
                                </div>

                                {data.login_enabled && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">{text.password} {!editingUser && <span className="text-red-600">{text.required}</span>}</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={data.password}
                                        autoComplete="new-password"
                                        onChange={(event) => setData('password', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        required={!editingUser}
                                    />
                                    {errors.password && <div className="mt-1 text-sm text-red-600">{errors.password}</div>}
                                </div>
                                )}

                                {data.login_enabled && (
                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">{text.passwordConfirmation} {!editingUser && <span className="text-red-600">{text.required}</span>}</label>
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        autoComplete="new-password"
                                        onChange={(event) => setData('password_confirmation', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        required={!editingUser}
                                    />
                                </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.nationalId}</label>
                                    <input
                                        value={data.national_id}
                                        onChange={(event) => setData('national_id', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.national_id && <div className="mt-1 text-sm text-red-600">{errors.national_id}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.educationQualification}</label>
                                    <input
                                        value={data.education_qualification}
                                        onChange={(event) => setData('education_qualification', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.education_qualification && <div className="mt-1 text-sm text-red-600">{errors.education_qualification}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.hiredAt}</label>
                                    <input
                                        type="date"
                                        value={data.hired_at}
                                        onChange={(event) => setData('hired_at', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.hired_at && <div className="mt-1 text-sm text-red-600">{errors.hired_at}</div>}
                                </div>

                                <div className="md:col-span-2 lg:col-span-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                                    <div className="mb-3 text-sm font-black text-emerald-900">{text.contractDetails}</div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{text.employmentType}</label>
                                            <select
                                                value={data.employment_type}
                                                onChange={(event) => setEmploymentType(event.target.value)}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                            >
                                                <option value="permanent">{text.permanentContract}</option>
                                                <option value="part_time">{text.partTimeContract}</option>
                                            </select>
                                            {errors.employment_type && <div className="mt-1 text-sm text-red-600">{errors.employment_type}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{text.contractStartDate} {data.employment_type === 'part_time' && <span className="text-red-600">{text.required}</span>}</label>
                                            <input
                                                type="date"
                                                value={data.contract_start_date}
                                                onChange={(event) => setContractStartDate(event.target.value)}
                                                disabled={data.employment_type !== 'part_time'}
                                                required={data.employment_type === 'part_time'}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:bg-slate-100"
                                            />
                                            {errors.contract_start_date && <div className="mt-1 text-sm text-red-600">{errors.contract_start_date}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{text.contractDurationMonths} {data.employment_type === 'part_time' && <span className="text-red-600">{text.required}</span>}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={data.contract_duration_months}
                                                onChange={(event) => setContractDuration(event.target.value)}
                                                disabled={data.employment_type !== 'part_time'}
                                                required={data.employment_type === 'part_time'}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:bg-slate-100"
                                            />
                                            {errors.contract_duration_months && <div className="mt-1 text-sm text-red-600">{errors.contract_duration_months}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{text.contractEndDate} {data.employment_type === 'part_time' && <span className="text-red-600">{text.required}</span>}</label>
                                            <input
                                                type="date"
                                                value={data.contract_end_date}
                                                onChange={(event) => setData('contract_end_date', event.target.value)}
                                                disabled={data.employment_type !== 'part_time'}
                                                required={data.employment_type === 'part_time'}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:bg-slate-100"
                                            />
                                            {errors.contract_end_date && <div className="mt-1 text-sm text-red-600">{errors.contract_end_date}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{text.contractNoticeDays}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="180"
                                                value={data.contract_expiry_notice_days}
                                                onChange={(event) => setData('contract_expiry_notice_days', event.target.value)}
                                                disabled={data.employment_type !== 'part_time'}
                                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 disabled:bg-slate-100"
                                            />
                                            {errors.contract_expiry_notice_days && <div className="mt-1 text-sm text-red-600">{errors.contract_expiry_notice_days}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.basicSalary}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.basic_salary}
                                        onChange={(event) => setData('basic_salary', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    />
                                    {errors.basic_salary && <div className="mt-1 text-sm text-red-600">{errors.basic_salary}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.status}</label>
                                    <select
                                        value={data.status}
                                        onChange={(event) => setData('status', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    >
                                        <option value="active">{text.active}</option>
                                        <option value="inactive">{text.inactive}</option>
                                        <option value="suspended">{text.suspended}</option>
                                        <option value="archived">{text.archived}</option>
                                    </select>
                                    {errors.status && <div className="mt-1 text-sm text-red-600">{errors.status}</div>}
                                </div>

                                {data.login_enabled && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.role}</label>
                                    <select
                                        value={data.role_id}
                                        onChange={(event) => setData('role_id', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    >
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {roleLabel(role)} ({role.slug})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role_id && <div className="mt-1 text-sm text-red-600">{errors.role_id}</div>}
                                </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.department}</label>
                                    {isDepartmentCodingMode && !editingUser ? (
                                        <div className="mt-1 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
                                            {departmentLabel(codingDepartment)}
                                        </div>
                                    ) : (
                                        <select
                                            value={data.department_id}
                                            onChange={(event) => {
                                                setData((current) => ({
                                                    ...current,
                                                    department_id: event.target.value,
                                                    position_id: '',
                                                }));
                                            }}
                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        >
                                            <option value="">{text.noDepartment}</option>
                                            {departments.map((department) => (
                                                <option key={department.id} value={department.id}>
                                                    {departmentLabel(department)}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.department_id && <div className="mt-1 text-sm text-red-600">{errors.department_id}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{text.position}</label>
                                    <select
                                        value={data.position_id}
                                        onChange={(event) => setData('position_id', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    >
                                        <option value="">{text.noPosition}</option>
                                        {availablePositions.map((position) => (
                                            <option key={position.id} value={position.id}>
                                                {positionLabel(position)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.position_id && <div className="mt-1 text-sm text-red-600">{errors.position_id}</div>}
                                </div>

                                <div className="md:col-span-2 lg:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700">{text.manager}</label>
                                    <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                        {availableManagers.map((manager) => (
                                            <label key={manager.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    checked={data.manager_ids.includes(manager.id)}
                                                    onChange={() => toggleManager(manager.id)}
                                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                />
                                                <span>{employeeName(manager)}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{text.managerHint}</p>
                                    {errors.manager_ids && <div className="mt-1 text-sm text-red-600">{errors.manager_ids}</div>}
                                </div>

                                {showWarehouseAssignments && (
                                    <div className="md:col-span-2 lg:col-span-4">
                                        <label className="block text-sm font-medium text-slate-700">{text.assignedWarehouses}</label>
                                        <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                            {warehouses.map((warehouse) => (
                                                <label key={warehouse.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.warehouse_ids.includes(warehouse.id)}
                                                        onChange={() => toggleWarehouse(warehouse.id)}
                                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                    />
                                                    <span>{warehouse.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">{text.warehouseHint}</p>
                                        {errors.warehouse_ids && <div className="mt-1 text-sm text-red-600">{errors.warehouse_ids}</div>}
                                    </div>
                                )}

                                <div className="md:col-span-2 lg:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700">{text.address}</label>
                                    <textarea
                                        value={data.address}
                                        onChange={(event) => setData('address', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                        rows="2"
                                    />
                                    {errors.address && <div className="mt-1 text-sm text-red-600">{errors.address}</div>}
                                </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {editingUser ? text.saveChanges : (data.login_enabled ? text.create : text.saveEmployee)}
                                </button>

                                {editingUser && (
                                    <button
                                        type="button"
                                        onClick={clearForm}
                                        className="me-3 rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        {text.cancel}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="p-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>

                            <div className="mt-6 overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-3 text-right">{text.employeeCode}</th>
                                            <th className="px-4 py-3 text-right">{text.profilePhoto}</th>
                                            <th className="px-4 py-3 text-right">{text.name}</th>
                                            <th className="px-4 py-3 text-right">{text.email}</th>
                                            <th className="px-4 py-3 text-right">{text.phone}</th>
                                            <th className="px-4 py-3 text-right">{text.role}</th>
                                            <th className="px-4 py-3 text-right">{text.department}</th>
                                            <th className="px-4 py-3 text-right">{text.position}</th>
                                            <th className="px-4 py-3 text-right">{text.assignedWarehouses}</th>
                                            <th className="px-4 py-3 text-right">{text.manager}</th>
                                            <th className="px-4 py-3 text-right">{text.status}</th>
                                            <th className="px-4 py-3 text-right">{text.joined}</th>
                                            {(canViewEmployeeCv || canEditUsers || canDeleteUsers) && <th className="px-4 py-3 text-right">{text.actions}</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {users.map((user) => {
                                            const focused = isFocused(user.id, focusId);

                                            return (
                                            <tr key={user.id} id={`focus-${user.id}`} className={focused ? focusRowClass() : ''}>
                                                <td className="px-4 py-4">{user.employee_code ?? text.autoCode}</td>
                                                <td className="px-4 py-4">
                                                    {user.profile_photo_url ? (
                                                        <img src={user.profile_photo_url} alt={employeeName(user)} className="h-10 w-10 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">{employeeName(user)?.charAt(0)?.toUpperCase()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 font-medium text-slate-950">{employeeName(user)}</td>
                                                <td className="px-4 py-4">{user.login_enabled ? (user.email ?? '-') : text.noLogin}</td>
                                                <td className="px-4 py-4">{user.phone ?? '-'}</td>
                                                <td className="px-4 py-4">
                                                    {user.login_enabled && can('assign_role') ? (
                                                        <select
                                                            value={user.role_id ?? ''}
                                                            onChange={(event) => updateRole(user, event.target.value)}
                                                            className="rounded-md border-slate-300 text-sm shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                                        >
                                                            <option value="" disabled>{text.noRole}</option>
                                                            {roles.map((role) => (
                                                                <option key={role.id} value={role.id}>
                                                                    {roleLabel(role)} ({role.slug})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        user.login_enabled ? roleLabel(user.role) : text.noLogin
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">{user.department?.name ?? text.noDepartment}</td>
                                                <td className="px-4 py-4">{user.position?.name ?? text.noPosition}</td>
                                                <td className="px-4 py-4">
                                                    {user.warehouses?.length ? user.warehouses.map((warehouse) => warehouse.name).join(', ') : '-'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {user.managers?.length ? user.managers.map((manager) => employeeName(manager)).join(', ') : (employeeName(user.manager) || text.noManager)}
                                                </td>
                                                <td className="px-4 py-4">{text[user.status] ?? user.status}</td>
                                                <td className="px-4 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                                {(canViewEmployeeCv || canEditUsers || canDeleteUsers) && (
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        {canViewEmployeeCv && (
                                                            <Link
                                                                href={route('users.cv', user.id)}
                                                                className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100"
                                                            >
                                                                {text.employeeCv}
                                                            </Link>
                                                        )}
                                                        {canEditUserRecord(user) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(user)}
                                                                className="me-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                                            >
                                                                {text.edit}
                                                            </button>
                                                        )}
                                                        {canDeleteUsers && user.role?.slug !== 'admin' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteUser(user)}
                                                                disabled={user.id === auth.user.id}
                                                                className="me-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                            >
                                                                {text.delete}
                                                            </button>
                                                        )}
                                                        {canArchiveUsers && user.role?.slug !== 'admin' && user.status !== 'archived' && ['inactive', 'suspended'].includes(user.status) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => archiveUser(user)}
                                                                className="me-2 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
                                                            >
                                                                {text.archive}
                                                            </button>
                                                        )}
                                                        {canArchiveUsers && user.role?.slug !== 'admin' && user.status === 'archived' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => restoreUser(user)}
                                                                className="me-2 rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-800"
                                                            >
                                                                {text.restore}
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
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

function classifyDepartmentPosition(position) {
    const code = String(position?.code ?? '').toLowerCase();
    const name = String(position?.name ?? '');

    if (code === 'general_employee' || name.includes('احتياج')) {
        return 'unallocated';
    }

    if (code.includes('worker') || name.includes('عامل')) {
        return 'worker';
    }

    return 'admin';
}

function isFocused(id, focusId) {
    return focusId && String(id) === String(focusId);
}

function focusRowClass() {
    return 'scroll-mt-28 bg-amber-100/80 outline outline-2 outline-amber-500';
}

function scrollToFocusedRow(focusId) {
    if (!focusId) return;
    window.setTimeout(() => {
        document.getElementById(`focus-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
}

