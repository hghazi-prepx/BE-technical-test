# Exam Feature API Documentation

## Overview

The exam feature allows Trainees to create and manage exams, and assign Students to them. Students can view their assigned exams.

## Models

### Exam

- `id`: Primary key
- `name`: Exam name (unique)
- `startDate`: When the exam starts
- `period`: Duration in minutes (15, 30, 60, 90, or 120)
- `status`: Exam status (PENDING, IN_PROGRESS, COMPLETED, EXPIRED)
- `createdAt`: When the exam was created
- `createdBy`: Trainee ID who created the exam

### ExamAssignment

- `id`: Primary key
- `examId`: Reference to exam
- `studentId`: Reference to student
- Unique constraint on (examId, studentId)

## API Endpoints

### Trainee Endpoints

#### Create Exam

```
POST /exams
Authorization: Bearer <token>
Role: Trainee

Body:
{
  "name": "Math Final Exam",
  "startDate": "2024-01-15T10:00:00Z",
  "period": 60
}
```

#### Update Exam

```
PUT /exams/:id
Authorization: Bearer <token>
Role: Trainee

Body:
{
  "name": "Updated Math Final Exam",
  "startDate": "2024-01-16T10:00:00Z",
  "period": 90
}
```

_Note: Can only update if exam hasn't started_

#### Get My Exams

```
GET /exams
Authorization: Bearer <token>
Role: Trainee
```

#### Get All Exams

```
GET /exams/all
Authorization: Bearer <token>
Role: Trainee
```

#### Get Specific Exam

```
GET /exams/:id
Authorization: Bearer <token>
Role: Trainee
```

#### Assign Students to Exam

```
POST /exams/:id/assign-students
Authorization: Bearer <token>
Role: Trainee

Body:
{
  "studentIds": [1, 2, 3]
}
```

#### Get Exam Assignments

```
GET /exams/:id/assignments
Authorization: Bearer <token>
Role: Trainee
```

#### Remove Student from Exam

```
DELETE /exams/:examId/students/:studentId
Authorization: Bearer <token>
Role: Trainee
```

#### Delete Exam

```
DELETE /exams/:id
Authorization: Bearer <token>
Role: Trainee
```

_Note: Can only delete if exam hasn't started_

### Student Endpoints

#### Get My Exams

```
GET /exams/student/my-exams
Authorization: Bearer <token>
Role: Students
```

#### Get Specific Exam

```
GET /exams/:id
Authorization: Bearer <token>
Role: Students
```

## Business Rules

1. Only Trainees can create, update, and delete exams
2. Trainees can only update their own exams
3. Exams cannot be updated or deleted once they have started
4. Students can only be assigned to exams if they have the "Students" role
5. A student cannot be assigned to the same exam multiple times
6. Exam names must be unique
7. Start date must be in the future
8. Period must be one of: 15, 30, 60, 90, or 120 minutes

## Error Codes

- `27001`: Exam doesn't exist
- `27002`: Cannot modify exam that has started
- `27003`: Exam name already exists
- `27004`: Student doesn't exist or doesn't have Student role
- `27005`: Student already assigned to exam
- `27006`: Assignment doesn't exist
- `27007`: Start date must be in the future
