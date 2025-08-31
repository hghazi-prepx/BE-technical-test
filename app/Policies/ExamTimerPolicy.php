<?php

namespace App\Policies;

use App\Models\ExamTimer;
use App\Models\User;

class ExamTimerPolicy
{
    /**
     * Determine whether the user can view the timer.
     */
    public function view(User $user, ExamTimer $timer): bool
    {
        // Allow registered students & proctors
        return $user->isProctorFor($timer->exam_id) || $user->isRegisteredFor($timer->exam_id);
    }

    /**
     * Determine whether the user can manage the timer.
     */
    public function manage(User $user, ExamTimer $timer): bool
    {
        // Only proctors/instructors
        return $user->isProctorFor($timer->exam_id);
    }
}
