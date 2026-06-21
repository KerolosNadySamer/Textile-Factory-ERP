<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} {{ $number }}</title>
    <style>
        body { color: #0f172a; font-family: Arial, sans-serif; margin: 24px; direction: rtl; }
        .top { align-items: center; border-bottom: 2px solid #0f172a; display: flex; justify-content: space-between; padding-bottom: 16px; }
        .brand { align-items: center; display: flex; gap: 12px; }
        .logo { align-items: center; border: 2px solid #0f172a; display: flex; font-weight: 800; height: 48px; justify-content: center; width: 48px; }
        h1 { font-size: 24px; margin: 0; }
        .muted { color: #64748b; font-size: 12px; margin-top: 4px; }
        .barcode { display: flex; gap: 2px; height: 42px; margin-top: 8px; }
        .barcode span { background: #0f172a; display: block; height: 42px; }
        .summary { display: grid; gap: 10px; grid-template-columns: repeat(4, 1fr); margin: 22px 0; }
        .box { border: 1px solid #cbd5e1; padding: 10px; }
        .box b { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
        table { border-collapse: collapse; font-size: 12px; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
        th { background: #f1f5f9; }
        .actions { margin-bottom: 18px; text-align: left; }
        button { background: #0f172a; border: 0; border-radius: 6px; color: white; cursor: pointer; font-weight: 700; padding: 10px 14px; }
        @media print {
            .actions { display: none; }
            body { margin: 0; }
        }
    </style>
</head>
<body>
<div class="actions"><button onclick="window.print()">طباعة / حفظ PDF</button></div>
<div class="top">
    <div class="brand">
        <div class="logo">ERP</div>
        <div>
            <h1>{{ $title }}</h1>
            <div class="muted">شركة أسود للصباغة والتجهيز والنسيج</div>
        </div>
    </div>
    <div>
        <div><b>رقم المستند:</b> {{ $number }}</div>
        <div class="muted">تاريخ الطباعة {{ now()->format('Y-m-d H:i') }}</div>
        <div class="barcode" aria-label="barcode">
            @foreach (str_split(substr(md5($number), 0, 18)) as $char)
                <span style="width: {{ (hexdec($char) % 4) + 1 }}px"></span>
            @endforeach
        </div>
    </div>
</div>

<div class="summary">
    @foreach ($summary as $label => $value)
        <div class="box"><b>{{ $label }}</b>{{ $value ?: '-' }}</div>
    @endforeach
</div>

<table>
    <thead>
    <tr>
        @foreach ($headings as $heading)
            <th>{{ $heading }}</th>
        @endforeach
    </tr>
    </thead>
    <tbody>
    @forelse ($rows as $row)
        <tr>
            @foreach ($row as $cell)
                <td>{{ $cell ?: '-' }}</td>
            @endforeach
        </tr>
    @empty
        <tr><td colspan="{{ count($headings) }}">لا توجد بيانات.</td></tr>
    @endforelse
    </tbody>
</table>
</body>
</html>
