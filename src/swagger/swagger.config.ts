import { DocumentBuilder } from '@nestjs/swagger';
import { AppConfigService } from '../config/app.config';

/**
 * Swagger Configuration
 * Contains all Swagger-related configuration and setup
 */
export class SwaggerConfig {
  /**
   * Creates the Swagger document configuration
   * @param appConfig - Application configuration service
   * @returns Swagger document configuration
   */
  static createDocumentConfig(appConfig: AppConfigService) {
    return (
      new DocumentBuilder()
        .setTitle('PrepX Timer API')
        .setDescription(
          'A comprehensive API for managing exam timers with real-time synchronization, user authentication, and role-based access control',
        )
        .setVersion('1.0')
        .addTag(
          'Authentication',
          'User authentication and account management endpoints',
        )
        .addTag(
          'User Management',
          'User management endpoints for admins and instructors',
        )
        .addTag(
          'Exam Management',
          'Exam creation, retrieval, and timer control endpoints',
        )
        // .addTag(
        //   'Timer Control',
        //   'Timer management and control endpoints for instructors',
        // )
        // .addTag(
        //   'Student Participation',
        //   'Student exam participation and timer tracking endpoints',
        // )
        .addTag('Health Check', 'Application health and status endpoints')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addServer(`http://localhost:${appConfig.port}`, 'Development server')
        .build()
    );
  }

  /**
   * Gets the Swagger UI options
   * @returns Swagger UI configuration options
   */
  static getSwaggerOptions() {
    return {
      customSiteTitle: 'PrepX Timer API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    };
  }
}
