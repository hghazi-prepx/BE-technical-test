import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

import { ExamAssignmentRepository } from './data/exam-assignment.repository';
import { ExamValidation } from './api/validation/exam.validation';
import { ExamController } from './api/controller/exam.controller';
import { CommonError } from 'src/common/error.service';
import { ExamError } from './service/exam-error.service';
import { Exam } from './data/exam.model';
import { UserRepository } from 'src/user/data/user.repository';
import { User } from 'src/user/data/user.schema';
import { ExamAssignment } from './data/exam-assignment.model';
import { ExamService } from './service/exam.service';
import { ExamRepository } from './data/exam.repository';
import { ExamCronService } from './service/exam-cron.service';
import { ExamGateway } from './api/gateway/exam.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamAssignment, User]),
    PassportModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ExamController],
  providers: [
    ExamService,
    ExamRepository,
    ExamAssignmentRepository,
    ExamValidation,
    CommonError,
    ExamError,
    UserRepository,
    ExamCronService,
    ExamGateway,
  ],
  exports: [ExamService],
})
export class ExamModule {}
