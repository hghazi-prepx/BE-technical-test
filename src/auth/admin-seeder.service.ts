import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { AppConfigService } from '../config/app.config';

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: AppConfigService,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  /**
   * Creates default admin user if it doesn't exist
   */
  private async createDefaultAdmin(): Promise<void> {
    try {
      const adminEmail = this.configService.adminEmail;
      const adminPassword = this.configService.adminDefaultPassword;

      // Check if admin already exists
      const existingAdmin = await this.userModel.findOne({
        email: adminEmail,
        role: UserRole.ADMIN,
      });

      if (existingAdmin) {
        this.logger.log(
          'Admin already exists, recreating with correct password...',
        );
        await this.userModel.deleteOne({
          email: adminEmail,
          role: UserRole.ADMIN,
        });
      }

      // Create admin user (password will be hashed by schema pre-save hook)
      const adminUser = new this.userModel({
        email: adminEmail,
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      });

      await adminUser.save();
      this.logger.log(`Default admin user created with email: ${adminEmail}`);
    } catch (error) {
      this.logger.error('Failed to create default admin user', error.stack);
    }
  }

  /**
   * Manually trigger admin creation (for testing purposes)
   */
  async createAdmin(): Promise<void> {
    await this.createDefaultAdmin();
  }
}
