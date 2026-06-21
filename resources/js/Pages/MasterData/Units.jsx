import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useLanguage from '@/lib/useLanguage';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = {
    ar: {
        title: 'الوحدات',
        subtitle: 'إدارة بيانات الوحدات',
        list: 'قائمة الوحدات',
        code: 'الكود',
        name: 'الاسم',
        description: 'الوصف',
        active: 'نشط',
        yes: 'نعم',
        no: 'لا',
        save: 'حفظ الوحدة',
        update: 'تحديث الوحدة',
        cancel: 'إلغاء',
        edit: 'تعديل',
        delete: 'حذف',
        actions: 'إجراءات',
        confirmDelete: (name) => `حذف الوحدة ${name}؟`,
    },
    en: {
        title: 'Units',
        subtitle: 'Manage units master data',
        list: 'Unit List',
        code: 'Code',
        name: 'Name',
        description: 'Description',
        active: 'Active',
        yes: 'Yes',
        no: 'No',
        save: 'Save Unit',
        update: 'Update Unit',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        actions: 'Actions',
        confirmDelete: (name) => `Delete unit ${name}?`,
    },
};

function Field({ label, error, children }) {
    return (
        <label className="block text-sm font-medium text-slate-700">
            <span>{label}</span>
            <div className="mt-1">{children}</div>
            {error && <div className="mt-1 text-sm text-rose-600">{error}</div>}
        </label>
    );
}

export default function Units({ auth, flash, units }) {
    const { isRtl, text } = useLanguage(labels);
    const [editingUnit, setEditingUnit] = useState(null);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
        active: true,
    });

    const resetForm = () => {
        setEditingUnit(null);
        reset('code', 'name', 'description', 'active');
        setData({ code: '', name: '', description: '', active: true });
    };

    const submit = (event) => {
        event.preventDefault();

        if (editingUnit) {
            patch(route('master-data.units.update', editingUnit.id), data, {
                preserveScroll: true,
                onSuccess: resetForm,
            });
            return;
        }

        post(route('master-data.units.store'), {
            preserveScroll: true,
            onSuccess: resetForm,
        });
    };

    const editUnit = (unit) => {
        setEditingUnit(unit);
        setData({
            code: unit.code ?? '',
            name: unit.name ?? '',
            description: unit.description ?? '',
            active: Boolean(unit.active),
        });
    };

    const deleteUnit = (unit) => {
        if (!window.confirm(text.confirmDelete(unit.name))) {
            return;
        }

        router.delete(route('master-data.units.destroy', unit.id), {
            preserveScroll: true,
        });
    };

    const alignClass = isRtl ? 'text-right' : 'text-left';

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="text-xl font-semibold leading-tight text-slate-900">{text.title}</h2>}>
            <Head title={text.title} />

            <div className="py-8" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="border-b border-slate-200 pb-4">
                            <h3 className="text-lg font-semibold text-slate-950">{text.subtitle}</h3>
                        </div>

                        {flash?.success && (
                            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Field label={text.code} error={errors.code}>
                                <input value={data.code} onChange={(event) => setData('code', event.target.value)} className="form-input w-full" required />
                            </Field>
                            <Field label={text.name} error={errors.name}>
                                <input value={data.name} onChange={(event) => setData('name', event.target.value)} className="form-input w-full" required />
                            </Field>
                            <Field label={text.description} error={errors.description}>
                                <input value={data.description} onChange={(event) => setData('description', event.target.value)} className="form-input w-full" />
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

                            <div className="lg:col-span-4">
                                <button disabled={processing} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                                    {editingUnit ? text.update : text.save}
                                </button>
                                {editingUnit && (
                                    <button type="button" onClick={resetForm} className="ms-2 rounded-md border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700">
                                        {text.cancel}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-950">{text.list}</h3>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.code}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.name}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.description}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.active}</th>
                                        <th className={`px-4 py-3 ${alignClass}`}>{text.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {units.map((unit) => (
                                        <tr key={unit.id}>
                                            <td className="px-4 py-4 font-medium text-slate-950">{unit.code}</td>
                                            <td className="px-4 py-4">{unit.name}</td>
                                            <td className="px-4 py-4">{unit.description ?? '-'}</td>
                                            <td className="px-4 py-4">{unit.active ? text.yes : text.no}</td>
                                            <td className={`px-4 py-4 ${alignClass}`}>
                                                <div className={`flex gap-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                                                    <button type="button" onClick={() => editUnit(unit)} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                                        {text.edit}
                                                    </button>
                                                    <button type="button" onClick={() => deleteUnit(unit)} className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-100">
                                                        {text.delete}
                                                    </button>
                                                </div>
                                            </td>
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
