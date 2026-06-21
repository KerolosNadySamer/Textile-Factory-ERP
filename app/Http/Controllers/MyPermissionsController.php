<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyPermissionsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('MyPermissions/Index', [
            'user' => $request->user()->load(['role.permissions', 'department', 'position', 'manager:id,name,name_ar,name_en,email']),
        ]);
    }
}
