import { Injectable } from '@nestjs/common';
import { User } from './user.schema';
import { TypeOrmRepository } from 'package/database/typeOrm/typeOrm.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository extends TypeOrmRepository<User> {
  constructor(
    @InjectRepository(User)
    user: Repository<User>,
  ) {
    super(user);
  }
}
