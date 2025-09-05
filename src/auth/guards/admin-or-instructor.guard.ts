import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../schemas/user.schema';

/**
 * Admin or Instructor Guard
 * Allows access to users with ADMIN or INSTRUCTOR roles
 * Used for operations that both admins and instructors can perform
 * (e.g., adding students, managing exams)
 */
@Injectable()
export class AdminOrInstructorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role: UserRole };

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const allowedRoles = [UserRole.ADMIN, UserRole.INSTRUCTOR];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Admin or Instructor access required');
    }

    return true;
  }
}
