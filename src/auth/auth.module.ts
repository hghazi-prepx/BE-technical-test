import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { InstructorGuard } from './guards/instructor.guard';
import { AdminOrInstructorGuard } from './guards/admin-or-instructor.guard';
import { AdminSeederService } from './admin-seeder.service';
import { AppConfigService } from '../config/app.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    JwtAuthGuard,
    AdminGuard,
    InstructorGuard,
    AdminOrInstructorGuard,
    AdminSeederService,
    {
      provide: AppConfigService,
      useFactory: (configService: ConfigService) => {
        return AppConfigService.getInstance(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    AdminGuard,
    InstructorGuard,
    AdminOrInstructorGuard,
    PassportModule,
  ],
})
export class AuthModule {}
