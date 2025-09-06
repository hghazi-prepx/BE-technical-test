import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  SwaggerCreateExam,
  SwaggerGetExam,
  SwaggerGetExams,
  SwaggerGetTimerState,
  SwaggerStartTimer,
  SwaggerPauseTimer,
  SwaggerResetTimer,
  SwaggerAdjustTimer,
  SwaggerAddStudent,
  SwaggerRemoveStudent,
  SwaggerGetStudentTimer,
  SwaggerDeleteExam,
} from '../swagger';
import { ExamService } from './exam.service';
import { CreateExamDto } from '../dto/create-exam.dto';
import { AdjustTimerDto } from '../dto/adjust-timer.dto';
import { TimerState } from '../interfaces/timer-state.interface';
import { ExamDocument } from '../schemas/exam.schema';
import { StudentTimerDocument } from '../schemas/student-timer.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExamAccessGuard } from '../auth/guards/exam-access.guard';
import { ExamOwnerGuard } from '../auth/guards/exam-owner.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../schemas/user.schema';

/**
 * Exam Controller
 * Handles exam management, timer controls, and student participation
 */
@ApiTags('Exam Management')
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  /**
   * Get all exams based on user role
   * Admin: Gets all exams in the system
   * Instructor: Gets only exams created by them
   * Student: Gets only exams they are participating in
   * @param req - Request object containing user information
   * @returns Array of exam objects based on user role
   */
  @SwaggerGetExams()
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllExams(@Request() req: { user: { sub: string; role: string } }) {
    return this.examService.getAllExamsByRole(
      req.user.sub,
      req.user.role as UserRole,
    );
  }

  /**
   * Create a new exam (Instructor only)
   * Creates a new exam with specified title, description, and duration
   * Only instructors can create exams
   * @param createExamDto - Exam creation data including title, description, duration
   * @returns Created exam object
   */
  @SwaggerCreateExam()
  @ApiBody({ type: CreateExamDto, description: 'Exam creation data' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard) // only instructors can create exams
  @Roles(UserRole.INSTRUCTOR)
  // @Public() // Temporarily public for testing - should be instructor-only in production
  async createExam(@Body(ValidationPipe) createExamDto: CreateExamDto) {
    return this.examService.createExam(createExamDto);
  }

  /**
   * Get exam details
   * Retrieves detailed information about a specific exam
   * Accessible to Admin, Instructor who created it, or Student participating in it
   * @param id - Exam ID
   * @returns Exam object with details
   */
  @SwaggerGetExam()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @Get(':id')
  @UseGuards(JwtAuthGuard, ExamAccessGuard)
  async getExam(@Param('id') id: string) {
    return this.examService.getExam(id);
  }

  /**
   * Get current timer state
   * Retrieves the current state of the exam timer
   * Accessible to Admin, Instructor who created it, or Student participating in it
   * @param id - Exam ID
   * @returns Current timer state including remaining time and status
   */
  @SwaggerGetTimerState()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @Get(':id/timer')
  @UseGuards(JwtAuthGuard, ExamAccessGuard)
  async getTimerState(@Param('id') id: string): Promise<TimerState> {
    return this.examService.getCurrentTimerState(id);
  }

  /**
   * Start exam timer (Instructor only)
   * Starts the countdown timer for the specified exam
   * Only instructors can start exam timers
   * @param id - Exam ID
   * @returns Updated exam object with started timer
   */
  @SwaggerStartTimer()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @Post(':id/timer/start')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async startTimer(@Param('id') id: string): Promise<ExamDocument> {
    return this.examService.startTimer(id);
  }

  /**
   * Pause exam timer (Instructor only)
   * Pauses the countdown timer for the specified exam
   * Only instructors can pause exam timers
   * @param id - Exam ID
   * @returns Updated exam object with paused timer
   */
  @SwaggerPauseTimer()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @Post(':id/timer/pause')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async pauseTimer(@Param('id') id: string): Promise<ExamDocument> {
    return this.examService.pauseTimer(id);
  }

  /**
   * Reset exam timer (Instructor only)
   * Resets the timer back to the original exam duration
   * Only instructors can reset exam timers
   * @param id - Exam ID
   * @returns Updated exam object with reset timer
   */
  @SwaggerResetTimer()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @Post(':id/timer/reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async resetTimer(@Param('id') id: string): Promise<ExamDocument> {
    return this.examService.resetTimer(id);
  }

  /**
   * Adjust exam timer (Instructor only)
   * Adds or subtracts time from the exam timer
   * Can be applied to all students or specific students
   * Only instructors can adjust exam timers
   * @param id - Exam ID
   * @param adjustTimerDto - Timer adjustment data including time change and target students
   * @returns Updated exam object with adjusted timer
   */
  @SwaggerAdjustTimer()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiBody({ type: AdjustTimerDto, description: 'Timer adjustment data' })
  @Put(':id/timer/adjust')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async adjustTimer(
    @Param('id') id: string,
    @Body(ValidationPipe) adjustTimerDto: AdjustTimerDto,
  ): Promise<ExamDocument> {
    return this.examService.adjustTimer(id, adjustTimerDto);
  }

  /**
   * Add student to exam
   * Adds a student to participate in a specific exam
   * Creates individual timer tracking for the student
   * Only Admin or Instructor who created the exam can add students
   * @param examId - Exam ID
   * @param studentId - Student ID to add
   * @returns Success message with student timer details
   */
  @SwaggerAddStudent()
  @Post(':id/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ExamOwnerGuard)
  async addStudent(
    @Param('id') examId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.examService.addStudentToExam(examId, studentId);
  }

  /**
   * Remove student from exam
   * Disconnects a student from the specified exam
   * Marks the student timer as inactive
   * Only Admin or Instructor who created the exam can remove students
   * @param examId - Exam ID
   * @param studentId - Student ID to remove
   * @returns Success message
   */
  @SwaggerRemoveStudent()
  @Post(':id/students/:studentId/disconnect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ExamOwnerGuard)
  async removeStudent(
    @Param('id') examId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.examService.removeStudentFromExam(examId, studentId);
  }

  /**
   * Get student-specific timer
   * Retrieves the timer information for a specific student in an exam
   * Includes any individual time adjustments made for that student
   * Accessible to Admin, Instructor who created the exam, or the Student themselves
   * @param examId - Exam ID
   * @param studentId - Student ID
   * @returns Student timer object with remaining time and adjustments
   */
  @SwaggerGetStudentTimer()
  @Get(':id/students/:studentId/timer')
  @UseGuards(JwtAuthGuard, ExamAccessGuard)
  async getStudentTimer(
    @Param('id') examId: string,
    @Param('studentId') studentId: string,
  ): Promise<StudentTimerDocument> {
    return this.examService.getStudentTimer(examId, studentId);
  }

  /**
   * Delete exam
   * Permanently deletes an exam and all associated student timers
   * Only Admin or Instructor who created the exam can delete it
   * @param examId - Exam ID to delete
   * @returns Success message
   */
  @SwaggerDeleteExam()
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, ExamOwnerGuard)
  async deleteExam(@Param('id') examId: string): Promise<void> {
    return this.examService.deleteExam(examId);
  }
}
