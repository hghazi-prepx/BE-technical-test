<?php

use App\Http\Controllers\ExamTimerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/exams/{exam}/timer', [ExamTimerController::class, 'show']);
    Route::post('/exams/{exam}/timer/start', [ExamTimerController::class, 'start']);
    Route::post('/exams/{exam}/timer/pause', [ExamTimerController::class, 'pause']);
    Route::post('/exams/{exam}/timer/resume', [ExamTimerController::class, 'resume']);
    Route::post('/exams/{exam}/timer/reset', [ExamTimerController::class, 'reset']);
    Route::post('/exams/{exam}/timer/adjust', [ExamTimerController::class, 'adjust']);
    Route::get('/exams/{exam}/users', [ExamTimerController::class, 'getUsers']);
});
