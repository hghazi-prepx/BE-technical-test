import { Injectable } from '@nestjs/common';
import * as joi from 'joi';
import { JoiValidationPipe } from 'package/validation/joi.pips';
import { UserRoles } from 'src/common/enums/user.enums';
import { pagination } from 'package/pagination/validation';

@Injectable()
export class UserValidation {
  create({ body }) {
    const create = joi.object({
      username: joi.string().min(4).required(),
      password: joi.string().min(4).required(),
      role: joi
        .string()
        .valid(...Object.values(UserRoles))
        .required(),
    });

    return new JoiValidationPipe(create).transform(body);
  }

  getAllUsers({ query }) {
    const getAllUsers = joi.object({
      ...pagination(),
      role: joi
        .string()
        .valid(...Object.values(UserRoles))
        .optional(),
      search: joi.string().min(1).optional(),
    });

    return new JoiValidationPipe(getAllUsers).transform(query);
  }
}
