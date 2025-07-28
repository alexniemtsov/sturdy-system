<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentShareController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('documents', DocumentController::class);
    
    // Document sharing routes
    Route::prefix('api/documents/{document}')->group(function () {
        Route::get('shares', [DocumentShareController::class, 'index'])->name('documents.shares.index');
        Route::post('shares', [DocumentShareController::class, 'store'])->name('documents.shares.store');
        Route::put('shares/{share}', [DocumentShareController::class, 'update'])->name('documents.shares.update');
        Route::delete('shares/{share}', [DocumentShareController::class, 'destroy'])->name('documents.shares.destroy');
        Route::post('broadcast', [DocumentController::class, 'broadcast'])->name('documents.broadcast');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Broadcasting routes
Broadcast::routes(['middleware' => ['auth']]);
