import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app.config';
import { SwaggerService } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);

  // Enable CORS for client connections
  app.enableCors({
    origin: appConfig.corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Setup Swagger documentation
  SwaggerService.setupSwagger(app, appConfig);

  await app.listen(appConfig.port);
  console.log(
    `🚀 Application is running on: http://localhost:${appConfig.port}`,
  );
  console.log(
    `📡 API endpoints available at: http://localhost:${appConfig.port}/api`,
  );
  console.log(
    `🌐 Client interface available at: http://localhost:${appConfig.port}`,
  );
  console.log(`⚙️  Environment: ${appConfig.nodeEnv}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
