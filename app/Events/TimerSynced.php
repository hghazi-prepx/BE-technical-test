<?php

namespace App\Events;

use App\Models\ExamTimer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TimerSynced implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public ExamTimer $timer,
        public ?int $studentId = null,
        public ?int $deltaSeconds = null,
        public ?string $action = null,
        public $studentTimerState = null,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('exams.'.$this->timer->exam_id.'.timer')];

        if ($this->studentId) {
            $channels[] = new PrivateChannel('exams.'.$this->timer->exam_id.'.students.'.$this->studentId.'.timer');
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'TimerSynced';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        $data = [
            'exam_id' => $this->timer->exam_id,
            'state' => $this->timer->state,
            'duration_seconds' => $this->timer->duration_seconds,
            'started_at' => optional($this->timer->started_at)->toIso8601String(),
            'paused_at' => optional($this->timer->paused_at)->toIso8601String(),
            'paused_total_seconds' => $this->timer->paused_total_seconds,
            'global_adjust_seconds' => $this->timer->global_adjust_seconds,
            'version' => $this->timer->version,
            'delta_seconds' => $this->deltaSeconds,
            'target_student_id' => $this->studentId,
            'action' => $this->action,
            'server_time' => now()->toIso8601String(),
        ];

        // Add student-specific timer state if available
        if ($this->studentTimerState) {
            $data['student_timer_state'] = [
                'state' => $this->studentTimerState->state,
                'started_at' => optional($this->studentTimerState->started_at)->toIso8601String(),
                'paused_at' => optional($this->studentTimerState->paused_at)->toIso8601String(),
                'paused_total_seconds' => $this->studentTimerState->paused_total_seconds,
                'student_adjust_seconds' => $this->studentTimerState->student_adjust_seconds,
                'version' => $this->studentTimerState->version,
            ];
        }

        return $data;
    }
}
