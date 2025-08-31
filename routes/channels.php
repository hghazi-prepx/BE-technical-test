<?php

use App\Models\Exam;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('exams.{examId}.timer', function ($user, $examId) {
    // authorize instructor + registered students of exam
    $canView = $user->can('viewTimer', [Exam::class, (int) $examId]);

    Log::info('Broadcasting channel authorization', [
        'channel' => "exams.{$examId}.timer",
        'user_id' => $user->id,
        'user_role' => $user->role,
        'exam_id' => $examId,
        'can_view' => $canView,
        'is_proctor' => $user->isProctorFor($examId),
        'is_registered' => $user->isRegisteredFor($examId),
    ]);

    return $canView;
});

Broadcast::channel('exams.{examId}.students.{studentId}.timer', function ($user, $examId, $studentId) {
    // a student can listen to their own channel; instructors can listen to any
    $canAccess = (int) $user->id === (int) $studentId || $user->can('manageTimer', [Exam::class, (int) $examId]);

    Log::info('Broadcasting student channel authorization', [
        'channel' => "exams.{$examId}.students.{$studentId}.timer",
        'user_id' => $user->id,
        'user_role' => $user->role,
        'exam_id' => $examId,
        'student_id' => $studentId,
        'can_access' => $canAccess,
        'is_own_channel' => (int) $user->id === (int) $studentId,
        'can_manage' => $user->can('manageTimer', [Exam::class, (int) $examId]),
    ]);

    return $canAccess;
});
