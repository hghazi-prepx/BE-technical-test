export enum ExamStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Paused = 'Paused',
  Completed = 'Completed',
  Expired = 'Expired',
}

export enum ExamPeriod {
  MIN_15 = 15,
  MIN_30 = 30,
  MIN_60 = 60,
  MIN_90 = 90,
  MIN_120 = 120,
}

export enum ExamEvents {
  ExamUpdated = 'ExamUpdated',
}
