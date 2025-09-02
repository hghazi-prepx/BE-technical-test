import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const TransactionParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.transaction;
  },
);
