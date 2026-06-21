<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class SpreadsheetImportService
{
    public function rows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'csv' => $this->csvRows($file->getRealPath()),
            'xlsx' => $this->xlsxRows($file->getRealPath()),
            default => throw new RuntimeException('Unsupported import file type. Use CSV or XLSX.'),
        };
    }

    private function csvRows(string $path): array
    {
        $handle = fopen($path, 'r');

        if (! $handle) {
            return [];
        }

        $firstLine = fgetcsv($handle) ?: [];
        $hasHeader = $this->hasRecognizedHeader($firstLine);
        $headers = $hasHeader ? $firstLine : [];
        $rows = [];

        if (! $hasHeader && $this->hasAnyValue($firstLine)) {
            $rows[] = $this->combine($headers, $firstLine);
        }

        while (($line = fgetcsv($handle)) !== false) {
            $rows[] = $this->combine($headers, $line);
        }

        fclose($handle);

        return $rows;
    }

    private function xlsxRows(string $path): array
    {
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            throw new RuntimeException('Could not open XLSX file.');
        }

        $sharedStrings = $this->sharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            return [];
        }

        $sheet = new SimpleXMLElement($sheetXml);
        $rawRows = [];

        foreach ($sheet->sheetData->row as $row) {
            $values = [];

            foreach ($row->c as $cell) {
                $ref = (string) $cell['r'];
                $columnIndex = $this->columnIndex(preg_replace('/\d+/', '', $ref));
                $type = (string) $cell['t'];
                $value = (string) $cell->v;
                if ($type === 's') {
                    $values[$columnIndex] = $sharedStrings[(int) $value] ?? '';
                } elseif ($type === 'inlineStr') {
                    $values[$columnIndex] = isset($cell->is->t) ? (string) $cell->is->t : '';
                } else {
                    $values[$columnIndex] = $value;
                }
            }

            ksort($values);
            $rawRows[] = $values;
        }

        $firstRow = array_values($rawRows[0] ?? []);
        $hasHeader = $this->hasRecognizedHeader($firstRow);
        $headers = $hasHeader ? $firstRow : [];
        $rows = [];

        foreach (array_slice($rawRows, $hasHeader ? 1 : 0) as $rawRow) {
            $rows[] = $this->combine($headers, array_values($rawRow));
        }

        return $rows;
    }

    private function sharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if ($xml === false) {
            return [];
        }

        $strings = [];
        $shared = new SimpleXMLElement($xml);

        foreach ($shared->si as $item) {
            $strings[] = isset($item->t) ? (string) $item->t : trim((string) $item->asXML());
        }

        return $strings;
    }

    private function combine(array $headers, array $line): array
    {
        $row = [];

        foreach ($line as $index => $value) {
            $row['column_'.($index + 1)] = trim((string) $value);
        }

        foreach ($headers as $index => $header) {
            $key = $this->normalizeHeader((string) $header);
            $row[$key] = trim((string) ($line[$index] ?? ''));
        }

        return $row;
    }

    private function hasRecognizedHeader(array $headers): bool
    {
        $recognized = [
            'code',
            'customer_code',
            'supplier_code',
            'name',
            'customer_name',
            'supplier_name',
            'name_ar',
            'product_name',
            'item_name',
            'اسم',
            'الاسم',
            'اسم_الصنف',
            'الصنف',
            'اسم_العميل',
            'العميل',
            'اسم_المورد',
            'المورد',
            'كود',
            'كود_الصنف',
            'كود_العميل',
            'كود_المورد',
            'موبايل',
            'الموبايل',
            'هاتف',
            'الهاتف',
            'تليفون',
            'البريد',
            'البريد_الإلكتروني',
            'النوع',
            'الجودة',
            'الوحدة',
            'العرض',
            'الوزن',
            'السعر',
            'الضريبة',
            'الحالة',
            'اسم',
            'الاسم',
            'اسم_الصنف',
            'الصنف',
            'اسم_العميل',
            'العميل',
            'اسم_المورد',
            'المورد',
            'كود',
            'كود_الصنف',
            'كود_العميل',
            'كود_المورد',
            'موبايل',
            'الموبايل',
            'هاتف',
            'الهاتف',
            'تليفون',
            'البريد',
            'البريد_الإلكتروني',
            'النوع',
            'الجودة',
            'الوحدة',
            'العرض',
            'الوزن',
            'السعر',
            'الضريبة',
            'الحالة',
            'اسم',
            'اسم_العميل',
            'اسم_المورد',
            'الاسم',
            'العميل',
            'المورد',
            'كود',
            'كود_العميل',
            'كود_المورد',
            'موبايل',
            'الموبايل',
            'هاتف',
            'تليفون',
            'البريد',
            'البريد_الإلكتروني',
            'اسم',
            'اسم_العميل',
            'الاسم',
            'العميل',
            'كود',
            'كود_العميل',
            'موبايل',
            'الموبايل',
            'mobile',
            'phone',
            'email',
        ];

        foreach ($headers as $header) {
            if (in_array($this->normalizeHeader((string) $header), $recognized, true)) {
                return true;
            }
        }

        return false;
    }

    private function hasAnyValue(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return true;
            }
        }

        return false;
    }

    private function normalizeHeader(string $header): string
    {
        $key = strtolower(trim($header));

        return str_replace([' ', '-', 'ـ'], '_', $key);
    }

    private function columnIndex(string $letters): int
    {
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = $index * 26 + ord(strtoupper($letter)) - 64;
        }

        return $index - 1;
    }
}
