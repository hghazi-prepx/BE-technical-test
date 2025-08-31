<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamTimer;
use App\Models\User;
use App\Services\TimerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ExamTimerController extends Controller
{
    public function __construct(private TimerService $service) {}

    /**
     * Get timer state for an exam
     */
    public function show(Exam $exam)
    {
        // Debug authentication
        Log::info('ExamTimerController::show called', [
            'exam_id' => $exam->id,
            'user_id' => Auth::id(),
            'user_role' => Auth::user()?->role,
            'authenticated' => Auth::check(),
        ]);

        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('view', $timer);

        $studentId = Auth::user()->role === 'student' ? Auth::id() : null;

        return response()->json([
            'data' => $this->service->getTimerState($timer, $studentId),
        ]);
    }

    /**
     * Start the timer
     */
    public function start(Request $request, Exam $exam)
    {
        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('manage', $timer);

        $updated = $this->service->start($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Pause the timer
     */
    public function pause(Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->pause($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Resume the timer
     */
    public function resume(Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->resume($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Reset the timer
     */
    public function reset(Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->reset($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Adjust timer (add/subtract time)
     */
    public function adjust(Request $request, Exam $exam)
    {
        $validated = $request->validate([
            'seconds' => ['required', 'integer', 'between:-3600,3600'], // guard rails
            'student_id' => ['nullable', 'integer', 'exists:users,id'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->adjust(
            $timer,
            $validated['seconds'],
            $validated['student_id'] ?? null,
            $validated['reason'] ?? null
        );

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Get users for dropdown selection
     */
    public function getUsers(Exam $exam)
    {
        $this->authorize('manage', ExamTimer::firstOrCreate(['exam_id' => $exam->id]));

        $users = User::select('id', 'name', 'email')
            ->where('role', 'student')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }
}
