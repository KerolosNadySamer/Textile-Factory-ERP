import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'المخازن',
        subtitle: 'إدارة بيانات المخازن وربطها بالقسم المسؤول',
        list: 'قائمة المخازن',
        code: 'الكود',
        codeHint: 'اكتب كود إنجليزي مثل WH-YARN أو yarn_store',
        name: 'الاسم',
        location: 'الموقع',
        department: 'القسم المسؤول',
        noDepartment: 'بدون قسم',
        active: 'نشط',
        yes: 'نعم',
        no: 'لا',
        save: 'حفظ المخزن',
        update: 'تحديث المخزن',
        cancel: 'إلغاء',
        edit: 'تعديل',
        delete: 'حذف',
        actions: 'إجراءات',
        confirmDelete: (name) => `حذف المخزن ${name}؟`,
    },
    en: {
        title: 'Warehouses',
        subtitle: 'Manage warehouse master data and responsible department',
        list: 'Warehouse List',
        code: 'Code',
        codeHint: 'Use an English code like WH-YARN or yarn_store',
        name: 'Name',
        location: 'Location',
        department: 'Responsible Department',
        noDepartment: 'No Department',
        active: 'Active',
        yes: 'Yes',
        no: 'No',
        save: 'Save Warehouse',
        update: 'Update Warehouse',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        actions: 'Actions',
        confirmDelete: (name) => `Delete warehouse ${name}?`,
    },
};

export default function Warehouses({ auth, flash, warehouses, departments = [] }) {
    const { language, isRtl, text } = useLanguage(labels);
    const permissions = auth.permissions ?? auth.user.role?.permissions?.map((permission) => permission.slug) ?? [];
    const canManage = permissions.includes('manage_warehouses');
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        code: '',
        name: '',
        location: '',
        department_id: '',
        active: true,
    });

    const departmentLabel = (department) => language === 'ar'
        ? (department?.name_ar ?? department?.name ?? department?.name_en ?? '')
        : (department?.name_en ?? department?.name ?? department?.name_ar ?? '');

    const resetForm = () => {
        setEditingWarehouse(null);
        reset('code', 'name', 'location', 'department_id', 'active');
        setData({ code: '', name: '', location: '', department_id: '', active: true });
    };

    const submit = (event) => {
        event.preventDefault();

        if (editingWarehouse) {
            patch(route('master-data.warehouses.update', editingWarehouse.id), data, {
                preserveScroll: true,
                onSuccess: resetForm,
            });
            return;
        }

        post(route('master-data.warehouses.store'), {
            preserveScroll: true,
            onSuccess: resetForm,
        });
    };

    const editWarehouse = (warehouse) => {
        setEditingWarehouse(warehouse);
        setData({
            code: warehouse.code ?? '',
            name: warehouse.name ?? '',
            location: warehouse.location ?? '',
            department_id: warehouse.department_id ?? '',
            active: Boolean(warehouse.active),
        });
    };

    const deleteWarehouse = (warehouse) => {
        if (!window.confirm(text.confirmDelete(warehouse.name))) {
            return;
        }

        router.delete(route('master-data.warehouses.destroy', warehouse.id), {
            preserveScroll: true,
        });
    };

    const alignClass = isRtl ? 'text-right' : 'text-left';

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {canManage && (
                        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="border-b border-slate-200 pb-4">
                                <h3 className="text-lg font-semibold text-slate-950">{text.subtitle}</h3>
                            </div>

                            {flash?.success && (
                                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                    {flash.success}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <Field label={text.code} error={errors.code}>
                                    <input
                                        value={data.code}
                                        onChange={(event) => setData('code', event.target.value)}
                                        className="form-input w-full"
                                        placeholder="WH-YARN"
                                        pattern="[A-Za-z][A-Za-z0-9_-]*"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-slate-500">{text.codeHint}</p>
                                </Field>
                                <Field label={text.name} error={errors.name}>
                                    <input value={data.name} onChange={(event) => setData('name', event.target.value)} className="form-input w-full" required />
                                </Field>
                                <Field label={text.location} error={errors.location}>
                                    <input value={data.location} onChange={(event) => setData('location', event.target.value)} className="form-input w-full" />
                                </Field>
                                <Field label={text.department} error={errors.department_id}>
                                    <select value={data.department_id} onChange={(event) => setData('department_id', event.target.value)} className="form-input w-full">
                                        <option value="">{text.noDepartment}</option>
                                        {departments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {departmentLabel(department)}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={data.active}
                                        onChange={(event) => setData('active', event.target.checked)}
                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                    />
                                    {text.active}
                                </label>

                                <div className="lg:col-span-5">
                                    <button disabled={processing} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                        {editingWarehouse ? text.update : text.save}
                                    </button>
                                    {editingWarehouse && (
                                        <button type="button" onClick={resetForm} className="ms-2 rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700">
                                            {text.cancel}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">{text.list}</h3>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.code}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.name}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.location}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.department}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.active}</th>
                                        {canManage && <th className={`px-4 py-3 ${alignClass}`}>{text.actions}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {warehouses.map((warehouse) => (
                                        <tr key={warehouse.id}>
                                            <td className="px-4 py-4 font-medium text-slate-950">{warehouse.code}</td>
                                            <td className="px-4 py-4">{warehouse.name}</td>
                                            <td className="px-4 py-4">{warehouse.location ?? '-'}</td>
                                            <td className="px-4 py-4">{departmentLabel(warehouse.department) || text.noDepartment}</td>
                                            <td className="px-4 py-4">{warehouse.active ? text.yes : text.no}</td>
                                            {canManage && (
                                                <td className={`px-4 py-4 ${alignClass}`}>
                                                    <div className={`flex gap-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                                                        <button type="button" onClick={() => editWarehouse(warehouse)} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                                            {text.edit}
                                                        </button>
                                                        <button type="button" onClick={() => deleteWarehouse(warehouse)} className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-100">
                                                            {text.delete}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            <span>{label}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-rose-600">{error}</div>}
        </label>
    );
}
