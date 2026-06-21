<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\GovernanceChangeRequestService;
use App\Services\SpreadsheetImportService;
use App\Services\XlsxTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly GovernanceChangeRequestService $governanceChanges,
        private readonly SpreadsheetImportService $spreadsheets,
        private readonly XlsxTemplateService $xlsxTemplates,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('Products/Index', [
            'products' => Product::query()
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProduct($request);
        $data['code'] = $data['code'] ?: $this->nextProductCode();

        $this->governanceChanges->requestCreate($request->user(), Product::class, $data);

        return back()->with('success', 'Product change request sent for approval.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $this->governanceChanges->requestUpdate($request->user(), $product, $this->validateProduct($request, $product));

        return back()->with('success', 'Product change request sent for approval.');
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        $this->governanceChanges->requestDelete($request->user(), $product);

        return back()->with('success', 'Product delete request sent for approval.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required_without:import_decision', 'file', 'mimes:csv,xlsx', 'max:5120'],
            'import_decision' => ['nullable', Rule::in(['accept_duplicates', 'unique_only'])],
        ]);

        $rows = $request->input('import_decision')
            ? $request->session()->pull('pending_product_import_rows', [])
            : $this->spreadsheets->rows($request->file('file'));

        if ($rows === []) {
            return back()->with('error', 'No pending product import was found. Please upload the file again.');
        }

        $duplicateInfo = $this->duplicateImportRows($rows);

        if (! $request->input('import_decision') && $duplicateInfo['duplicate_rows'] > 0) {
            $request->session()->put('pending_product_import_rows', $rows);

            return back()->with('duplicate_product_import', [
                'duplicate_names' => $duplicateInfo['duplicate_names'],
                'duplicate_rows' => $duplicateInfo['duplicate_rows'],
                'message' => "Found {$duplicateInfo['duplicate_rows']} repeated product rows across {$duplicateInfo['duplicate_names']} codes or names.",
            ]);
        }

        $uniqueOnly = $request->input('import_decision') === 'unique_only';
        $created = 0;
        $skipped = 0;
        $errors = [];
        $seen = [];

        DB::transaction(function () use ($rows, $uniqueOnly, &$created, &$skipped, &$errors, &$seen): void {
            foreach ($rows as $index => $row) {
                $line = $index + 2;
                $name = $this->rowValue($row, ['name', 'product_name', 'item_name', 'اسم_الصنف', 'الصنف', 'column_2', 'column_1']);

                if ($name === '' || $this->isProductHeadingName($name)) {
                    $skipped++;
                    continue;
                }

                $code = $this->rowValue($row, ['code', 'product_code', 'item_code', 'كود_الصنف', 'كود', 'column_1']);
                $duplicateKey = $this->normalizeName($code !== '' ? $code : $name);

                if ($uniqueOnly && isset($seen[$duplicateKey])) {
                    $skipped++;
                    continue;
                }

                $seen[$duplicateKey] = true;

                if ($code !== '' && ! ctype_digit($code)) {
                    $errors[] = "Line {$line}: product code must contain digits only.";
                    continue;
                }

                if ($code !== '' && Product::query()->where('code', $code)->exists()) {
                    $errors[] = "Line {$line}: duplicate product code {$code}.";
                    continue;
                }

                if ($code === '') {
                    $code = $this->nextProductCode();
                }

                Product::create([
                    'code' => $code,
                    'name' => $name,
                    'type' => $this->productType($this->rowValue($row, ['type', 'product_type', 'النوع', 'column_3'])),
                    'quality' => $this->productQuality($this->rowValue($row, ['quality', 'الجودة', 'column_4'])),
                    'unit' => $this->productUnit($this->rowValue($row, ['unit', 'الوحدة', 'column_5'])),
                    'width' => $this->nullableNumber($this->rowValue($row, ['width', 'العرض', 'column_6'])),
                    'weight' => $this->nullableNumber($this->rowValue($row, ['weight', 'الوزن', 'column_7'])),
                    'price' => $this->number($this->rowValue($row, ['price', 'السعر', 'column_8'])),
                    'tax' => $this->number($this->rowValue($row, ['tax', 'الضريبة', 'column_9'])),
                    'active' => $this->activeValue($this->rowValue($row, ['active', 'status', 'الحالة', 'column_10'])),
                ]);

                $created++;
            }
        });

        $message = "Imported {$created} products.";

        if ($skipped > 0) {
            $message .= " Skipped {$skipped} heading/duplicate rows.";
        }

        if (count($errors) > 0) {
            $message .= ' Skipped: '.implode(' | ', array_slice($errors, 0, 5));
        }

        return back()->with('success', $message);
    }

    public function template(Request $request)
    {
        $language = $this->templateLanguage($request);

        if ($language === 'ar') {
            return $this->xlsxTemplates->download(
                'products_import_template_ar.xlsx',
                [
                    ['كود الصنف', 'اسم الصنف', 'النوع', 'الجودة', 'الوحدة', 'العرض', 'الوزن', 'السعر', 'الضريبة', 'الحالة'],
                    ['', 'قماش خام قطن 180 سم', 'raw_fabric', 'first', 'meter', '180', '220', '0', '14', 'active'],
                    ['', 'كرتونة تعبئة كبيرة', 'packing', '', 'carton', '', '', '0', '14', 'active'],
                ],
                true,
            );
        }

        $rows = $language === 'ar'
            ? [
                ['كود الصنف', 'اسم الصنف', 'النوع', 'الجودة', 'الوحدة', 'العرض', 'الوزن', 'السعر', 'الضريبة', 'الحالة'],
                ['', 'قماش خام قطن 180 سم', 'raw_fabric', 'first', 'meter', '180', '220', '0', '14', 'active'],
                ['', 'كرتونة تعبئة كبيرة', 'packing', '', 'carton', '', '', '0', '14', 'active'],
            ]
            : [
                ['code', 'name', 'type', 'quality', 'unit', 'width', 'weight', 'price', 'tax', 'active'],
                ['', 'Cotton Fabric 180cm', 'raw_fabric', 'first', 'meter', '180', '220', '0', '14', 'active'],
                ['', 'Packing Carton Large', 'packing', '', 'carton', '', '', '0', '14', 'active'],
            ];

        return $this->xlsxTemplates->download(
            "products_import_template_{$language}.xlsx",
            $rows,
            $language === 'ar',
        );
    }

    private function validateProduct(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'code' => ['nullable', 'digits_between:1,100', Rule::unique('products', 'code')->ignore($product)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['yarn', 'raw_fabric', 'dyed_fabric', 'chemical', 'packing'])],
            'quality' => ['nullable', Rule::in(['premium', 'first', 'second'])],
            'unit' => ['required', Rule::in(['kg', 'meter', 'piece', 'roll', 'carton'])],
            'width' => ['nullable', 'numeric', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'tax' => ['required', 'numeric', 'min:0', 'max:100'],
            'active' => ['boolean'],
        ]);
    }

    private function rowValue(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $row) && trim((string) $row[$key]) !== '') {
                return trim((string) $row[$key]);
            }
        }

        return '';
    }

    private function duplicateImportRows(array $rows): array
    {
        $seen = [];
        $duplicates = [];

        foreach ($rows as $row) {
            $name = $this->rowValue($row, ['name', 'product_name', 'item_name', 'اسم_الصنف', 'الصنف', 'column_2', 'column_1']);
            $code = $this->rowValue($row, ['code', 'product_code', 'item_code', 'كود_الصنف', 'كود', 'column_1']);

            if ($name === '' || $this->isProductHeadingName($name)) {
                continue;
            }

            $key = $this->normalizeName($code !== '' ? "code:{$code}" : "name:{$name}");

            if (isset($seen[$key])) {
                $duplicates[$key] = true;
                continue;
            }

            $seen[$key] = true;
        }

        return [
            'duplicate_names' => count($duplicates),
            'duplicate_rows' => count($duplicates),
        ];
    }

    private function isProductHeadingName(string $name): bool
    {
        return in_array($this->normalizeName($name), ['name', 'product_name', 'item_name', 'اسم الصنف', 'اسم_الصنف', 'الصنف'], true);
    }

    private function normalizeName(string $name): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $name)));
    }

    private function nextProductCode(): string
    {
        $max = Product::query()
            ->whereRaw('code REGEXP "^[0-9]+$"')
            ->selectRaw('MAX(CAST(code AS UNSIGNED)) as max_code')
            ->value('max_code');

        return str_pad((string) (((int) $max) + 1), 4, '0', STR_PAD_LEFT);
    }

    private function productType(string $value): string
    {
        $value = strtolower($value);

        return in_array($value, ['yarn', 'raw_fabric', 'dyed_fabric', 'chemical', 'packing'], true)
            ? $value
            : 'raw_fabric';
    }

    private function productQuality(string $value): ?string
    {
        $value = strtolower($value);

        return in_array($value, ['premium', 'first', 'second'], true) ? $value : null;
    }

    private function productUnit(string $value): string
    {
        $value = strtolower($value);

        return in_array($value, ['kg', 'meter', 'piece', 'roll', 'carton'], true)
            ? $value
            : 'meter';
    }

    private function nullableNumber(string $value): ?float
    {
        return $value === '' ? null : (float) $value;
    }

    private function number(string $value): float
    {
        return $value === '' ? 0 : (float) $value;
    }

    private function activeValue(string $value): bool
    {
        $value = strtolower($value);

        return ! in_array($value, ['0', 'no', 'inactive', 'false'], true);
    }

    private function templateLanguage(Request $request): string
    {
        return $request->query('lang') === 'en' ? 'en' : 'ar';
    }
}
