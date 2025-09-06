import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

/**
 * Enhanced Roles Guard
 * Supports hierarchical role-based access control:
 * - ADMIN: Has access to everything (absolute permissions)
 * - INSTRUCTOR: Can add students and manage exams
 * - STUDENT: Basic user permissions
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role: UserRole };
    if (!user) {
      return false;
    }

    // Admin has absolute permissions - can access everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user's role is in the required roles
    return requiredRoles.some((role) => user.role === role);
  }

  /**
   * Helper method to check if user has permission for specific role
   * @param userRole Current user's role
   * @param requiredRole Required role for the operation
   * @returns boolean indicating if user has permission
   */
  private hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    // Admin can do everything
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Instructor can do instructor and student operations
    if (
      userRole === UserRole.INSTRUCTOR &&
      (requiredRole === UserRole.INSTRUCTOR ||
        requiredRole === UserRole.STUDENT)
    ) {
      return true;
    }

    // Student can only do student operations
    if (userRole === UserRole.STUDENT && requiredRole === UserRole.STUDENT) {
      return true;
    }

    return false;
  }
}
