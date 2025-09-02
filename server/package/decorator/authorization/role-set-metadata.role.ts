import { SetMetadata } from '@nestjs/common';
import { UserRoles } from 'src/common/enums/user.enums';

export const Role = (role: UserRoles[]) => SetMetadata('role', role);
