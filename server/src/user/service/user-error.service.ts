import { Injectable } from '@nestjs/common';
import { Error } from 'package/utils/Error/error';
import { errorCode } from 'package/utils/Error/error-codes';

@Injectable()
export class UserError {
  notFoundError: Error = {
    message: 'User Not Found',
    code: errorCode.notFoundUser,
  };
  userAlreadyExistError: Error = {
    message: 'User Already exist',
    code: errorCode.userAlreadyExist,
  };

  notFound() {
    return this.notFoundError;
  }
  userAlreadyExist() {
    return this.userAlreadyExistError;
  }
}
