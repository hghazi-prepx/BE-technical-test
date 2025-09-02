# Exam Pause/Unpause Functionality

## Overview

The exam system now supports pausing and unpausing exams. When an exam is paused, the timer stops and the pause duration is tracked. When unpaused, the pause time is added to the total paused time, and the exam continues from where it left off.

## New Fields Added to Exam Model

- `pausedAt: Date` - Timestamp when the exam was paused (nullable)
- `totalPausedTime: number` - Total time the exam has been paused in milliseconds (default: 0)

## New Exam Status

- `Paused` - Exam is currently paused

## API Endpoints

### Pause Exam

```
POST /exams/:id/pause
```

- **Role Required**: Trainee
- **Description**: Pauses an exam that is currently in progress
- **Validation**:
  - Exam must exist and belong to the trainee
  - Exam must be in "InProgress" status
  - Exam cannot already be paused

### Unpause Exam

```
POST /exams/:id/unpause
```

- **Role Required**: Trainee
- **Description**: Unpauses an exam that is currently paused
- **Validation**:
  - Exam must exist and belong to the trainee
  - Exam must be in "Paused" status
- **Behavior**:
  - Calculates pause duration and adds to `totalPausedTime`
  - Sets `pausedAt` to null
  - Changes status back to "InProgress"

## Cron Job Updates

The cron job that runs every minute has been updated to handle paused exams:

1. **Exam Completion**: When calculating if an exam should be completed, the system now considers:

   - Original start time
   - Exam period (in minutes)
   - Total paused time (in milliseconds)

2. **Formula**: `endTime = startDate + (period * 60 * 1000) + totalPausedTime`

3. **Expiration**: Same logic applies for expired exams with grace period

## Example Usage

### Scenario 1: Simple Pause/Unpause

1. Exam starts at 10:00 AM with 60-minute duration
2. At 10:30 AM, exam is paused (30 minutes elapsed)
3. At 10:45 AM, exam is unpaused (15 minutes paused)
4. Exam will complete at 11:15 AM (original 10:00 AM + 60 minutes + 15 minutes pause)

### Scenario 2: Multiple Pauses

1. Exam starts at 10:00 AM with 60-minute duration
2. At 10:20 AM, exam is paused (20 minutes elapsed)
3. At 10:25 AM, exam is unpaused (5 minutes paused, totalPausedTime = 5 minutes)
4. At 10:40 AM, exam is paused again (15 minutes elapsed since unpause)
5. At 10:50 AM, exam is unpaused (10 minutes paused, totalPausedTime = 15 minutes)
6. Exam will complete at 11:15 AM (original 10:00 AM + 60 minutes + 15 minutes total pause)

## Database Migration

If you have existing exams in your database, you may need to add the new columns:

```sql
ALTER TABLE exams ADD COLUMN paused_at TIMESTAMP NULL;
ALTER TABLE exams ADD COLUMN total_paused_time BIGINT DEFAULT 0;
```

## Error Handling

The system includes proper error handling for:

- Attempting to pause an exam that's not in progress
- Attempting to pause an already paused exam
- Attempting to unpause an exam that's not paused
- Attempting to pause/unpause an exam that doesn't exist or doesn't belong to the user
