<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\User;

class ExamPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Exam $exam): bool
    {
        return $user->isProctorFor($exam->id) || $user->isRegisteredFor($exam->id);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['proctor', 'admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Exam $exam): bool
    {
        return $user->isProctorFor($exam->id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Exam $exam): bool
    {
        return $user->isProctorFor($exam->id);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Exam $exam): bool
    {
        return $user->isProctorFor($exam->id);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Exam $exam): bool
    {
        return $user->isProctorFor($exam->id);
    }

    /**
     * Determine whether the user can view timer for the exam.
     */
    public function viewTimer(User $user, int $examId): bool
    {
        return $user->isProctorFor($examId) || $user->isRegisteredFor($examId);
    }

    /**
     * Determine whether the user can manage timer for the exam.
     */
    public function manageTimer(User $user, int $examId): bool
    {
        return $user->isProctorFor($examId);
    }
}
