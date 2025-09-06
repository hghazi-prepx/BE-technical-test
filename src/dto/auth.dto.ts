import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

// Base DTO for common user fields
export class BaseUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;
}

// DTO for registering instructors (only admin can use)
export class RegisterInstructorDto extends BaseUserDto {}

// DTO for registering students (admin and instructors can use)
export class RegisterStudentDto extends BaseUserDto {}

// Legacy DTO - kept for backward compatibility but deprecated
/**
 * @deprecated Use RegisterInstructorDto or RegisterStudentDto instead
 */
export class RegisterDto extends BaseUserDto {
  @ApiPropertyOptional({
    description: 'User role (deprecated - role is determined by endpoint)',
    enum: UserRole,
    example: UserRole.STUDENT,
    default: UserRole.STUDENT,
    deprecated: true,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.STUDENT;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      email: { type: 'string', example: 'user@example.com' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      fullName: { type: 'string', example: 'John Doe' },
      role: {
        type: 'string',
        enum: Object.values(UserRole),
        example: UserRole.STUDENT,
      },
      isActive: { type: 'boolean', example: true },
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
  };

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiPropertyOptional({
    description: 'JWT refresh token (optional)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current user password',
    example: 'oldpassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
