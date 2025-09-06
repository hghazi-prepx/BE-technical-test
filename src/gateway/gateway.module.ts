import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TimerGateway } from './timer.gateway';
import { ExamModule } from '../exam/exam.module';
import { AuthModule } from '../auth/auth.module';
import { AppConfigService } from '../config/app.config';

@Module({
  imports: [ExamModule, AuthModule],
  providers: [
    TimerGateway,
    {
      provide: AppConfigService,
      useFactory: (configService: ConfigService) => {
        return AppConfigService.getInstance(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [TimerGateway],
})
export class GatewayModule {}
