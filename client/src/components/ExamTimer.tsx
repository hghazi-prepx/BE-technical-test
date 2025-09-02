import React from 'react';
import { useExamTimer } from '../hooks/useExamTimer';
import { Exam, ExamStatus } from '../types';

interface ExamTimerProps {
  exam: Exam;
  onPause?: () => void;
  onUnpause?: () => void;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ exam, onPause, onUnpause }) => {
  const { timeLeft, isRunning, formatTime, getProgressPercentage, status } =
    useExamTimer({ exam });

  const getTimerColor = () => {
    const percentage = getProgressPercentage();
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage > 80) return 'bg-red-600';
    if (percentage > 60) return 'bg-orange-600';
    return 'bg-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{exam.name}</h2>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === ExamStatus.InProgress
              ? 'bg-green-100 text-green-800'
              : status === ExamStatus.Paused
              ? 'bg-orange-100 text-orange-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Time Remaining
          </span>
          <span className={`text-2xl font-bold ${getTimerColor()}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>{Math.round(getProgressPercentage())}%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-2 font-medium">{exam.period} minutes</span>
        </div>
        <div>
          <span className="text-gray-500">Start Time:</span>
          <span className="ml-2 font-medium">
            {new Date(exam.startDate).toLocaleString()}
          </span>
        </div>
      </div>

      {status === ExamStatus.InProgress && (
        <div className="mt-6">
          <button
            onClick={onPause}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
          >
            Pause Exam
          </button>
        </div>
      )}

      {status === ExamStatus.Paused && (
        <div className="mt-6">
          <button
            onClick={onUnpause}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Resume Exam
          </button>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-center font-medium">
            Time's up! The exam has ended.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamTimer;

