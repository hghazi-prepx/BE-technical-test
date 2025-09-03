import { UserRoles } from 'src/common/enums/user.enums';

export interface IUser {
  id: number;
  username: string;
  role: UserRoles;
}
