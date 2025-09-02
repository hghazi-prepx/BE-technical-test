import { Module, forwardRef } from '@nestjs/common';
import { User } from './data/user.schema';
import { UserRepository } from './data/user.repository';
import { UserError } from './service/user-error.service';
import { UserValidation } from './api/validation';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './service/user.service';
import { UserController } from './api/controller/user.controller';
import { CommonError } from 'src/common/error.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    CommonError,
    UserService,
    UserRepository,
    UserError,
    UserValidation,
  ],
  controllers: [UserController],
  exports: [UserService, UserRepository, UserError],
})
export class UserModule {}
