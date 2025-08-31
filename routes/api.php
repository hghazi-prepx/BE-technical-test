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

    // Individual student timer control
    Route::post('/exams/{exam}/timer/start-student', [ExamTimerController::class, 'startForStudent']);
    Route::post('/exams/{exam}/timer/pause-student', [ExamTimerController::class, 'pauseForStudent']);
    Route::post('/exams/{exam}/timer/resume-student', [ExamTimerController::class, 'resumeForStudent']);
    Route::post('/exams/{exam}/timer/reset-student', [ExamTimerController::class, 'resetForStudent']);
    Route::post('/exams/{exam}/timer/adjust-student', [ExamTimerController::class, 'adjustForStudent']);
    Route::get('/exams/{exam}/timer/student-state', [ExamTimerController::class, 'getStudentTimerState']);
    Route::get('/exams/{exam}/timer/student/{student}', [ExamTimerController::class, 'getStudentTimer']);

    // Bulk timer control for all students
    Route::post('/exams/{exam}/timer/start-all', [ExamTimerController::class, 'startForAllStudents']);
    Route::post('/exams/{exam}/timer/pause-all', [ExamTimerController::class, 'pauseForAllStudents']);
    Route::post('/exams/{exam}/timer/resume-all', [ExamTimerController::class, 'resumeForAllStudents']);
    Route::post('/exams/{exam}/timer/reset-all', [ExamTimerController::class, 'resetForAllStudents']);
    Route::get('/exams/{exam}/timer/all-students-states', [ExamTimerController::class, 'getAllStudentsTimerStates']);
});
