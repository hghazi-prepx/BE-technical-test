<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentTimerState extends Model
{
    protected $fillable = [
        'exam_timer_id',
        'student_id',
        'state',
        'started_at',
        'paused_at',
        'paused_total_seconds',
        'student_adjust_seconds',
        'version',
        'updated_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'paused_at' => 'datetime',
        'paused_total_seconds' => 'integer',
        'student_adjust_seconds' => 'integer',
        'version' => 'integer',
    ];

    /**
     * Get the exam timer this state belongs to
     */
    public function examTimer(): BelongsTo
    {
        return $this->belongsTo(ExamTimer::class);
    }

    /**
     * Get the student this state is for
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the user who last updated this state
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Check if the timer is running
     */
    public function isRunning(): bool
    {
        return $this->state === 'running';
    }

    /**
     * Check if the timer is paused
     */
    public function isPaused(): bool
    {
        return $this->state === 'paused';
    }

    /**
     * Check if the timer is finished
     */
    public function isFinished(): bool
    {
        return $this->state === 'finished';
    }

    /**
     * Calculate remaining time for this student
     */
    public function getRemainingSeconds(): int
    {
        if ($this->state === 'idle' || ! $this->started_at) {
            return $this->examTimer->duration_seconds + $this->student_adjust_seconds;
        }

        $elapsed = 0;
        if ($this->state === 'running') {
            $elapsed = now()->diffInSeconds($this->started_at) - $this->paused_total_seconds;
        } elseif ($this->state === 'paused' && $this->paused_at) {
            $elapsed = $this->paused_at->diffInSeconds($this->started_at) - $this->paused_total_seconds;
        }

        $remaining = $this->examTimer->duration_seconds + $this->student_adjust_seconds - $elapsed;

        return max(0, $remaining);
    }
}
