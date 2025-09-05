import { Injectable } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AppConfigService } from '../config/app.config';
import { SwaggerConfig } from './swagger.config';

/**
 * Swagger Service
 * Handles the setup and configuration of Swagger documentation
 */
@Injectable()
export class SwaggerService {
  /**
   * Sets up Swagger documentation for the application
   * @param app - NestJS application instance
   * @param appConfig - Application configuration service
   */
  static setupSwagger(
    app: INestApplication,
    appConfig: AppConfigService,
  ): void {
    // Create Swagger document configuration
    const config = SwaggerConfig.createDocumentConfig(appConfig);

    // Generate the Swagger document
    const document = SwaggerModule.createDocument(app, config);

    // Setup Swagger UI
    const swaggerOptions = SwaggerConfig.getSwaggerOptions();
    SwaggerModule.setup('api/docs', app, document, swaggerOptions);

    // Log Swagger setup completion
    console.log(
      `📚 Swagger Documentation: http://localhost:${appConfig.port}/api/docs`,
    );
  }

  /**
   * Gets the Swagger documentation URL
   * @param port - Application port
   * @returns Swagger documentation URL
   */
  static getDocumentationUrl(port: number): string {
    return `http://localhost:${port}/api/docs`;
  }

  /**
   * Validates Swagger configuration
   * @param appConfig - Application configuration service
   * @returns Boolean indicating if configuration is valid
   */
  static validateConfiguration(appConfig: AppConfigService): boolean {
    if (!appConfig.port) {
      console.error(
        '❌ Swagger Setup Error: Application port is not configured',
      );
      return false;
    }

    return true;
  }
}
