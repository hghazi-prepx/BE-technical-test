import { Controller, UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from 'package/guards/jwt-auth.guard';

export function AuthenticatedController({
  controller,
}: {
  controller: string;
}) {
  return applyDecorators(UseGuards(JwtAuthGuard), Controller(controller));
}
