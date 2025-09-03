import { errorCode } from 'package/utils/Error/error-codes';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonError {
  notFoundError() {
    return {
      code: errorCode.documentNotFound,
      message: 'Document Not Found',
    };
  }
}
