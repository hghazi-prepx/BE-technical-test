import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Application Controller
 * Handles basic application endpoints and health checks
 */
@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Application health check
   * Returns a simple greeting message to verify the API is running
   * Public endpoint - no authentication required
   * @returns Welcome message string
   */
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns a welcome message to verify the API is running and accessible',
  })
  @ApiOkResponse({
    description: 'API is running successfully',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
