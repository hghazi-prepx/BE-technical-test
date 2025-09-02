import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ExamRepository } from '../data/exam.repository';
import { ExamAssignmentRepository } from '../data/exam-assignment.repository';
import { CommonError } from 'src/common/error.service';
import { ExamError } from './exam-error.service';
import {
  CreateExamDto,
  UpdateExamDto,
  AssignStudentsDto,
  GetAllExams,
} from '../api/dto/exam.dto';
import { UserRoles } from 'src/common/enums/user.enums';
import { ExamEvents, ExamStatus } from '../enums/exam.enums';
import { UserRepository } from 'src/user/data/user.repository';
import { FilterService } from 'package/helpers/filtering-service';
import { User } from 'src/user/data/user.schema';
import { IUser } from 'package/types/user';
import { ExamGateway } from '../api/gateway/exam.gateway';
import { In } from 'typeorm';

@Injectable()
export class ExamService {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly examAssignmentRepository: ExamAssignmentRepository,
    private readonly userRepository: UserRepository,
    private readonly examError: ExamError,
    private readonly examGateway: ExamGateway,
    private readonly commonError: CommonError,
  ) {}

  async findAll({ take, skip, search }: GetAllExams, user: IUser) {
    const filter = new FilterService();

    if (search) {
      filter.substring('name', search);
    }
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    if (user.role === UserRoles.Students)
      filter.equals('assignments.studentId', user.id);

    return await this.examRepository.findAndCount({
      where: filter.build(),
      options: { skip, take },
      relations: {
        trainee: true,
        assignments: { student: true },
      },
    });
  }

  async findOne(id: number, user: IUser) {
    const filter = new FilterService();
    filter.equals('id', id);
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    if (user.role === UserRoles.Students)
      filter.equals('assignments.studentId', user.id);
    // For students, verify they are assigned to this exam
    return await this.examRepository.findOne({
      where: filter.build(),
      options: {
        relations: { trainee: true, assignments: { student: true } },
      },
      error: this.examError.notFound(),
    });
  }

  async createExam(body: CreateExamDto, user: IUser) {
    // Check if exam with same name already exists
    let traineeId = user.role === UserRoles.Trainee ? user.id : body.traineeId;

    if (!traineeId) {
      throw new HttpException('provide the trainee id', HttpStatus.BAD_REQUEST);
    }

    if (user.role === UserRoles.Trainee) {
      traineeId = user.id;
    }
    const existingExam = await this.examRepository.findOne({
      where: { name: body.name },
    });

    if (existingExam) {
      throw new HttpException(
        this.examError.examNameAlreadyExists(),
        HttpStatus.BAD_REQUEST,
      );
    }

    const exam = await this.examRepository.create({
      doc: {
        ...body,
        traineeId: user.id,
      },
    });

    return exam;
  }

  async updateExam(examId: number, body: UpdateExamDto, user: IUser) {
    const filter = new FilterService();
    filter.equals('id', examId);
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    const exam = await this.examRepository.findOne({
      where: filter.build(),
      error: this.examError.notFound(),
    });

    // Check if exam has already started
    if (new Date() >= exam.startDate) {
      throw new HttpException(
        this.examError.examAlreadyStarted(),
        HttpStatus.BAD_REQUEST,
      );
    }

    // If updating name, check if it already exists
    if (body.name && body.name !== exam.name) {
      const existingExam = await this.examRepository.findOne({
        where: { name: body.name },
      });

      if (existingExam) {
        throw new HttpException(
          this.examError.examNameAlreadyExists(),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (body.startDate && new Date(body.startDate) <= new Date()) {
      throw new HttpException(
        this.examError.invalidStartDate(),
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedExam = await this.examRepository.findOneAndUpdate({
      where: { id: examId },
      update: body,
      options: {
        relations: { trainee: true, assignments: { student: true } },
      },
    });

    if (exam.period !== body.period && exam.status === ExamStatus.InProgress) {
      this.examGateway.sendExamEvent(
        ExamEvents.ExamUpdated + '-' + updatedExam.id,
        updatedExam,
      );
    }

    return updatedExam;
  }

  async assignStudentsToExam(
    examId: number,
    body: AssignStudentsDto,
    user: IUser,
  ) {
    const filter = new FilterService();
    filter.equals('id', examId);

    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);

    // Verify exam exists and belongs to trainee
    await this.examRepository.findOne({
      where: filter.build(),
      error: this.examError.notFound(),
    });

    // Verify all students exist and have Student role
    const students = await this.userRepository.findAll({
      where: { role: UserRoles.Students, id: In(body.studentIds) },
    });

    if (students.length !== body.studentIds.length) {
      throw new HttpException(
        this.examError.studentNotFound(),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create assignments
    const assignments = [];
    for (const studentId of body.studentIds) {
      // Check if assignment already exists
      const existingAssignment = await this.examAssignmentRepository.findOne({
        where: { examId, studentId },
      });

      if (existingAssignment) {
        continue; // Skip if already assigned
      }

      const assignment = await this.examAssignmentRepository.create({
        doc: { examId, studentId },
      });
      assignments.push(assignment);
    }

    return assignments;
  }

  async removeStudentFromExam(examId: number, studentId: number, user: IUser) {
    const filter = new FilterService();
    filter.equals('id', examId);
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    await this.examRepository.findOne({
      where: filter.build(),
      error: this.examError.notFound(),
    });

    const assignment = await this.examAssignmentRepository.findOne({
      where: { examId, studentId },
      error: this.examError.assignmentNotFound(),
    });

    await this.examAssignmentRepository.delete({
      criteria: { id: assignment.id },
    });

    return { message: 'Student removed from exam successfully' };
  }

  async deleteExam(examId: number, user: IUser) {
    const filter = new FilterService();
    filter.equals('id', examId);
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    const exam = await this.examRepository.findOne({
      where: filter.build(),
      error: this.examError.notFound(),
    });

    // Check if exam has already started
    if (new Date() >= exam.startDate) {
      throw new HttpException(
        this.examError.examAlreadyStarted(),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Delete assignments first (cascade should handle this, but being explicit)
    await this.examAssignmentRepository.delete({
      criteria: { examId },
    });

    // Delete exam
    await this.examRepository.delete({
      criteria: { id: examId },
    });

    return { message: 'Exam deleted successfully' };
  }

  async pauseExam(examId: number, user: IUser) {
    const filter = new FilterService();
    filter.equals('id', examId);
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    const exam = await this.examRepository.findOne({
      where: filter.build(),
      error: this.examError.notFound(),
    });

    // Check if exam is in progress
    if (exam.status !== ExamStatus.InProgress) {
      throw new HttpException(
        this.examError.examNotInProgress(),
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedExam = await this.examRepository.findOneAndUpdate({
      where: { id: examId },
      update: {
        status: ExamStatus.Paused,
        pausedAt: new Date(),
      },
      options: {
        relations: { trainee: true, assignments: { student: true } },
      },
    });
    this.examGateway.sendExamEvent(
      ExamEvents.ExamUpdated + '-' + updatedExam.id,
      updatedExam,
    );

    return updatedExam;
  }

  async unpauseExam(examId: number, user: IUser) {
    const filter = new FilterService();
    filter.equals('id', examId);
    if (user.role === UserRoles.Trainee) filter.equals('traineeId', user.id);
    const exam = await this.examRepository.findOne({
      where: filter.build(),
      error: this.examError.notFound(),
    });

    // Check if exam is paused
    if (exam.status !== ExamStatus.Paused) {
      throw new HttpException(
        'Exam can only be unpaused when it is paused',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calculate pause duration and add to total paused time
    const now = new Date();
    const pauseDuration = now.getTime() - exam.pausedAt.getTime();
    const newTotalPausedTime = exam.totalPausedTime + pauseDuration;

    const updatedExam = await this.examRepository.findOneAndUpdate({
      where: { id: examId },
      update: {
        status: ExamStatus.InProgress,
        pausedAt: null,
        totalPausedTime: newTotalPausedTime,
      },
      options: {
        relations: { trainee: true, assignments: { student: true } },
      },
    });

    this.examGateway.sendExamEvent(
      ExamEvents.ExamUpdated + '-' + updatedExam.id,
      updatedExam,
    );

    return updatedExam;
  }
}
