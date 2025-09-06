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
import { UserRole } from '../../schemas/user.schema';

/**
 * Guard to check if user owns the exam (Admin or Instructor who created it)
 * Used for operations that require ownership like adding/removing students
 */
@Injectable()
export class ExamOwnerGuard implements CanActivate {
  constructor(@InjectModel(Exam.name) private examModel: Model<ExamDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string; role: UserRole };
    const examId = request.params.id || request.params.examId;

    if (!user || !examId) {
      return false;
    }

    // Admin can manage any exam
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Find the exam
    const exam = await this.examModel.findById(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Instructor can only manage exams they created
    if (user.role === UserRole.INSTRUCTOR && exam.instructorId === user.sub) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to manage this exam',
    );
  }
}
