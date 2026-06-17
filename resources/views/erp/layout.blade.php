<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Textile ERP')</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body { background:#f5f7fb; font-family: Tahoma, Arial, sans-serif; }
        .app-shell { min-height:100vh; }
        .sidebar { width:280px; background:#18212f; color:#fff; position:fixed; inset-block:0; inset-inline-start:0; overflow:auto; }
        .sidebar a { color:#cbd5e1; text-decoration:none; border-radius:8px; display:flex; gap:.6rem; align-items:center; padding:.65rem .8rem; }
        .sidebar a:hover, .sidebar a.active { background:#263449; color:#fff; }
        .content { margin-inline-start:280px; padding:24px; }
        .metric { border:0; border-radius:8px; box-shadow:0 8px 24px rgba(15,23,42,.06); }
        .table-card { border:0; border-radius:8px; box-shadow:0 8px 24px rgba(15,23,42,.06); }
        .status-pill { border-radius:999px; padding:.25rem .6rem; background:#eef2ff; color:#3730a3; font-size:.8rem; white-space:nowrap; }
        .form-control, .form-select, .btn, .card { border-radius:8px; }
        @media (max-width: 992px) {
            .sidebar { position:static; width:100%; max-height:none; }
            .content { margin:0; padding:16px; }
        }
    </style>
</head>
<body>
@php
    $nav = [
        'users' => ['المستخدمين','bi-shield-lock'],
        'customers' => ['العملاء','bi-people'],
        'orders' => ['المبيعات','bi-receipt'],
        'production-requests' => ['طلبات الإنتاج','bi-send'],
        'plans' => ['التخطيط','bi-diagram-3'],
        'warehouses' => ['المخازن','bi-box-seam'],
        'inventory' => ['الأصناف','bi-boxes'],
        'material-issues' => ['صرف الخامات','bi-clipboard-check'],
        'machines' => ['الماكينات','bi-cpu'],
        'weaving' => ['النسج','bi-grid-3x3-gap'],
        'dyeing' => ['المصبغة','bi-droplet-half'],
        'rolls' => ['الرولات QR','bi-qr-code'],
        'quality' => ['الجودة','bi-patch-check'],
        'invoices' => ['الفواتير','bi-file-earmark-text'],
        'payments' => ['المدفوعات','bi-cash-stack'],
        'shipping' => ['الشحن','bi-truck'],
        'employees' => ['HR','bi-person-badge'],
        'maintenance' => ['الصيانة','bi-tools'],
    ];
@endphp
<div class="app-shell">
    <aside class="sidebar p-3">
        <a href="{{ route('dashboard') }}" class="mb-3 fs-5 fw-bold text-white">
            <i class="bi bi-speedometer2"></i> Textile ERP
        </a>
        <div class="small text-secondary mb-2 px-2">دورة العمل</div>
        @foreach($nav as $key => [$label, $icon])
            <a href="{{ route('erp.module', $key) }}" class="{{ request()->is("modules/$key*") ? 'active' : '' }}">
                <i class="bi {{ $icon }}"></i><span>{{ $label }}</span>
            </a>
        @endforeach
    </aside>

    <main class="content">
        @if(session('success'))
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                {{ session('success') }}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        @endif
        @if($errors->any())
            <div class="alert alert-danger">
                من فضلك راجع الحقول المطلوبة.
            </div>
        @endif
        @yield('content')
    </main>
</div>

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script>
    $(function () {
        $('[data-confirm]').on('submit', function (event) {
            if (!confirm($(this).data('confirm'))) event.preventDefault();
        });
        $('.auto-total').on('input', function () {
            const subtotal = parseFloat($('[name=subtotal]').val() || 0);
            const tax = parseFloat($('[name=tax]').val() || 0);
            $('[name=total]').val((subtotal + tax).toFixed(2));
        });
    });
</script>
@stack('scripts')
</body>
</html>
