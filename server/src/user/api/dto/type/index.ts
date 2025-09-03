import { UserRoles } from 'src/common/enums/user.enums';
import { GetByCriteria } from 'package/pagination/dto';

export class UserDto {
  username: string;
  password: string;
  role: UserRoles;
}

export class GetUsersQueryDto extends GetByCriteria {
  role?: UserRoles;
  search?: string;
}
