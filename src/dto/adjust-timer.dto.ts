import { IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustTimerDto {
  @ApiProperty({
    description: 'Time to add or subtract in seconds (can be negative)',
    example: 300,
    type: 'number',
  })
  @IsNumber()
  timeAdjustment: number; // Time to add/subtract in seconds (can be negative)

  @ApiPropertyOptional({
    description:
      'Array of student IDs to adjust time for (if not provided, adjusts for all students)',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[]; // If provided, adjust time for specific students only
}

export class TimerControlDto {
  @ApiProperty({
    description: 'Timer control action',
    enum: ['start', 'pause', 'reset'],
    example: 'start',
  })
  @IsString()
  action: 'start' | 'pause' | 'reset';
}
