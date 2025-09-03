import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { passportStrategy } from 'package/strategies/constant';
import { errorCode } from 'package/utils/Error/error-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard(passportStrategy.jwt) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.headers['authorization']?.split(' ')[1] === null)
      throw new HttpException(
        { code: errorCode.notFoundToken, message: 'Not Found Token' },
        HttpStatus.UNAUTHORIZED,
      );
    return super.canActivate(context);
  }

  // You can throw an exception based on either "info" or "err" arguments
  handleRequest(err, user, info) {
    if (err || !user) {
      throw (
        err ||
        new HttpException(
          { code: errorCode.notFoundToken, message: 'not authenticated' },
          HttpStatus.UNAUTHORIZED,
        )
      );
    }
    return user;
  }
}
// we can use it like this:

/*
@UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
*/
