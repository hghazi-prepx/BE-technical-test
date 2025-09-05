/**
 * Swagger Decorators
 * Centralized Swagger decorators for API documentation
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Auth Decorators
export const SwaggerRegisterUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register new user (Deprecated)',
      description:
        'Creates a new user account with the provided credentials and returns JWT token. This endpoint is deprecated, use role-specific registration endpoints instead.',
    }),
    ApiCreatedResponse({
      description: 'User successfully registered',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: {
                type: 'string',
                enum: ['student', 'instructor', 'admin'],
              },
            },
          },
          access_token: { type: 'string' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid registration data or email already exists',
    }),
  );

export const SwaggerLoginUser = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User login',
      description:
        'Authenticates user with email and password, returns JWT token',
    }),
    ApiOkResponse({
      description: 'User successfully authenticated',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: {
                type: 'string',
                enum: ['student', 'instructor', 'admin'],
              },
            },
          },
          access_token: { type: 'string' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid credentials' }),
    ApiUnauthorizedResponse({ description: 'Authentication failed' }),
  );

export const SwaggerChangePassword = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Change user password',
      description: 'Allows authenticated user to change their password',
    }),
    ApiOkResponse({
      description: 'Password successfully changed',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Password changed successfully' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid current password or validation failed',
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
  );

export const SwaggerGetProfile = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get user profile',
      description: "Retrieves the authenticated user's profile information",
    }),
    ApiOkResponse({
      description: 'User profile retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
  );

// Exam Decorators
export const SwaggerCreateExam = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Create new exam',
      description:
        'Creates a new exam with specified details (Instructor only)',
    }),
    ApiCreatedResponse({
      description: 'Exam created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          duration: { type: 'number' },
          instructorId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid exam data' }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Instructor role required' }),
  );

export const SwaggerGetExam = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get exam details',
      description:
        'Retrieves detailed information about a specific exam (Admin, Instructor who created it, or Student participating in it)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Exam details retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          duration: { type: 'number' },
          instructorId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({
      description: 'Access denied - insufficient permissions',
    }),
    ApiNotFoundResponse({ description: 'Exam not found' }),
  );

export const SwaggerGetExams = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get exams based on user role',
      description:
        'Retrieves exams based on user role: Admin gets all exams, Instructor gets their created exams, Student gets exams they participate in',
    }),
    ApiOkResponse({
      description: 'Exams list retrieved successfully based on user role',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'number' },
            instructorId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
  );

// Timer Control Decorators
export const SwaggerAdjustTimer = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Adjust exam timer',
      description: 'Adjusts the timer for a specific exam (Instructor only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Timer adjusted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          newDuration: { type: 'number' },
          examId: { type: 'string' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid timer adjustment data' }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Instructor role required' }),
    ApiNotFoundResponse({ description: 'Exam not found' }),
  );

export const SwaggerControlTimer = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Control exam timer',
      description: 'Start, pause, or stop the exam timer (Instructor only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Timer control action executed successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          action: { type: 'string', enum: ['start', 'pause', 'stop'] },
          examId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid timer control action' }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Instructor role required' }),
    ApiNotFoundResponse({ description: 'Exam not found' }),
  );

// User Management Decorators
export const SwaggerGetAllUsers = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get all users',
      description:
        'Retrieves a list of all users in the system with optional role filtering (Admin and Instructor only)',
    }),
    ApiQuery({
      name: 'role',
      required: false,
      enum: ['student', 'instructor', 'admin'],
      description: 'Filter users by role',
    }),
    ApiOkResponse({
      description: 'Users retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description:
        'Insufficient permissions - Admin or Instructor role required',
    }),
  );

export const SwaggerToggleUserStatus = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Toggle user status',
      description:
        'Activates or deactivates a user account (Admin and Instructor only)',
    }),
    ApiParam({ name: 'id', description: 'User ID to toggle status' }),
    ApiOkResponse({
      description: 'User status toggled successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
          isActive: { type: 'boolean' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description:
        'Insufficient permissions - Admin or Instructor role required',
    }),
    ApiBadRequestResponse({ description: 'User not found' }),
  );

export const SwaggerDeleteUser = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete user',
      description: 'Permanently removes a user from the system (Admin only)',
    }),
    ApiParam({ name: 'id', description: 'User ID to delete' }),
    ApiOkResponse({
      description: 'User deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User deleted successfully' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions - Admin role required',
    }),
    ApiBadRequestResponse({
      description: 'User not found or cannot delete yourself',
    }),
  );

export const SwaggerRegisterInstructor = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Register new instructor',
      description: 'Creates a new instructor account (Admin only)',
    }),
    ApiCreatedResponse({
      description: 'Instructor registered successfully',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: { type: 'string', example: 'instructor' },
            },
          },
          access_token: { type: 'string' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions - Admin role required',
    }),
    ApiBadRequestResponse({
      description: 'Invalid registration data or email already exists',
    }),
  );

export const SwaggerRegisterStudent = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Register new student',
      description: 'Creates a new student account (Admin and Instructor only)',
    }),
    ApiCreatedResponse({
      description: 'Student registered successfully',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              role: { type: 'string', example: 'student' },
            },
          },
          access_token: { type: 'string' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description:
        'Insufficient permissions - Admin or Instructor role required',
    }),
    ApiBadRequestResponse({
      description: 'Invalid registration data or email already exists',
    }),
  );

// Health Check Decorators
export const SwaggerHealthCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Health check',
      description: 'Returns the current health status of the application',
    }),
    ApiOkResponse({
      description: 'Application is healthy',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
        },
      },
    }),
    ApiInternalServerErrorResponse({ description: 'Application is unhealthy' }),
  );

// Additional Exam Management Decorators
export const SwaggerUpdateExam = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Update exam',
      description:
        'Updates an existing exam with new details (Instructor only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Exam updated successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          duration: { type: 'number' },
          instructorId: { type: 'string' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid exam data' }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Instructor role required' }),
    ApiNotFoundResponse({ description: 'Exam not found' }),
  );

export const SwaggerDeleteExam = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete exam',
      description:
        'Permanently deletes an exam and all associated student timers (Admin or Instructor who created the exam only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Exam deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Exam deleted successfully' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({
      description: 'Access denied - only admin or exam creator can delete exam',
    }),
    ApiNotFoundResponse({ description: 'Exam not found' }),
  );

// Timer State Decorators
export const SwaggerGetTimerState = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get timer state',
      description:
        'Retrieves the current timer state for a specific exam (Admin, Instructor who created it, or Student participating in it)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Timer state retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'active', 'paused', 'completed'],
          },
          remainingTime: {
            type: 'number',
            description: 'Remaining time in seconds',
          },
          totalDuration: {
            type: 'number',
            description: 'Total duration in seconds',
          },
          startTime: { type: 'string', format: 'date-time', nullable: true },
          endTime: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({
      description: 'Access denied - insufficient permissions',
    }),
    ApiBadRequestResponse({ description: 'Exam not found' }),
  );

export const SwaggerStartTimer = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Start exam timer',
      description: 'Starts the timer for a specific exam (Instructor only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Timer started successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string', example: 'active' },
          startTime: { type: 'string', format: 'date-time' },
          duration: { type: 'number', description: 'Duration in minutes' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions - Instructor role required',
    }),
    ApiBadRequestResponse({
      description: 'Exam not found or timer already started',
    }),
  );

export const SwaggerPauseTimer = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Pause exam timer',
      description: 'Pauses the timer for a specific exam (Instructor only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Timer paused successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string', example: 'paused' },
          pausedAt: { type: 'string', format: 'date-time' },
          remainingTime: {
            type: 'number',
            description: 'Remaining time in seconds',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions - Instructor role required',
    }),
    ApiBadRequestResponse({
      description: 'Exam not found or timer not active',
    }),
  );

export const SwaggerResetTimer = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Reset exam timer',
      description:
        'Resets the timer for a specific exam to its initial state (Instructor only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Timer reset successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string', example: 'pending' },
          startTime: { type: 'string', nullable: true },
          endTime: { type: 'string', nullable: true },
          duration: { type: 'number', description: 'Duration in minutes' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions - Instructor role required',
    }),
    ApiBadRequestResponse({ description: 'Exam not found' }),
  );

// Student Participation Decorators
export const SwaggerAddStudent = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Add student to exam',
      description:
        'Adds a student to participate in a specific exam and creates individual timer tracking (Admin or Instructor who created the exam only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiParam({
      name: 'studentId',
      description: 'Student ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Student added to exam successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Student added to exam successfully',
          },
          studentTimer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              examId: { type: 'string' },
              studentId: { type: 'string' },
              joinedAt: { type: 'string', format: 'date-time' },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({
      description:
        'Access denied - only admin or exam creator can add students',
    }),
    ApiBadRequestResponse({
      description: 'Exam not found or student already participating',
    }),
  );

export const SwaggerRemoveStudent = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Remove student from exam',
      description:
        'Removes a student from exam participation and marks timer as disconnected (Admin or Instructor who created the exam only)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiParam({
      name: 'studentId',
      description: 'Student ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Student removed from exam successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Student removed from exam successfully',
          },
          disconnectedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({
      description:
        'Access denied - only admin or exam creator can remove students',
    }),
    ApiBadRequestResponse({
      description: 'Exam not found or student not participating',
    }),
  );

export const SwaggerGetStudentTimer = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get student timer',
      description:
        'Retrieves the timer information for a specific student in an exam (Admin, Instructor who created it, or Student participating in it)',
    }),
    ApiParam({
      name: 'id',
      description: 'Exam ID',
      type: 'string',
    }),
    ApiParam({
      name: 'studentId',
      description: 'Student ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Student timer retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          examId: { type: 'string' },
          studentId: { type: 'string' },
          joinedAt: { type: 'string', format: 'date-time' },
          disconnectedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          isActive: { type: 'boolean' },
          remainingTime: {
            type: 'number',
            description: 'Student remaining time in seconds',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({
      description: 'Access denied - insufficient permissions',
    }),
    ApiBadRequestResponse({
      description: 'Exam not found or student not participating',
    }),
  );
