import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/seed/database.module';
import { User } from './user/data/user.schema';
import { ExamModule } from './exam/exam.module';
import { Exam } from './exam/data/exam.model';
import { ExamAssignment } from './exam/data/exam-assignment.model';
import { dbConfig } from './db/db.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: dbConfig.type as any,
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [User, Exam, ExamAssignment],
      synchronize: true,
    }),

    UserModule,
    AuthModule,
    DatabaseModule,
    ExamModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
