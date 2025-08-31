<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentTimerControlRequest;
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
        $this->authorize('manage', ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]));

        $users = User::select('id', 'name', 'email')
            ->where('role', 'student')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    /**
     * Start timer for a specific student
     */
    public function startForStudent(StudentTimerControlRequest $request, Exam $exam)
    {
        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('manage', $timer);

        $updated = $this->service->startForStudent($timer, $request->validated()['student_id']);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Pause timer for a specific student
     */
    public function pauseForStudent(StudentTimerControlRequest $request, Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->pauseForStudent($timer, $request->validated()['student_id']);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Resume timer for a specific student
     */
    public function resumeForStudent(StudentTimerControlRequest $request, Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->resumeForStudent($timer, $request->validated()['student_id']);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Reset timer for a specific student
     */
    public function resetForStudent(StudentTimerControlRequest $request, Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->resetForStudent($timer, $request->validated()['student_id']);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Adjust timer for a specific student
     */
    public function adjustForStudent(StudentTimerControlRequest $request, Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $data = $request->validated();
        $updated = $this->service->adjust($timer, $data['seconds'], $data['student_id']);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Start timer for all students
     */
    public function startForAllStudents(Exam $exam)
    {
        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('manage', $timer);

        $updated = $this->service->startForAllStudents($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Pause timer for all students
     */
    public function pauseForAllStudents(Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->pauseForAllStudents($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Resume timer for all students
     */
    public function resumeForAllStudents(Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->resumeForAllStudents($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Reset timer for all students
     */
    public function resetForAllStudents(Exam $exam)
    {
        $timer = ExamTimer::where('exam_id', $exam->id)->firstOrFail();
        $this->authorize('manage', $timer);

        $updated = $this->service->resetForAllStudents($timer);

        return response()->json(['ok' => true, 'version' => $updated->version]);
    }

    /**
     * Get timer state for a specific student
     */
    public function getStudentTimerState(StudentTimerControlRequest $request, Exam $exam)
    {
        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('view', $timer);

        $state = $this->service->getTimerStateForStudent($timer, $request->validated()['student_id']);

        return response()->json(['data' => $state]);
    }

    /**
     * Get timer states for all students
     */
    public function getAllStudentsTimerStates(Exam $exam)
    {
        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('manage', $timer);

        $states = $this->service->getTimerStatesForAllStudents($timer);

        return response()->json(['data' => $states]);
    }

    /**
     * Get timer for a specific student (for display purposes)
     */
    public function getStudentTimer(Exam $exam, User $student)
    {
        $timer = ExamTimer::firstOrCreate(['exam_id' => $exam->id], [
            'duration_seconds' => $exam->default_duration_seconds,
        ]);

        $this->authorize('view', $timer);

        // Get the student's timer state
        $studentState = $this->service->getTimerStateForStudent($timer, $student->id);

        // Get the base timer state
        $baseState = $this->service->getTimerState($timer, null);

        // Combine base timer with student-specific adjustments
        $combinedState = array_merge($baseState, [
            'student_id' => $student->id,
            'student_name' => $student->name,
            'student_email' => $student->email,
            'student_adjust_seconds' => $studentState['student_adjust_seconds'] ?? 0,
            'remaining_seconds' => $studentState['remaining_seconds'] ?? $baseState['remaining_seconds'],
            'state' => $studentState['state'] ?? $baseState['state'],
            'started_at' => $studentState['started_at'] ?? $baseState['started_at'],
            'paused_at' => $studentState['paused_at'] ?? $baseState['paused_at'],
            'paused_total_seconds' => $studentState['paused_total_seconds'] ?? $baseState['paused_total_seconds'],
        ]);

        return response()->json($combinedState);
    }
}
