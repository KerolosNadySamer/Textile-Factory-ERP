@extends('erp.layout')

@section('title', 'لوحة التحكم')

@section('content')
<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
    <div>
        <h1 class="h3 mb-1">لوحة التحكم</h1>
        <div class="text-muted">متابعة دورة الطلبية من المبيعات حتى الإغلاق والتسليم.</div>
    </div>
    <a href="{{ route('erp.module', 'orders') }}" class="btn btn-primary">
        <i class="bi bi-plus-lg"></i> طلبية جديدة
    </a>
</div>

<div class="row g-3 mb-4">
    @foreach($cards as $label => $value)
        <div class="col-6 col-xl-2">
            <div class="card metric">
                <div class="card-body">
                    <div class="text-muted small">{{ $label }}</div>
                    <div class="fs-3 fw-bold">{{ $value }}</div>
                </div>
            </div>
        </div>
    @endforeach
</div>

<div class="row g-4">
    <div class="col-lg-8">
        <div class="card table-card">
            <div class="card-header bg-white fw-bold">أحدث الطلبيات</div>
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead class="table-light">
                    <tr>
                        <th>رقم الطلبية</th>
                        <th>العميل</th>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>التسليم</th>
                        <th>الحالة</th>
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($orders as $order)
                        <tr>
                            <td>{{ $order->order_no }}</td>
                            <td>{{ $order->customer_name }}</td>
                            <td>{{ $order->product }}</td>
                            <td>{{ number_format($order->quantity, 2) }}</td>
                            <td>{{ $order->delivery_date }}</td>
                            <td><span class="status-pill">{{ $order->status }}</span></td>
                        </tr>
                    @empty
                        <tr><td colspan="6" class="text-center text-muted py-4">لا توجد طلبيات بعد.</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col-lg-4">
        <div class="card table-card mb-4">
            <div class="card-header bg-white fw-bold">تنبيهات المخزون</div>
            <div class="list-group list-group-flush">
                @forelse($lowStock as $item)
                    <div class="list-group-item d-flex justify-content-between">
                        <span>{{ $item->name }}</span>
                        <strong>{{ $item->quantity }} {{ $item->unit }}</strong>
                    </div>
                @empty
                    <div class="list-group-item text-muted">لا يوجد أصناف تحت حد الطلب.</div>
                @endforelse
            </div>
        </div>
        <div class="card table-card">
            <div class="card-header bg-white fw-bold">الإشعارات</div>
            <div class="list-group list-group-flush">
                @forelse($alerts as $alert)
                    <div class="list-group-item">
                        <div class="fw-bold">{{ $alert->title }}</div>
                        <div class="small text-muted">{{ $alert->message }}</div>
                    </div>
                @empty
                    <div class="list-group-item text-muted">لا توجد إشعارات.</div>
                @endforelse
            </div>
        </div>
    </div>
</div>

<div class="card table-card mt-4">
    <div class="card-body">
        <canvas id="workflowChart" height="90"></canvas>
    </div>
</div>
@endsection

@push('scripts')
<script>
    new Chart(document.getElementById('workflowChart'), {
        type: 'bar',
        data: {
            labels: ['المبيعات', 'التخطيط', 'النسج', 'الصباغة', 'الجودة', 'الفواتير'],
            datasets: [{
                label: 'نشاط النظام',
                data: @json(array_values($cards)),
                backgroundColor: '#2563eb'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
</script>
@endpush
