<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerPortalController;
use App\Http\Controllers\CustomerAccountReportController;
use App\Http\Controllers\CostAccountingController;
use App\Http\Controllers\CareerPlanningController;
use App\Http\Controllers\ChangeRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DataAnalysisController;
use App\Http\Controllers\DailySummaryController;
use App\Http\Controllers\DepartmentHiringRequestController;
use App\Http\Controllers\DepartmentEmployeeCodingController;
use App\Http\Controllers\DepartmentStaffingController;
use App\Http\Controllers\EmployeeCodingCoverageController;
use App\Http\Controllers\EmployeeCvController;
use App\Http\Controllers\EmployeeMonthlyReviewController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DyeSampleController;
use App\Http\Controllers\DyeingOrderController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\GovernanceCenterController;
use App\Http\Controllers\IssueOrderController;
use App\Http\Controllers\InventoryLedgerController;
use App\Http\Controllers\LotController;
use App\Http\Controllers\MyPermissionsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationStructureController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PendingApprovalsController;
use App\Http\Controllers\PilotFeedbackController;
use App\Http\Controllers\PhysicalInventoryController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductionOrderController;
use App\Http\Controllers\PurchasingController;
use App\Http\Controllers\RecruitmentOnboardingController;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\SupplierAccountReportController;
use App\Http\Controllers\SystemAssistantFindingsController;
use App\Http\Controllers\SystemBackupController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserProvisioningMonitorController;
use App\Http\Controllers\UserSwitchController;
use App\Http\Controllers\WeavingProductionController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware('guest')->group(function () {
    Route::get('/customer-login', [CustomerPortalController::class, 'login'])
        ->name('customer-login');

    Route::get('/customer-register', [CustomerPortalController::class, 'register'])
        ->name('customer-register');

    Route::post('/customer-register', [CustomerPortalController::class, 'storeRegistration'])
        ->name('customer-register.store');
});

