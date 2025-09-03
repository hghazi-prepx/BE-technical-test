import { UserRoles } from 'src/common/enums/user.enums';
import { User } from 'src/user/data/user.schema';

export interface JWTPayload {
  id: number;
  username: string;
  role: UserRoles;
}

export function buildJWTPayload(user: User) {
  const { id, username, role } = user;

  const result: JWTPayload = {
    id,
    username,
    role,
  };
  return result;
}
