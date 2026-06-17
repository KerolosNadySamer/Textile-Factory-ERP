<?php

use App\Http\Controllers\ErpController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ErpController::class, 'dashboard'])->name('dashboard');
Route::get('/modules/{module}', [ErpController::class, 'index'])->name('erp.module');
Route::post('/modules/{module}', [ErpController::class, 'store'])->name('erp.store');
Route::get('/modules/{module}/{id}/edit', [ErpController::class, 'edit'])->name('erp.edit');
Route::put('/modules/{module}/{id}', [ErpController::class, 'update'])->name('erp.update');
Route::delete('/modules/{module}/{id}', [ErpController::class, 'destroy'])->name('erp.destroy');
