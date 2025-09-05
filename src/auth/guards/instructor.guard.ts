import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../schemas/user.schema';

/**
 * Instructor Guard
 * Allows access only to users with INSTRUCTOR role
 * Instructors can add students and manage exams
 */
@Injectable()
export class InstructorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role: UserRole };

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== UserRole.INSTRUCTOR) {
      throw new ForbiddenException('Instructor access required');
    }

    return true;
  }
}