Route::get('/dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/customer-portal', [CustomerPortalController::class, 'index'])
        ->name('customer-portal.index');

    Route::post('/customer-portal/orders', [CustomerPortalController::class, 'storeOrder'])
        ->name('customer-portal.orders.store');

    Route::post('/customer-portal/profile', [CustomerPortalController::class, 'updateProfile'])
        ->name('customer-portal.profile.update');

    Route::post('/customer-portal/wallet-payments', [CustomerPortalController::class, 'storeWalletPayment'])
        ->name('customer-portal.wallet-payments.store');

    Route::post('/customer-portal/messages', [CustomerPortalController::class, 'storeMessage'])
        ->name('customer-portal.messages.store');

    Route::get('/global-search', GlobalSearchController::class)
        ->name('global-search');

    Route::get('/daily-summary', DailySummaryController::class)
        ->name('daily-summary');

    Route::get('/exports/{type}', ExportController::class)
        ->middleware('permission:export_reports')
        ->name('exports.show');

    Route::get('/print/purchase-orders/{purchaseOrder}', [PrintController::class, 'purchaseOrder'])
        ->middleware('permission:print_documents')
        ->name('print.purchase-orders');

    Route::get('/print/goods-receipts/{goodsReceipt}', [PrintController::class, 'goodsReceipt'])
        ->middleware('permission:print_documents')
        ->name('print.goods-receipts');

    Route::get('/print/sales-orders/{salesOrder}', [PrintController::class, 'salesOrder'])
        ->middleware('permission:print_documents')
        ->name('print.sales-orders');

    Route::get('/print/production-orders/{productionOrder}', [PrintController::class, 'productionOrder'])
        ->middleware('permission:print_documents')
        ->name('print.production-orders');

    Route::get('/print/issue-orders/{issueOrder}', [PrintController::class, 'issueOrder'])
        ->middleware('permission:print_documents')
        ->name('print.issue-orders');

    Route::get('/print/lots/{lot}', [PrintController::class, 'lotReport'])
        ->middleware('permission:print_documents')
        ->name('print.lots');

    Route::get('/print/price-list', [PrintController::class, 'priceList'])
        ->middleware('permission:print_documents')
        ->name('print.price-list');

    Route::get('/system-backups', [SystemBackupController::class, 'index'])
        ->middleware('permission:manage_system_backups')
        ->name('system-backups.index');

    Route::post('/system-backups', [SystemBackupController::class, 'store'])
        ->middleware('permission:manage_system_backups')
        ->name('system-backups.store');

    Route::post('/system-backups/{backup}/restore', [SystemBackupController::class, 'restore'])
        ->middleware('permission:manage_system_backups')
        ->name('system-backups.restore');

    Route::delete('/system-backups/{backup}', [SystemBackupController::class, 'destroy'])
        ->middleware('permission:manage_system_backups')
        ->name('system-backups.destroy');

    Route::get('/physical-inventory', [PhysicalInventoryController::class, 'index'])
        ->middleware('permission:view_physical_inventory')
        ->name('physical-inventory.index');

    Route::post('/physical-inventory', [PhysicalInventoryController::class, 'store'])
        ->middleware('permission:create_stock_count')
        ->name('physical-inventory.store');

    Route::patch('/physical-inventory/{stockCount}/approve', [PhysicalInventoryController::class, 'approve'])
        ->middleware('permission:approve_stock_count')
        ->name('physical-inventory.approve');

    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])
        ->name('notifications.read');

    Route::get('/system-assistant/findings', SystemAssistantFindingsController::class)
        ->name('system-assistant.findings');

    Route::get('/my-permissions', MyPermissionsController::class)
        ->name('my-permissions.index');

    Route::get('/pending-approvals', PendingApprovalsController::class)
        ->middleware('permission:view_change_requests')
        ->name('pending-approvals.index');

    Route::get('/change-requests', [ChangeRequestController::class, 'index'])
        ->name('change-requests.index');

    Route::post('/change-requests/password', [ChangeRequestController::class, 'storePasswordRequest'])
        ->name('change-requests.password.store');

    Route::patch('/change-requests/{changeRequest}/approve', [ChangeRequestController::class, 'approve'])
        ->name('change-requests.approve');

    Route::patch('/change-requests/{changeRequest}/reject', [ChangeRequestController::class, 'reject'])
        ->name('change-requests.reject');

    Route::get('/pilot-feedback', [PilotFeedbackController::class, 'index'])
        ->name('pilot-feedback.index');

    Route::post('/pilot-feedback', [PilotFeedbackController::class, 'store'])
        ->name('pilot-feedback.store');

    Route::patch('/pilot-feedback/{pilotFeedback}', [PilotFeedbackController::class, 'update'])
        ->name('pilot-feedback.update');

    Route::delete('/pilot-feedback/{pilotFeedback}', [PilotFeedbackController::class, 'destroy'])
        ->name('pilot-feedback.destroy');

    Route::delete('/pilot-feedback', [PilotFeedbackController::class, 'bulkDestroy'])
        ->name('pilot-feedback.bulk-destroy');

    Route::patch('/pilot-feedback/{id}/restore', [PilotFeedbackController::class, 'restore'])
        ->name('pilot-feedback.restore');

    Route::get('/pilot-feedback/export/{format}', [PilotFeedbackController::class, 'export'])
        ->name('pilot-feedback.export');

    Route::get('/governance', GovernanceCenterController::class)
        ->middleware('permission:view_governance_center')
        ->name('governance.index');

    Route::get('/data-analysis', DataAnalysisController::class)
        ->middleware('permission:view_data_analysis')
        ->name('data-analysis.index');

    Route::get('/user-provisioning-monitor', UserProvisioningMonitorController::class)
        ->middleware('permission:view_users')
        ->name('user-provisioning-monitor.index');

    Route::get('/user-switch/candidates', [UserSwitchController::class, 'candidates'])
        ->name('user-switch.candidates');

    Route::post('/user-switch', [UserSwitchController::class, 'switch'])
        ->name('user-switch.store');

    Route::get('/user-switch-history', [UserSwitchController::class, 'history'])
        ->middleware('permission:view_audit_logs')
        ->name('user-switch-history.index');

    Route::get('/users', [UserController::class, 'index'])
        ->middleware('permission:view_users')
        ->name('users.index');

    Route::post('/users', [UserController::class, 'store'])
        ->middleware('permission:create_user')
        ->name('users.store');

    Route::patch('/users/{user}', [UserController::class, 'update'])
        ->middleware('permission:edit_user')
        ->name('users.update');

    Route::patch('/users/{user}/role', [UserController::class, 'updateRole'])
        ->middleware('permission:assign_role')
        ->name('users.update-role');

    Route::patch('/users/{user}/archive', [UserController::class, 'archive'])
        ->middleware('permission:edit_user')
        ->name('users.archive');

    Route::patch('/users/{user}/restore', [UserController::class, 'restore'])
        ->middleware('permission:edit_user')
        ->name('users.restore');

    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->middleware('permission:delete_user')
        ->name('users.destroy');

    Route::get('/users/{user}/cv', EmployeeCvController::class)
        ->middleware('permission:view_users')
        ->name('users.cv');

    Route::get('/employee-coding-coverage', EmployeeCodingCoverageController::class)
        ->middleware('permission:view_users')
        ->name('employee-coding-coverage.index');

    Route::get('/department-staffing', [DepartmentStaffingController::class, 'index'])
        ->middleware('permission:view_users')
        ->name('department-staffing.index');

    Route::get('/department-coding', [DepartmentStaffingController::class, 'index'])
        ->middleware('permission:view_users')
        ->name('department-coding.index');

    Route::post('/department-staffing/departments', [DepartmentStaffingController::class, 'storeDepartment'])
        ->middleware('permission:view_users')
        ->name('department-staffing.departments.store');

    Route::post('/department-staffing/units', [DepartmentStaffingController::class, 'storeUnit'])
        ->middleware('permission:view_users')
        ->name('department-staffing.units.store');

    Route::patch('/department-staffing/departments/{department}', [DepartmentStaffingController::class, 'updateDepartment'])
        ->middleware('permission:view_users')
        ->name('department-staffing.departments.update');

    Route::patch('/department-staffing/departments/{department}/approve', [DepartmentStaffingController::class, 'approveDepartment'])
        ->middleware('permission:view_departments')
        ->name('department-staffing.departments.approve');

    Route::patch('/department-staffing/departments/{department}/reject', [DepartmentStaffingController::class, 'rejectDepartment'])
        ->middleware('permission:view_departments')
        ->name('department-staffing.departments.reject');

    Route::post('/department-staffing/departments/{department}/positions', [DepartmentStaffingController::class, 'storeDepartmentPosition'])
        ->middleware('permission:view_users')
        ->name('department-staffing.departments.positions.store');

    Route::patch('/department-staffing/departments/{department}/cancel-tree', [DepartmentStaffingController::class, 'cancelDepartmentTree'])
        ->middleware('permission:view_users')
        ->name('department-staffing.departments.cancel-tree');

    Route::delete('/department-staffing/departments/{department}', [DepartmentStaffingController::class, 'destroyDepartment'])
        ->middleware('permission:delete_department')
        ->name('department-staffing.departments.destroy');

    Route::patch('/department-staffing/positions/{departmentPosition}', [DepartmentStaffingController::class, 'updateHeadcount'])
        ->middleware('permission:view_users')
        ->name('department-staffing.positions.update');

    Route::post('/employee-coding-coverage/transfers', [EmployeeCodingCoverageController::class, 'transfer'])
        ->middleware('permission:edit_user')
        ->name('employee-coding-coverage.transfers.store');

    Route::patch('/employee-coding-coverage/transfers/{transferRequest}/approve', [EmployeeCodingCoverageController::class, 'approveTransfer'])
        ->middleware('permission:edit_user')
        ->name('employee-coding-coverage.transfers.approve');

    Route::patch('/employee-coding-coverage/transfers/{transferRequest}/reject', [EmployeeCodingCoverageController::class, 'rejectTransfer'])
        ->middleware('permission:edit_user')
        ->name('employee-coding-coverage.transfers.reject');

    Route::get('/employee-coding/departments/{department}', DepartmentEmployeeCodingController::class)
        ->middleware('permission:view_users')
        ->name('employee-coding.department');

    Route::get('/organization-structure', [OrganizationStructureController::class, 'tree'])
        ->middleware('permission:view_departments')
        ->name('organization-structure.index');

    Route::get('/approved-positions', [OrganizationStructureController::class, 'approvedPositions'])
        ->middleware('permission:view_departments')
        ->name('approved-positions.index');

    Route::get('/career-planning', [CareerPlanningController::class, 'index'])
        ->middleware('permission:view_users')
        ->name('career-planning.index');

    Route::post('/career-planning/promotions', [CareerPlanningController::class, 'storePromotion'])
        ->middleware('permission:edit_user')
        ->name('career-planning.promotions.store');

    Route::patch('/career-planning/promotions/{promotionRequest}/approve', [CareerPlanningController::class, 'approvePromotion'])
        ->middleware('permission:edit_user')
        ->name('career-planning.promotions.approve');

    Route::patch('/career-planning/promotions/{promotionRequest}/reject', [CareerPlanningController::class, 'rejectPromotion'])
        ->middleware('permission:edit_user')
        ->name('career-planning.promotions.reject');

    Route::post('/career-planning/succession', [CareerPlanningController::class, 'storeSuccession'])
        ->middleware('permission:edit_user')
        ->name('career-planning.succession.store');

    Route::patch('/career-planning/succession/{successionPlan}', [CareerPlanningController::class, 'updateSuccession'])
        ->middleware('permission:edit_user')
        ->name('career-planning.succession.update');

    Route::get('/employee-monthly-reviews', [EmployeeMonthlyReviewController::class, 'index'])
        ->middleware('permission:view_users')
        ->name('employee-monthly-reviews.index');

    Route::post('/employee-monthly-reviews', [EmployeeMonthlyReviewController::class, 'store'])
        ->middleware('permission:edit_user')
        ->name('employee-monthly-reviews.store');

    Route::get('/my-monthly-reviews', [EmployeeMonthlyReviewController::class, 'myReviews'])
        ->name('employee-monthly-reviews.mine');

    Route::get('/payroll', [PayrollController::class, 'index'])
        ->middleware('permission:view_finance')
        ->name('payroll.index');

    Route::post('/payroll', [PayrollController::class, 'store'])
        ->middleware('permission:edit_finance')
        ->name('payroll.store');

    Route::patch('/payroll/{batch}/review', [PayrollController::class, 'review'])
        ->middleware('permission:view_finance')
        ->name('payroll.review');

    Route::patch('/payroll/{batch}/approve-hr', [PayrollController::class, 'approveHr'])
        ->middleware('permission:view_users')
        ->name('payroll.approve-hr');

    Route::patch('/payroll/{batch}/approve-general-manager', [PayrollController::class, 'approveGeneralManager'])
        ->middleware('permission:view_finance')
        ->name('payroll.approve-general-manager');

    Route::patch('/payroll/{batch}/reject', [PayrollController::class, 'reject'])
        ->middleware('permission:view_finance')
        ->name('payroll.reject');

    Route::get('/my-payroll', [PayrollController::class, 'mine'])
        ->name('payroll.mine');

    Route::get('/customer-account-reports', [CustomerAccountReportController::class, 'index'])
        ->middleware('permission:view_finance')
        ->name('customer-account-reports.index');

    Route::patch('/customer-account-reports/payments/{payment}/receive', [CustomerAccountReportController::class, 'receive'])
        ->middleware('permission:edit_finance')
        ->name('customer-account-reports.payments.receive');

    Route::get('/supplier-account-reports', [SupplierAccountReportController::class, 'index'])
        ->middleware('permission:view_finance')
        ->name('supplier-account-reports.index');

    Route::post('/supplier-account-reports/payments', [SupplierAccountReportController::class, 'storePayment'])
        ->middleware('permission:edit_finance')
        ->name('supplier-account-reports.payments.store');

    Route::get('/products', [ProductController::class, 'index'])
        ->middleware('permission:view_products')
        ->name('products.index');

    Route::post('/products', [ProductController::class, 'store'])
        ->middleware('permission:create_product')
        ->name('products.store');

    Route::post('/products/import', [ProductController::class, 'import'])
        ->middleware('permission:create_product')
        ->name('products.import');

    Route::get('/products/import-template', [ProductController::class, 'template'])
        ->middleware('permission:create_product')
        ->name('products.import-template');

    Route::patch('/products/{product}', [ProductController::class, 'update'])
        ->middleware('permission:edit_product')
        ->name('products.update');

    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->middleware('permission:delete_product')
        ->name('products.destroy');

    Route::get('/dye-samples', [DyeSampleController::class, 'index'])
        ->middleware('permission:view_dye_samples')
        ->name('dye-samples.index');

    Route::post('/dye-samples', [DyeSampleController::class, 'store'])
        ->middleware('permission:create_dye_sample')
        ->name('dye-samples.store');

    Route::patch('/dye-samples/{dyeSample}', [DyeSampleController::class, 'update'])
        ->middleware('permission:create_dye_sample')
        ->name('dye-samples.update');

    Route::patch('/dye-samples/{dyeSample}/status', [DyeSampleController::class, 'updateStatus'])
        ->middleware('permission:create_dye_sample,review_dye_sample,approve_dye_sample')
        ->name('dye-samples.status');

    Route::delete('/dye-samples/{dyeSample}', [DyeSampleController::class, 'destroy'])
        ->middleware('permission:delete_dye_sample')
        ->name('dye-samples.destroy');

    Route::get('/weaving-production', [WeavingProductionController::class, 'index'])
        ->middleware('permission:view_weaving_production')
        ->name('weaving-production.index');

    Route::post('/weaving-production', [WeavingProductionController::class, 'store'])
        ->middleware('permission:create_weaving_production')
        ->name('weaving-production.store');

    Route::patch('/weaving-production/{weavingProduction}/status', [WeavingProductionController::class, 'updateStatus'])
        ->middleware('permission:edit_weaving_production')
        ->name('weaving-production.status');

    Route::get('/dyeing-orders', [DyeingOrderController::class, 'index'])
        ->middleware('permission:view_dyeing_orders')
        ->name('dyeing-orders.index');

    Route::post('/dyeing-orders', [DyeingOrderController::class, 'store'])
        ->middleware('permission:create_dyeing_order')
        ->name('dyeing-orders.store');

    Route::patch('/dyeing-orders/{dyeingOrder}/status', [DyeingOrderController::class, 'updateStatus'])
        ->middleware('permission:edit_dyeing_order')
        ->name('dyeing-orders.status');

    Route::get('/issue-orders', [IssueOrderController::class, 'index'])
        ->middleware('permission:view_issue_orders')
        ->name('issue-orders.index');

    Route::post('/issue-orders', [IssueOrderController::class, 'store'])
        ->middleware('permission:create_issue_order')
        ->name('issue-orders.store');

    Route::patch('/issue-orders/{issueOrder}', [IssueOrderController::class, 'update'])
        ->middleware('permission:edit_issue_order')
        ->name('issue-orders.update');

    Route::delete('/issue-orders/{issueOrder}', [IssueOrderController::class, 'destroy'])
        ->middleware('permission:delete_issue_order')
        ->name('issue-orders.destroy');

    Route::get('/master-data/customers', [CustomerController::class, 'index'])
        ->middleware('permission:view_customers')
        ->name('master-data.customers');

    Route::post('/master-data/customers', [CustomerController::class, 'store'])
        ->middleware('permission:create_customer')
        ->name('customers.store');

    Route::patch('/master-data/customers/{customer}', [CustomerController::class, 'update'])
        ->middleware('permission:edit_customer')
        ->name('customers.update');

    Route::patch('/master-data/customers/{customer}/approve-data', [CustomerController::class, 'approveData'])
        ->middleware('permission:edit_customer')
        ->name('customers.approve-data');

    Route::patch('/master-data/customers/{customer}/notify-incomplete-data', [CustomerController::class, 'notifyIncompleteData'])
        ->middleware('permission:edit_customer')
        ->name('customers.notify-incomplete-data');

    Route::patch('/master-data/customers/{customer}/activate-portal-account', [CustomerController::class, 'activatePortalAccount'])
        ->middleware('permission:edit_customer')
        ->name('customers.activate-portal-account');

    Route::post('/master-data/customers/{customer}/portal-account', [CustomerController::class, 'createPortalAccount'])
        ->middleware('permission:edit_customer')
        ->name('customers.portal-account.store');

    Route::patch('/master-data/customers/{customer}/reject-data', [CustomerController::class, 'rejectData'])
        ->middleware('permission:edit_customer')
        ->name('customers.reject-data');

    Route::patch('/master-data/customers/{customer}/archive', [CustomerController::class, 'archive'])
        ->middleware('permission:edit_customer')
        ->name('customers.archive');

    Route::patch('/master-data/customers/{customer}/restore', [CustomerController::class, 'restore'])
        ->middleware('permission:edit_customer')
        ->name('customers.restore');

    Route::delete('/master-data/customers/{customer}', [CustomerController::class, 'destroy'])
        ->middleware('permission:delete_customer')
        ->name('customers.destroy');

    Route::post('/master-data/customers/import', [CustomerController::class, 'import'])
        ->middleware('permission:create_customer')
        ->name('customers.import');

    Route::get('/master-data/customers/import-template', [CustomerController::class, 'template'])
        ->middleware('permission:create_customer')
        ->name('customers.import-template');

    Route::get('/sales-orders', [SalesOrderController::class, 'index'])
        ->middleware('permission:view_sales_orders')
        ->name('sales-orders.index');

    Route::post('/sales-orders', [SalesOrderController::class, 'store'])
        ->middleware('permission:create_sales_order')
        ->name('sales-orders.store');

    Route::patch('/sales-orders/{salesOrder}', [SalesOrderController::class, 'update'])
        ->middleware('permission:edit_sales_order')
        ->name('sales-orders.update');

    Route::patch('/sales-orders/{salesOrder}/status', [SalesOrderController::class, 'updateStatus'])
        ->middleware('permission:create_sales_order,review_sales_order,approve_sales_order')
        ->name('sales-orders.status');

    Route::post('/sales-orders/{salesOrder}/messages', [SalesOrderController::class, 'storeMessage'])
        ->middleware('permission:view_sales_orders')
        ->name('sales-orders.messages.store');

    Route::patch('/sales-orders/{salesOrder}/invoice', [SalesOrderController::class, 'invoice'])
        ->middleware('permission:edit_finance')
        ->name('sales-orders.invoice');

    Route::patch('/sales-orders/{salesOrder}/prepare-shipping', [SalesOrderController::class, 'prepareShipping'])
        ->middleware('permission:create_sales_order,edit_sales_order')
        ->name('sales-orders.prepare-shipping');

    Route::patch('/sales-orders/{salesOrder}/deliver', [SalesOrderController::class, 'deliver'])
        ->middleware('permission:create_sales_order,edit_sales_order')
        ->name('sales-orders.deliver');

    Route::patch('/sales-orders/{salesOrder}/close', [SalesOrderController::class, 'close'])
        ->middleware('permission:edit_finance,approve_sales_order')
        ->name('sales-orders.close');

    Route::get('/production-orders', [ProductionOrderController::class, 'index'])
        ->middleware('permission:view_production_orders')
        ->name('production-orders.index');

    Route::post('/production-orders', [ProductionOrderController::class, 'store'])
        ->middleware('permission:create_production_order')
        ->name('production-orders.store');

    Route::patch('/production-orders/{productionOrder}/status', [ProductionOrderController::class, 'updateStatus'])
        ->middleware('permission:plan_production_order,release_production_order,run_production_order,close_production_order')
        ->name('production-orders.status');

    Route::get('/lots', [LotController::class, 'index'])
        ->middleware('permission:view_lots')
        ->name('lots.index');

    Route::post('/lots', [LotController::class, 'store'])
        ->middleware('permission:create_lot')
        ->name('lots.store');

    Route::patch('/lots/{lot}', [LotController::class, 'update'])
        ->middleware('permission:edit_lot')
        ->name('lots.update');

    Route::patch('/lots/{lot}/status', [LotController::class, 'updateStatus'])
        ->middleware('permission:edit_lot,edit_closed_lot')
        ->name('lots.status');

    Route::delete('/lots/{lot}', [LotController::class, 'destroy'])
        ->middleware('permission:delete_lot')
        ->name('lots.destroy');

    Route::post('/lots/{lot}/samples', [LotController::class, 'storeSample'])
        ->middleware('permission:create_lot')
        ->name('lots.samples.store');

    Route::patch('/lots/{lot}/samples/{sample}/approve', [LotController::class, 'approveSample'])
        ->middleware('permission:approve_lot_sample')
        ->name('lots.samples.approve');

    Route::get('/inventory-ledger', [InventoryLedgerController::class, 'index'])
        ->middleware('permission:view_inventory_ledger')
        ->name('inventory-ledger.index');

    Route::post('/inventory-ledger', [InventoryLedgerController::class, 'store'])
        ->middleware('permission:create_inventory_ledger_entry')
        ->name('inventory-ledger.store');

    Route::get('/purchasing', [PurchasingController::class, 'index'])
        ->middleware('permission:view_purchasing')
        ->name('purchasing.index');

    Route::post('/purchasing/suppliers', [PurchasingController::class, 'storeSupplier'])
        ->middleware('permission:manage_suppliers')
        ->name('purchasing.suppliers.store');

    Route::post('/purchasing/suppliers/import', [PurchasingController::class, 'importSuppliers'])
        ->middleware('permission:manage_suppliers')
        ->name('purchasing.suppliers.import');

    Route::get('/purchasing/suppliers/import-template', [PurchasingController::class, 'supplierTemplate'])
        ->middleware('permission:manage_suppliers')
        ->name('purchasing.suppliers.import-template');

    Route::get('/recruitment-onboarding', [RecruitmentOnboardingController::class, 'index'])
        ->middleware('permission:view_recruitment_onboarding')
        ->name('recruitment-onboarding.index');

    Route::post('/recruitment-onboarding', [RecruitmentOnboardingController::class, 'store'])
        ->middleware('permission:create_recruitment_request')
        ->name('recruitment-onboarding.store');

    Route::get('/department-hiring-requests', [DepartmentHiringRequestController::class, 'index'])
        ->name('department-hiring-requests.index');

    Route::post('/department-hiring-requests', [DepartmentHiringRequestController::class, 'store'])
        ->name('department-hiring-requests.store');

    Route::patch('/department-hiring-requests/{hiringRequest}/approve', [DepartmentHiringRequestController::class, 'approve'])
        ->name('department-hiring-requests.approve');

    Route::patch('/department-hiring-requests/{hiringRequest}/reject', [DepartmentHiringRequestController::class, 'reject'])
        ->name('department-hiring-requests.reject');

    Route::post('/department-hiring-requests/{hiringRequest}/hire', [DepartmentHiringRequestController::class, 'hire'])
        ->name('department-hiring-requests.hire');

    Route::post('/purchasing/purchase-requests', [PurchasingController::class, 'storePurchaseRequest'])
        ->middleware('permission:create_purchase_request')
        ->name('purchasing.purchase-requests.store');

    Route::post('/purchasing/purchase-orders', [PurchasingController::class, 'storePurchaseOrder'])
        ->middleware('permission:create_purchase_order')
        ->name('purchasing.purchase-orders.store');

    Route::patch('/purchasing/purchase-orders/{purchaseOrder}/approve', [PurchasingController::class, 'approvePurchaseOrder'])
        ->middleware('permission:approve_purchase_order')
        ->name('purchasing.purchase-orders.approve');

    Route::post('/purchasing/goods-receipts', [PurchasingController::class, 'storeGoodsReceipt'])
        ->middleware('permission:create_goods_receipt')
        ->name('purchasing.goods-receipts.store');

    Route::patch('/purchasing/goods-receipts/{goodsReceipt}/approve', [PurchasingController::class, 'approveGoodsReceipt'])
        ->middleware('permission:approve_goods_receipt')
        ->name('purchasing.goods-receipts.approve');

    Route::patch('/purchasing/goods-receipts/{goodsReceipt}/reject', [PurchasingController::class, 'rejectGoodsReceipt'])
        ->middleware('permission:reject_goods_receipt')
        ->name('purchasing.goods-receipts.reject');

    Route::get('/cost-accounting', [CostAccountingController::class, 'index'])
        ->middleware('permission:view_cost_accounting')
        ->name('cost-accounting.index');

    Route::post('/cost-accounting/entries', [CostAccountingController::class, 'storeEntry'])
        ->middleware('permission:create_cost_entry')
        ->name('cost-accounting.entries.store');

    Route::patch('/cost-accounting/lots/{lot}/recalculate', [CostAccountingController::class, 'recalculateSummary'])
        ->middleware('permission:create_cost_entry,review_cost_summary')
        ->name('cost-accounting.recalculate');

    Route::patch('/cost-accounting/lots/{lot}/review', [CostAccountingController::class, 'reviewSummary'])
        ->middleware('permission:review_cost_summary')
        ->name('cost-accounting.review');

    Route::patch('/cost-accounting/lots/{lot}/approve', [CostAccountingController::class, 'approveSummary'])
        ->middleware('permission:approve_cost_summary')
        ->name('cost-accounting.approve');

    Route::get('/master-data/warehouses', [WarehouseController::class, 'index'])
        ->middleware('permission:view_warehouses')
        ->name('master-data.warehouses');

    Route::post('/master-data/warehouses', [WarehouseController::class, 'store'])
        ->middleware('permission:manage_warehouses')
        ->name('master-data.warehouses.store');

    Route::patch('/master-data/warehouses/{warehouse}', [WarehouseController::class, 'update'])
        ->middleware('permission:manage_warehouses')
        ->name('master-data.warehouses.update');

    Route::delete('/master-data/warehouses/{warehouse}', [WarehouseController::class, 'destroy'])
        ->middleware('permission:manage_warehouses')
        ->name('master-data.warehouses.destroy');

    Route::get('/master-data/departments', [DepartmentController::class, 'index'])
        ->middleware('permission:view_departments')
        ->name('master-data.departments');

    Route::post('/master-data/departments', [DepartmentController::class, 'store'])
        ->middleware('permission:create_department')
        ->name('master-data.departments.store');

    Route::patch('/master-data/departments/{department}', [DepartmentController::class, 'update'])
        ->middleware('permission:edit_department')
        ->name('master-data.departments.update');

    Route::patch('/master-data/departments/{department}/deactivate', [DepartmentController::class, 'deactivate'])
        ->middleware('permission:deactivate_department')
        ->name('master-data.departments.deactivate');

    Route::patch('/master-data/departments/{department}/archive', [DepartmentController::class, 'archive'])
        ->middleware('permission:archive_department')
        ->name('master-data.departments.archive');

    Route::delete('/master-data/departments/{department}', [DepartmentController::class, 'destroy'])
        ->middleware('permission:delete_department')
        ->name('master-data.departments.destroy');

    Route::get('/master-data/units', [UnitController::class, 'index'])
        ->middleware('permission:view_units')
        ->name('master-data.units');

    Route::post('/master-data/units', [UnitController::class, 'store'])
        ->middleware('permission:view_units')
        ->name('master-data.units.store');

    Route::patch('/master-data/units/{unit}', [UnitController::class, 'update'])
        ->middleware('permission:view_units')
        ->name('master-data.units.update');

    Route::delete('/master-data/units/{unit}', [UnitController::class, 'destroy'])
        ->middleware('permission:view_units')
        ->name('master-data.units.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
