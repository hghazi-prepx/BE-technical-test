import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { comparePassword } from 'package/utils/bcrypt/bcrypt';
import { UserService } from 'src/user/service/user.service';
import { LoginDto } from '../api/dto';
import { User } from 'src/user/data/user.schema';
import { buildJWTPayload } from 'package/strategies/jwt/jwt-payload';
import { JwtService } from '@nestjs/jwt';
import { UserError } from 'src/user/service/user-error.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private userError: UserError,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (!user || !(await comparePassword(pass, user.password))) {
      return null;
    }
    delete user.password;
    return user;
  }

  async login(body: LoginDto, curUser: User) {
    const jwtPayload = buildJWTPayload(curUser);
    return {
      user: curUser,
      accessToken: this.jwtService.sign(jwtPayload),
    };
  }
}
