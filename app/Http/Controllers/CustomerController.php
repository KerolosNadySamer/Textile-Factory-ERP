<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use App\Services\GovernanceChangeRequestService;
use App\Services\NotificationService;
use App\Services\SequenceService;
use App\Services\SpreadsheetImportService;
use App\Services\TimelineService;
use App\Services\XlsxTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(
        private readonly TimelineService $timeline,
        private readonly SequenceService $sequences,
        private readonly SpreadsheetImportService $spreadsheets,
        private readonly NotificationService $notifications,
        private readonly XlsxTemplateService $xlsxTemplates,
        private readonly GovernanceChangeRequestService $governanceChanges,
    )
    {
    }

    public function index(Request $request): Response
    {
        $salesRepId = $request->input('sales_rep_id');
        $relations = $this->customerIndexRelations();

        return Inertia::render('MasterData/Customers', [
            'customers' => Customer::query()
                ->with($relations)
                ->when($salesRepId, fn ($query) => $query->where('sales_rep_id', $salesRepId))
                ->where(fn ($query) => $this->completeOrApprovedCustomerQuery($query))
                ->orderByRaw($this->numericCodeOrderExpression('code', 0).' DESC')
                ->orderBy('code')
                ->get(),
            'incompleteCustomers' => Customer::query()
                ->with($relations)
                ->when($salesRepId, fn ($query) => $query->where('sales_rep_id', $salesRepId))
                ->where(fn ($query) => $this->incompleteCustomerQuery($query))
                ->orderByRaw($this->numericCodeOrderExpression('code', 0).' DESC')
                ->orderBy('code')
                ->get()
                ->map(function (Customer $customer) {
                    $customer->setAttribute('missing_fields', $this->missingCustomerFields($customer));

                    return $customer;
                }),
            'salesReps' => User::query()
                ->where('status', 'active')
                ->whereHas('department', fn ($query) => $query->where('code', 'sales'))
                ->whereHas('position', fn ($query) => $query->whereIn('code', ['sales_rep', 'sales_officer', 'sales_manager']))
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => [
                'sales_rep_id' => $salesRepId,
            ],
        ]);
    }

    private function customerIndexRelations(): array
    {
        return [
            'creator:id,name,department_id',
            'updater:id,name,department_id',
            'salesRep:id,name',
            'dataReviewer:id,name',
            'salesOfficerApprover:id,name',
            'salesManagerApprover:id,name',
            'dataRejecter:id,name',
            'portalUsers:id,name,email,customer_id,login_enabled,status',
            'timeline' => fn ($query) => $query->with(['user:id,name', 'department:id,name,code'])->oldest(),
        ];
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request->hasFile('profile_photo')) {
            return back()->with('error', 'Customer photo upload must be done after the customer change request is approved.');
        }

        $data = $this->validateCustomer($request);
        $sequence = $this->sequences->next('customers');
        $data['code'] = empty($data['code']) ? $sequence['code'] : $data['code'];
        $data['internal_sequence'] = $sequence['number'];
        $data['barcode'] = $data['code'];
        $data['name'] = $data['name_ar'];
        $data['active'] = $data['status'] === 'active';
        $data['data_status'] = 'pending_sales_officer';
        $data['verification_tier'] = 'none';
        $data['data_reviewed_by'] = null;
        $data['data_reviewed_at'] = null;
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;

        if ($request->hasFile('national_id_image')) {
            $data['national_id_image_path'] = $request->file('national_id_image')->store('customer-national-ids', 'public');
        }

        unset($data['profile_photo'], $data['national_id_image']);

        $this->governanceChanges->requestCreate($request->user(), Customer::class, $data);

        return back()->with('success', 'Customer change request sent for approval.');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($customer->data_status !== 'approved' || $request->user()?->hasRole('admin'), 403);

        if ($request->hasFile('profile_photo')) {
            return back()->with('error', 'Customer photo upload must be done after the customer change request is approved.');
        }

        $data = $this->validateCustomer($request, $customer);
        $data['code'] = $data['code'] ?: $customer->code;
        $data['barcode'] = $data['barcode'] ?? $data['code'];
        $data['name'] = $data['name_ar'];
        $data['active'] = $data['status'] === 'active';
        $data['updated_by'] = $request->user()->id;

        if ($request->hasFile('national_id_image')) {
            $data['national_id_image_path'] = $request->file('national_id_image')->store('customer-national-ids', 'public');
        }

        if (in_array($customer->data_status, ['rejected_sales_officer', 'rejected_sales_manager'], true)) {
            $data['data_status'] = 'pending_sales_officer';
            $data['data_rejected_by'] = null;
            $data['data_rejected_at'] = null;
            $data['data_rejection_stage'] = null;
            $data['data_rejection_reason'] = null;
            $data['sales_officer_approved_by'] = null;
            $data['sales_officer_approved_at'] = null;
            $data['sales_manager_approved_by'] = null;
            $data['sales_manager_approved_at'] = null;
        } elseif ($customer->data_status === 'approved') {
            $data['data_status'] = 'approved';
        } else {
            $data['data_status'] = $customer->data_status ?: 'pending_sales_officer';
        }

        unset($data['profile_photo'], $data['national_id_image']);

        if ($customer->data_status !== 'approved') {
            $wasRejected = in_array($customer->data_status, ['rejected_sales_officer', 'rejected_sales_manager'], true);

            $customer->update($data);
            $customer->refresh();

            $this->timeline->record(
                $customer,
                'Customer Data Updated',
                "Customer {$customer->code} data was completed or updated before final approval.",
                $request->user(),
            );

            if ($wasRejected || $this->isCustomerRecordComplete($customer)) {
                $this->notifyCustomerReviewIfPending($customer, $request->user());
            }

            return back()->with('success', 'تم حفظ بيانات العميل وتحديث الكشف مباشرة.');
        }

        $this->governanceChanges->requestUpdate($request->user(), $customer, $data);

        return back()->with('success', 'Customer change request sent for approval.');
    }

    public function approveData(Request $request, Customer $customer): RedirectResponse
    {
        if (in_array($customer->data_status, ['pending_review', 'pending_sales_officer'], true)) {
            abort_unless($this->canApproveAsSalesOfficer($request->user()), 403);

            if (! $this->isCustomerRecordComplete($customer)) {
                return back()->with('error', 'لا يمكن اعتماد العميل قبل استكمال البيانات المطلوبة: المندوب، المدينة، شروط الدفع، الرقم القومي، وصورة البطاقة.');
            }

            $customer->update([
                'data_status' => 'pending_sales_manager',
                'sales_officer_approved_by' => $request->user()->id,
                'sales_officer_approved_at' => now(),
                'updated_by' => $request->user()->id,
            ]);

            $this->timeline->record($customer, 'Customer Data Sales Officer Approved', "Customer {$customer->code} data was approved by sales officer.", $request->user());
            $this->notifyCustomerManagerReview($customer->fresh(), $request->user());

            return back()->with('success', 'Customer data approved by sales officer and sent to sales manager.');
        }

        abort_unless($customer->data_status === 'pending_sales_manager' && $this->canApproveAsSalesManager($request->user()), 403);

        $customer->update([
            'data_status' => 'approved',
            'verification_tier' => $this->verificationTierFor($customer),
            'sales_manager_approved_by' => $request->user()->id,
            'sales_manager_approved_at' => now(),
            'data_reviewed_by' => $request->user()->id,
            'data_reviewed_at' => now(),
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($customer, 'Customer Data Approved', "تم اعتماد بيانات العميل {$customer->code} كما هي.", $request->user());

        return back()->with('success', 'Customer data approved.');
    }

    public function archive(Request $request, Customer $customer): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $customer->update([
            'status' => 'inactive',
            'active' => false,
            'archived_at' => now(),
            'archived_by' => $request->user()->id,
            'archived_reason' => $data['reason'] ?? 'Archived by sales/admin review.',
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($customer, 'Customer Archived', "Customer {$customer->code} was archived.", $request->user());

        return back()->with('success', 'Customer archived.');
    }

    public function restore(Request $request, Customer $customer): RedirectResponse
    {
        $customer->update([
            'status' => 'active',
            'active' => true,
            'archived_at' => null,
            'archived_by' => null,
            'archived_reason' => null,
            'data_status' => 'pending_sales_officer',
            'verification_tier' => 'none',
            'accounting_statement_confirmed_at' => null,
            'accounting_statement_confirmed_by' => null,
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($customer, 'Customer Restored', "Customer {$customer->code} was restored and sent to sales review.", $request->user());
        $this->notifyCustomerReviewIfPending($customer->fresh(), $request->user());

        return back()->with('success', 'Customer restored and sent to sales review.');
    }

    public function activatePortalAccount(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('admin'), 403);

        $customer->portalUsers()
            ->whereHas('role', fn ($query) => $query->where('slug', 'customer'))
            ->update([
                'login_enabled' => true,
                'status' => 'active',
            ]);

        $customer->update([
            'status' => 'active',
            'active' => true,
            'data_status' => 'pending_sales_officer',
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($customer, 'Customer Portal Account Activated', "Customer {$customer->code} portal account was activated and sent to sales review.", $request->user());
        $this->notifyCustomerReviewIfPending($customer->fresh(), $request->user());

        return back()->with('success', 'تم تفعيل حساب العميل وإرساله للمبيعات لاستكمال المراجعة.');
    }

    public function createPortalAccount(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($this->canApproveAsSalesOfficer($request->user()), 403);

        $existingPortalUser = $customer->portalUsers()
            ->whereHas('role', fn ($query) => $query->where('slug', 'customer'))
            ->first();

        $data = $request->validate([
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($existingPortalUser),
                Rule::unique('customers', 'email')->ignore($customer),
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $userData = [
            'name' => $customer->name_ar ?? $customer->name,
            'name_ar' => $customer->name_ar ?? $customer->name,
            'name_en' => $customer->name_en,
            'email' => $data['email'],
            'phone' => $customer->mobile ?: $customer->phone,
            'status' => 'active',
            'login_enabled' => true,
            'role_id' => Role::query()->where('slug', 'customer')->value('id'),
            'customer_id' => $customer->id,
            'password' => Hash::make($data['password']),
        ];

        if ($existingPortalUser) {
            $existingPortalUser->update($userData);
        } else {
            User::create($userData);
        }

        $customer->update([
            'email' => $data['email'],
            'status' => 'active',
            'active' => true,
            'data_status' => 'pending_sales_officer',
            'verification_tier' => 'none',
            'sales_officer_approved_by' => null,
            'sales_officer_approved_at' => null,
            'sales_manager_approved_by' => null,
            'sales_manager_approved_at' => null,
            'data_reviewed_by' => null,
            'data_reviewed_at' => null,
            'data_rejected_by' => null,
            'data_rejected_at' => null,
            'data_rejection_stage' => null,
            'data_rejection_reason' => null,
            'archived_at' => null,
            'archived_by' => null,
            'archived_reason' => null,
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($customer, 'Customer Portal Account Linked', "Portal account was linked to customer {$customer->code} and sent to sales approval.", $request->user());
        $this->notifyCustomerReviewIfPending($customer->fresh(), $request->user());

        return back()->with('success', 'تم ربط حساب دخول العميل بنفس بياناته وإرساله لاعتماد المبيعات.');
    }

    public function rejectData(Request $request, Customer $customer): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if (in_array($customer->data_status, ['pending_review', 'pending_sales_officer'], true)) {
            abort_unless($this->canApproveAsSalesOfficer($request->user()), 403);

            $status = 'rejected_sales_officer';
            $stage = 'sales_officer';
        } else {
            abort_unless($customer->data_status === 'pending_sales_manager' && $this->canApproveAsSalesManager($request->user()), 403);

            $status = 'rejected_sales_manager';
            $stage = 'sales_manager';
        }

        $customer->update([
            'data_status' => $status,
            'data_rejected_by' => $request->user()->id,
            'data_rejected_at' => now(),
            'data_rejection_stage' => $stage,
            'data_rejection_reason' => $data['reason'],
            'updated_by' => $request->user()->id,
        ]);

        $this->timeline->record($customer, 'Customer Data Returned For Correction', "Customer {$customer->code} data was returned for correction: {$data['reason']}", $request->user());
        $this->notifyCustomerCreatorForCorrection($customer->fresh('creator', 'dataRejecter'), $request->user(), $data['reason']);

        return back()->with('success', 'Customer data returned to creator for correction.');
    }

    public function notifyIncompleteData(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($this->canApproveAsSalesManager($request->user()), 403);

        $missingFields = $this->missingCustomerFields($customer);

        if (empty($missingFields)) {
            return back()->with('success', 'بيانات العميل مكتملة ولا تحتاج تنبيه متابعة.');
        }

        $recipients = $this->customerIncompleteFollowUpRecipients($customer);

        if ($recipients->isEmpty()) {
            return back()->with('error', 'لا يوجد مندوب أو مدخل بيانات أو مسؤول مبيعات نشط لإرسال التنبيه.');
        }

        $missingText = implode('، ', $missingFields);

        $this->notifications->sendToUsers(
            $recipients,
            "استكمال بيانات عميل {$customer->code}",
            "العميل {$customer->name_ar} بياناته ناقصة: {$missingText}. برجاء التواصل مع العميل واستكمال البيانات قبل الاعتماد.",
            route('master-data.customers', ['focus' => $customer->id]),
            $request->user(),
        );

        $this->timeline->record($customer, 'Incomplete Customer Follow-up Sent', "Missing customer data follow-up sent: {$missingText}", $request->user());

        return back()->with('success', 'تم إرسال تنبيه متابعة البيانات للمعنيين.');
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        $this->governanceChanges->requestDelete($request->user(), $customer);

        return back()->with('success', 'Customer delete request sent for approval.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required_without:import_decision', 'file', 'mimes:csv,xlsx', 'max:5120'],
            'import_decision' => ['nullable', Rule::in(['accept_duplicates', 'unique_only'])],
        ]);

        $rows = $request->input('import_decision')
            ? $request->session()->pull('pending_customer_import_rows', [])
            : $this->spreadsheets->rows($request->file('file'));

        if ($rows === []) {
            return back()->with('error', 'No pending customer import was found. Please upload the file again.');
        }

        $duplicateInfo = $this->duplicateImportNames($rows);

        if (! $request->input('import_decision') && $duplicateInfo['duplicate_rows'] > 0) {
            $request->session()->put('pending_customer_import_rows', $rows);

            return back()->with('duplicate_import', [
                'duplicate_names' => $duplicateInfo['duplicate_names'],
                'duplicate_rows' => $duplicateInfo['duplicate_rows'],
                'message' => "Found {$duplicateInfo['duplicate_rows']} repeated customer name rows across {$duplicateInfo['duplicate_names']} names.",
            ]);
        }

        $uniqueOnly = $request->input('import_decision') === 'unique_only';
        $created = 0;
        $skippedDuplicates = 0;
        $pendingReviewCount = 0;
        $errors = [];
        $seenNames = [];

        DB::transaction(function () use ($request, $rows, $uniqueOnly, &$created, &$skippedDuplicates, &$pendingReviewCount, &$errors, &$seenNames): void {
            foreach ($rows as $index => $row) {
                $line = $index + 2;
                $nameAr = $this->rowValue($row, ['name_ar', 'customer_name', 'name', 'اسم_العميل', 'اسم', 'الاسم', 'العميل', 'column_1']);

                if ($nameAr === '') {
                    $errors[] = "Line {$line}: customer name is required.";
                    continue;
                }

                if ($this->isImportHeadingName($nameAr, 'customer')) {
                    continue;
                }

                $normalizedName = $this->normalizeName($nameAr);

                if ($uniqueOnly && isset($seenNames[$normalizedName])) {
                    $skippedDuplicates++;
                    continue;
                }

                $seenNames[$normalizedName] = true;

                $code = $this->rowValue($row, ['code', 'customer_code', 'كود_العميل', 'كود']);

                if ($code !== '' && Customer::query()->where('code', $code)->exists()) {
                    $errors[] = "Line {$line}: duplicate customer code {$code}.";
                    continue;
                }

                $sequence = $this->sequences->next('customers');
                $customerCode = $code === '' ? $sequence['code'] : $code;

                $customerData = [
                    'code' => $customerCode,
                    'internal_sequence' => $sequence['number'],
                    'barcode' => $customerCode,
                    'name' => $nameAr,
                    'name_ar' => $nameAr,
                    'name_en' => $this->rowValue($row, ['name_en', 'english_name', 'اسم_العميل_بالإنجليزي']),
                    'mobile' => $this->rowValue($row, ['mobile', 'موبايل', 'الموبايل']),
                    'phone' => $this->rowValue($row, ['phone', 'هاتف', 'الهاتف', 'تليفون']),
                    'email' => $this->rowValue($row, ['email', 'البريد', 'البريد_الإلكتروني']) ?: null,
                    'tax_number' => $this->rowValue($row, ['tax_number', 'الرقم_الضريبي']),
                    'commercial_register' => $this->rowValue($row, ['commercial_register', 'السجل_التجاري']),
                    'credit_limit' => (float) ($this->rowValue($row, ['credit_limit', 'حد_الائتمان']) ?: 0),
                    'payment_terms' => $this->rowValue($row, ['payment_terms', 'شروط_الدفع']),
                    'city' => $this->rowValue($row, ['city', 'مدينة', 'المدينة']),
                    'address' => $this->rowValue($row, ['address', 'عنوان', 'العنوان']),
                    'status' => $this->rowValue($row, ['status', 'الحالة']) ?: 'active',
                    'notes' => $this->rowValue($row, ['notes', 'ملاحظات']),
                    'sales_rep_id' => null,
                    'created_by' => $request->user()->id,
                    'updated_by' => $request->user()->id,
                ];

                $customerData['active'] = $customerData['status'] === 'active';
                $customerData['data_status'] = 'pending_sales_officer';
                $customerData['verification_tier'] = 'none';
                $customerData['data_reviewed_by'] = null;
                $customerData['data_reviewed_at'] = null;

                $customer = Customer::create($customerData);

                $this->timeline->record($customer, 'Customer Imported', "Customer {$customer->code} was imported from file.", $request->user());
                if ($customer->data_status === 'pending_sales_officer') {
                    $pendingReviewCount++;
                }
                $created++;
            }
        });

        if ($pendingReviewCount > 0) {
            $this->notifyBulkCustomerReview($pendingReviewCount, $request->user());
        }

        $message = "Imported {$created} customers.";

        if ($skippedDuplicates > 0) {
            $message .= " Skipped {$skippedDuplicates} repeated customer names by your choice.";
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
                'customers_import_template_ar.xlsx',
                [
                    ['كود العميل', 'اسم العميل', 'اسم العميل بالإنجليزي', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'حد الائتمان', 'شروط الدفع', 'المدينة', 'العنوان', 'الحالة', 'ملاحظات'],
                    ['', 'شركة مثال للتوريدات', 'Example Supplies Co.', '01000000000', '0220000000', 'info@example.com', '123456789', 'CR-001', '0', '30 days', 'Cairo', 'عنوان العميل', 'active', 'اكتب active أو inactive في الحالة'],
                ],
                true,
            );
        }

        $rows = $language === 'ar'
            ? [
                ['كود العميل', 'اسم العميل', 'اسم العميل بالإنجليزي', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'حد الائتمان', 'شروط الدفع', 'المدينة', 'العنوان', 'الحالة', 'ملاحظات'],
                ['', 'شركة مثال للتوريدات', 'Example Supplies Co.', '01000000000', '0220000000', 'info@example.com', '123456789', 'CR-001', '0', '30 days', 'Cairo', 'عنوان العميل', 'active', 'اكتب active أو inactive في الحالة'],
            ]
            : [
                ['code', 'name_ar', 'name_en', 'mobile', 'phone', 'email', 'tax_number', 'commercial_register', 'credit_limit', 'payment_terms', 'city', 'address', 'status', 'notes'],
                ['', 'Example Customer Co.', 'Example Customer Co.', '01000000000', '0220000000', 'info@example.com', '123456789', 'CR-001', '0', '30 days', 'Cairo', 'Customer address', 'active', 'Use active or inactive for status'],
            ];

        return $this->xlsxTemplates->download(
            "customers_import_template_{$language}.xlsx",
            $rows,
            $language === 'ar',
        );

        return $this->xlsxTemplates->download('customers_import_template.xlsx', [
            ['كود العميل', 'اسم العميل', 'اسم العميل بالإنجليزي', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'حد الائتمان', 'شروط الدفع', 'المدينة', 'العنوان', 'الحالة', 'ملاحظات'],
            ['', 'شركة مثال للتوريدات', 'Example Supplies Co.', '01000000000', '0220000000', 'info@example.com', '123456789', 'CR-001', '0', '30 days', 'Cairo', 'عنوان العميل', 'active', 'اكتب active أو inactive في الحالة'],
        ]);

        $rows = [
            ['كود العميل', 'اسم العميل', 'اسم العميل بالإنجليزي', 'الموبايل', 'الهاتف', 'البريد الإلكتروني', 'الرقم الضريبي', 'السجل التجاري', 'حد الائتمان', 'شروط الدفع', 'المدينة', 'العنوان', 'الحالة', 'ملاحظات'],
            ['', 'شركة مثال للتوريدات', 'Example Supplies Co.', '01000000000', '0220000000', 'info@example.com', '123456789', 'CR-001', '0', '30 days', 'Cairo', 'عنوان العميل', 'active', 'اكتب active أو inactive في الحالة'],
        ];

        $handle = fopen('php://temp', 'r+');

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $content = "\xEF\xBB\xBF".stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="customers_import_template.csv"',
        ]);

        $headers = ['code', 'name_ar', 'name_en', 'mobile', 'phone', 'email', 'tax_number', 'commercial_register', 'credit_limit', 'payment_terms', 'city', 'address', 'status', 'notes'];
        $example = ['', 'شركة مثال', 'Example Co.', '01000000000', '', 'info@example.com', '123456789', 'CR-001', '0', '30 days', 'Cairo', 'Address', 'active', ''];
        $content = implode(',', $headers)."\n".implode(',', $example)."\n";

        return response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="customers_import_template.csv"',
        ]);
    }

    private function validateCustomer(Request $request, ?Customer $customer = null): array
    {
        return $request->validate([
            'code' => ['nullable', 'digits_between:1,100', Rule::unique('customers', 'code')->ignore($customer)],
            'name_ar' => ['required', 'string', 'max:255', Rule::notIn($this->reservedCustomerHeadingNames())],
            'name_en' => ['nullable', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'national_id' => ['nullable', 'string', 'max:50', Rule::unique('customers', 'national_id')->ignore($customer)],
            'national_id_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'commercial_register' => ['nullable', 'string', 'max:100'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string'],
            'sales_rep_id' => [
                'nullable',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query
                        ->where('status', 'active')
                        ->whereExists(function ($subQuery) {
                            $subQuery
                                ->selectRaw('1')
                                ->from('departments')
                                ->whereColumn('departments.id', 'users.department_id')
                                ->where('departments.code', 'sales');
                        });
                }),
            ],
        ]);
    }

    private function rowValue(array $row, array $keys): string
    {
        foreach ($keys as $key) {
            $value = trim((string) ($row[$key] ?? ''));

            if ($value !== '') {
                return $value;
            }
        }

        return '';
    }

    private function duplicateImportNames(array $rows): array
    {
        $counts = [];

        foreach ($rows as $row) {
            $name = $this->rowValue($row, ['name_ar', 'customer_name', 'name', 'اسم_العميل', 'اسم', 'الاسم', 'العميل', 'column_1']);

            if ($name === '') {
                continue;
            }

            if ($this->isImportHeadingName($name, 'customer')) {
                continue;
            }

            $normalizedName = $this->normalizeName($name);
            $counts[$normalizedName] = ($counts[$normalizedName] ?? 0) + 1;
        }

        $duplicateRows = collect($counts)
            ->filter(fn ($count) => $count > 1)
            ->sum(fn ($count) => $count - 1);

        return [
            'duplicate_names' => collect($counts)->filter(fn ($count) => $count > 1)->count(),
            'duplicate_rows' => $duplicateRows,
        ];
    }

    private function normalizeName(string $name): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim($name)));
    }

    private function isImportHeadingName(string $name, string $type): bool
    {
        $normalized = $this->normalizeName($name);
        $headings = $type === 'supplier'
            ? ['اسم المورد', 'المورد', 'supplier name', 'supplier_name']
            : $this->reservedCustomerHeadingNames();

        return in_array($normalized, array_map(fn ($heading) => $this->normalizeName($heading), $headings), true);
    }

    private function reservedCustomerHeadingNames(): array
    {
        return [
            'اسم العميل',
            'العميل',
            'customer name',
            'customer_name',
            'name_ar',
            'name',
        ];
    }

    private function isCustomerDataComplete(array $data): bool
    {
        return filled($data['name_ar'] ?? null)
            && (filled($data['mobile'] ?? null) || filled($data['phone'] ?? null))
            && filled($data['city'] ?? null)
            && filled($data['sales_rep_id'] ?? null)
            && filled($data['payment_terms'] ?? null)
            && filled($data['national_id'] ?? null);
    }

    private function verificationTierFor(Customer $customer): string
    {
        $creditLimit = (float) $customer->credit_limit;
        $purchaseTotal = (float) $customer->salesOrders()
            ->whereIn('status', ['approved', 'in_production', 'completed', 'delivered', 'closed'])
            ->sum('order_total');

        if ($creditLimit >= 200000 || $purchaseTotal >= 500000) {
            return 'gold';
        }

        if ($creditLimit >= 50000 || $purchaseTotal >= 100000) {
            return 'silver';
        }

        return 'bronze';
    }

    private function isCustomerRecordComplete(Customer $customer): bool
    {
        return filled($customer->name_ar)
            && (filled($customer->mobile) || filled($customer->phone))
            && filled($customer->city)
            && filled($customer->sales_rep_id)
            && filled($customer->payment_terms)
            && filled($customer->national_id)
            && filled($customer->national_id_image_path);
    }

    private function completeOrApprovedCustomerQuery($query)
    {
        return $query
            ->where('data_status', 'approved')
            ->orWhere(fn ($complete) => $this->completeCustomerQuery($complete));
    }

    private function completeCustomerQuery($query)
    {
        return $query
            ->whereNotNull('name_ar')->where('name_ar', '!=', '')
            ->where(fn ($contact) => $contact
                ->whereNotNull('mobile')->where('mobile', '!=', '')
                ->orWhere(fn ($phone) => $phone->whereNotNull('phone')->where('phone', '!=', '')))
            ->whereNotNull('city')->where('city', '!=', '')
            ->whereNotNull('sales_rep_id')
            ->whereNotNull('payment_terms')->where('payment_terms', '!=', '')
            ->whereNotNull('national_id')->where('national_id', '!=', '')
            ->whereNotNull('national_id_image_path')->where('national_id_image_path', '!=', '');
    }

    private function incompleteCustomerQuery($query)
    {
        return $query
            ->where('data_status', '!=', 'approved')
            ->where(fn ($missing) => $missing
                ->whereNull('name_ar')->orWhere('name_ar', '')
                ->orWhere(fn ($contact) => $contact
                    ->where(fn ($mobile) => $mobile->whereNull('mobile')->orWhere('mobile', ''))
                    ->where(fn ($phone) => $phone->whereNull('phone')->orWhere('phone', '')))
                ->orWhereNull('city')->orWhere('city', '')
                ->orWhereNull('sales_rep_id')
                ->orWhereNull('payment_terms')->orWhere('payment_terms', '')
                ->orWhereNull('national_id')->orWhere('national_id', '')
                ->orWhereNull('national_id_image_path')->orWhere('national_id_image_path', ''));
    }

    private function missingCustomerFields(Customer $customer): array
    {
        $fields = [];

        if (! filled($customer->name_ar)) {
            $fields[] = 'اسم العميل';
        }

        if (! filled($customer->mobile) && ! filled($customer->phone)) {
            $fields[] = 'الموبايل أو الهاتف';
        }

        if (! filled($customer->city)) {
            $fields[] = 'المدينة';
        }

        if (! filled($customer->sales_rep_id)) {
            $fields[] = 'المندوب';
        }

        if (! filled($customer->payment_terms)) {
            $fields[] = 'شروط الدفع';
        }

        if (! filled($customer->national_id)) {
            $fields[] = 'الرقم القومي';
        }

        if (! filled($customer->national_id_image_path)) {
            $fields[] = 'صورة البطاقة';
        }

        return $fields;
    }

    private function notifyCustomerReviewIfPending(Customer $customer, User $sender): void
    {
        if (! in_array($customer->data_status, ['pending_review', 'pending_sales_officer'], true)) {
            return;
        }

        $this->notifications->sendToUsers(
            $this->customerSalesOfficerReviewRecipients(),
            "بيانات عميل تحتاج اعتماد {$customer->code}",
            "العميل {$customer->name_ar} تم تسجيله ببيانات غير مكتملة. برجاء استكمال البيانات أو اعتمادها كما هي.",
            route('master-data.customers', ['focus' => $customer->id]),
            $sender,
        );
    }

    private function notifyBulkCustomerReview(int $count, User $sender): void
    {
        $this->notifications->sendToUsers(
            $this->customerSalesOfficerReviewRecipients(),
            "بيانات عملاء تحتاج اعتماد",
            "تم استيراد {$count} عميل ببيانات غير مكتملة. برجاء مراجعة قائمة العملاء واستكمال البيانات أو اعتمادها كما هي.",
            route('master-data.customers'),
            $sender,
        );
    }

    private function notifyCustomerManagerReview(Customer $customer, User $sender): void
    {
        $this->notifications->sendToUsers(
            $this->customerSalesManagerReviewRecipients(),
            "بيانات عميل تحتاج اعتماد مدير المبيعات {$customer->code}",
            "تم اعتماد العميل {$customer->name_ar} من مسؤول المبيعات. برجاء الاعتماد النهائي.",
            route('master-data.customers', ['focus' => $customer->id]),
            $sender,
        );
    }

    private function notifyCustomerCreatorForCorrection(Customer $customer, User $sender, string $reason): void
    {
        if (! $customer->creator) {
            return;
        }

        $this->notifications->sendToUsers(
            new Collection([$customer->creator]),
            "بيانات عميل مرجعة للتعديل {$customer->code}",
            "تم إرجاع بيانات العميل {$customer->name_ar} للتعديل بواسطة {$sender->name}. السبب: {$reason}",
            route('master-data.customers', ['focus' => $customer->id]),
            $sender,
        );
    }

    private function customerSalesOfficerReviewRecipients()
    {
        return User::query()
            ->where('status', 'active')
            ->where(function ($query) {
                $query
                    ->whereHas('role', fn ($roleQuery) => $roleQuery->whereIn('slug', ['admin', 'general_manager']))
                    ->orWhere(function ($salesQuery) {
                        $salesQuery
                            ->whereHas('department', fn ($departmentQuery) => $departmentQuery->where('code', 'sales'))
                            ->whereHas('position', fn ($positionQuery) => $positionQuery->whereIn('code', ['sales_officer', 'sales_manager']));
                    });
            })
            ->get();
    }

    private function customerIncompleteFollowUpRecipients(Customer $customer): Collection
    {
        $recipients = User::query()
            ->where('status', 'active')
            ->whereHas('department', fn ($departmentQuery) => $departmentQuery->where('code', 'sales'))
            ->whereHas('position', fn ($positionQuery) => $positionQuery->whereIn('code', ['sales_officer', 'sales_data_entry']))
            ->get();

        if ($customer->sales_rep_id) {
            $salesRep = User::query()->where('status', 'active')->find($customer->sales_rep_id);

            if ($salesRep) {
                $recipients->push($salesRep);
            }
        }

        if ($customer->creator && $customer->creator->status === 'active') {
            $recipients->push($customer->creator);
        }

        return $recipients->unique('id')->values();
    }

    private function customerSalesManagerReviewRecipients()
    {
        return User::query()
            ->where('status', 'active')
            ->where(function ($query) {
                $query
                    ->whereHas('role', fn ($roleQuery) => $roleQuery->whereIn('slug', ['admin', 'general_manager']))
                    ->orWhere(function ($salesQuery) {
                        $salesQuery
                            ->whereHas('department', fn ($departmentQuery) => $departmentQuery->where('code', 'sales'))
                            ->whereHas('position', fn ($positionQuery) => $positionQuery->where('code', 'sales_manager'));
                    });
            })
            ->get();
    }

    private function canApproveAsSalesOfficer(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager'])
            || ($user->department?->code === 'sales' && in_array($user->position?->code, ['sales_officer', 'sales_manager'], true));
    }

    private function canApproveAsSalesManager(User $user): bool
    {
        return $user->hasRole(['admin', 'general_manager'])
            || ($user->department?->code === 'sales' && $user->position?->code === 'sales_manager');
    }

    private function numericCodeOrderExpression(string $column, int $fallback): string
    {
        if (DB::getDriverName() === 'sqlite') {
            return "CASE WHEN {$column} GLOB '[0-9]*' THEN CAST({$column} AS INTEGER) ELSE {$fallback} END";
        }

        return "CASE WHEN {$column} REGEXP '^[0-9]+$' THEN CAST({$column} AS UNSIGNED) ELSE {$fallback} END";
    }

    private function templateLanguage(Request $request): string
    {
        return $request->query('lang') === 'en' ? 'en' : 'ar';
    }
}
