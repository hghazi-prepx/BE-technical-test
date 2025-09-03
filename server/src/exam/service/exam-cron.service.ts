import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExamRepository } from '../data/exam.repository';
import { ExamEvents, ExamStatus } from '../enums/exam.enums';
import { LessThanOrEqual } from 'typeorm';
import { ExamGateway } from '../api/gateway/exam.gateway';

@Injectable()
export class ExamCronService {
  private readonly logger = new Logger(ExamCronService.name);

  constructor(
    private readonly examRepository: ExamRepository,
    private readonly examGateway: ExamGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkExamStatus() {
    const now = new Date();
    this.logger.log('Checking exam status...');
    const examsToStart = await this.examRepository.findAll({
      where: {
        startDate: LessThanOrEqual(now),
        status: ExamStatus.Pending,
      },
    });

    for (const exam of examsToStart) {
      const updatedExam = await this.examRepository.findOneAndUpdate({
        where: { id: exam.id },
        update: { status: ExamStatus.InProgress },
      });
      this.examGateway.sendExamEvent(
        ExamEvents.ExamUpdated + '-' + updatedExam.id,
        updatedExam,
      );
    }

    // Find exams that should be completed (startDate + period + totalPausedTime <= now and status is InProgress)
    const examsToComplete = await this.examRepository.findAll({
      where: {
        status: ExamStatus.InProgress,
      },
    });

    for (const exam of examsToComplete) {
      // Calculate end time considering pause time
      const endTime = new Date(
        exam.startDate.getTime() +
          exam.period * 60 * 1000 + // period in minutes
          exam.totalPausedTime, // add total paused time
      );

      console.log('the end time of the exam ', exam.id, 'is ', endTime);

      if (now >= endTime) {
        const updatedExam = await this.examRepository.findOneAndUpdate({
          where: { id: exam.id },
          update: { status: ExamStatus.Completed },
        });

        this.examGateway.sendExamEvent(
          ExamEvents.ExamUpdated + '-' + updatedExam.id,
          updatedExam,
        );
      }
    }
  }
}
