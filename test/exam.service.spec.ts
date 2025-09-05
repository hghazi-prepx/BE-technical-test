import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamService } from '../src/exam/exam.service';
import { AppConfigService } from '../src/config/app.config';
import { Exam } from '../src/schemas/exam.schema';
import { StudentTimer } from '../src/schemas/student-timer.schema';
import { User, UserRole } from '../src/schemas/user.schema';
import { CreateExamDto } from '../src/dto/create-exam.dto';
import { AdjustTimerDto } from '../src/dto/adjust-timer.dto';

describe('ExamService', () => {
  let service: ExamService;
  let examModel: any;
  let studentTimerModel: any;
  let userModel: any;
  let appConfig: AppConfigService;

  const mockExam = {
    _id: 'exam123',
    id: 'exam123',
    title: 'Test Exam',
    description: 'Test Description',
    duration: 3600,
    remainingTime: 3600,
    status: 'pending',
    createdBy: 'teacher123',
    connectedStudents: [],
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    save: jest.fn().mockResolvedValue(this),
    toObject: jest.fn().mockReturnValue({
      _id: 'exam123',
      id: 'exam123',
      title: 'Test Exam',
      description: 'Test Description',
      duration: 3600,
      remainingTime: 3600,
      status: 'pending',
      createdBy: 'teacher123',
      connectedStudents: [],
      startedAt: null,
      pausedAt: null,
      completedAt: null
    })
  };

  const mockStudentTimer = {
    _id: 'timer123',
    examId: 'exam123',
    studentId: 'student123',
    remainingTime: 3600,
    timeAdjustment: 0,
    status: 'active',
    lastSyncAt: new Date(),
    save: jest.fn().mockResolvedValue(this)
  };

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.STUDENT
  };

  const mockAppConfig = {
    maxTimeAdjustment: 1800
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        {
          provide: getModelToken(Exam.name),
          useValue: jest.fn().mockImplementation((examData) => ({
            ...mockExam,
            ...examData,
            save: jest.fn().mockResolvedValue({ ...mockExam, ...examData }),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndDelete: jest.fn(),
            create: jest.fn(),
            exec: jest.fn()
          }))
        },
        {
          provide: getModelToken(StudentTimer.name),
          useValue: jest.fn().mockImplementation((timerData) => ({
            ...mockStudentTimer,
            ...timerData,
            save: jest.fn().mockResolvedValue({ ...mockStudentTimer, ...timerData }),
            find: jest.fn(),
            findOne: jest.fn(),
            updateMany: jest.fn(),
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
            exec: jest.fn()
          }))
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                exec: jest.fn()
              })
            })
          }
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfig
        }
      ]
    }).compile();

    service = module.get<ExamService>(ExamService);
    examModel = module.get(getModelToken(Exam.name));
    studentTimerModel = module.get(getModelToken(StudentTimer.name));
    userModel = module.get(getModelToken(User.name));
    appConfig = module.get<AppConfigService>(AppConfigService);

    // Add static methods to mock models
    examModel.find = jest.fn().mockReturnValue({ exec: jest.fn() });
    examModel.findById = jest.fn().mockReturnValue({ exec: jest.fn() });
    examModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });
    examModel.create = jest.fn();
    
    studentTimerModel.find = jest.fn().mockReturnValue({ exec: jest.fn() });
    studentTimerModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn() });
    studentTimerModel.updateMany = jest.fn().mockReturnValue({ exec: jest.fn() });
    studentTimerModel.deleteOne = jest.fn().mockReturnValue({ exec: jest.fn() });
    studentTimerModel.deleteMany = jest.fn().mockReturnValue({ exec: jest.fn() });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExam', () => {
    it('should create a new exam successfully', async () => {
      const createExamDto: CreateExamDto = {
        title: 'Test Exam',
        description: 'Test Description',
        duration: 3600
      };
      const createdBy = 'teacher123';

      const result = await service.createExam(createExamDto);

      expect(examModel).toHaveBeenCalledWith({
        ...createExamDto,
        duration: createExamDto.duration * 60,
        remainingTime: createExamDto.duration * 60
      });
    });
  });

  describe('getExam', () => {
    it('should return exam with connected students count', async () => {
      const examWithStudents = {
        ...mockExam,
        connectedStudents: ['student1', 'student2']
      };
      const mockStudents = [{ _id: 'student1', name: 'Student 1' }, { _id: 'student2', name: 'Student 2' }];
      
      examModel.findById = jest.fn().mockResolvedValue(examWithStudents);
      userModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockStudents)
        })
      });

      const result = await service.getExam('exam123');

      expect(examModel.findById).toHaveBeenCalledWith('exam123');
      expect(result.connectedStudents).toEqual(mockStudents);
    });

    it('should throw NotFoundException when exam not found', async () => {
      examModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.getExam('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllExamsByRole', () => {
    it('should return all exams for admin role', async () => {
      const exams = [mockExam];
      examModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(exams)
      });

      const result = await service.getAllExamsByRole('admin123', UserRole.ADMIN);

      expect(examModel.find).toHaveBeenCalledWith();
      expect(result).toEqual(exams);
    });

    it('should return created exams for teacher role', async () => {
      const exams = [mockExam];
      examModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(exams)
      });

      const result = await service.getAllExamsByRole('teacher123', UserRole.INSTRUCTOR);

      expect(examModel.find).toHaveBeenCalledWith({ instructorId: 'teacher123' });
      expect(result).toEqual(exams);
    });
  });

  describe('startTimer', () => {
    it('should start timer successfully', async () => {
      const exam = {
        ...mockExam,
        status: 'pending',
        save: jest.fn().mockResolvedValue(mockExam)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      const result = await service.startTimer('exam123');

      expect(exam.status).toBe('running');
      expect(exam.startedAt).toBeInstanceOf(Date);
      expect(exam.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when exam is already running', async () => {
      const exam = {
        ...mockExam,
        status: 'running'
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      await expect(service.startTimer('exam123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('pauseTimer', () => {
    it('should pause timer successfully', async () => {
      const exam = {
        ...mockExam,
        status: 'running',
        startedAt: new Date(Date.now() - 1000),
        save: jest.fn().mockResolvedValue(mockExam)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      const result = await service.pauseTimer('exam123');

      expect(exam.status).toBe('paused');
      expect(exam.pausedAt).toBeInstanceOf(Date);
      expect(exam.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when exam is not running', async () => {
      const exam = {
        ...mockExam,
        status: 'pending'
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      await expect(service.pauseTimer('exam123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetTimer', () => {
    it('should reset timer successfully', async () => {
      const exam = {
        ...mockExam,
        status: 'paused',
        remainingTime: 1800,
        save: jest.fn().mockResolvedValue(mockExam)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);
       studentTimerModel.updateMany = jest.fn().mockReturnValue({
         exec: jest.fn().mockResolvedValue({})
       });

      const result = await service.resetTimer('exam123');

      expect(exam.status).toBe('stopped');
      expect(exam.remainingTime).toBe(exam.duration);
      expect(exam.startedAt).toBeNull();
      expect(exam.pausedAt).toBeNull();
      expect(exam.completedAt).toBeNull();
      expect(studentTimerModel.updateMany).toHaveBeenCalledWith(
        { examId: 'exam123' },
        {
          timeAdjustment: 0,
          remainingTime: exam.duration,
          status: 'active',
          lastSyncAt: expect.any(Date)
        }
      );
    });
  });

  describe('adjustTimer', () => {
    it('should adjust timer for all students', async () => {
      const exam = {
        ...mockExam,
        remainingTime: 3600,
        save: jest.fn().mockResolvedValue(mockExam)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);
      studentTimerModel.updateMany = jest.fn().mockResolvedValue({});

      const adjustTimerDto: AdjustTimerDto = {
        timeAdjustment: 300
      };

      const result = await service.adjustTimer('exam123', adjustTimerDto);

      expect(exam.remainingTime).toBe(3900);
      expect(studentTimerModel.updateMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException for excessive time adjustment', async () => {
      const exam = { ...mockExam };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      const adjustTimerDto: AdjustTimerDto = {
        timeAdjustment: 2000 // Exceeds maxTimeAdjustment
      };

      await expect(service.adjustTimer('exam123', adjustTimerDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('addStudentToExam', () => {
    it('should add new student to exam', async () => {
      const exam = {
        ...mockExam,
        connectedStudents: [],
        save: jest.fn().mockResolvedValue(mockExam)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);
      studentTimerModel.findOne = jest.fn().mockResolvedValue(null);
      studentTimerModel.constructor = jest.fn().mockImplementation(() => ({
        ...mockStudentTimer,
        save: jest.fn().mockResolvedValue(mockStudentTimer)
      }));

      const result = await service.addStudentToExam('exam123', 'student123');

      expect(exam.connectedStudents).toContain('student123');
      expect(exam.save).toHaveBeenCalled();
    });

    it('should reactivate existing student timer', async () => {
      const exam = { ...mockExam };
      const existingTimer = {
        ...mockStudentTimer,
        status: 'inactive',
        save: jest.fn().mockResolvedValue(mockStudentTimer)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);
      studentTimerModel.findOne = jest.fn().mockResolvedValue(existingTimer);

      const result = await service.addStudentToExam('exam123', 'student123');

      expect(existingTimer.status).toBe('active');
      expect(existingTimer.save).toHaveBeenCalled();
    });
  });

  describe('removeStudentFromExam', () => {
    it('should remove student from exam', async () => {
      const exam = {
        ...mockExam,
        connectedStudents: ['student123', 'student456'],
        save: jest.fn().mockResolvedValue(mockExam)
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);
      studentTimerModel.deleteOne = jest.fn().mockResolvedValue({});

      await service.removeStudentFromExam('exam123', 'student123');

      expect(studentTimerModel.deleteOne).toHaveBeenCalledWith({
        examId: 'exam123',
        studentId: 'student123'
      });
      expect(exam.connectedStudents).not.toContain('student123');
      expect(exam.save).toHaveBeenCalled();
    });
  });

  describe('getStudentTimer', () => {
    it('should return student timer', async () => {
      studentTimerModel.findOne = jest.fn().mockResolvedValue(mockStudentTimer);

      const result = await service.getStudentTimer('exam123', 'student123');

      expect(studentTimerModel.findOne).toHaveBeenCalledWith({
        examId: 'exam123',
        studentId: 'student123'
      });
      expect(result).toEqual(mockStudentTimer);
    });

    it('should throw NotFoundException when timer not found', async () => {
      studentTimerModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getStudentTimer('exam123', 'student123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentTimerState', () => {
    it('should return current timer state for pending exam', async () => {
      const exam = {
        ...mockExam,
        status: 'pending'
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      const result = await service.getCurrentTimerState('exam123');

      expect(result.examId).toBe('exam123');
      expect(result.status).toBe('pending');
      expect(result.isActive).toBe(false);
    });

    it('should calculate remaining time for running exam', async () => {
      const exam = {
        ...mockExam,
        status: 'running',
        startedAt: new Date(Date.now() - 1000),
        remainingTime: 3600
      };
      examModel.findById = jest.fn().mockResolvedValue(exam);

      const result = await service.getCurrentTimerState('exam123');

      expect(result.status).toBe('running');
      expect(result.isActive).toBe(true);
      expect(result.remainingTime).toBeLessThan(3600);
    });
  });

  describe('deleteExam', () => {
    it('should delete exam and associated timers', async () => {
      examModel.findById = jest.fn().mockResolvedValue(mockExam);
      studentTimerModel.deleteMany = jest.fn().mockResolvedValue({});
      examModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockExam);

      await service.deleteExam('exam123');

      expect(studentTimerModel.deleteMany).toHaveBeenCalledWith({ examId: 'exam123' });
      expect(examModel.findByIdAndDelete).toHaveBeenCalledWith('exam123');
    });

    it('should throw NotFoundException when exam not found', async () => {
      examModel.findById = jest.fn().mockResolvedValue(null);

      await expect(service.deleteExam('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});