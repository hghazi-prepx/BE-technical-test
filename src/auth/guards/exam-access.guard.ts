import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exam, ExamDocument } from '../../schemas/exam.schema';
import {
  StudentTimer,
  StudentTimerDocument,
} from '../../schemas/student-timer.schema';
import { UserRole } from '../../schemas/user.schema';

/**
 * Guard to check if user has access to exam
 * - Admin: Can access any exam
 * - Instructor: Can access exams they created
 * - Student: Can access exams they are participating in
 */
@Injectable()
export class ExamAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(StudentTimer.name)
    private studentTimerModel: Model<StudentTimerDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string; role: UserRole };
    const examId = request.params.id || request.params.examId;

    if (!user || !examId) {
      return false;
    }

    // Admin can access any exam
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Find the exam
    const exam = await this.examModel.findById(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Instructor can access exams they created
    if (user.role === UserRole.INSTRUCTOR && exam.instructorId === user.sub) {
      return true;
    }

    // Student can access exams they are participating in
    if (user.role === UserRole.STUDENT) {
      const studentTimer = await this.studentTimerModel.findOne({
        examId: examId,
        studentId: user.sub,
        isActive: true,
      });
      if (studentTimer) {
        return true;
      }
    }

    throw new ForbiddenException(
      'You do not have permission to access this exam',
    );
  }
}
