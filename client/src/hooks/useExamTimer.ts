import { useState, useEffect, useCallback } from "react";
import { Exam, ExamStatus } from "../types";

interface UseExamTimerProps {
	exam: Exam;
	onTimeUp?: () => void;
	onStatusChange?: (status: ExamStatus) => void;
}

export const useExamTimer = ({ exam, onTimeUp, onStatusChange }: UseExamTimerProps) => {
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [elapsedTime, setElapsedTime] = useState<number>(0);

	// Calculate initial time left
	useEffect(() => {
		if (exam) {
			const now = new Date().getTime();
			const startTime = new Date(exam.startDate).getTime();
			const periodMs = exam.period * 60 * 1000; // Convert minutes to milliseconds
			const totalPausedTimeMs = exam.totalPausedTime || 0; // totalPausedTime is already in milliseconds

			// Calculate elapsed time considering pauses
			let elapsed = 0;
			if (exam.status === ExamStatus.InProgress) {
				elapsed = now - startTime - totalPausedTimeMs;
			} else if (exam.status === ExamStatus.Paused && exam.pausedAt) {
				const pauseTime = new Date(exam.pausedAt).getTime();
				elapsed = pauseTime - startTime - totalPausedTimeMs;
			}

			const remaining = Math.max(0, periodMs - elapsed);
			setTimeLeft(remaining);
			setElapsedTime(elapsed);
			setIsRunning(exam.status === ExamStatus.InProgress);

			console.log("Timer calculation:", {
				now: new Date(now).toISOString(),
				startTime: new Date(startTime).toISOString(),
				periodMs,
				totalPausedTimeMs,
				elapsed,
				remaining,
				examStatus: exam.status,
				examPeriod: exam.period,
				examTotalPausedTime: exam.totalPausedTime,
			});
		}
	}, [exam]);

	// Timer effect
	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (isRunning && timeLeft > 0) {
			interval = setInterval(() => {
				setTimeLeft((prev) => {
					const newTime = prev - 1000;
					if (newTime <= 0) {
						setIsRunning(false);
						onTimeUp?.();
						return 0;
					}
					return newTime;
				});
			}, 1000);
		}

		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [isRunning, timeLeft, onTimeUp]);

	// Update running state when exam status changes
	useEffect(() => {
		setIsRunning(exam.status === ExamStatus.InProgress);
		onStatusChange?.(exam.status);
	}, [exam.status, onStatusChange]);

	const formatTime = useCallback((ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
		}
		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}, []);

	const getProgressPercentage = useCallback((): number => {
		if (!exam) return 0;
		const totalTime = exam.period * 60 * 1000; // Convert minutes to milliseconds
		return Math.min(100, (elapsedTime / totalTime) * 100);
	}, [exam, elapsedTime]);

	return {
		timeLeft,
		isRunning,
		elapsedTime,
		formatTime,
		getProgressPercentage,
		status: exam.status,
	};
};
