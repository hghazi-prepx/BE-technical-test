import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { UserRepository } from '../data/user.repository';
import { CommonError } from 'src/common/error.service';
import { UserDto, GetUsersQueryDto } from '../api/dto/type';
import { usersData } from 'src/db/seed/users.data';
import { UserError } from './user-error.service';
import { FilterService } from 'package/helpers/filtering-service';
import { IUser } from 'package/types/user';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userError: UserError,
    private commonError: CommonError,
  ) {}

  async seed() {
    const count = await this.userRepository.count({});
    if (!count) {
      await this.userRepository.create({ doc: usersData });
    }

    return;
  }

  async createUser(body: UserDto) {
    let user = await this.findByUsername(body.username);
    if (user) {
      throw new HttpException(
        this.userError.userAlreadyExist(),
        HttpStatus.BAD_REQUEST,
      );
    }
    user = await this.userRepository.create({
      doc: body,
    });
    delete user.password;
    return user;
  }

  async findByUsername(username: string) {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async getAllUsers(query: GetUsersQueryDto) {
    const { role, search, take, skip } = query;

    const filter = new FilterService();

    // Filter by role if provided
    if (role) {
      filter.equals('role', role);
    }

    // Search by name (username) if provided
    if (search) {
      filter.startsWith('username', search);
    }

    console.log(filter.build());

    return await this.userRepository.findAndCount({
      where: filter.build(),
      options: {
        take,
        skip,
      },
      select: ['id', 'username', 'role'] as any, // Exclude password for security
    });
  }
}
