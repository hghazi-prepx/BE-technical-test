import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfigService } from '../config/app.config';
import { Exam, ExamDocument } from '../schemas/exam.schema';
import {
  StudentTimer,
  StudentTimerDocument,
} from '../schemas/student-timer.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { CreateExamDto } from '../dto/create-exam.dto';
import { AdjustTimerDto } from '../dto/adjust-timer.dto';
import { TimerState } from '../interfaces/timer-state.interface';

/**
 * Exam Service
 * Handles all exam-related operations including creation, timer management,
 * student participation, and exam lifecycle management
 */
@Injectable()
export class ExamService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(StudentTimer.name)
    private studentTimerModel: Model<StudentTimerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private appConfig: AppConfigService,
  ) {}

  /**
   * Creates a new exam with the provided details
   * Converts duration from minutes to seconds and initializes timer state
   * @param createExamDto - Exam creation data transfer object
   * @returns Promise resolving to the created exam document
   */
  async createExam(createExamDto: CreateExamDto): Promise<ExamDocument> {
    // Convert duration from minutes to seconds
    const durationInMinutes =
      createExamDto.duration || this.appConfig.defaultExamDuration / 60;
    const durationInSeconds = durationInMinutes * 60;

    const exam = new this.examModel({
      ...createExamDto,
      duration: durationInSeconds,
      remainingTime: durationInSeconds,
    });
    return exam.save();
  }

  /**
   * Internal helper method to retrieve and validate exam document
   * Throws NotFoundException if exam doesn't exist
   * @param examId - The exam ID to retrieve
   * @returns Promise resolving to the exam document
   * @throws NotFoundException when exam is not found
   */
  private async getExamDocument(examId: string): Promise<ExamDocument> {
    const exam = await this.examModel.findById(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    return exam;
  }

  /**
   * Retrieves a specific exam with populated connected students information
   * Returns exam data with student details (excluding passwords)
   * @param examId - The exam ID to retrieve
   * @returns Promise resolving to exam object with populated student data
   * @throws NotFoundException when exam is not found
   */
  async getExam(examId: string): Promise<any> {
    const exam = await this.getExamDocument(examId);

    // Get connected students information
    const connectedStudentsInfo = await this.userModel
      .find({ _id: { $in: exam.connectedStudents } })
      .select('-password')
      .exec();

    // Return exam with populated connected students
    return {
      ...exam.toObject(),
      connectedStudents: connectedStudentsInfo,
    };
  }

  /**
   * Retrieves exams based on user role and permissions
   * Admin: Gets all exams, Instructor: Gets created exams, Student: Gets participating exams
   * @param userId - The user ID requesting the exams
   * @param userRole - The role of the requesting user
   * @returns Promise resolving to array of exam documents based on user role
   * @throws BadRequestException for invalid user roles
   */
  async getAllExamsByRole(
    userId: string,
    userRole: UserRole,
  ): Promise<ExamDocument[]> {
    switch (userRole) {
      case UserRole.ADMIN:
        // Admin gets all exams
        return this.examModel.find().exec();
      case UserRole.INSTRUCTOR:
        // Instructor gets only exams they created
        return this.examModel.find({ instructorId: userId }).exec();
      case UserRole.STUDENT: {
        // Student gets only exams they are participating in (connected to)
        return this.examModel.find({ connectedStudents: userId }).exec();
      }
      default:
        throw new BadRequestException('Invalid user role');
    }
  }

  /**
   * Starts the exam timer and updates exam status to running
   * Handles both initial start and resume from pause scenarios
   * Resets completed exams and all associated student timers
   * @param examId - The exam ID to start the timer for
   * @returns Promise resolving to the updated exam document
   * @throws BadRequestException when timer is already running
   * @throws NotFoundException when exam is not found
   */
  async startTimer(examId: string): Promise<ExamDocument> {
    const exam = await this.getExamDocument(examId);

    if (exam.status === 'running') {
      throw new BadRequestException('Timer is already running');
    }

    // Allow restarting completed exams
    if (exam.status === 'completed') {
      // Reset the exam when restarting a completed exam
      exam.remainingTime = exam.duration;
      exam.completedAt = null;

      // Reset all student timers
      await this.studentTimerModel.updateMany(
        { examId },
        {
          timeAdjustment: 0,
          remainingTime: exam.duration,
          status: 'active',
          lastSyncAt: new Date(),
        },
      );
    }

    // Only set startedAt if this is the first start (not resuming from pause)
    if (!exam.startedAt || exam.status === 'completed') {
      exam.startedAt = new Date();
    } else if (exam.pausedAt) {
      // If resuming from pause, set startedAt to current time
      // since remainingTime was already updated in pauseTimer
      exam.startedAt = new Date();
    }

    exam.status = 'running';

    exam.pausedAt = null;

    return exam.save();
  }

  /**
   * Pauses the exam timer and calculates elapsed time
   * Updates remaining time based on elapsed duration since start
   * @param examId - The exam ID to pause the timer for
   * @returns Promise resolving to the updated exam document
   * @throws BadRequestException when timer is not running
   * @throws NotFoundException when exam is not found
   */
  async pauseTimer(examId: string): Promise<ExamDocument> {
    const exam = await this.getExamDocument(examId);

    if (exam.status !== 'running') {
      throw new BadRequestException('Timer is not running');
    }

    // Calculate elapsed time and update remaining time
    const now = new Date();
    if (exam.startedAt) {
      const elapsedTime = Math.floor(
        (now.getTime() - exam.startedAt.getTime()) / 1000,
      );
      exam.remainingTime = Math.max(0, exam.remainingTime - elapsedTime);
    }

    exam.status = 'paused';
    exam.pausedAt = now;

    return exam.save();
  }

  /**
   * Resets the exam timer to its initial state
   * Restores original duration and clears all timer timestamps
   * Resets all associated student timers to default state
   * @param examId - The exam ID to reset the timer for
   * @returns Promise resolving to the updated exam document
   * @throws NotFoundException when exam is not found
   */
  async resetTimer(examId: string): Promise<ExamDocument> {
    const exam = await this.getExamDocument(examId);

    exam.status = 'stopped';
    exam.remainingTime = exam.duration;
    exam.startedAt = null;
    exam.pausedAt = null;
    exam.completedAt = null;

    // Reset all student timers
    await this.studentTimerModel.updateMany(
      { examId },
      {
        timeAdjustment: 0,
        remainingTime: exam.duration,
        status: 'active',
        lastSyncAt: new Date(),
      },
    );

    return exam.save();
  }

  /**
   * Adjusts exam timer by adding or subtracting time
   * Can adjust time for all students or specific students only
   * Validates adjustment against maximum allowed limit
   * @param examId - The exam ID to adjust timer for
   * @param adjustTimerDto - Timer adjustment data including time and target students
   * @returns Promise resolving to the updated exam document
   * @throws BadRequestException when adjustment exceeds maximum limit
   * @throws NotFoundException when exam is not found
   */
  async adjustTimer(
    examId: string,
    adjustTimerDto: AdjustTimerDto,
  ): Promise<ExamDocument> {
    const exam = await this.getExamDocument(examId);

    // Check maximum time adjustment limit from config service
    if (
      Math.abs(adjustTimerDto.timeAdjustment) > this.appConfig.maxTimeAdjustment
    ) {
      throw new BadRequestException(
        `Time adjustment cannot exceed ${this.appConfig.maxTimeAdjustment} seconds`,
      );
    }

    if (adjustTimerDto.studentIds && adjustTimerDto.studentIds.length > 0) {
      // Adjust time for specific students
      await this.adjustStudentTimers(
        examId,
        adjustTimerDto.studentIds,
        adjustTimerDto.timeAdjustment,
      );
    } else {
      // Adjust time for all students
      exam.remainingTime += adjustTimerDto.timeAdjustment;
      exam.remainingTime = Math.max(0, exam.remainingTime);

      // Update all student timers
      await this.studentTimerModel.updateMany(
        { examId },
        {
          $inc: { timeAdjustment: adjustTimerDto.timeAdjustment },
          lastSyncAt: new Date(),
        },
      );
    }

    return exam.save();
  }

  /**
   * Adjusts timer for specific students in an exam
   * Updates time adjustment and sync timestamp for targeted students
   * @param examId - The exam ID containing the students
   * @param studentIds - Array of student IDs to adjust timers for
   * @param timeAdjustment - Time adjustment in seconds (positive or negative)
   */
  private async adjustStudentTimers(
    examId: string,
    studentIds: string[],
    timeAdjustment: number,
  ): Promise<void> {
    await this.studentTimerModel.updateMany(
      { examId, studentId: { $in: studentIds } },
      {
        $inc: { timeAdjustment: timeAdjustment },
        lastSyncAt: new Date(),
      },
    );
  }

  /**
   * Adds a student to an exam and creates their timer
   * Reactivates existing timer if student was previously connected
   * Creates new timer with current exam remaining time for new students
   * @param examId - The exam ID to add student to
   * @param studentId - The student ID to add
   * @returns Promise resolving to the student timer document
   * @throws NotFoundException when exam is not found
   */
  async addStudentToExam(
    examId: string,
    studentId: string,
  ): Promise<StudentTimerDocument> {
    const exam = await this.getExamDocument(examId);

    // Check if student is already connected
    const existingTimer = await this.studentTimerModel.findOne({
      examId,
      studentId,
    });
    if (existingTimer) {
      existingTimer.status = 'active';
      existingTimer.lastSyncAt = new Date();
      return existingTimer.save();
    }

    // Create new student timer
    const studentTimer = new this.studentTimerModel({
      examId,
      studentId,
      remainingTime: exam.remainingTime,
      lastSyncAt: new Date(),
    });

    // Add student to exam's connected students list
    if (!exam.connectedStudents.includes(studentId)) {
      exam.connectedStudents.push(studentId);
      await exam.save();
    }

    return studentTimer.save();
  }

  /**
   * Removes a student from an exam and deletes their timer
   * Cleans up student timer record and removes from connected students list
   * @param examId - The exam ID to remove student from
   * @param studentId - The student ID to remove
   * @throws NotFoundException when exam is not found
   */
  async removeStudentFromExam(
    examId: string,
    studentId: string,
  ): Promise<void> {
    // Delete student timer record from database
    await this.studentTimerModel.deleteOne({ examId, studentId });

    // Remove student from exam's connected students list
    const exam = await this.getExamDocument(examId);
    exam.connectedStudents = exam.connectedStudents.filter(
      (id) => id !== studentId,
    );
    await exam.save();
  }

  /**
   * Retrieves a specific student's timer for an exam
   * Returns the student timer document with current state
   * @param examId - The exam ID to get timer for
   * @param studentId - The student ID to get timer for
   * @returns Promise resolving to the student timer document
   * @throws NotFoundException when student timer is not found
   */
  async getStudentTimer(
    examId: string,
    studentId: string,
  ): Promise<StudentTimerDocument> {
    const timer = await this.studentTimerModel.findOne({ examId, studentId });
    if (!timer) {
      throw new NotFoundException('Student timer not found');
    }
    return timer;
  }

  /**
   * Gets the current timer state for an exam with real-time calculations
   * Calculates current remaining time for running timers
   * Auto-completes exam when time expires
   * @param examId - The exam ID to get timer state for
   * @returns Promise resolving to the current timer state
   * @throws NotFoundException when exam is not found
   */
  async getCurrentTimerState(examId: string): Promise<TimerState> {
    const exam = await this.getExamDocument(examId);
    let currentRemainingTime = exam.remainingTime;

    // If timer is running, calculate current remaining time
    if (exam.status === 'running' && exam.startedAt) {
      const now = new Date();
      const elapsedTime = Math.floor(
        (now.getTime() - exam.startedAt.getTime()) / 1000,
      );
      currentRemainingTime = Math.max(0, exam.remainingTime - elapsedTime);

      // Auto-complete exam if time is up
      if (currentRemainingTime === 0 && exam.status === 'running') {
        exam.status = 'completed';
        exam.completedAt = new Date();
        exam.remainingTime = 0;
        await exam.save();
      }
    }

    return {
      examId: exam.id as string,
      duration: exam.duration,
      remainingTime: currentRemainingTime,
      status: exam.status,
      startedAt: exam.startedAt,
      pausedAt: exam.pausedAt,
      completedAt: exam.completedAt,
      isActive: exam.status === 'running',
    };
  }

  /**
   * Deletes an exam and all associated student timers
   * Performs cascade deletion to clean up all related data
   * @param examId - The exam ID to delete
   * @throws NotFoundException when exam is not found
   */
  async deleteExam(examId: string): Promise<void> {
    // First check if exam exists
    const exam = await this.getExamDocument(examId);
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Delete all student timers associated with this exam
    await this.studentTimerModel.deleteMany({ examId });

    // Delete the exam itself
    await this.examModel.findByIdAndDelete(examId);
  }
}
