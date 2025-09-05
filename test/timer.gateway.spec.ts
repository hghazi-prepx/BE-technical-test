import { Test, TestingModule } from '@nestjs/testing';
import { TimerGateway } from '../src/gateway/timer.gateway';
import { ExamService } from '../src/exam/exam.service';
import { AuthService } from '../src/auth/auth.service';
import { AppConfigService } from '../src/config/app.config';
import { User, UserRole } from '../src/schemas/user.schema';
import { Exam, ExamStatus } from '../src/schemas/exam.schema';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';

describe('TimerGateway', () => {
  let gateway: TimerGateway;
  let examService: ExamService;
  let authService: AuthService;
  let appConfig: AppConfigService;
  let mockSocket: Partial<Socket>;
  let mockServer: Partial<Server>;

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.STUDENT
  };

  const mockExam = {
    _id: 'exam123',
    title: 'Test Exam',
    duration: 3600,
    remainingTime: 3600,
    status: 'pending',
    createdBy: 'instructor123',
    instructorId: 'instructor123',
    connectedStudents: []
  };

  const mockInstructor = {
    _id: 'instructor123',
    username: 'instructor',
    email: 'instructor@example.com',
    fullName: 'Test Instructor',
    role: UserRole.INSTRUCTOR
  };

  beforeEach(async () => {
    // Mock socket
    mockSocket = {
      id: 'socket123',
      connected: true,
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      on: jest.fn(),
      disconnect: jest.fn()
    };

    // Mock server
    const mockServerEmit = jest.fn();
    mockServer = {
      to: jest.fn().mockReturnValue({
        emit: mockServerEmit
      }),
      emit: mockServerEmit,
      sockets: {
        sockets: new Map([['socket123', mockSocket as Socket]])
      } as any
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimerGateway,
        {
          provide: ExamService,
          useValue: {
            getExam: jest.fn(),
            addStudentToExam: jest.fn(),
            removeStudentFromExam: jest.fn(),
            startTimer: jest.fn(),
            pauseTimer: jest.fn(),
            resetTimer: jest.fn(),
            adjustTimer: jest.fn(),
            getCurrentTimerState: jest.fn(),
            getStudentTimer: jest.fn()
          }
        },
        {
          provide: AuthService,
          useValue: {
            getUserProfile: jest.fn(),
            validateUser: jest.fn()
          }
        },
        {
          provide: AppConfigService,
          useValue: {
            maxTimeAdjustment: 1800
          }
        }
      ]
    }).compile();

    gateway = module.get<TimerGateway>(TimerGateway);
    examService = module.get<ExamService>(ExamService);
    authService = module.get<AuthService>(AuthService);
    appConfig = module.get<AppConfigService>(AppConfigService);

    // Set up the server mock
    gateway.server = mockServer as Server;

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should handle new client connection', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      
      gateway.handleConnection(mockSocket as Socket);

      expect(logSpy).toHaveBeenCalledWith('Client connected: socket123');
      expect(mockSocket.on).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      
      gateway.handleDisconnect(mockSocket as Socket);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Client disconnected: socket123')
      );
    });
  });

  describe('handleJoinExam', () => {
    it('should allow student to join exam successfully', async () => {
      authService.validateUser = jest.fn().mockResolvedValue(mockUser);
      examService.getExam = jest.fn().mockResolvedValue(mockExam);
      examService.getStudentTimer = jest.fn().mockResolvedValue({ examId: 'exam123', studentId: 'user123' });

      const joinData = { examId: 'exam123', userId: 'user123' };
      
      await gateway.handleJoinExam(mockSocket as Socket, joinData);

      expect(authService.validateUser).toHaveBeenCalledWith('user123');
      expect(examService.getExam).toHaveBeenCalledWith('exam123');
      expect(mockSocket.join).toHaveBeenCalledWith('exam123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joinExamResponse', expect.any(Object));
    });

    it('should allow instructor to join exam successfully', async () => {
      authService.validateUser = jest.fn().mockResolvedValue(mockInstructor);
      examService.getExam = jest.fn().mockResolvedValue(mockExam);

      const joinData = { examId: 'exam123', userId: 'instructor123' };
      
      await gateway.handleJoinExam(mockSocket as Socket, joinData);

      expect(authService.validateUser).toHaveBeenCalledWith('instructor123');
      expect(examService.getExam).toHaveBeenCalledWith('exam123');
      expect(mockSocket.join).toHaveBeenCalledWith('exam123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joinExamResponse', expect.any(Object));
    });

    it('should handle user not found error', async () => {
      authService.validateUser = jest.fn().mockRejectedValue(new Error('User not found'));

      const joinData = { examId: 'exam123', userId: 'nonexistent' };
      
      await gateway.handleJoinExam(mockSocket as Socket, joinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('joinExamResponse', {
        success: false,
        message: 'User not found or inactive',
        error: 'USER_NOT_FOUND'
      });
    });

    it('should handle exam not found error', async () => {
      authService.validateUser = jest.fn().mockResolvedValue(mockUser);
      examService.getExam = jest.fn().mockResolvedValue(null);

      const joinData = { examId: 'nonexistent', userId: 'user123' };
      
      await gateway.handleJoinExam(mockSocket as Socket, joinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('joinExamResponse', {
        success: false,
        message: 'Exam not found',
        error: 'EXAM_NOT_FOUND'
      });
    });
  });

  describe('handleStartTimer', () => {
    beforeEach(async () => {
      // Set mockSocket.id to match the key in clients map
      mockSocket.id = 'instructor-socket';
      // Manually add instructor to clients map
      gateway['clients'].set('instructor-socket', {
        userId: 'instructor123',
        examId: 'exam123',
        role: UserRole.INSTRUCTOR,
        socket: mockSocket as Socket
      });
    });

    it('should start timer for all students when no specific student provided', async () => {
      const startData = { examId: 'exam123' };
      
      await gateway.handleStartTimer(mockSocket as Socket, startData);

      expect(mockServer.to).toHaveBeenCalledWith('exam123');
      expect(mockServer.emit).toHaveBeenCalledWith('timerStarted', expect.any(Object));
    });

    it('should start timer for specific student when studentId provided', async () => {
      // Add a student to the exam
      const studentSocket = { ...mockSocket, id: 'student-socket', emit: jest.fn() };
      gateway['clients'].set('student-socket', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket as Socket
      });
      
      // Add student session
      gateway['studentSessions'].set('exam123_user123', {
        studentId: 'user123',
        userName: 'Test Student',
        socketId: 'student-socket',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });

      const startData = { examId: 'exam123', studentId: 'user123' };
      
      await gateway.handleStartTimer(mockSocket as Socket, startData);

      expect(mockSocket.emit).toHaveBeenCalledWith('timerStarted', expect.any(Object));
    });

    it('should handle unauthorized access', async () => {
      // Set up a student trying to start timer
      const studentSocket = { ...mockSocket, id: 'student-socket', emit: jest.fn() };
      gateway['clients'].set('student-socket', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket as Socket
      });

      const startData = { examId: 'exam123' };
      
      await gateway.handleStartTimer(studentSocket as Socket, startData);

      expect(studentSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Only instructors and admins can start the timer'
      });
    });
  });

  describe('handlePauseTimer', () => {
    beforeEach(async () => {
      // Set mockSocket.id to match the key in clients map
      mockSocket.id = 'instructor-socket';
      // Manually add instructor to clients map
      gateway['clients'].set('instructor-socket', {
        userId: 'instructor123',
        examId: 'exam123',
        role: UserRole.INSTRUCTOR,
        socket: mockSocket as Socket
      });
    });

    it('should pause timer for all students when no specific student provided', async () => {
      const pauseData = { examId: 'exam123' };
      
      await gateway.handlePauseTimer(mockSocket as Socket, pauseData);

      expect(mockServer.to).toHaveBeenCalledWith('exam123');
      expect(mockServer.emit).toHaveBeenCalledWith('timerPaused', expect.any(Object));
    });

    it('should pause timer for specific student when studentId provided', async () => {
      // Add a student to the exam
      const studentSocket = { ...mockSocket, id: 'student-socket', emit: jest.fn() };
      gateway['clients'].set('student-socket', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket as Socket
      });
      
      // Add student session
      gateway['studentSessions'].set('exam123_user123', {
        studentId: 'user123',
        userName: 'Test Student',
        socketId: 'student-socket',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });

      const pauseData = { examId: 'exam123', studentId: 'user123' };
      
      await gateway.handlePauseTimer(mockSocket as Socket, pauseData);

      expect(mockSocket.emit).toHaveBeenCalledWith('timerPaused', expect.any(Object));
    });
  });

  describe('handleResetTimer', () => {
    beforeEach(async () => {
      // Set mockSocket.id to match the key in clients map
      mockSocket.id = 'instructor-socket';
      // Manually add instructor to clients map
      gateway['clients'].set('instructor-socket', {
        userId: 'instructor123',
        examId: 'exam123',
        role: UserRole.INSTRUCTOR,
        socket: mockSocket as Socket
      });
    });

    it('should reset timer for all students when no specific student provided', async () => {
      const resetData = { examId: 'exam123' };
      
      await gateway.handleResetTimer(mockSocket as Socket, resetData);

      expect(mockServer.to).toHaveBeenCalledWith('exam123');
      expect(mockServer.emit).toHaveBeenCalledWith('timerReset', expect.any(Object));
    });

    it('should reset timer for specific student when studentId provided', async () => {
      // Add a student to the exam
      const studentSocket = { ...mockSocket, id: 'student-socket', emit: jest.fn() };
      gateway['clients'].set('student-socket', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket as Socket
      });
      
      // Add student session
      gateway['studentSessions'].set('exam123_user123', {
        studentId: 'user123',
        userName: 'Test Student',
        socketId: 'student-socket',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });

      const resetData = { examId: 'exam123', studentId: 'user123' };
      
      await gateway.handleResetTimer(mockSocket as Socket, resetData);

      expect(mockSocket.emit).toHaveBeenCalledWith('timerReset', expect.any(Object));
    });
  });

  describe('handleAdjustTimer', () => {
    beforeEach(async () => {
      // Set mockSocket.id to match the key in clients map
      mockSocket.id = 'instructor-socket';
      // Manually add instructor to clients map
      gateway['clients'].set('instructor-socket', {
        userId: 'instructor123',
        examId: 'exam123',
        role: UserRole.INSTRUCTOR,
        socket: mockSocket as Socket
      });
    });

    it('should adjust timer for specific student', async () => {
      // Add a student to the exam
      const studentSocket = { ...mockSocket, id: 'student-socket', emit: jest.fn() };
      gateway['clients'].set('student-socket', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket as Socket
      });
      
      // Add student session
      gateway['studentSessions'].set('exam123_user123', {
        studentId: 'user123',
        userName: 'Test Student',
        socketId: 'student-socket',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });

      const adjustData = {
        examId: 'exam123',
        studentId: 'user123',
        timeAdjustment: 300
      };
      
      await gateway.handleAdjustTimer(mockSocket as Socket, adjustData);

      expect(mockSocket.emit).toHaveBeenCalledWith('timerAdjusted', expect.any(Object));
    });

    it('should adjust timer for multiple specific students', async () => {
      // Add students to the exam
      const studentSocket1 = { ...mockSocket, id: 'student-socket1', emit: jest.fn() };
      const studentSocket2 = { ...mockSocket, id: 'student-socket2', emit: jest.fn() };
      
      gateway['clients'].set('student-socket1', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket1 as Socket
      });
      
      gateway['clients'].set('student-socket2', {
        userId: 'user456',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: studentSocket2 as Socket
      });
      
      // Add student sessions
      gateway['studentSessions'].set('exam123_user123', {
        studentId: 'user123',
        userName: 'Test Student 1',
        socketId: 'student-socket1',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });
      
      gateway['studentSessions'].set('exam123_user456', {
        studentId: 'user456',
        userName: 'Test Student 2',
        socketId: 'student-socket2',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });

      const adjustData = {
        examId: 'exam123',
        studentIds: ['user123', 'user456'],
        timeAdjustment: 300
      };
      
      await gateway.handleAdjustTimer(mockSocket as Socket, adjustData);

      expect(mockSocket.emit).toHaveBeenCalledWith('timerAdjusted', expect.any(Object));
    });

    it('should handle excessive time adjustment', async () => {
      const adjustData = {
        examId: 'exam123',
        timeAdjustment: 2000 // Exceeds maxTimeAdjustment
      };
      
      await gateway.handleAdjustTimer(mockSocket as Socket, adjustData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });

  describe('handleLeaveExam', () => {
    it('should handle student leaving exam', async () => {
      // Set mockSocket.id to match the key in clients map
      mockSocket.id = 'student-socket';
      // Manually add student to clients map
      examService.removeStudentFromExam = jest.fn().mockResolvedValue(undefined);
      
      gateway['clients'].set('student-socket', {
        userId: 'user123',
        examId: 'exam123',
        role: UserRole.STUDENT,
        socket: mockSocket as Socket
      });

      const leaveData = { examId: 'exam123' };
      
      await gateway.handleLeaveExam(mockSocket as Socket, leaveData);

      expect(mockSocket.leave).toHaveBeenCalledWith('exam123');
      expect(mockSocket.emit).toHaveBeenCalledWith('leaveExamResponse', expect.any(Object));
    });
  });

  describe('handleRequestStudentSessions', () => {
    it('should return student sessions for instructor', async () => {
      // Manually add instructor to clients map
      (gateway as any).clients.set('socket123', {
        examId: 'exam123',
        userId: 'instructor123',
        role: 'instructor',
        userName: 'Test Instructor',
        joinedAt: new Date()
      });

      const requestData = { examId: 'exam123' };
      
      gateway.handleRequestStudentSessions(mockSocket as Socket, requestData);

      expect(mockSocket.emit).toHaveBeenCalledWith('studentSessionsUpdate', expect.any(Object));
    });
  });

  describe('handleConnectionHealthCheck', () => {
    it('should respond to health check request', () => {
      gateway.handleConnectionHealthCheck(mockSocket as Socket, {});

      expect(mockSocket.emit).toHaveBeenCalledWith('connectionHealthResponse', expect.any(Object));
    });
  });

  describe('handleRequestReconnection', () => {
    it('should handle reconnection request', async () => {
      authService.getUserProfile = jest.fn().mockResolvedValue(mockUser);
      examService.getExam = jest.fn().mockResolvedValue(mockExam);

      const reconnectData = {
        examId: 'exam123',
        userId: 'user123',
        lastKnownState: { remainingTime: 3000 }
      };
      
      await gateway.handleRequestReconnection(mockSocket as Socket, reconnectData);

      expect(mockSocket.emit).toHaveBeenCalledWith('reconnectionResponse', expect.any(Object));
    });
  });

  describe('handleSelectStudent', () => {
    it('should handle student selection by instructor', async () => {
      // Manually add instructor to clients map
      (gateway as any).clients.set('socket123', {
        examId: 'exam123',
        userId: 'instructor123',
        role: 'instructor',
        userName: 'Test Instructor',
        joinedAt: new Date()
      });

      // Manually add student session
      (gateway as any).studentSessions.set('exam123_user123', {
        studentId: 'user123',
        userName: 'Test User',
        socketId: 'student-socket',
        examId: 'exam123',
        isConnected: true,
        joinedAt: new Date(),
        timerState: {
          status: 'stopped',
          remainingTime: 3600,
          totalTime: 3600,
          timeAdjustment: 0
        }
      });
      
      const selectData = { examId: 'exam123', studentId: 'user123' };
      
      gateway.handleSelectStudent(mockSocket as Socket, selectData);

      expect(mockSocket.emit).toHaveBeenCalledWith('studentSelected', expect.any(Object));
    });
  });

  describe('getConnectedClientsCount', () => {
    it('should return correct count of connected clients', async () => {
      // Join some clients to an exam
      authService.getUserProfile = jest.fn().mockResolvedValue(mockUser);
      examService.getExam = jest.fn().mockResolvedValue(mockExam);
      
      const joinData = { examId: 'exam123', userId: 'user123' };
      await gateway.handleJoinExam(mockSocket as Socket, joinData);

      const count = gateway.getConnectedClientsCount('exam123');
      
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for exam with no connected clients', () => {
      const count = gateway.getConnectedClientsCount('nonexistent-exam');
      
      expect(count).toBe(0);
    });
  });
});