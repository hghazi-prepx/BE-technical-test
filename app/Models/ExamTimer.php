<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamTimer extends Model
{
    protected $fillable = [
        'exam_id',
        'duration_seconds',
        'state',
        'started_at',
        'paused_at',
        'paused_total_seconds',
        'global_adjust_seconds',
        'version',
        'updated_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'paused_at' => 'datetime',
    ];

    /**
     * Get the exam this timer belongs to
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * Get the user who last updated this timer
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get all adjustments for this timer
     */
    public function adjustments(): HasMany
    {
        return $this->hasMany(TimerAdjustment::class);
    }

    /**
     * Get global adjustments (applied to all students)
     */
    public function globalAdjustments(): HasMany
    {
        return $this->hasMany(TimerAdjustment::class)->whereNull('student_id');
    }

    /**
     * Get adjustments for a specific student
     */
    public function studentAdjustments(int $studentId): HasMany
    {
        return $this->hasMany(TimerAdjustment::class)->where('student_id', $studentId);
    }
}
