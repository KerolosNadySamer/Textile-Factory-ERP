import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, Link } from '@inertiajs/react';

const labels = {
    ar: {
        title: 'السيرة الوظيفية',
        subtitle: 'ملف داخلي يوضح تاريخ الموظف داخل المصنع والشركة.',
        back: 'العودة للمستخدمين',
        employeeCode: 'كود الموظف',
        currentStatus: 'الحالة الحالية',
        accountStatus: 'حساب النظام',
        active: 'نشط',
        inactive: 'غير نشط',
        suspended: 'موقوف',
        enabled: 'مفعل',
        disabled: 'غير مفعل',
        department: 'القسم الحالي',
        position: 'الوظيفة الحالية',
        role: 'الدور',
        manager: 'المدير المباشر',
        hireDate: 'تاريخ التعيين',
        currentSalary: 'المرتب الحالي',
        phone: 'الهاتف',
        email: 'البريد',
        warehouses: 'المخازن المسؤول عنها',
        managers: 'المديرون / المتابعون',
        salaryHistory: 'تاريخ المرتب',
        departmentHistory: 'تاريخ الأقسام',
        positionHistory: 'تاريخ الوظائف',
        statusHistory: 'تاريخ الحالة',
        accountHistory: 'تاريخ الحساب والصلاحيات',
        monthlyReviews: 'التقييمات الشهرية',
        month: 'الشهر',
        salary: 'مرتب الشهر',
        score: 'التقييم',
        rating: 'التقدير',
        reviewedBy: 'تم بواسطة',
        publishStatus: 'حالة النشر',
        published: 'منشور للموظف',
        draft: 'غير منشور',
        activityTimeline: 'Timeline النشاطات',
        date: 'التاريخ',
        actor: 'بواسطة',
        from: 'من',
        to: 'إلى',
        change: 'قيمة التغيير',
        action: 'الإجراء',
        field: 'البند',
        noData: 'لا توجد بيانات مسجلة حتى الآن.',
        notRecorded: 'غير مسجل',
        created: 'إنشاء',
        updated: 'تعديل',
        deleted: 'حذف',
        current: 'حالي',
        basic_salary: 'المرتب الأساسي',
        department_id: 'القسم',
        position_id: 'الوظيفة',
        status: 'الحالة',
        login_enabled: 'تفعيل الحساب',
        role_id: 'الدور',
        manager_id: 'المدير',
        hired_at: 'تاريخ التعيين',
        increased: 'زيادة',
        decreased: 'نقص',
        unchanged: 'بدون تغيير',
    },
    en: {
        title: 'Employee CV',
        subtitle: 'Internal employee profile showing history inside the factory and company.',
        back: 'Back to Users',
        employeeCode: 'Employee Code',
        currentStatus: 'Current Status',
        accountStatus: 'System Account',
        active: 'Active',
        inactive: 'Inactive',
        suspended: 'Suspended',
        enabled: 'Enabled',
        disabled: 'Disabled',
        department: 'Current Department',
        position: 'Current Position',
        role: 'Role',
        manager: 'Direct Manager',
        hireDate: 'Hire Date',
        currentSalary: 'Current Salary',
        phone: 'Phone',
        email: 'Email',
        educationQualification: 'Education Qualification',
        warehouses: 'Assigned Warehouses',
        managers: 'Managers / Followers',
        salaryHistory: 'Salary History',
        departmentHistory: 'Department History',
        positionHistory: 'Position History',
        statusHistory: 'Status History',
        accountHistory: 'Account & Permission History',
        monthlyReviews: 'Monthly Reviews',
        month: 'Month',
        salary: 'Monthly Salary',
        score: 'Score',
        rating: 'Rating',
        reviewedBy: 'Reviewed By',
        publishStatus: 'Publish Status',
        published: 'Published to employee',
        draft: 'Draft',
        activityTimeline: 'Activity Timeline',
        date: 'Date',
        actor: 'Actor',
        from: 'From',
        to: 'To',
        change: 'Change',
        action: 'Action',
        field: 'Field',
        noData: 'No data recorded yet.',
        notRecorded: 'Not recorded',
        created: 'Created',
        updated: 'Updated',
        deleted: 'Deleted',
        current: 'Current',
        basic_salary: 'Basic Salary',
        education_qualification: 'Education Qualification',
        department_id: 'Department',
        position_id: 'Position',
        status: 'Status',
        login_enabled: 'Account Enabled',
        role_id: 'Role',
        manager_id: 'Manager',
        hired_at: 'Hire Date',
        increased: 'Increase',
        decreased: 'Decrease',
        unchanged: 'No change',
    },
};

const valueText = (value, fallback) => value ?? fallback;

