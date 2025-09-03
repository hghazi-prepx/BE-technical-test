import { AuthenticatedController } from 'package/decorator/authentication/authenticated-controller.decorator';
import { AuthorizedApi } from 'package/decorator/authorization/authorization.decorator';
import { Api } from 'package/utils/api-methods';
import { UserValidation } from '../validation';
import { Body, Query } from '@nestjs/common';
import { UserService } from 'src/user/service/user.service';
import { UserDto, GetUsersQueryDto } from '../dto/type';
import { UserRoles } from 'src/common/enums/user.enums';
import { paginationParser } from 'package/pagination/pagination';

@AuthenticatedController({
  controller: 'users',
})
export class UserController {
  constructor(
    private readonly userValidation: UserValidation,
    private readonly userService: UserService,
  ) {}

  @AuthorizedApi({
    api: Api.POST,
    role: [UserRoles.Admin],
    url: '/',
  })
  async create(@Body() body: UserDto) {
    this.userValidation.create({ body });
    return this.userService.createUser(body);
  }

  @AuthorizedApi({
    api: Api.GET,
    role: [UserRoles.Admin],
    url: '/',
  })
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    this.userValidation.getAllUsers({ query });
    const { criteria, pagination } = paginationParser(query);
    return this.userService.getAllUsers({ ...criteria, ...pagination });
  }
}
