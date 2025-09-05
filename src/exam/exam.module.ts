import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { Exam, ExamSchema } from '../schemas/exam.schema';
import {
  StudentTimer,
  StudentTimerSchema,
} from '../schemas/student-timer.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { AppConfigService } from '../config/app.config';
import { ExamAccessGuard } from '../auth/guards/exam-access.guard';
import { ExamOwnerGuard } from '../auth/guards/exam-owner.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: StudentTimer.name, schema: StudentTimerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ExamController],
  providers: [
    ExamService,
    ExamAccessGuard,
    ExamOwnerGuard,
    {
      provide: AppConfigService,
      useFactory: (configService: ConfigService) => {
        return AppConfigService.getInstance(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [ExamService],
})
export class ExamModule {}
