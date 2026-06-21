import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

const labels = {
    ar: {
        title: 'التقييمات الشهرية للموظفين',
        subtitle: 'تسجيل تقييم كل شهر مع مرتب الشهر، ولا يظهر للموظف إلا بعد النشر.',
        employee: 'الموظف',
        month: 'الشهر',
        salary: 'مرتب الشهر',
        score: 'التقييم من 100',
        rating: 'التقدير',
        notes: 'ملاحظات',
        strengths: 'نقاط القوة',
        improvements: 'نقاط التحسين',
        visible: 'ظاهر للموظف',
        save: 'حفظ تقييم الشهر',
        currentSalary: 'المرتب الحالي',
        department: 'القسم',
        position: 'الوظيفة',
        latestReviews: 'آخر التقييمات',
        reviewedBy: 'تم بواسطة',
        status: 'النشر',
        published: 'منشور',
        draft: 'غير منشور',
        noData: 'لا توجد تقييمات مسجلة حتى الآن.',
        notRecorded: 'غير مسجل',
        selectEmployee: 'اختر موظف',
    },
    en: {
        title: 'Employee Monthly Reviews',
        subtitle: 'Record each month review with salary snapshot, visible to the employee only when published.',
        employee: 'Employee',
        month: 'Month',
        salary: 'Monthly Salary',
        score: 'Score / 100',
        rating: 'Rating',
        notes: 'Notes',
        strengths: 'Strengths',
        improvements: 'Improvements',
        visible: 'Visible to employee',
        save: 'Save Monthly Review',
        currentSalary: 'Current Salary',
        department: 'Department',
        position: 'Position',
        latestReviews: 'Latest Reviews',
        reviewedBy: 'Reviewed By',
        status: 'Publish',
        published: 'Published',
        draft: 'Draft',
        noData: 'No reviews recorded yet.',
        notRecorded: 'Not recorded',
        selectEmployee: 'Select employee',
    },
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function EmployeeMonthlyReviewsIndex({ auth, flash, employees, reviews }) {
    const { isRtl, text } = useLanguage(labels);
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        review_month: currentMonth(),
        salary_snapshot: '',
        evaluation_score: '',
        rating: '',
        notes: '',
        strengths: '',
        improvements: '',
        visible_to_employee: false,
    });

    const selectedEmployee = useMemo(
        () => employees.find((employee) => String(employee.id) === String(data.user_id)),
        [employees, data.user_id],
    );

    const formatNumber = (value) => value !== null && value !== undefined && value !== ''
        ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : text.notRecorded;

    const formatMonth = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : text.notRecorded;

    const submit = (event) => {
        event.preventDefault();
        post(route('employee-monthly-reviews.store'), {
            preserveScroll: true,
            onSuccess: () => reset('evaluation_score', 'rating', 'notes', 'strengths', 'improvements'),
        });
    };

    const chooseEmployee = (employeeId) => {
        const employee = employees.find((item) => String(item.id) === String(employeeId));
        setData((current) => ({
            ...current,
            user_id: employeeId,
            salary_snapshot: employee?.basic_salary ?? '',
        }));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}
        >
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">{text.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{text.subtitle}</p>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{text.employee}</label>
                                <select
                                    value={data.user_id}
                                    onChange={(event) => chooseEmployee(event.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    required
                                >
                                    <option value="">{text.selectEmployee}</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.employee_code ?? employee.id} - {employee.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.user_id && <div className="mt-1 text-sm text-red-600">{errors.user_id}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{text.month}</label>
                                <input
                                    type="month"
                                    value={data.review_month}
                                    onChange={(event) => setData('review_month', event.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                    required
                                />
                                {errors.review_month && <div className="mt-1 text-sm text-red-600">{errors.review_month}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{text.salary}</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.salary_snapshot}
                                    onChange={(event) => setData('salary_snapshot', event.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                />
                                {errors.salary_snapshot && <div className="mt-1 text-sm text-red-600">{errors.salary_snapshot}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{text.score}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={data.evaluation_score}
                                    onChange={(event) => setData('evaluation_score', event.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                />
                                {errors.evaluation_score && <div className="mt-1 text-sm text-red-600">{errors.evaluation_score}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">{text.rating}</label>
                                <input
                                    value={data.rating}
                                    onChange={(event) => setData('rating', event.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                />
                                {errors.rating && <div className="mt-1 text-sm text-red-600">{errors.rating}</div>}
                            </div>

                            <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.visible_to_employee}
                                    onChange={(event) => setData('visible_to_employee', event.target.checked)}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                />
                                {text.visible}
                            </label>

                            {selectedEmployee && (
                                <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:col-span-2">
                                    {text.currentSalary}: <span className="font-semibold text-slate-950">{formatNumber(selectedEmployee.basic_salary)}</span>
                                    <span className="mx-2">|</span>
                                    {text.department}: {selectedEmployee.department?.name ?? text.notRecorded}
                                    <span className="mx-2">|</span>
                                    {text.position}: {selectedEmployee.position?.name ?? text.notRecorded}
                                </div>
                            )}

                            <div className="md:col-span-2 lg:col-span-4">
                                <label className="block text-sm font-medium text-slate-700">{text.notes}</label>
                                <textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} rows="2" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">{text.strengths}</label>
                                <textarea value={data.strengths} onChange={(event) => setData('strengths', event.target.value)} rows="2" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">{text.improvements}</label>
                                <textarea value={data.improvements} onChange={(event) => setData('improvements', event.target.value)} rows="2" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500" />
                            </div>

                            <div className="md:col-span-2 lg:col-span-4">
                                <button type="submit" disabled={processing} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                    {text.save}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-slate-950">{text.latestReviews}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            {reviews.length ? (
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-3 text-right">{text.month}</th>
                                            <th className="px-4 py-3 text-right">{text.employee}</th>
                                            <th className="px-4 py-3 text-right">{text.salary}</th>
                                            <th className="px-4 py-3 text-right">{text.score}</th>
                                            <th className="px-4 py-3 text-right">{text.rating}</th>
                                            <th className="px-4 py-3 text-right">{text.reviewedBy}</th>
                                            <th className="px-4 py-3 text-right">{text.status}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {reviews.map((review) => (
                                            <tr key={review.id}>
                                                <td className="px-4 py-3">{formatMonth(review.review_month)}</td>
                                                <td className="px-4 py-3 font-medium text-slate-950">{review.employee?.name ?? text.notRecorded}</td>
                                                <td className="px-4 py-3">{formatNumber(review.salary_snapshot)}</td>
                                                <td className="px-4 py-3">{review.evaluation_score ?? text.notRecorded}</td>
                                                <td className="px-4 py-3">{review.rating ?? text.notRecorded}</td>
                                                <td className="px-4 py-3">{review.reviewer?.name ?? text.notRecorded}</td>
                                                <td className="px-4 py-3">{review.visible_to_employee ? text.published : text.draft}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="px-6 py-5 text-sm text-slate-500">{text.noData}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
