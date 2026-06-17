@extends('erp.layout')

@section('title', $config['title'])

@section('content')
<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
    <div>
        <h1 class="h3 mb-1">{{ $config['title'] }}</h1>
        <div class="text-muted">إدارة البيانات الخاصة بهذا القسم ضمن دورة تشغيل المصنع.</div>
    </div>
    @if($editing)
        <a href="{{ route('erp.module', $module) }}" class="btn btn-outline-secondary">إلغاء التعديل</a>
    @endif
</div>

<div class="row g-4">
    <div class="col-xl-4">
        <div class="card table-card">
            <div class="card-header bg-white fw-bold">{{ $editing ? 'تعديل سجل' : 'إضافة سجل جديد' }}</div>
            <div class="card-body">
                <form method="post" action="{{ $editing ? route('erp.update', [$module, $editing->id]) : route('erp.store', $module) }}">
                    @csrf
                    @if($editing)
                        @method('put')
                    @endif
                    @foreach($config['fields'] as $field => $label)
                        @php $value = old($field, $editing->$field ?? ''); @endphp
                        <div class="mb-3">
                            <label class="form-label">{{ $label }}</label>
                            @if($field === 'password')
                                <input type="password" name="{{ $field }}" value="" class="form-control" autocomplete="new-password">
                            @elseif(isset($lookups[$field]))
                                <select name="{{ $field }}" class="form-select">
                                    <option value="">اختر</option>
                                    @foreach($lookups[$field] as $option)
                                        <option value="{{ $option->id }}" @selected((string)$value === (string)$option->id)>{{ $option->label }}</option>
                                    @endforeach
                                </select>
                            @elseif(str_contains($field, 'date') || str_ends_with($field, '_at'))
                                <input type="{{ str_ends_with($field, '_at') ? 'date' : 'date' }}" name="{{ $field }}" value="{{ $value }}" class="form-control">
                            @elseif(in_array($field, ['notes', 'stages', 'message', 'description', 'defects', 'issue'], true))
                                <textarea name="{{ $field }}" rows="3" class="form-control">{{ $value }}</textarea>
                            @elseif(str_contains($field, 'status') || in_array($field, ['priority', 'type', 'method', 'grade', 'product_type'], true))
                                <input list="list-{{ $field }}" name="{{ $field }}" value="{{ $value }}" class="form-control">
                                <datalist id="list-{{ $field }}">
                                    @foreach(['Draft','Approved','Planned','Materials Reserved','In Weaving','In Dyeing','In Quality','Ready For Invoice','Delivered','Closed','Cancelled','Pending','Running','Completed','Rejected','Unpaid','Partially Paid','Paid','Overdue','Active','Available','Open','High','Medium','Low','Preventive','Emergency','Cash','Credit','Bank Transfer','First Grade','Second Grade','Premium'] as $option)
                                        <option value="{{ $option }}">
                                    @endforeach
                                </datalist>
                            @else
                                <input name="{{ $field }}" value="{{ $value }}" class="form-control {{ in_array($field, ['subtotal','tax'], true) ? 'auto-total' : '' }}">
                            @endif
                            @error($field)<div class="small text-danger mt-1">{{ $message }}</div>@enderror
                        </div>
                    @endforeach
                    <button class="btn btn-primary w-100">{{ $editing ? 'حفظ التعديل' : 'حفظ' }}</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-xl-8">
        <div class="card table-card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <strong>السجلات</strong>
                <span class="text-muted small">{{ $records->total() }} سجل</span>
            </div>
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead class="table-light">
                    <tr>
                        <th>#</th>
                        @foreach($config['fields'] as $field => $label)
                            @if($field !== 'password')
                                <th>{{ $label }}</th>
                            @endif
                        @endforeach
                        <th>إجراءات</th>
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($records as $record)
                        <tr>
                            <td>{{ $record->id }}</td>
                            @foreach($config['fields'] as $field => $label)
                                @continue($field === 'password')
                                <td>
                                    @php $cell = $record->$field ?? ''; @endphp
                                    @if(str_contains($field, 'status') || $field === 'grade')
                                        <span class="status-pill">{{ $cell }}</span>
                                    @else
                                        {{ \Illuminate\Support\Str::limit((string)$cell, 28) }}
                                    @endif
                                </td>
                            @endforeach
                            <td class="text-nowrap">
                                @if(($record->is_system ?? false) && $module === 'users')
                                    <span class="badge text-bg-secondary">Protected</span>
                                @else
                                    <a href="{{ route('erp.edit', [$module, $record->id]) }}" class="btn btn-sm btn-outline-primary">
                                        <i class="bi bi-pencil"></i>
                                    </a>
                                    <form method="post" action="{{ route('erp.destroy', [$module, $record->id]) }}" class="d-inline" data-confirm="هل تريد حذف هذا السجل؟">
                                        @csrf
                                        @method('delete')
                                        <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                                    </form>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="{{ count($config['fields']) + 2 }}" class="text-center text-muted py-4">لا توجد بيانات بعد.</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
            <div class="card-footer bg-white">
                {{ $records->links() }}
            </div>
        </div>
    </div>
</div>
@endsection
