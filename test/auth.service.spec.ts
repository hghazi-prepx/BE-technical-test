import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { AuthService } from '../src/auth/auth.service';
import { User, UserDocument, UserRole } from '../src/schemas/user.schema';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
} from '../src/dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    role: UserRole.STUDENT,
    isActive: true,
    password: 'hashedPassword',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
    comparePassword: jest.fn(),
  };

  const mockUserModel = jest.fn().mockImplementation((userData) => ({
     ...userData,
     save: jest.fn().mockResolvedValue({
       _id: 'mockUserId',
       ...userData,
     }),
   }));
   
   mockUserModel.findOne = jest.fn();
   mockUserModel.findById = jest.fn();
   mockUserModel.create = jest.fn();
   mockUserModel.find = jest.fn();
   mockUserModel.findByIdAndUpdate = jest.fn();
   mockUserModel.findByIdAndDelete = jest.fn();
   mockUserModel.select = jest.fn();
   mockUserModel.sort = jest.fn();

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.STUDENT,
    };

    it('should successfully register a new user', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      
      const mockNewUser = {
        _id: 'mockUserId',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        save: jest.fn().mockResolvedValue({
          _id: 'mockUserId',
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        }),
      };
      
      mockUserModel.mockReturnValue(mockNewUser);

      const result = await service.register(registerDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: registerDto.email });
      expect(mockUserModel).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
      });
      expect(mockNewUser.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: registerDto.email });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserWithMethods),
      });

      const result = await service.login(loginDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(mockUserWithMethods.comparePassword).toHaveBeenCalledWith(loginDto.password);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(inactiveUser),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserWithMethods),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should return user if found and active', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.validateUser(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.validateUser(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(inactiveUser),
      });

      await expect(service.validateUser(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUserProfile', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should return user profile without password', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.getUserProfile(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getUserProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    const userId = '507f1f77bcf86cd799439011';
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123',
    };

    it('should successfully change password', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      
      mockUserModel.findById.mockResolvedValue(mockUserWithMethods);

      const result = await service.changePassword(userId, changePasswordDto);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockUserWithMethods.comparePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      
      mockUserModel.findById.mockResolvedValue(mockUserWithMethods);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllUsers', () => {
    const mockUsers = [mockUser, { ...mockUser, _id: 'another-id' }];

    it('should return all users when no role filter', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUsers);
    });

    it('should filter users by role', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      await service.getAllUsers(UserRole.STUDENT);

      expect(mockUserModel.find).toHaveBeenCalledWith({ role: UserRole.STUDENT });
    });

    it('should restrict instructor access to students only', async () => {
      const currentUser = { sub: 'instructor-id', role: UserRole.INSTRUCTOR };
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      await service.getAllUsers(undefined, currentUser);

      expect(mockUserModel.find).toHaveBeenCalledWith({
        $or: [
          { role: UserRole.STUDENT },
          { _id: currentUser.sub },
        ],
      });
    });
  });

  describe('toggleUserStatus', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should toggle user status from active to inactive', async () => {
      const mockUserWithSave = {
        ...mockUser,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };
      
      mockUserModel.findById.mockResolvedValue(mockUserWithSave);

      const result = await service.toggleUserStatus(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockUserWithSave.isActive).toBe(false);
      expect(mockUserWithSave.save).toHaveBeenCalled();
      expect(result).toEqual(mockUserWithSave);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.toggleUserStatus(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should successfully delete user', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await service.deleteUser(userId);

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});