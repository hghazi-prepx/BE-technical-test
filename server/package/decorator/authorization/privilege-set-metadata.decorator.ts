import { SetMetadata } from '@nestjs/common';

export const Privileges = (privilege: string[]) =>
  SetMetadata('privilege', privilege);
