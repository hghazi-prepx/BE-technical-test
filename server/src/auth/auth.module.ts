import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './api/controller/auth.controller';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'package/strategies/jwt/jwt.constants';
import { JwtStrategy } from 'package/strategies/jwt/jwt.strategy';
import { AuthValidation } from './api/validation';
import { AuthError } from './service/auth-error.service';
import { UserModule } from 'src/user/user.module';
import { CommonError } from 'src/common/error.service';
import { LocalStrategy } from './passport/local-strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  providers: [
    CommonError,
    LocalStrategy,
    JwtStrategy,
    AuthValidation,
    AuthError,
    AuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
