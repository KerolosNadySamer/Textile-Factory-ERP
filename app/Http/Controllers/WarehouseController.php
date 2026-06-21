<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('MasterData/Warehouses', [
            'warehouses' => Warehouse::query()->with('department:id,name,name_ar,name_en')->orderBy('name')->get(),
            'departments' => Department::query()
                ->officialActive()
                ->orderBy('id')
                ->get(['id', 'name', 'name_ar', 'name_en', 'code']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z][A-Za-z0-9_-]*$/', 'unique:warehouses,code'],
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'active' => ['boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        Warehouse::create($request->only(['code', 'name', 'location', 'active', 'department_id']));

        return back()->with('success', 'Warehouse created.');
    }

    public function update(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z][A-Za-z0-9_-]*$/', Rule::unique('warehouses', 'code')->ignore($warehouse)],
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'active' => ['boolean'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        $warehouse->update($request->only(['code', 'name', 'location', 'active', 'department_id']));

        return back()->with('success', 'Warehouse updated.');
    }

    public function destroy(Warehouse $warehouse): RedirectResponse
    {
        $warehouse->delete();

        return back()->with('success', 'Warehouse deleted.');
    }
}
