import { UserRoles } from './../../../src/common/enums/user.enums';
import { UseGuards, applyDecorators } from '@nestjs/common';
import { Role } from './role-set-metadata.role';
import { RoleGuard } from 'package/guards/role.guard';

export function Authorized({ role }: { role: UserRoles[] }) {
  return applyDecorators(Role(role), UseGuards(RoleGuard));
}
