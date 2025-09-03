import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  LoggerService,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request: any = ctx.getRequest();

    let statusCode;
    let responseBody;
    console.log('exception constructor', exception);
    switch (exception.constructor) {
      case HttpException: {
        const httpException = exception as any as HttpException;
        statusCode = httpException.getStatus();
        const response = httpException.getResponse() as any;
        httpException.getResponse();
        responseBody = {
          statusCode,
          error: {
            message:
              response?.response?.error?.message ||
              response?.response?.message ||
              response?.message,
            code:
              response?.response?.error?.code ||
              response?.response?.code ||
              response?.code,
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        };
        break;
      }
      // case exception instanceof
      default: {
        const { message } = exception as { message: any };
        statusCode = (exception as any).status || 500;
        responseBody = {
          statusCode: (exception as any).status || 500,
          error: {
            message,
            code: 101010,
          },
          timestamps: new Date().toISOString(),
          path: request.url,
        };
        break;
      }
    }

    this.logMessage(request, responseBody.error, statusCode, exception);
    response.status(statusCode).json(responseBody);
  }

  private logMessage(
    request: any,
    message: any,
    status: number,
    exception: any,
  ) {
    // Ignore client-side errors and common client requests
    const clientPaths = [
      '/favicon.ico',
      '/robots.txt',
      '/manifest.json',
      '/static/',
      '/assets/',
    ];
    const isClientPath = clientPaths.some((path) =>
      request.path.includes(path),
    );
    const isClientError =
      status === 404 && (isClientPath || request.path.startsWith('/static/'));

    // Don't log client-side errors
    if (isClientError) {
      return;
    }

    if (status === 500) {
      this.logger.error(
        `End Request for ${request.path}`,
        `method=${request.method} status=${status} code_error=${
          message.code ? message.code : null
        } message=${message.message ? message.message : null}`,
        status >= 500 ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `End Request for ${request.path}`,
        `method=${request.method} status=${status} code_error=${
          message.code ? message.code : null
        } message=${message.message ? message.message : null}`,
      );
    }
  }
}
