import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import { ResponseInterceptor } from 'package/http/response/response.interceptor';
import { LoggingInterceptor } from 'package/http/request/request.interceptor';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from 'package/exception/http-exception.interseptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor(new Logger()));
  app.useGlobalFilters(new AllExceptionsFilter(new Logger()));
  app.use(cookieParser());

  await app.listen(3000);
}
bootstrap();
