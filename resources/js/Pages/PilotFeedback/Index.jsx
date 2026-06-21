import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const labels = {
    ar: {
        title: 'مركز ملاحظات التشغيل',
        subtitle: 'إدارة ملاحظات التشغيل التجريبي ومتابعة تنفيذها.',
        add: 'إضافة ملاحظة',
        edit: 'تعديل',
        delete: 'حذف',
        restore: 'استعادة',
        bulkDelete: 'حذف المحدد',
        save: 'حفظ',
        cancel: 'إلغاء',
        filters: 'الفلاتر',
        trash: 'سلة المحذوفات',
        titleField: 'العنوان',
        description: 'الوصف',
        page: 'الشاشة',
        creator: 'منشئ الملاحظة',
        department: 'القسم المسؤول',
        owner: 'المسؤول',
        type: 'النوع',
        category: 'تصنيف التقرير',
        priority: 'الأولوية',
        status: 'الحالة',
        createdAt: 'تاريخ الإنشاء',
        closedAt: 'تاريخ الإغلاق',
        resolution: 'ملاحظات الحل',
        ai: 'اقتراح المساعد',
        actions: 'إجراءات',
        export: 'تصدير',
        empty: 'لا توجد ملاحظات.',
        all: 'الكل',
        types: { problem: 'مشكلة', suggestion: 'اقتراح', improvement: 'طلب تطوير' },
        categories: { bugs: 'أخطاء', improvements: 'تحسينات', user_requests: 'طلبات المستخدمين', missing_permissions: 'صلاحيات ناقصة', required_reports: 'تقارير مطلوبة', screen_changes: 'شاشات تحتاج تعديل' },
        priorities: { low: 'منخفضة', medium: 'متوسطة', high: 'عالية' },
        statuses: { new: 'جديدة', in_review: 'قيد المراجعة', resolved: 'تم الحل', rejected: 'مرفوضة', deferred: 'مؤجلة' },
    },
    en: {
        title: 'Pilot Feedback Center',
        subtitle: 'Manage pilot operation feedback and follow execution.',
        add: 'Add Feedback',
        edit: 'Edit',
        delete: 'Delete',
        restore: 'Restore',
        bulkDelete: 'Delete selected',
        save: 'Save',
        cancel: 'Cancel',
        filters: 'Filters',
        trash: 'Trash',
        titleField: 'Title',
        description: 'Description',
        page: 'Page',
        creator: 'Creator',
        department: 'Responsible department',
        owner: 'Owner',
        type: 'Type',
        category: 'Report category',
        priority: 'Priority',
        status: 'Status',
        createdAt: 'Created at',
        closedAt: 'Closed at',
        resolution: 'Resolution notes',
        ai: 'Assistant suggestion',
        actions: 'Actions',
        export: 'Export',
        empty: 'No feedback found.',
        all: 'All',
        types: { problem: 'Problem', suggestion: 'Suggestion', improvement: 'Improvement request' },
        categories: { bugs: 'Bugs', improvements: 'Improvements', user_requests: 'User requests', missing_permissions: 'Missing permissions', required_reports: 'Required reports', screen_changes: 'Screens needing changes' },
        priorities: { low: 'Low', medium: 'Medium', high: 'High' },
        statuses: { new: 'New', in_review: 'In review', resolved: 'Resolved', rejected: 'Rejected', deferred: 'Deferred' },
    },
};

const blankForm = {
    title: '',
    description: '',
    page: '',
    type: 'problem',
    finding_category: 'bugs',
    priority: 'medium',
    status: 'new',
    assigned_department_id: '',
    assigned_user_id: '',
    resolution_notes: '',
};

