import { Injectable } from '@nestjs/common';
import * as joi from 'joi';
import { LoginDto } from '../dto';
import { JoiValidationPipe } from 'package/validation/joi.pips';

@Injectable()
export class AuthValidation {
  login(body: LoginDto) {
    const loginSchema = joi.object<LoginDto>({
      username: joi.string().required().min(3),
      password: joi.string().min(8).required(),
    });
    return new JoiValidationPipe(loginSchema).transform(body);
  }
}
