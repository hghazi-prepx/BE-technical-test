<?php

namespace App\Services;

use App\Events\ServerTimeSync;
use App\Events\TimerSynced;
use App\Models\ExamTimer;
use App\Models\TimerAdjustment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TimerService
{
    /**
     * Broadcast server time to all connected clients for synchronization
     */
    private function broadcastServerTime(): void
    {
        try {
            broadcast(new ServerTimeSync);
            Log::info('Server time broadcasted automatically after timer state change');
        } catch (\Exception $e) {
            Log::warning('Failed to broadcast server time', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Start the timer for an exam
     */
    public function start(ExamTimer $timer): ExamTimer
    {
        return DB::transaction(function () use ($timer) {
            $timer = ExamTimer::whereKey($timer->id)->lockForUpdate()->first();

            if (! in_array($timer->state, ['idle', 'finished'])) {
                throw ValidationException::withMessages(['state' => 'Timer not startable.']);
            }

            $timer->update([
                'state' => 'running',
                'started_at' => now(),
                'paused_at' => null,
                'paused_total_seconds' => 0,
                'version' => $timer->version + 1,
                'updated_by' => Auth::id(),
            ]);

            $freshTimer = $timer->fresh();
            Log::info('Dispatching TimerSynced event after start', [
                'timer_id' => $freshTimer->id,
                'state' => $freshTimer->state,
                'version' => $freshTimer->version,
                'broadcasting_driver' => config('broadcasting.default'),
                'should_broadcast' => true,
            ]);

            try {
                TimerSynced::dispatch($freshTimer);
                Log::info('TimerSynced event dispatched successfully after start');

                // Automatically broadcast server time for synchronization
                $this->broadcastServerTime();
            } catch (\Exception $e) {
                Log::error('Failed to dispatch TimerSynced event after start', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            return $timer;
        });
    }

    /**
     * Pause the running timer
     */
    public function pause(ExamTimer $timer): ExamTimer
    {
        return DB::transaction(function () use ($timer) {
            $timer = ExamTimer::whereKey($timer->id)->lockForUpdate()->first();

            if ($timer->state !== 'running') {
                throw ValidationException::withMessages(['state' => 'Timer not running.']);
            }

            // When pausing, we don't update paused_total_seconds yet
            // We just store the current state and let resume handle the calculation
            // This prevents negative values and ensures correct timing

            $timer->update([
                'state' => 'paused',
                'paused_at' => now(),
                'version' => $timer->version + 1,
                'updated_by' => Auth::id(),
            ]);

            // Debug logging to see what's happening during pause
            Log::info('Pause details', [
                'timer_id' => $timer->id,
                'state' => 'paused',
                'paused_at' => now(),
                'current_paused_total' => $timer->paused_total_seconds,
                'started_at' => $timer->started_at,
                'version' => $timer->version + 1,
            ]);

            $freshTimer = $timer->fresh();
            Log::info('Dispatching TimerSynced event after pause', [
                'timer_id' => $freshTimer->id,
                'state' => $freshTimer->state,
                'version' => $freshTimer->version,
                'broadcasting_driver' => config('broadcasting.default'),
                'should_broadcast' => true,
            ]);

            try {
                TimerSynced::dispatch($freshTimer);
                Log::info('TimerSynced event dispatched successfully after pause');

                // Automatically broadcast server time for synchronization
                $this->broadcastServerTime();
            } catch (\Exception $e) {
                Log::error('Failed to dispatch TimerSynced event after pause', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            return $timer;
        });
    }

    /**
     * Resume the paused timer
     */
    public function resume(ExamTimer $timer): ExamTimer
    {
        return DB::transaction(function () use ($timer) {
            $timer = ExamTimer::whereKey($timer->id)->lockForUpdate()->first();

            if ($timer->state !== 'paused') {
                throw ValidationException::withMessages(['state' => 'Timer not paused.']);
            }

            // Calculate how long the timer was paused this time
            $pausedFor = 0;
            if ($timer->paused_at && ! $timer->paused_at->isFuture()) {
                // Use absolute value to handle any timezone issues
                $pausedFor = abs(now()->diffInSeconds($timer->paused_at));

                // Additional safety check - if pause duration seems unreasonable, cap it
                if ($pausedFor > 86400) { // More than 24 hours
                    Log::warning('Pause duration seems unreasonable, capping at 24 hours', [
                        'timer_id' => $timer->id,
                        'calculated_pause_duration' => $pausedFor,
                        'paused_at' => $timer->paused_at,
                        'now' => now(),
                    ]);
                    $pausedFor = 86400; // Cap at 24 hours
                }
            }

            // Add this pause duration to the total paused time
            $newPausedTotal = $timer->paused_total_seconds + $pausedFor;

            // Debug logging to see what's happening
            Log::info('Resume calculation details', [
                'timer_id' => $timer->id,
                'current_paused_total' => $timer->paused_total_seconds,
                'pause_duration' => $pausedFor,
                'new_paused_total' => $newPausedTotal,
                'paused_at' => $timer->paused_at,
                'now' => now(),
                'calculation' => $timer->paused_total_seconds.' + '.$pausedFor.' = '.$newPausedTotal,
                'time_details' => [
                    'paused_at_timestamp' => $timer->paused_at ? $timer->paused_at->toISOString() : 'null',
                    'now_timestamp' => now()->toISOString(),
                    'diff_in_seconds' => $pausedFor,
                    'timezone_info' => [
                        'app_timezone' => config('app.timezone'),
                        'paused_at_timezone' => $timer->paused_at ? $timer->paused_at->timezone->getName() : 'null',
                        'now_timezone' => now()->timezone->getName(),
                        'raw_diff' => now()->diffInSeconds($timer->paused_at),
                        'abs_diff' => abs(now()->diffInSeconds($timer->paused_at)),
                    ],
                ],
            ]);

            // Ensure total paused time is reasonable (not negative or too large)
            $newPausedTotal = max(0, min($newPausedTotal, 86400 * 7)); // Max 7 days

            // Additional safety check - if total paused time seems unreasonable, reset it
            if ($newPausedTotal > 86400 * 30) { // More than 30 days
                Log::warning('Total paused time seems unreasonable, resetting to 0', [
                    'timer_id' => $timer->id,
                    'current_paused_total' => $timer->paused_total_seconds,
                    'new_total_paused' => $newPausedTotal,
                ]);
                $newPausedTotal = 0;
            }

            // DO NOT change the started_at time - this causes the remaining time to increase
            // The timer should continue from exactly where it was paused
            //
            // How it works:
            // 1. started_at remains constant (e.g., 21:31:02)
            // 2. paused_total_seconds accumulates all pause time (e.g., 75 seconds)
            // 3. When calculating remaining time: duration - (now - started_at) + paused_total_seconds
            // 4. This effectively "pauses" the timer at the exact moment it was paused
            $newStartedAt = $timer->started_at;

            // Log the values for debugging
            Log::info('Timer resume calculation', [
                'timer_id' => $timer->id,
                'original_started_at' => $timer->started_at,
                'current_paused_total' => $timer->paused_total_seconds,
                'this_pause_duration' => $pausedFor,
                'new_total_paused' => $newPausedTotal,
                'new_started_at' => $newStartedAt,
                'pause_time' => $timer->paused_at,
                'resume_time' => now(),
                'total_pause_effect' => 'started_at unchanged, paused_total_seconds updated to '.$newPausedTotal,
            ]);

            try {
                Log::info('Attempting to update timer with data:', [
                    'timer_id' => $timer->id,
                    'update_data' => [
                        'state' => 'running',
                        'started_at' => $newStartedAt,
                        'paused_total_seconds' => $newPausedTotal,
                        'paused_at' => null,
                        'version' => $timer->version + 1,
                    ],
                    'before_update' => [
                        'paused_total_seconds' => $timer->paused_total_seconds,
                        'paused_at' => $timer->paused_at,
                        'started_at' => $timer->started_at,
                    ],
                ]);

                $timer->update([
                    'state' => 'running',
                    'started_at' => $newStartedAt,
                    'paused_total_seconds' => $newPausedTotal,
                    'paused_at' => null,
                    'version' => $timer->version + 1,
                    'updated_by' => Auth::id(),
                ]);

                // Log the result after update
                $timer->refresh();
                Log::info('Timer updated successfully', [
                    'timer_id' => $timer->id,
                    'after_update' => [
                        'paused_total_seconds' => $timer->paused_total_seconds,
                        'paused_at' => $timer->paused_at,
                        'state' => $timer->state,
                        'version' => $timer->version,
                    ],
                ]);

            } catch (\Exception $e) {
                Log::error('Failed to update timer on resume', [
                    'timer_id' => $timer->id,
                    'error' => $e->getMessage(),
                    'update_data' => [
                        'state' => 'running',
                        'started_at' => $newStartedAt,
                        'paused_total_seconds' => $newPausedTotal,
                        'paused_at' => null,
                        'version' => $timer->version + 1,
                    ],
                    'current_timer_state' => [
                        'paused_total_seconds' => $timer->paused_total_seconds,
                        'paused_at' => $timer->paused_at,
                        'started_at' => $timer->started_at,
                    ],
                ]);
                throw $e;
            }

            $freshTimer = $timer->fresh();
            Log::info('Dispatching TimerSynced event after resume', [
                'timer_id' => $freshTimer->id,
                'state' => $freshTimer->state,
                'version' => $freshTimer->version,
                'broadcasting_driver' => config('broadcasting.default'),
                'should_broadcast' => true,
            ]);

            try {
                TimerSynced::dispatch($freshTimer);
                Log::info('TimerSynced event dispatched successfully');

                // Automatically broadcast server time for synchronization
                $this->broadcastServerTime();
            } catch (\Exception $e) {
                Log::error('Failed to dispatch TimerSynced event', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            return $timer;
        });
    }

    /**
     * Reset the timer to idle state
     */
    public function reset(ExamTimer $timer): ExamTimer
    {
        return DB::transaction(function () use ($timer) {
            $timer = ExamTimer::whereKey($timer->id)->lockForUpdate()->first();

            $timer->update([
                'state' => 'idle',
                'started_at' => null,
                'paused_at' => null,
                'paused_total_seconds' => 0,
                'global_adjust_seconds' => 0,
                'version' => $timer->version + 1,
                'updated_by' => Auth::id(),
            ]);

            // Optionally: archive or soft-delete adjustments here
            // For this implementation, we'll keep the history but reset the global counter

            TimerSynced::dispatch($timer->fresh());

            // Automatically broadcast server time for synchronization
            $this->broadcastServerTime();

            return $timer;
        });
    }

    /**
     * Adjust timer (add/subtract time)
     *
     * @param  int  $seconds  Positive or negative adjustment in seconds
     * @param  int|null  $studentId  If null, applies to all students (global)
     * @param  string|null  $reason  Optional reason for the adjustment
     */
    public function adjust(ExamTimer $timer, int $seconds, ?int $studentId = null, ?string $reason = null): ExamTimer
    {
        return DB::transaction(function () use ($timer, $seconds, $studentId, $reason) {
            $timer = ExamTimer::whereKey($timer->id)->lockForUpdate()->first();

            TimerAdjustment::create([
                'exam_timer_id' => $timer->id,
                'student_id' => $studentId,
                'seconds' => $seconds,
                'reason' => $reason,
                'created_by' => Auth::id(),
            ]);

            if (is_null($studentId)) {
                // Global adjust — keep denormalized sum up to date
                $timer->increment('global_adjust_seconds', $seconds);
                $timer->increment('version');
            } else {
                $timer->increment('version');
            }

            $timer->refresh();
            TimerSynced::dispatch($timer->fresh(), $studentId, $seconds);

            // Automatically broadcast server time for synchronization
            $this->broadcastServerTime();

            return $timer;
        });
    }

    /**
     * Compute remaining seconds for a student at a reference time
     *
     * @param  CarbonImmutable  $at  Reference time
     * @return int Remaining seconds (clamped to 0 minimum)
     */
    public function remainingFor(ExamTimer $timer, ?int $studentId, CarbonImmutable $at): int
    {
        $elapsed = 0;

        if ($timer->state === 'running') {
            // When running: elapsed = (now - startedAt) - paused_total_seconds
            $elapsed = $at->diffInSeconds($timer->started_at) - $timer->paused_total_seconds;
        } elseif ($timer->state === 'paused') {
            // When paused: elapsed = (pausedAt - startedAt) - paused_total_seconds
            $elapsed = $timer->paused_at->diffInSeconds($timer->started_at) - $timer->paused_total_seconds;
        } elseif ($timer->state === 'finished' || $timer->state === 'idle') {
            $elapsed = 0; // handle per business rule
        }

        // Calculate student-specific adjustments
        $studentAdjust = TimerAdjustment::where('exam_timer_id', $timer->id)
            ->where('student_id', $studentId)
            ->sum('seconds');

        $remaining = $timer->duration_seconds
            + $timer->global_adjust_seconds
            + $studentAdjust
            - $elapsed;

        return max(0, $remaining);
    }

    /**
     * Check if timer has finished for a student
     */
    public function hasFinished(ExamTimer $timer, ?int $studentId): bool
    {
        return $this->remainingFor($timer, $studentId, CarbonImmutable::now()) <= 0;
    }

    /**
     * Finish timer if time is up
     */
    public function finishIfTimeUp(ExamTimer $timer): ExamTimer
    {
        if ($timer->state === 'running' && $this->hasFinished($timer, null)) {
            return DB::transaction(function () use ($timer) {
                $timer = ExamTimer::whereKey($timer->id)->lockForUpdate()->first();

                $timer->update([
                    'state' => 'finished',
                    'version' => $timer->version + 1,
                    'updated_by' => Auth::id(),
                ]);

                TimerSynced::dispatch($timer->fresh());

                // Automatically broadcast server time for synchronization
                $this->broadcastServerTime();

                return $timer;
            });
        }

        return $timer;
    }

    /**
     * Get timer state with computed remaining time for a student
     */
    public function getTimerState(ExamTimer $timer, ?int $studentId = null): array
    {
        $remaining = $this->remainingFor($timer, $studentId, CarbonImmutable::now());

        // Get student-specific adjustments
        $studentAdjustments = 0;
        if ($studentId) {
            $studentAdjustments = TimerAdjustment::where('exam_timer_id', $timer->id)
                ->where('student_id', $studentId)
                ->sum('seconds');
        }

        return [
            'exam_id' => $timer->exam_id,
            'state' => $timer->state,
            'duration_seconds' => $timer->duration_seconds,
            'started_at' => optional($timer->started_at)->toIso8601String(),
            'paused_at' => optional($timer->paused_at)->toIso8601String(),
            'paused_total_seconds' => $timer->paused_total_seconds,
            'global_adjust_seconds' => $timer->global_adjust_seconds,
            'student_adjust_seconds' => $studentAdjustments,
            'remaining_seconds' => $remaining,
            'version' => $timer->version,
            'server_time' => now()->toIso8601String(),
        ];
    }
}
