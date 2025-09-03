import { Injectable } from '@nestjs/common';
import { Error } from 'package/utils/Error/error';
import { errorCode } from 'package/utils/Error/error-codes';

@Injectable()
export class AuthError {
  loginFailedError: Error = {
    message: 'phoneNumber or otp is wrong',
    code: errorCode.loginFailed,
  };

  userIsRegisteredError: Error = {
    message: 'User is Already registered',
    code: errorCode.userAlreadyExist,
  };

  userIsNotRegisteredError: Error = {
    message: 'User is not registered',
    code: errorCode.userNotExist,
  };

  wrongCredsError: Error = {
    message: 'Wrong credentials',
    code: errorCode.wrongCreds,
  };

  loginFailed() {
    return this.loginFailedError;
  }

  userIsRegistered() {
    return this.userIsRegisteredError;
  }
  userIsNotRegistered() {
    return this.userIsNotRegisteredError;
  }
  wrongCreds() {
    return this.wrongCredsError;
  }
}
