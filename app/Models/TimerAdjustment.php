<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimerAdjustment extends Model
{
    protected $fillable = [
        'exam_timer_id',
        'student_id',
        'seconds',
        'reason',
        'created_by',
    ];

    /**
     * Get the timer this adjustment belongs to
     */
    public function examTimer(): BelongsTo
    {
        return $this->belongsTo(ExamTimer::class);
    }

    /**
     * Get the student this adjustment is for (null = global)
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the user who created this adjustment
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if this is a global adjustment
     */
    public function isGlobal(): bool
    {
        return is_null($this->student_id);
    }
}
