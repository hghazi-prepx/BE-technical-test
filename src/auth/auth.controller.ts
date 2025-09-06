import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import {
  // SwaggerRegisterUser,
  SwaggerLoginUser,
  SwaggerGetProfile,
  SwaggerChangePassword,
  SwaggerGetAllUsers,
  SwaggerToggleUserStatus,
  SwaggerDeleteUser,
  SwaggerRegisterInstructor,
  SwaggerRegisterStudent,
} from '../swagger';
import { AuthService } from './auth.service';
import {
  // RegisterDto,
  LoginDto,
  ChangePasswordDto,
  RegisterInstructorDto,
  RegisterStudentDto,
} from '../dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminOrInstructorGuard } from './guards/admin-or-instructor.guard';
import { UserRole } from '../schemas/user.schema';
import { Public } from './decorators/public.decorator';

/**
 * Authentication Controller
 * Handles user authentication, registration, and user management operations
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login
   * Authenticates user credentials and returns JWT token
   * @param loginDto - Login credentials (email and password)
   * @returns User object with JWT access token
   */
  @Public()
  @SwaggerLoginUser()
  @ApiBody({ type: LoginDto, description: 'User login credentials' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Get user profile
   * Retrieves the authenticated user's profile information
   * Requires valid JWT token in Authorization header
   * @param req - Request object containing authenticated user data
   * @returns User profile information
   */
  @SwaggerGetProfile()
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: { user: { sub: string } }) {
    return this.authService.getUserProfile(req.user.sub);
  }

  /**
   * Change user password
   * Allows authenticated users to change their password
   * Requires current password verification
   * @param req - Request object containing authenticated user data
   * @param changePasswordDto - Password change data (current and new password)
   * @returns Success message
   */
  @SwaggerChangePassword()
  @ApiBody({ type: ChangePasswordDto, description: 'Password change data' })
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: { user: { sub: string } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }

  /**
   * Get all users (Admin and Instructor only)
   * Retrieves a list of all users in the system
   * Can be filtered by user role (student/instructor/admin)
   * @param role - Optional role filter
   * @returns Array of user objects
   */
  @ApiTags('User Management')
  @SwaggerGetAllUsers()
  @Get('users')
  @UseGuards(JwtAuthGuard, AdminOrInstructorGuard)
  async getAllUsers(@Query('role') role?: UserRole, @Request() req?: any) {
    return this.authService.getAllUsers(role, req?.user);
  }

  /**
   * Toggle user status (Admin and Instructor only)
   * Activates or deactivates a user account
   * Admins and instructors can perform this action
   * @param userId - ID of the user to toggle status
   * @returns Updated user object
   */
  @ApiTags('User Management')
  @SwaggerToggleUserStatus()
  @Put('users/:id/toggle-status')
  @UseGuards(JwtAuthGuard, AdminOrInstructorGuard)
  async toggleUserStatus(@Param('id') userId: string) {
    return this.authService.toggleUserStatus(userId);
  }

  /**
   * Delete user (Admin only)
   * Permanently removes a user from the system
   * Only admins can perform this critical action
   * @param userId - ID of the user to delete
   * @returns Success message
   */
  @ApiTags('User Management')
  @SwaggerDeleteUser()
  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteUser(@Param('id') userId: string) {
    return this.authService.deleteUser(userId);
  }

  /**
   * Register new instructor (Admin only)
   * Creates a new instructor account
   * Only admins can register new instructors
   * @param registerInstructorDto - Instructor registration data
   * @returns Created instructor object with JWT token
   */
  @ApiTags('User Management')
  @SwaggerRegisterInstructor()
  @ApiBody({
    type: RegisterInstructorDto,
    description: 'Instructor registration data',
  })
  @Post('register-instructor')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async registerInstructor(
    @Body() registerInstructorDto: RegisterInstructorDto,
  ) {
    const instructorData = {
      ...registerInstructorDto,
      role: UserRole.INSTRUCTOR,
    };
    return this.authService.register(instructorData);
  }

  /**
   * Register new student (Admin and Instructor only)
   * Creates a new student account
   * Admins and instructors can register new students
   * @param registerStudentDto - Student registration data
   * @returns Created student object with JWT token
   */
  @ApiTags('User Management')
  @SwaggerRegisterStudent()
  @ApiBody({
    type: RegisterStudentDto,
    description: 'Student registration data',
  })
  @Post('register-student')
  @UseGuards(JwtAuthGuard, AdminOrInstructorGuard)
  async registerStudent(@Body() registerStudentDto: RegisterStudentDto) {
    const studentData = { ...registerStudentDto, role: UserRole.STUDENT };
    return this.authService.register(studentData);
  }
}
