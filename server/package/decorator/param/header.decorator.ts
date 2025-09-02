import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const Headers = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    request.headers.languageKey = request.headers['accept-language'] || 'ar';
    return request.headers;
  },
);

export const HeadersContent = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;

    return data ? headers?.[data] : headers;
  },
);