export default function EmployeeCvShow({ auth, employee, salaryHistory, departmentHistory, positionHistory, statusHistory, accountHistory, monthlyReviews, activityTimeline }) {
    const { isRtl, text } = useLanguage(labels);
    const formatDate = (value) => value ? new Date(value).toLocaleDateString() : text.notRecorded;
    const formatNumber = (value) => value !== null && value !== undefined && value !== ''
        ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : text.notRecorded;
    const statusLabel = (status) => text[status] ?? status ?? text.notRecorded;
    const boolLabel = (value) => value ? text.enabled : text.disabled;
    const relationName = (item) => item?.name_ar ?? item?.name_en ?? item?.name ?? item?.slug ?? text.notRecorded;
    const formatMonth = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : text.notRecorded;
    const educationQualificationLabel = text.educationQualification ?? (isRtl ? 'المؤهل الدراسي' : 'Education Qualification');
    const fieldLabel = (field) => text[field] ?? (field === 'education_qualification' ? educationQualificationLabel : field);

    const summaryCards = [
        [text.employeeCode, employee.employee_code ?? text.notRecorded],
        [text.currentStatus, statusLabel(employee.status)],
        [text.accountStatus, boolLabel(employee.login_enabled)],
        [text.department, relationName(employee.department)],
        [text.position, relationName(employee.position)],
        [text.currentSalary, formatNumber(employee.basic_salary)],
        [educationQualificationLabel, employee.education_qualification ?? text.notRecorded],
        [text.hireDate, formatDate(employee.hired_at)],
        [text.role, employee.login_enabled ? relationName(employee.role) : text.disabled],
    ];
    const accountRows = [
        ...accountHistory.login.map((row) => ({
            ...row,
            field_label: text.login_enabled,
            old_label: row.old_value === null || row.old_value === undefined ? text.notRecorded : boolLabel(row.old_value),
            new_label: row.new_value === null || row.new_value === undefined ? text.notRecorded : boolLabel(row.new_value),
        })),
        ...accountHistory.role.map((row) => ({ ...row, field_label: text.role_id })),
        ...accountHistory.manager.map((row) => ({ ...row, field_label: text.manager_id })),
    ];

    const changeText = (delta) => {
        if (delta === null || delta === undefined) {
            return text.unchanged;
        }

        if (Number(delta) > 0) {
            return `${text.increased} ${formatNumber(delta)}`;
        }

        if (Number(delta) < 0) {
            return `${text.decreased} ${formatNumber(Math.abs(delta))}`;
        }

        return text.unchanged;
    };

    const DataTable = ({ title, rows, children }) => (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                {rows.length ? (
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        {children}
                    </table>
                ) : (
                    <div className="px-5 py-5 text-sm text-slate-500">{text.noData}</div>
                )}
            </div>
        </section>
    );

    const StandardHistory = ({ title, rows }) => (
        <DataTable title={title} rows={rows}>
            <thead className="bg-slate-50 text-slate-600">
                <tr>
                    <th className="px-4 py-3 text-right">{text.date}</th>
                    <th className="px-4 py-3 text-right">{text.from}</th>
                    <th className="px-4 py-3 text-right">{text.to}</th>
                    <th className="px-4 py-3 text-right">{text.actor}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((row, index) => (
                    <tr key={`${title}-${index}`}>
                        <td className="px-4 py-3">{formatDate(row.date)}</td>
                        <td className="px-4 py-3">{valueText(row.old_label, text.notRecorded)}</td>
                        <td className="px-4 py-3 font-medium text-slate-950">{valueText(row.new_label, text.notRecorded)}</td>
                        <td className="px-4 py-3">{row.actor ?? text.notRecorded}</td>
                    </tr>
                ))}
            </tbody>
        </DataTable>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}
        >
            <Head title={`${text.title} - ${employee.name}`} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            {employee.profile_photo_url ? (
                                <img src={employee.profile_photo_url} alt={employee.name} className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow" />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 shadow-sm">
                                    {employee.name?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-slate-950">{employee.name}</h1>
                                <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>
                            </div>
                        </div>
                        <Link
                            href={route('users.index')}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            {text.back}
                        </Link>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map(([label, value]) => (
                            <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                                <div className="mt-2 text-lg font-bold text-slate-950">{value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-slate-950">{text.email}</div>
                            <div className="mt-1 text-sm text-slate-600">{employee.email ?? text.notRecorded}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-slate-950">{text.phone}</div>
                            <div className="mt-1 text-sm text-slate-600">{employee.phone ?? text.notRecorded}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-slate-950">{text.manager}</div>
                            <div className="mt-1 text-sm text-slate-600">{relationName(employee.manager)}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                            <div className="text-sm font-semibold text-slate-950">{text.managers}</div>
                            <div className="mt-1 text-sm text-slate-600">
                                {employee.managers?.length ? employee.managers.map((manager) => manager.name).join(', ') : text.notRecorded}
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="text-sm font-semibold text-slate-950">{text.warehouses}</div>
                            <div className="mt-1 text-sm text-slate-600">
                                {employee.warehouses?.length ? employee.warehouses.map((warehouse) => warehouse.name).join(', ') : text.notRecorded}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6">
                        <DataTable title={text.salaryHistory} rows={salaryHistory}>
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 text-right">{text.date}</th>
                                    <th className="px-4 py-3 text-right">{text.from}</th>
                                    <th className="px-4 py-3 text-right">{text.to}</th>
                                    <th className="px-4 py-3 text-right">{text.change}</th>
                                    <th className="px-4 py-3 text-right">{text.actor}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {salaryHistory.map((row, index) => (
                                    <tr key={`salary-${index}`}>
                                        <td className="px-4 py-3">{formatDate(row.date)}</td>
                                        <td className="px-4 py-3">{formatNumber(row.old_value)}</td>
                                        <td className="px-4 py-3 font-medium text-slate-950">{formatNumber(row.new_value)}</td>
                                        <td className="px-4 py-3">{changeText(row.delta)}</td>
                                        <td className="px-4 py-3">{row.actor ?? text.notRecorded}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <StandardHistory title={text.departmentHistory} rows={departmentHistory} />
                            <StandardHistory title={text.positionHistory} rows={positionHistory} />
                            <StandardHistory title={text.statusHistory} rows={statusHistory.map((row) => ({ ...row, old_label: statusLabel(row.old_value), new_label: statusLabel(row.new_value) }))} />
                            <DataTable title={text.accountHistory} rows={accountRows}>
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-right">{text.date}</th>
                                        <th className="px-4 py-3 text-right">{text.field}</th>
                                        <th className="px-4 py-3 text-right">{text.from}</th>
                                        <th className="px-4 py-3 text-right">{text.to}</th>
                                        <th className="px-4 py-3 text-right">{text.actor}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {accountRows.map((row, index) => (
                                        <tr key={`account-${index}`}>
                                            <td className="px-4 py-3">{formatDate(row.date)}</td>
                                            <td className="px-4 py-3">{row.field_label}</td>
                                            <td className="px-4 py-3">{valueText(row.old_label, text.notRecorded)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-950">{valueText(row.new_label, text.notRecorded)}</td>
                                            <td className="px-4 py-3">{row.actor ?? text.notRecorded}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </DataTable>
                        </div>

                        <DataTable title={text.monthlyReviews} rows={monthlyReviews}>
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 text-right">{text.month}</th>
                                    <th className="px-4 py-3 text-right">{text.salary}</th>
                                    <th className="px-4 py-3 text-right">{text.score}</th>
                                    <th className="px-4 py-3 text-right">{text.rating}</th>
                                    <th className="px-4 py-3 text-right">{text.reviewedBy}</th>
                                    <th className="px-4 py-3 text-right">{text.publishStatus}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {monthlyReviews.map((review) => (
                                    <tr key={review.id}>
                                        <td className="px-4 py-3">{formatMonth(review.review_month)}</td>
                                        <td className="px-4 py-3">{formatNumber(review.salary_snapshot)}</td>
                                        <td className="px-4 py-3">{review.evaluation_score ?? text.notRecorded}</td>
                                        <td className="px-4 py-3">{review.rating ?? text.notRecorded}</td>
                                        <td className="px-4 py-3">{review.reviewer?.name ?? text.notRecorded}</td>
                                        <td className="px-4 py-3">{review.visible_to_employee ? text.published : text.draft}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>

                        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h3 className="text-base font-semibold text-slate-950">{text.activityTimeline}</h3>
                            </div>
                            {activityTimeline.length ? (
                                <div className="divide-y divide-slate-100">
                                    {activityTimeline.map((item) => (
                                        <div key={item.id} className="p-5">
                                            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                                <div className="font-semibold text-slate-950">{text[item.action] ?? item.action}</div>
                                                <div className="text-sm text-slate-500">{formatDate(item.date)} - {item.actor ?? text.notRecorded}</div>
                                            </div>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {item.changes.map((change) => (
                                                    <div key={`${item.id}-${change.field}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                                        <span className="font-semibold text-slate-950">{fieldLabel(change.field)}: </span>
                                                        {valueText(change.old_label, text.notRecorded)} {' -> '} {valueText(change.new_label, text.notRecorded)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-5 py-5 text-sm text-slate-500">{text.noData}</div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
