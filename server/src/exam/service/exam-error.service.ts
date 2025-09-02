import { Injectable } from '@nestjs/common';
import { Error } from 'package/utils/Error/error';
import { errorCode } from 'package/utils/Error/error-codes';

@Injectable()
export class ExamError {
  notFoundError: Error = {
    message: 'Exam not found',
    code: errorCode.notFoundExam,
  };

  examAlreadyStartedError: Error = {
    message: 'Cannot update exam that has already started',
    code: errorCode.examAlreadyStarted,
  };

  examNameAlreadyExistsError: Error = {
    message: 'Exam with this name already exists',
    code: errorCode.examNameAlreadyExists,
  };

  studentNotFoundError: Error = {
    message: 'Student not found',
    code: errorCode.notFoundExamStudent,
  };

  assignmentAlreadyExistsError: Error = {
    message: 'Student is already assigned to this exam',
    code: errorCode.examAssignmentAlreadyExists,
  };

  assignmentNotFoundError: Error = {
    message: 'Exam assignment not found',
    code: errorCode.notFoundExamAssignment,
  };

  invalidStartDateError: Error = {
    message: 'Start date must be in the future',
    code: errorCode.invalidExamStartDate,
  };

  examNotInProgressError: Error = {
    message: 'Exam is not in progress',
    code: errorCode.examNotInProgress,
  };

  notFound() {
    return this.notFoundError;
  }

  examAlreadyStarted() {
    return this.examAlreadyStartedError;
  }

  examNameAlreadyExists() {
    return this.examNameAlreadyExistsError;
  }

  studentNotFound() {
    return this.studentNotFoundError;
  }

  assignmentAlreadyExists() {
    return this.assignmentAlreadyExistsError;
  }

  assignmentNotFound() {
    return this.assignmentNotFoundError;
  }

  invalidStartDate() {
    return this.invalidStartDateError;
  }

  examNotInProgress() {
    return this.examNotInProgressError;
  }
}
