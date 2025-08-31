<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Exam extends Model
{
    protected $fillable = [
        'title',
        'description',
        'default_duration_seconds',
        'scheduled_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    /**
     * Get the user who created this exam
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the timer for this exam
     */
    public function timer(): HasOne
    {
        return $this->hasOne(ExamTimer::class);
    }

    /**
     * Get the students registered for this exam
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'exam_registrations', 'exam_id', 'student_id')
            ->withTimestamps();
    }

    /**
     * Get the registrations for this exam
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(ExamRegistration::class);
    }
}
