import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument, UserRole } from '../schemas/user.schema';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  ChangePasswordDto,
} from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * Creates a new user account with the provided information
   * @param registerDto - User registration data (email, password, firstName, lastName, role)
   * @returns Promise<AuthResponseDto> - User data and JWT access token
   * @throws ConflictException - If user with email already exists
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = new this.userModel({
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.STUDENT,
    });

    await user.save();

    // Generate JWT token
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: (user._id as any).toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
    };
  }

  /**
   * Authenticate user login
   * Validates credentials and returns user data with JWT token
   * @param loginDto - User login credentials (email and password)
   * @returns Promise<AuthResponseDto> - User data and JWT access token
   * @throws UnauthorizedException - If credentials are invalid or account is deactivated
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = (await this.userModel.findOne({ email }).exec()) as any;
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
    };
  }

  /**
   * Validate user by ID
   * Checks if user exists and is active
   * @param userId - The user ID to validate
   * @returns Promise<User> - The validated user document
   * @throws UnauthorizedException - If user not found or inactive
   */
  async validateUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user as User;
  }

  /**
   * Get user profile by ID
   * Returns user profile information without password
   * @param userId - The user ID
   * @returns Promise<User> - User profile data
   * @throws NotFoundException - If user not found
   */
  async getUserProfile(userId: string): Promise<User> {
    const user = (await this.userModel
      .findById(userId)
      .select('-password')) as User;
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Change user password
   * Validates current password and updates to new password
   * @param userId - The user ID
   * @param changePasswordDto - Password change data (current and new password)
   * @returns Promise<{message: string}> - Success message
   * @throws NotFoundException - If user not found
   * @throws UnauthorizedException - If current password is incorrect
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = (await this.userModel.findById(userId)) as any;
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Get all users with optional role filtering
   * Applies role-based access control:
   * - Admins: can see all users
   * - Instructors: can see students and their own account
   * @param role - Optional role filter
   * @param currentUser - Current user information for access control
   * @returns Promise<User[]> - Array of users based on permissions
   */
  async getAllUsers(role?: UserRole, currentUser?: any): Promise<User[]> {
    let filter: any = role ? { role } : {};

    // If current user is an instructor, restrict access to students and their own account only
    if (currentUser && currentUser.role === UserRole.INSTRUCTOR) {
      filter = {
        ...filter,
        $or: [
          { role: UserRole.STUDENT },
          { _id: currentUser.sub }, // Allow access to their own account
        ],
      };
    }

    return this.userModel
      .find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
  }

  /**
   * Toggle user active status
   * Switches user between active and inactive states
   * @param userId - The user ID to toggle status for
   * @returns Promise<User> - Updated user document
   * @throws NotFoundException - If user not found
   */
  async toggleUserStatus(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    (user as any).isActive = !(user as any).isActive;
    await (user as any).save();

    return user as User;
  }

  /**
   * Delete a user
   * Permanently removes user from the database
   * @param userId - The user ID to delete
   * @returns Promise<{message: string}> - Success message
   * @throws NotFoundException - If user not found
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    const result = (await this.userModel.findByIdAndDelete(userId)) as any;
    if (!result) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }
}
