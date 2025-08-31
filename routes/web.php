<?php

use App\Models\Exam;
use App\Models\ExamTimer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('login');
})->name('login');

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials)) {
        $request->session()->regenerate();

        return redirect('/');
    }

    return back()->withErrors([
        'email' => 'The provided credentials do not match our records.',
    ]);
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->name('logout');

// Broadcasting authentication route
Route::post('/broadcasting/auth', function (Request $request) {
    return Broadcast::auth($request);
})->middleware('auth');

Route::get('/timer/{exam}', function (Exam $exam) {
    if (! Auth::check()) {
        return redirect()->route('login');
    }

    // Check if user has access to this exam
    $user = Auth::user();
    if (! $user->isProctorFor($exam->id) && ! $user->isRegisteredFor($exam->id)) {
        abort(403, 'You do not have access to this exam.');
    }

    $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
        'duration_seconds' => $exam->default_duration_seconds,
    ]);

    return view('timer', compact('exam', 'timer'));
})->middleware('auth')->name('timer');

// Route to check current user's role and permissions
Route::get('/check-user', function () {
    if (! Auth::check()) {
        return response()->json(['authenticated' => false]);
    }

    $user = Auth::user();
    $examId = 1; // Default exam ID

    return response()->json([
        'authenticated' => true,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ],
        'permissions' => [
            'is_proctor_for_exam_1' => $user->isProctorFor($examId),
            'is_registered_for_exam_1' => $user->isRegisteredFor($examId),
            'can_view_timer' => $user->can('viewTimer', [\App\Models\Exam::class, $examId]),
            'can_manage_timer' => $user->can('manageTimer', [\App\Models\Exam::class, $examId]),
        ],
        'exam_access' => [
            'exam_id' => $examId,
            'has_access' => $user->isProctorFor($examId) || $user->isRegisteredFor($examId),
        ],
    ]);
})->middleware('auth');

// Route to start server time broadcasting
Route::post('/start-server-time-broadcast', function () {
    // Start the server time broadcasting command in the background
    $process = new \Symfony\Component\Process\Process(['php', 'artisan', 'broadcast:server-time']);
    $process->start();

    return response()->json([
        'message' => 'Server time broadcasting started',
        'process_id' => $process->getPid(),
        'status' => 'running',
    ]);
})->middleware('auth');