export default function PilotFeedbackIndex({ auth, items, departments, users, filters }) {
    const { language, isRtl, text } = useLanguage(labels);
    const rows = items.data ?? items ?? [];
    const focusId = new URLSearchParams(window.location.search).get('focus');
    const [editing, setEditing] = useState(null);
    const [selected, setSelected] = useState([]);
    const { data, setData, post, patch, processing, errors, reset } = useForm(blankForm);
    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const openCreate = () => {
        setEditing(null);
        reset();
    };

    const openEdit = (item) => {
        setEditing(item);
        setData({
            title: item.title ?? '',
            description: item.description ?? '',
            page: item.page ?? '',
            type: item.type ?? 'problem',
            finding_category: item.finding_category ?? 'bugs',
            priority: item.priority ?? 'medium',
            status: item.status ?? 'new',
            assigned_department_id: item.assigned_department_id ?? '',
            assigned_user_id: item.assigned_user_id ?? '',
            resolution_notes: item.resolution_notes ?? '',
        });
    };

    const submit = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => { setEditing(null); reset(); } };
        editing ? patch(route('pilot-feedback.update', editing.id), options) : post(route('pilot-feedback.store'), options);
    };

    const applyFilter = (key, value) => {
        router.get(route('pilot-feedback.index'), { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    };

    const toggleSelected = (id) => {
        setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const exportUrl = (format) => route('pilot-feedback.export', format, { lang: language });

    useEffect(() => {
        scrollToFocusedRow(focusId);
    }, [focusId]);

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight">{text.title}</h2>}>
            <Head title={text.title} />
            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="erp-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="text-lg font-black">{text.title}</h3>
                                <p className="mt-1 text-sm text-slate-600">{text.subtitle}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['excel', 'pdf', 'word', 'json'].map((format) => <a key={format} href={exportUrl(format)} className="control-pill">{text.export} {format.toUpperCase()}</a>)}
                                {selected.length > 0 && <button type="button" onClick={() => router.delete(route('pilot-feedback.bulk-destroy'), { data: { ids: selected }, preserveScroll: true, onSuccess: () => setSelected([]) })} className="control-pill">{text.bulkDelete}</button>}
                                <button type="button" onClick={openCreate} className="erp-button">{text.add}</button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-4">
                            <Select label={text.status} value={filters.status ?? ''} onChange={(value) => applyFilter('status', value)} options={text.statuses} all={text.all} />
                            <Select label={text.category} value={filters.finding_category ?? ''} onChange={(value) => applyFilter('finding_category', value)} options={text.categories} all={text.all} />
                            <Select label={text.priority} value={filters.priority ?? ''} onChange={(value) => applyFilter('priority', value)} options={text.priorities} all={text.all} />
                            <label className="flex items-end gap-2 text-sm font-semibold">
                                <input type="checkbox" checked={Boolean(filters.trash)} onChange={(event) => applyFilter('trash', event.target.checked ? 1 : '')} />
                                {text.trash}
                            </label>
                        </div>
                    </div>

                    <form onSubmit={submit} className="erp-card">
                        <h3 className="mb-4 text-base font-black">{editing ? text.edit : text.add}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label={text.titleField} value={data.title} onChange={(value) => setData('title', value)} error={errors.title} />
                            <Input label={text.page} value={data.page} onChange={(value) => setData('page', value)} error={errors.page} />
                            <Select label={text.type} value={data.type} onChange={(value) => setData('type', value)} options={text.types} />
                            <Select label={text.category} value={data.finding_category} onChange={(value) => setData('finding_category', value)} options={text.categories} />
                            <Select label={text.priority} value={data.priority} onChange={(value) => setData('priority', value)} options={text.priorities} />
                            <Select label={text.status} value={data.status} onChange={(value) => setData('status', value)} options={text.statuses} />
                            <Select label={text.department} value={data.assigned_department_id} onChange={(value) => setData('assigned_department_id', value)} options={Object.fromEntries(departments.map((item) => [item.id, item.name]))} all="-" />
                            <Select label={text.owner} value={data.assigned_user_id} onChange={(value) => setData('assigned_user_id', value)} options={Object.fromEntries(users.map((item) => [item.id, item.name]))} all="-" />
                        </div>
                        <Textarea label={text.description} value={data.description} onChange={(value) => setData('description', value)} error={errors.description} />
                        <Textarea label={text.resolution} value={data.resolution_notes} onChange={(value) => setData('resolution_notes', value)} />
                        <div className="mt-4 flex gap-2">
                            <button type="submit" disabled={processing} className="erp-button">{text.save}</button>
                            {editing && <button type="button" onClick={openCreate} className="control-pill">{text.cancel}</button>}
                        </div>
                    </form>

                    <div className="erp-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y text-sm" style={{ borderColor: 'var(--erp-border)' }}>
                                <thead><tr>{['', text.titleField, text.category, text.priority, text.status, text.creator, text.department, text.owner, text.ai, text.actions].map((heading) => <th key={heading} className="px-3 py-3 text-start font-semibold">{heading}</th>)}</tr></thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--erp-border)' }}>
                                    {rows.length === 0 && <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">{text.empty}</td></tr>}
                                    {rows.map((item) => {
                                        const focused = isFocused(item.id, focusId);

                                        return (
                                        <tr key={item.id} id={`focus-${item.id}`} className={focused ? focusRowClass() : ''}>
                                            <td className="px-3 py-4"><input type="checkbox" checked={selectedSet.has(item.id)} onChange={() => toggleSelected(item.id)} /></td>
                                            <td className="px-3 py-4"><div className="font-bold">{item.title}</div><div className="mt-1 text-xs text-slate-500">{item.description}</div><div className="mt-1 text-xs text-slate-500">{text.page}: {item.page ?? '-'}</div></td>
                                            <td className="px-3 py-4">{text.categories[item.finding_category] ?? item.finding_category}</td>
                                            <td className="px-3 py-4"><Badge value={text.priorities[item.priority] ?? item.priority} tone={item.priority} /></td>
                                            <td className="px-3 py-4">{text.statuses[item.status] ?? item.status}</td>
                                            <td className="px-3 py-4">{item.creator?.name ?? '-'}</td>
                                            <td className="px-3 py-4">{item.assigned_department?.name ?? item.assignedDepartment?.name ?? '-'}</td>
                                            <td className="px-3 py-4">{item.assigned_user?.name ?? item.assignedUser?.name ?? '-'}</td>
                                            <td className="px-3 py-4 text-xs text-slate-600"><div>{item.ai_owner_suggestion}</div><div>{item.ai_resolution_suggestion}</div></td>
                                            <td className="px-3 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {!item.deleted_at && <button type="button" onClick={() => openEdit(item)} className="control-pill h-8 px-2 text-xs">{text.edit}</button>}
                                                    {item.deleted_at ? (
                                                        <button type="button" onClick={() => router.patch(route('pilot-feedback.restore', item.id), {}, { preserveScroll: true })} className="control-pill h-8 px-2 text-xs">{text.restore}</button>
                                                    ) : (
                                                        <button type="button" onClick={() => router.delete(route('pilot-feedback.destroy', item.id), { preserveScroll: true })} className="control-pill h-8 px-2 text-xs">{text.delete}</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Input({ label, value, onChange, error }) {
    return <label className="block text-sm font-semibold">{label}<input value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="form-input" />{error && <div className="mt-1 text-xs text-red-600">{error}</div>}</label>;
}

function Textarea({ label, value, onChange, error }) {
    return <label className="mt-4 block text-sm font-semibold">{label}<textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="form-input min-h-24" />{error && <div className="mt-1 text-xs text-red-600">{error}</div>}</label>;
}

function Select({ label, value, onChange, options, all }) {
    return <label className="block text-sm font-semibold">{label}<select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="form-input">{all !== undefined && <option value="">{all}</option>}{Object.entries(options).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>;
}

function Badge({ value, tone }) {
    const colors = tone === 'high' ? 'bg-red-100 text-red-800' : tone === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
    return <span className={`rounded-full px-2 py-1 text-xs font-bold ${colors}`}>{value}</span>;
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
