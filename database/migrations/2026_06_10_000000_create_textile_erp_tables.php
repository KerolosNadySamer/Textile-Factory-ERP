<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('manager')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('city')->nullable();
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no')->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('product');
            $table->string('required_quality');
            $table->string('color')->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('length', 10, 2)->nullable();
            $table->decimal('quantity', 12, 2);
            $table->decimal('price', 12, 2)->default(0);
            $table->date('delivery_date')->nullable();
            $table->string('status')->default('Draft');
            $table->timestamps();
        });

        Schema::create('production_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->string('request_no')->unique();
            $table->string('product_type')->default('Dyed');
            $table->string('status')->default('Pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('production_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_request_id')->constrained()->cascadeOnDelete();
            $table->string('plan_no')->unique();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('priority')->default('Normal');
            $table->string('status')->default('Planned');
            $table->text('stages')->nullable();
            $table->timestamps();
        });

        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->string('keeper')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('unit')->default('kg');
            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('reorder_level', 12, 2)->default(0);
            $table->string('status')->default('Available');
            $table->timestamps();
        });

        Schema::create('material_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->string('voucher_no')->unique();
            $table->decimal('quantity', 12, 2);
            $table->string('approved_by')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamps();
        });

        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('department');
            $table->string('status')->default('Available');
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('employee_no')->unique();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('job_title');
            $table->decimal('salary', 12, 2)->default(0);
            $table->date('hire_date')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        Schema::create('weaving_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('machine_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('operator_id')->nullable()->references('id')->on('employees')->nullOnDelete();
            $table->string('batch_no')->unique();
            $table->decimal('input_yarn_qty', 12, 2)->default(0);
            $table->decimal('output_fabric_qty', 12, 2)->default(0);
            $table->decimal('waste_qty', 12, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->timestamps();
        });

        Schema::create('dyeing_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weaving_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('machine_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_no')->unique();
            $table->string('color');
            $table->decimal('temperature', 8, 2)->nullable();
            $table->integer('process_minutes')->nullable();
            $table->decimal('chemical_qty', 12, 2)->default(0);
            $table->decimal('waste_qty', 12, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->timestamps();
        });

        Schema::create('fabric_rolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dyeing_batch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('weaving_batch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('roll_no')->unique();
            $table->string('qr_code')->unique();
            $table->decimal('weight', 10, 2)->default(0);
            $table->decimal('length', 10, 2)->default(0);
            $table->string('grade')->default('Pending');
            $table->string('status')->default('In Quality');
            $table->timestamps();
        });

        Schema::create('quality_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fabric_roll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inspector_id')->nullable()->references('id')->on('employees')->nullOnDelete();
            $table->string('check_no')->unique();
            $table->string('color_result')->default('Accepted');
            $table->string('measurement_result')->default('Accepted');
            $table->string('defects')->nullable();
            $table->string('grade')->default('First Grade');
            $table->string('status')->default('Approved');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->string('invoice_no')->unique();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_status')->default('Unpaid');
            $table->date('due_date')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('method')->default('Cash');
            $table->string('bank')->nullable();
            $table->string('transfer_no')->nullable();
            $table->date('paid_at')->nullable();
            $table->string('status')->default('Paid');
            $table->timestamps();
        });

        Schema::create('shipping_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->string('shipping_no')->unique();
            $table->string('company')->nullable();
            $table->string('vehicle_no')->nullable();
            $table->string('driver')->nullable();
            $table->dateTime('departure_time')->nullable();
            $table->decimal('quantity', 12, 2)->default(0);
            $table->integer('rolls_count')->default(0);
            $table->string('status')->default('Pending');
            $table->timestamps();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->string('status')->default('Present');
            $table->timestamps();
        });

        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('month');
            $table->decimal('salary', 12, 2)->default(0);
            $table->decimal('bonus', 12, 2)->default(0);
            $table->decimal('deduction', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->references('id')->on('employees')->nullOnDelete();
            $table->string('issue');
            $table->string('priority')->default('Medium');
            $table->string('type')->default('Preventive');
            $table->string('status')->default('Open');
            $table->timestamps();
        });

        Schema::create('maintenance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type')->default('System');
            $table->text('message');
            $table->string('status')->default('Unread');
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor')->default('System');
            $table->string('action');
            $table->string('module');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'activity_logs', 'notifications', 'maintenance_logs', 'maintenance_requests', 'payrolls', 'attendances',
            'shipping_orders', 'payments', 'invoices', 'quality_checks', 'fabric_rolls', 'dyeing_batches',
            'weaving_batches', 'shifts', 'employees', 'machines', 'material_issues', 'inventory_items',
            'warehouses', 'production_plans', 'production_requests', 'sales_orders', 'customers', 'departments',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
