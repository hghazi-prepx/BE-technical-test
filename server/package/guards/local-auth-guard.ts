import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { passportStrategy } from 'package/strategies/constant';

@Injectable()
export class LocalAuthGuard extends AuthGuard(passportStrategy.local) {}

// we can use it like this: @UseGuards(LocalAuthGuard)
/*
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req) {
  return req.user;
}
*/
