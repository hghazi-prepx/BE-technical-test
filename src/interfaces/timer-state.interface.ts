export interface TimerState {
  examId: string;
  status: 'stopped' | 'running' | 'paused' | 'completed';
  remainingTime: number;
  duration: number;
  startedAt?: Date | null;
  pausedAt?: Date | null;
  completedAt?: Date | null;
  isActive: boolean;
}

export interface StudentTimerState extends TimerState {
  studentId: string;
  examTitle: string;
}

export interface ExamTimerResponse {
  success: boolean;
  data: TimerState;
  message?: string;
}
