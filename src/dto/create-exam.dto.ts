import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({
    description: 'Exam title',
    example: 'Mathematics Final Exam',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Exam description',
    example: 'Final exam for Math 101 covering all semester topics',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Exam duration in minutes',
    example: 120,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number; // Duration in minutes

  @ApiProperty({
    description: 'Instructor ID who creates the exam',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  instructorId: string;
}
