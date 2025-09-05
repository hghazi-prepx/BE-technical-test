import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  corsOrigin: string;
  nodeEnv: string;
  defaultExamDuration: number;
  maxTimeAdjustment: number;
  logLevel: string;
  sessionTimeout: number;
  maxConcurrentExams: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
  adminEmail: string;
  adminDefaultPassword: string;
}

export class AppConfigService {
  private static instance: AppConfigService;
  private config: AppConfig;

  private constructor(private configService: ConfigService) {
    this.config = this.loadConfig();
  }

  public static getInstance(configService: ConfigService): AppConfigService {
    if (!AppConfigService.instance) {
      AppConfigService.instance = new AppConfigService(configService);
    }
    return AppConfigService.instance;
  }

  private loadConfig(): AppConfig {
    return {
      port: parseInt(this.configService.get<string>('PORT', '3000'), 10),
      mongodbUri: this.configService.get<string>(
        'MONGODB_URI',
        'mongodb://localhost:27017/prepx-timer',
      ),
      jwtSecret: this.configService.get<string>(
        'JWT_SECRET',
        'your_jwt_secret_key',
      ),
      corsOrigin: this.configService.get<string>('CORS_ORIGIN', '*'),
      nodeEnv: this.configService.get<string>('NODE_ENV', 'development'),
      defaultExamDuration: parseInt(
        this.configService.get<string>('DEFAULT_EXAM_DURATION', '7200'), // 2 hours default
        10,
      ),
      maxTimeAdjustment: parseInt(
        this.configService.get<string>('MAX_TIME_ADJUSTMENT', '1800'),
        10,
      ),
      logLevel: this.configService.get<string>('LOG_LEVEL', 'info'),
      sessionTimeout: parseInt(
        this.configService.get<string>('SESSION_TIMEOUT', '86400'),
        10,
      ),
      maxConcurrentExams: parseInt(
        this.configService.get<string>('MAX_CONCURRENT_EXAMS', '100'),
        10,
      ),
      enableLogging:
        this.configService.get<string>('ENABLE_LOGGING', 'true') === 'true',
      enableMetrics:
        this.configService.get<string>('ENABLE_METRICS', 'false') === 'true',
      rateLimitWindow: parseInt(
        this.configService.get<string>('RATE_LIMIT_WINDOW', '900000'),
        10,
      ),
      rateLimitMax: parseInt(
        this.configService.get<string>('RATE_LIMIT_MAX', '100'),
        10,
      ),
      adminEmail: this.configService.get<string>(
        'ADMIN_EMAIL',
        'admin@prepx.com',
      ),
      adminDefaultPassword: this.configService.get<string>(
        'ADMIN_DEFAULT_PASSWORD',
        '12345678',
      ),
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get port(): number {
    return this.config.port;
  }

  public get mongodbUri(): string {
    return this.config.mongodbUri;
  }

  public get jwtSecret(): string {
    return this.config.jwtSecret;
  }

  public get corsOrigin(): string {
    return this.config.corsOrigin;
  }

  public get nodeEnv(): string {
    return this.config.nodeEnv;
  }

  public get defaultExamDuration(): number {
    return this.config.defaultExamDuration;
  }

  public get maxTimeAdjustment(): number {
    return this.config.maxTimeAdjustment;
  }

  public get logLevel(): string {
    return this.config.logLevel;
  }

  public get sessionTimeout(): number {
    return this.config.sessionTimeout;
  }

  public get maxConcurrentExams(): number {
    return this.config.maxConcurrentExams;
  }

  public get enableLogging(): boolean {
    return this.config.enableLogging;
  }

  public get enableMetrics(): boolean {
    return this.config.enableMetrics;
  }

  public get rateLimitWindow(): number {
    return this.config.rateLimitWindow;
  }

  public get rateLimitMax(): number {
    return this.config.rateLimitMax;
  }

  public get adminEmail(): string {
    return this.config.adminEmail;
  }

  public get adminDefaultPassword(): string {
    return this.config.adminDefaultPassword;
  }
}
