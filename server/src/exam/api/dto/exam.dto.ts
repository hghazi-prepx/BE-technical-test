import { GetByCriteria } from 'package/pagination/dto';

export interface CreateExamDto {
  name: string;
  startDate: Date;
  period: number;
  traineeId: number;
}

export interface UpdateExamDto {
  name?: string;
  startDate?: Date;
  period?: number;
}

export interface ExamResponseDto {
  id: number;
  name: string;
  startDate: Date;
  period: number;
  status: string;
  createdAt: Date;
  traineeId: number;
  trainee?: {
    id: number;
    username: string;
  };
}

export interface AssignStudentsDto {
  studentIds: number[];
}

export interface ExamAssignmentResponseDto {
  id: number;
  examId: number;
  studentId: number;
  exam?: ExamResponseDto;
  student?: {
    id: number;
    username: string;
  };
}

export interface GetAllExams extends GetByCriteria {
  search?: string;
}
