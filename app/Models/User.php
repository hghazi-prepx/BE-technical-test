<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the exams this user has created
     */
    public function createdExams(): HasMany
    {
        return $this->hasMany(Exam::class, 'created_by');
    }

    /**
     * Get the exams this user is registered for
     */
    public function examRegistrations(): BelongsToMany
    {
        return $this->belongsToMany(Exam::class, 'exam_registrations', 'student_id', 'exam_id')
            ->withTimestamps();
    }

    /**
     * Check if user is a proctor for a specific exam
     */
    public function isProctorFor(int $examId): bool
    {
        // Simple role-based check - you can enhance this with more complex logic
        return $this->role === 'proctor' || $this->role === 'admin' ||
               $this->createdExams()->where('id', $examId)->exists();
    }

    /**
     * Check if user is registered for a specific exam
     */
    public function isRegisteredFor(int $examId): bool
    {
        return $this->examRegistrations()->where('exam_id', $examId)->exists();
    }
}
