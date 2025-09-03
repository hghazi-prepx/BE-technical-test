// import { Strategy } from 'passport-local';
// import { PassportStrategy } from '@nestjs/passport';
// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { AuthService } from '../../src/auth/service/auth.service';
// import { AuthError } from 'src/auth/service/auth-error.service';
// import { passportStrategy } from './constant';

// @Injectable()
// export class LocalStrategy extends PassportStrategy(
//   Strategy,
//   passportStrategy.local,
// ) {
//   constructor(
//     private readonly authService: AuthService,
//     private readonly authError: AuthError,
//   ) {
//     super();
//   }

//   async validate(username: string, password: string): Promise<any> {
//     const user = await this.authService.validateUser(username, password);
//     if (!user) {
//       throw new HttpException(
//         this.authError.wrongCreds(),
//         HttpStatus.UNAUTHORIZED,
//       );
//     }
//     return user.dataValues;
//   }
// }
