import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app.config';
import { ExamService } from '../exam/exam.service';
import { AuthService } from '../auth/auth.service';
import { TimerState } from '../interfaces/timer-state.interface';
import { UserRole } from '../schemas/user.schema';

/**
 * Interface representing client connection information
 * Stores basic information about connected WebSocket clients
 */
interface ClientInfo {
  examId: string; // ID of the exam the client is connected to
  userId: string; // Unique identifier for the user
  role: UserRole; // User role (student, instructor, admin)
  userName?: string; // Optional display name for the user
  joinedAt: Date; // Timestamp when the client joined the exam
}

/**
 * Interface representing a student's exam session
 * Contains all information about a student's participation in an exam
 */
interface StudentSession {
  studentId: string; // Unique identifier for the student
  userName: string; // Student's display name
  socketId: string; // Current WebSocket connection ID
  examId: string; // ID of the exam the student is participating in
  isConnected: boolean; // Whether the student is currently connected
  joinedAt: Date; // Timestamp when the student first joined the exam
  // Individual timer state for each student session
  timerState: {
    status: 'stopped' | 'running' | 'paused'; // Current timer status
    remainingTime: number; // Time remaining in seconds
    totalTime: number; // Total exam duration in seconds
    startedAt?: Date; // Timestamp when timer was started
    pausedAt?: Date; // Timestamp when timer was paused
    timeAdjustment: number; // Total time adjustments made in seconds
  };
}

/**
 * WebSocket Gateway for handling real-time timer functionality in exam system
 * Manages student sessions, timer states, and real-time communication between
 * instructors and students during exams
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Enhanced connection settings for better network handling
  pingTimeout: 60000, // 60 seconds timeout for ping
  pingInterval: 25000, // 25 seconds interval for ping
  upgradeTimeout: 30000, // 30 seconds timeout for connection upgrade
  allowEIO3: true, // Allow Engine.IO v3 clients for better compatibility
  // Transport configuration for deployment platforms like Render
  transports: ['websocket', 'polling'],
  // Additional settings for production deployment
  allowUpgrades: true,
  cookie: false,
})
@Injectable()
export class TimerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TimerGateway.name);

  // Map to store basic client connection information
  private clients: Map<string, ClientInfo> = new Map();

  // Map to track which clients are in which exam rooms
  private examRooms: Map<string, Set<string>> = new Map();

  // Map to store detailed student session data with individual timer states
  private studentSessions: Map<string, StudentSession> = new Map(); // key: examId_studentId

  // Map to track which students are connected to which exams
  private examStudentSockets: Map<string, Set<string>> = new Map(); // key: examId, value: set of studentIds

  // Map to store active timer intervals for each student
  private studentTimerIntervals: Map<string, NodeJS.Timeout> = new Map(); // key: examId_studentId, value: timer interval

  // Connection monitoring and heartbeat management
  private connectionHeartbeats: Map<string, NodeJS.Timeout> = new Map(); // key: socketId, value: heartbeat interval
  private connectionAttempts: Map<string, number> = new Map(); // key: userId_examId, value: reconnection attempts
  private lastPingTimes: Map<string, Date> = new Map(); // key: socketId, value: last ping timestamp
  private networkQuality: Map<string, 'good' | 'poor' | 'unstable'> = new Map(); // key: socketId, value: network quality

  constructor(
    private readonly examService: ExamService,
    private readonly authService: AuthService,
    private readonly appConfig: AppConfigService,
  ) {}

  /**
   * Handles new WebSocket client connections
   * Initializes connection monitoring, heartbeat mechanism, and network quality tracking
   * @param client - The connected WebSocket client
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);

    // Initialize connection monitoring
    this.initializeConnectionMonitoring(client);

    // Set up heartbeat mechanism
    this.setupHeartbeat(client);

    // Initialize network quality as good
    this.networkQuality.set(client.id, 'good');

    // Set up connection event listeners for better error handling
    this.setupConnectionEventListeners(client);
  }

  /**
   * Handles WebSocket client disconnections
   * Cleans up client data, exam rooms, student sessions, and connection monitoring resources
   * Maintains session data for potential reconnection with enhanced recovery mechanisms
   * @param client - The disconnected WebSocket client
   */
  handleDisconnect(client: Socket): void {
    const disconnectTime = new Date();
    this.logger.log(
      `Client disconnected: ${client.id} at ${disconnectTime.toISOString()}`,
    );

    // Clean up connection monitoring resources
    this.cleanupConnectionMonitoring(client.id);

    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      // Log network quality at disconnection for analysis
      const networkQuality = this.networkQuality.get(client.id) || 'unknown';
      this.logger.log(
        `Client ${client.id} disconnected with network quality: ${networkQuality}`,
      );

      // Remove client from exam room
      const examRoom = this.examRooms.get(clientInfo.examId);
      if (examRoom) {
        examRoom.delete(client.id);
        if (examRoom.size === 0) {
          this.examRooms.delete(clientInfo.examId);
        }
      }

      // Handle student session cleanup with enhanced reconnection support
      if (clientInfo.role === UserRole.STUDENT) {
        const sessionKey = `${clientInfo.examId}_${clientInfo.userId}`;
        const studentSession = this.studentSessions.get(sessionKey);

        if (studentSession) {
          // Mark as disconnected but preserve session data for reconnection
          studentSession.isConnected = false;
          studentSession.socketId = '';

          // Store disconnection time for reconnection timeout handling
          (studentSession as any).lastDisconnectedAt = disconnectTime;

          // Preserve timer state if running to allow seamless reconnection
          if (studentSession.timerState.status === 'running') {
            this.logger.log(
              `Preserving running timer state for student ${clientInfo.userName} during disconnection`,
            );
          }

          this.studentSessions.set(sessionKey, studentSession);

          // Remove from active sockets
          const examStudentSockets = this.examStudentSockets.get(
            clientInfo.examId,
          );
          if (examStudentSockets) {
            examStudentSockets.delete(clientInfo.userId);
          }

          // Notify instructors about disconnection with enhanced information
          void this.broadcastStudentSessionUpdate(clientInfo.examId);

          this.logger.log(
            `Student ${clientInfo.userName} (${clientInfo.userId}) disconnected from exam ${clientInfo.examId}. Session preserved for reconnection.`,
          );
        }
      }

      this.clients.delete(client.id);
    }

    // Clean up network quality tracking
    this.networkQuality.delete(client.id);
  }

  /**
   * Handles user joining an exam room
   * Validates user and exam existence, manages client connections,
   * and initializes student sessions with timer state
   * @param client - The WebSocket client requesting to join
   * @param data - Contains examId and userId for the join request
   */
  @SubscribeMessage('joinExam')
  async handleJoinExam(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { examId: string; userId: string },
  ) {
    try {
      const { examId, userId } = data;

      // Validate user exists and is active
      let user;
      try {
        user = await this.authService.validateUser(userId);
      } catch (error) {
        client.emit('joinExamResponse', {
          success: false,
          message: 'User not found or inactive',
          error: 'USER_NOT_FOUND',
        });
        return;
      }

      // Validate exam exists
      const exam = await this.examService.getExam(examId);
      if (!exam) {
        client.emit('joinExamResponse', {
          success: false,
          message: 'Exam not found',
          error: 'EXAM_NOT_FOUND',
        });
        return;
      }

      // Check user permissions based on role
      if (user.role === UserRole.STUDENT) {
        // For students: check if they are added to the exam
        const studentTimer = await this.examService.getStudentTimer(
          examId,
          userId,
        );
        if (!studentTimer) {
          client.emit('joinExamResponse', {
            success: false,
            message: 'You have not been added to this exam by the instructor',
            error: 'STUDENT_NOT_ENROLLED',
          });
          return;
        }
      } else if (user.role === UserRole.INSTRUCTOR) {
        // For instructors: check if they own the exam
        if (exam.instructorId !== userId) {
          client.emit('joinExamResponse', {
            success: false,
            message: 'You do not have permission to access this exam',
            error: 'INSTRUCTOR_NOT_OWNER',
          });
          return;
        }
      } else {
        // Admin can access any exam
        // No additional checks needed
      }

      // Store client info
      this.clients.set(client.id, {
        examId,
        userId,
        role: user.role,
        userName: user.fullName,
        joinedAt: new Date(),
      });

      // Join exam room
      void client.join(examId);

      // Add to exam rooms tracking
      if (!this.examRooms.has(examId)) {
        this.examRooms.set(examId, new Set());
      }
      this.examRooms.get(examId)?.add(client.id);

      // Handle student connection - simplified centralized approach
      if (user.role === UserRole.STUDENT) {
        const sessionKey = `${examId}_${userId}`;

        // Check if student session already exists (from previous connection)
        let studentSession = this.studentSessions.get(sessionKey);

        if (studentSession) {
          // Handle reconnection with enhanced recovery
          this.handleReconnection(client, examId, userId);

          // Update existing session - student is reconnecting
          studentSession.socketId = client.id;
          studentSession.isConnected = true;

          // Check if session was disconnected recently and restore timer state
          const lastDisconnectedAt = (studentSession as any).lastDisconnectedAt;
          if (lastDisconnectedAt) {
            const disconnectionDuration =
              new Date().getTime() - new Date(lastDisconnectedAt).getTime();

            // If timer was running and disconnection was brief, continue timer
            if (
              studentSession.timerState.status === 'running' &&
              disconnectionDuration < 300000
            ) {
              // 5 minutes
              this.logger.log(
                `Restoring running timer for student ${user.fullName} after ${Math.round(disconnectionDuration / 1000)}s disconnection`,
              );

              // Adjust remaining time based on disconnection duration
              const timeElapsed = Math.floor(disconnectionDuration / 1000);
              studentSession.timerState.remainingTime = Math.max(
                0,
                studentSession.timerState.remainingTime - timeElapsed,
              );

              // Restart timer interval if still time remaining
              if (studentSession.timerState.remainingTime > 0) {
                const sessionKey = `${examId}_${userId}`;
                this.startStudentTimerInterval(sessionKey);
              }
            }

            // Clear disconnection timestamp
            delete (studentSession as any).lastDisconnectedAt;
          }

          this.logger.log(
            `Student ${user.fullName} (${userId}) reconnected to exam ${examId}`,
          );
        } else {
          // Create new student session for first-time connection with individual timer
          const examData = await this.examService.getExam(examId);
          studentSession = {
            studentId: userId,
            userName: user.fullName,
            socketId: client.id,
            examId: examId,
            isConnected: true,
            joinedAt: new Date(),
            timerState: {
              status: 'stopped',
              remainingTime: examData?.duration || 3600, // Default 1 hour if no duration
              totalTime: examData?.duration || 3600,
              timeAdjustment: 0,
            },
          };
          this.logger.log(
            `Student ${user.fullName} (${userId}) connected to exam ${examId} for the first time`,
          );
        }

        this.studentSessions.set(sessionKey, studentSession);

        // Track student socket for exam
        if (!this.examStudentSockets.has(examId)) {
          this.examStudentSockets.set(examId, new Set());
        }
        this.examStudentSockets.get(examId)?.add(userId);

        // Notify instructors about student connection
        void this.broadcastStudentSessionUpdate(examId);

        this.logger.log(
          `Student ${user.fullName} (${userId}) connected to exam ${examId}`,
        );
      }

      // Send current timer state to the client
      if (user.role === UserRole.STUDENT) {
        // Send individual student timer state
        const sessionKey = `${examId}_${userId}`;
        const studentSession = this.studentSessions.get(sessionKey);
        if (studentSession) {
          client.emit('timerUpdate', {
            status: studentSession.timerState.status,
            remainingTime: studentSession.timerState.remainingTime,
            totalTime: studentSession.timerState.totalTime,
            timeAdjustment: studentSession.timerState.timeAdjustment,
            examId: examId,
            studentId: userId,
          });
        }
      } else {
        // For instructors, send exam-level timer state (will be updated when student is selected)
        const timerState: TimerState =
          await this.examService.getCurrentTimerState(examId);
        client.emit('timerUpdate', timerState);
      }

      this.logger.log(
        `${user.role} ${user.fullName} (${userId}) joined exam ${examId}`,
      );

      client.emit('joinExamResponse', {
        success: true,
        examId,
        userId,
        role: user.role,
        userName: user.fullName,
        message: 'Successfully joined the exam',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error joining exam: ${errorMessage}`);
      client.emit('joinExamResponse', {
        success: false,
        message: 'Failed to join exam',
        error: errorMessage,
      });
    }
  }

  /**
   * Handles timer start requests from instructors/admins
   * Can start timer for a specific student or all students in an exam
   * Updates timer state and broadcasts changes to relevant clients
   * @param client - The WebSocket client requesting timer start
   * @param data - Contains examId and optional studentId for targeted timer start
   */
  @SubscribeMessage('startTimer')
  async handleStartTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string; studentId?: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message:
            'Unauthorized: Only instructors and admins can start the timer',
        });
        return;
      }

      if (data.studentId) {
        // Start timer for specific student
        const sessionKey = `${data.examId}_${data.studentId}`;
        const studentSession = this.studentSessions.get(sessionKey);

        if (!studentSession) {
          client.emit('error', {
            message: 'Student session not found',
          });
          return;
        }

        // Start individual student timer
        studentSession.timerState.status = 'running';
        studentSession.timerState.startedAt = new Date();
        this.studentSessions.set(sessionKey, studentSession);

        // Start countdown interval for this student
        this.startStudentTimerInterval(sessionKey);

        // Send timer update to the specific student
        if (studentSession.isConnected) {
          this.server.to(studentSession.socketId).emit('timerUpdate', {
            status: studentSession.timerState.status,
            remainingTime: studentSession.timerState.remainingTime,
            totalTime: studentSession.timerState.totalTime,
            timeAdjustment: studentSession.timerState.timeAdjustment,
            examId: data.examId,
            studentId: data.studentId,
          });
        }

        // Notify instructor about timer start
        client.emit('timerStarted', {
          timestamp: new Date().toISOString(),
          startedBy: clientInfo.userId,
          examId: data.examId,
          studentId: data.studentId,
        });

        this.logger.log(
          `Timer started for student ${data.studentId} in exam ${data.examId} by ${clientInfo.userId}`,
        );
      } else {
        // Start timer for all students in the exam
        this.studentSessions.forEach((session, sessionKey) => {
          if (session.examId === data.examId) {
            session.timerState.status = 'running';
            session.timerState.startedAt = new Date();
            this.studentSessions.set(sessionKey, session);

            // Start countdown interval for each student
            this.startStudentTimerInterval(sessionKey);

            // Send timer update to each student
            if (session.isConnected) {
              this.server.to(session.socketId).emit('timerUpdate', {
                status: session.timerState.status,
                remainingTime: session.timerState.remainingTime,
                totalTime: session.timerState.totalTime,
                timeAdjustment: session.timerState.timeAdjustment,
                examId: data.examId,
                studentId: session.studentId,
              });
            }
          }
        });

        // Broadcast to all clients in the exam room
        this.server.to(data.examId).emit('timerStarted', {
          timestamp: new Date().toISOString(),
          startedBy: clientInfo.userId,
          examId: data.examId,
        });

        this.logger.log(
          `Timer started for all students in exam ${data.examId} by ${clientInfo.userId}`,
        );
      }

      // Broadcast updated student sessions
      void this.broadcastStudentSessionUpdate(data.examId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error starting timer: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to start timer',
        error: errorMessage,
      });
    }
  }

  /**
   * Handles timer pause requests from instructors/admins
   * Can pause timer for a specific student or all students in an exam
   * Stops timer intervals and updates timer state accordingly
   * @param client - The WebSocket client requesting timer pause
   * @param data - Contains examId and optional studentId for targeted timer pause
   */
  @SubscribeMessage('pauseTimer')
  async handlePauseTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string; studentId?: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message:
            'Unauthorized: Only instructors and admins can pause the timer',
        });
        return;
      }

      if (data.studentId) {
        // Pause timer for specific student
        const sessionKey = `${data.examId}_${data.studentId}`;
        const studentSession = this.studentSessions.get(sessionKey);

        if (!studentSession) {
          client.emit('error', {
            message: 'Student session not found',
          });
          return;
        }

        // Pause individual student timer
        studentSession.timerState.status = 'paused';
        studentSession.timerState.pausedAt = new Date();
        this.studentSessions.set(sessionKey, studentSession);

        // Stop countdown interval for this student
        this.stopStudentTimerInterval(sessionKey);

        // Send timer update to the specific student
        if (studentSession.isConnected) {
          this.server.to(studentSession.socketId).emit('timerUpdate', {
            status: studentSession.timerState.status,
            remainingTime: studentSession.timerState.remainingTime,
            totalTime: studentSession.timerState.totalTime,
            timeAdjustment: studentSession.timerState.timeAdjustment,
            examId: data.examId,
            studentId: data.studentId,
          });
        }

        // Notify instructor about timer pause
        client.emit('timerPaused', {
          timestamp: new Date().toISOString(),
          pausedBy: clientInfo.userId,
          examId: data.examId,
          studentId: data.studentId,
        });

        this.logger.log(
          `Timer paused for student ${data.studentId} in exam ${data.examId} by ${clientInfo.userId}`,
        );
      } else {
        // Pause timer for all students in the exam
        this.studentSessions.forEach((session, sessionKey) => {
          if (
            session.examId === data.examId &&
            session.timerState.status === 'running'
          ) {
            session.timerState.status = 'paused';
            session.timerState.pausedAt = new Date();
            this.studentSessions.set(sessionKey, session);

            // Stop countdown interval for each student
            this.stopStudentTimerInterval(sessionKey);

            // Send timer update to each student
            if (session.isConnected) {
              this.server.to(session.socketId).emit('timerUpdate', {
                status: session.timerState.status,
                remainingTime: session.timerState.remainingTime,
                totalTime: session.timerState.totalTime,
                timeAdjustment: session.timerState.timeAdjustment,
                examId: data.examId,
                studentId: session.studentId,
              });
            }
          }
        });

        // Broadcast to all clients in the exam room
        this.server.to(data.examId).emit('timerPaused', {
          timestamp: new Date().toISOString(),
          pausedBy: clientInfo.userId,
          examId: data.examId,
        });

        this.logger.log(
          `Timer paused for all students in exam ${data.examId} by ${clientInfo.userId}`,
        );
      }

      // Broadcast updated student sessions
      void this.broadcastStudentSessionUpdate(data.examId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error pausing timer: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to pause timer',
        error: errorMessage,
      });
    }
  }

  /**
   * Handles timer reset requests from instructors/admins
   * Resets timer to original exam duration and stops all intervals
   * Can reset timer for a specific student or all students in an exam
   * @param client - The WebSocket client requesting timer reset
   * @param data - Contains examId and optional studentId for targeted timer reset
   */
  @SubscribeMessage('resetTimer')
  async handleResetTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string; studentId?: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message:
            'Unauthorized: Only instructors and admins can reset the timer',
        });
        return;
      }

      if (data.studentId) {
        // Reset timer for specific student
        const sessionKey = `${data.examId}_${data.studentId}`;
        const studentSession = this.studentSessions.get(sessionKey);

        if (!studentSession) {
          client.emit('error', {
            message: 'Student session not found',
          });
          return;
        }

        // Get exam data to reset to original duration
        const examData = await this.examService.getExam(data.examId);
        const originalDuration = examData?.duration || 3600;

        // Reset individual student timer
        studentSession.timerState.status = 'stopped';
        studentSession.timerState.remainingTime = originalDuration;
        studentSession.timerState.totalTime = originalDuration;
        studentSession.timerState.timeAdjustment = 0;
        studentSession.timerState.startedAt = undefined;
        studentSession.timerState.pausedAt = undefined;
        this.studentSessions.set(sessionKey, studentSession);

        // Stop countdown interval for this student
        this.stopStudentTimerInterval(sessionKey);

        // Send timer update to the specific student
        if (studentSession.isConnected) {
          this.server.to(studentSession.socketId).emit('timerUpdate', {
            status: studentSession.timerState.status,
            remainingTime: studentSession.timerState.remainingTime,
            totalTime: studentSession.timerState.totalTime,
            timeAdjustment: studentSession.timerState.timeAdjustment,
            examId: data.examId,
            studentId: data.studentId,
          });
        }

        // Notify instructor about timer reset
        client.emit('timerReset', {
          timestamp: new Date().toISOString(),
          resetBy: clientInfo.userId,
          examId: data.examId,
          studentId: data.studentId,
        });

        this.logger.log(
          `Timer reset for student ${data.studentId} in exam ${data.examId} by ${clientInfo.userId}`,
        );
      } else {
        // Reset timer for all students in the exam
        const examData = await this.examService.getExam(data.examId);
        const originalDuration = examData?.duration || 3600;

        this.studentSessions.forEach((session, sessionKey) => {
          if (session.examId === data.examId) {
            session.timerState.status = 'stopped';
            session.timerState.remainingTime = originalDuration;
            session.timerState.totalTime = originalDuration;
            session.timerState.timeAdjustment = 0;
            session.timerState.startedAt = undefined;
            session.timerState.pausedAt = undefined;
            this.studentSessions.set(sessionKey, session);

            // Stop countdown interval for each student
            this.stopStudentTimerInterval(sessionKey);

            // Send timer update to each student
            if (session.isConnected) {
              this.server.to(session.socketId).emit('timerUpdate', {
                status: session.timerState.status,
                remainingTime: session.timerState.remainingTime,
                totalTime: session.timerState.totalTime,
                timeAdjustment: session.timerState.timeAdjustment,
                examId: data.examId,
                studentId: session.studentId,
              });
            }
          }
        });

        // Broadcast to all clients in the exam room
        this.server.to(data.examId).emit('timerReset', {
          timestamp: new Date().toISOString(),
          resetBy: clientInfo.userId,
          examId: data.examId,
        });

        this.logger.log(
          `Timer reset for all students in exam ${data.examId} by ${clientInfo.userId}`,
        );
      }

      // Broadcast updated student sessions
      void this.broadcastStudentSessionUpdate(data.examId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error resetting timer: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to reset timer',
        error: errorMessage,
      });
    }
  }

  /**
   * Handles timer adjustment requests from instructors/admins
   * Allows adding or subtracting time from student timers
   * Can adjust time for specific students or all students in an exam
   * @param client - The WebSocket client requesting timer adjustment
   * @param data - Contains examId, timeAdjustment (in seconds), and optional studentIds array
   */
  @SubscribeMessage('adjustTimer')
  async handleAdjustTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      examId: string;
      timeAdjustment: number;
      studentIds?: string[];
      studentId?: string;
    },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message:
            'Unauthorized: Only instructors and admins can adjust the timer',
        });
        return;
      }

      // Handle single student adjustment (from frontend)
      if (data.studentId) {
        const sessionKey = `${data.examId}_${data.studentId}`;
        const studentSession = this.studentSessions.get(sessionKey);

        if (!studentSession) {
          client.emit('error', {
            message: 'Student session not found',
          });
          return;
        }

        // Apply time adjustment to individual student timer only
        studentSession.timerState.timeAdjustment += data.timeAdjustment;
        studentSession.timerState.remainingTime += data.timeAdjustment;
        studentSession.timerState.totalTime += data.timeAdjustment;

        // Ensure remaining time doesn't go below 0
        if (studentSession.timerState.remainingTime < 0) {
          studentSession.timerState.remainingTime = 0;
        }

        this.studentSessions.set(sessionKey, studentSession);

        // Send timer update only to the specific student
        if (studentSession.isConnected) {
          this.server.to(studentSession.socketId).emit('timerUpdate', {
            status: studentSession.timerState.status,
            remainingTime: studentSession.timerState.remainingTime,
            totalTime: studentSession.timerState.totalTime,
            timeAdjustment: studentSession.timerState.timeAdjustment,
            examId: data.examId,
            studentId: data.studentId,
          });
        }

        // Notify instructor about the adjustment
        client.emit('timerAdjusted', {
          timeAdjustment: data.timeAdjustment,
          adjustedBy: clientInfo.userId,
          targetStudent: data.studentId,
          examId: data.examId,
          timestamp: new Date().toISOString(),
        });

        // Broadcast updated student sessions to instructors
        void this.broadcastStudentSessionUpdate(data.examId);

        this.logger.log(
          `Timer adjusted for student ${data.studentId} in exam ${data.examId} by ${clientInfo.userId}: ${data.timeAdjustment}s`,
        );
        return;
      }

      if (data.studentIds && data.studentIds.length > 0) {
        // Adjust timer for specific students
        for (const studentId of data.studentIds) {
          const sessionKey = `${data.examId}_${studentId}`;
          const studentSession = this.studentSessions.get(sessionKey);

          if (studentSession) {
            // Apply time adjustment to individual student timer
            studentSession.timerState.timeAdjustment += data.timeAdjustment;
            studentSession.timerState.remainingTime += data.timeAdjustment;
            studentSession.timerState.totalTime += data.timeAdjustment;
            this.studentSessions.set(sessionKey, studentSession);

            // Send timer update to the specific student
            if (studentSession.isConnected) {
              this.server.to(studentSession.socketId).emit('timerUpdate', {
                status: studentSession.timerState.status,
                remainingTime: studentSession.timerState.remainingTime,
                totalTime: studentSession.timerState.totalTime,
                timeAdjustment: studentSession.timerState.timeAdjustment,
                examId: data.examId,
                studentId: studentId,
              });
            }
          }
        }

        // Notify instructor about timer adjustment
        client.emit('timerAdjusted', {
          timeAdjustment: data.timeAdjustment,
          studentIds: data.studentIds,
          adjustedBy: clientInfo.userId,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `Timer adjusted for students ${data.studentIds.join(', ')} in exam ${data.examId} by ${clientInfo.userId}: ${data.timeAdjustment}s`,
        );
      } else {
        // No specific students provided - require explicit student selection
        client.emit('error', {
          message: 'Student IDs must be specified for timer adjustments',
        });
        return;
      }

      // Broadcast updated student sessions
      void this.broadcastStudentSessionUpdate(data.examId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error adjusting timer: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to adjust timer',
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage('leaveExam')
  async handleLeaveExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (!clientInfo) {
        client.emit('error', {
          message: 'You are not currently in an exam',
        });
        return;
      }

      if (clientInfo.examId !== data.examId) {
        client.emit('error', {
          message: 'You are not in this exam',
        });
        return;
      }

      // Remove client from exam room
      const examRoom = this.examRooms.get(data.examId);
      if (examRoom) {
        examRoom.delete(client.id);
        if (examRoom.size === 0) {
          this.examRooms.delete(data.examId);
        }
      }

      // Update student status if it's a student
      if (clientInfo.role === UserRole.STUDENT) {
        // Don't remove student from database, just mark as disconnected
        // Update student session to show as disconnected
        const sessionKey = `${data.examId}_${clientInfo.userId}`;
        const studentSession = this.studentSessions.get(sessionKey);
        if (studentSession) {
          studentSession.isConnected = false;
          this.studentSessions.set(sessionKey, studentSession);
        }

        // Notify other clients about student disconnection (not removal)
        this.server.to(data.examId).emit('studentDisconnected', {
          userId: clientInfo.userId,
          userName: clientInfo.userName,
          isConnected: false,
          timestamp: new Date().toISOString(),
        });

        // Broadcast updated student sessions to show disconnected status
        this.broadcastStudentSessionUpdate(data.examId);
      }

      // Remove client info
      this.clients.delete(client.id);

      // Leave the socket room
      client.leave(data.examId);

      // Send success response
      client.emit('leaveExamResponse', {
        success: true,
        message: 'Successfully left the exam',
        examId: data.examId,
      });

      this.logger.log(
        `User ${clientInfo.userId} left exam ${data.examId} as ${clientInfo.role}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      client.emit('error', {
        message: `Failed to leave exam: ${errorMessage}`,
      });
      this.logger.error(`Error leaving exam: ${errorMessage}`);
    }
  }

  @SubscribeMessage('requestStudentSessions')
  handleRequestStudentSessions(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message: 'Unauthorized: Only instructors can view student sessions',
        });
        return;
      }

      const studentSessions = this.getStudentSessionsForExam(data.examId);
      client.emit('studentSessionsUpdate', {
        examId: data.examId,
        students: studentSessions,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting student sessions: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to get student sessions',
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage('adjustStudentTimer')
  async handleAdjustStudentTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { examId: string; studentId: string; timeAdjustment: number },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message: 'Unauthorized: Only instructors can adjust student timers',
        });
        return;
      }

      // Adjust timer for the specific student only
      const sessionKey = `${data.examId}_${data.studentId}`;
      const studentSession = this.studentSessions.get(sessionKey);

      if (!studentSession) {
        client.emit('error', {
          message: 'Student session not found',
        });
        return;
      }

      // Apply time adjustment to individual student timer only
      studentSession.timerState.timeAdjustment += data.timeAdjustment;
      studentSession.timerState.remainingTime += data.timeAdjustment;
      studentSession.timerState.totalTime += data.timeAdjustment;

      // Ensure remaining time doesn't go below 0
      if (studentSession.timerState.remainingTime < 0) {
        studentSession.timerState.remainingTime = 0;
      }

      this.studentSessions.set(sessionKey, studentSession);

      // Send timer update only to the specific student
      if (studentSession.isConnected) {
        this.server.to(studentSession.socketId).emit('timerUpdate', {
          status: studentSession.timerState.status,
          remainingTime: studentSession.timerState.remainingTime,
          totalTime: studentSession.timerState.totalTime,
          timeAdjustment: studentSession.timerState.timeAdjustment,
          examId: data.examId,
          studentId: data.studentId,
        });
      }

      // Notify instructor about the adjustment
      client.emit('timerAdjusted', {
        timeAdjustment: data.timeAdjustment,
        adjustedBy: clientInfo.userId,
        targetStudent: data.studentId,
        examId: data.examId,
        timestamp: new Date().toISOString(),
      });

      // Broadcast updated student sessions to instructors
      void this.broadcastStudentSessionUpdate(data.examId);

      this.logger.log(
        `Timer adjusted for student ${data.studentId} in exam ${data.examId} by ${clientInfo.userId}: ${data.timeAdjustment}s`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error adjusting student timer: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to adjust student timer',
        error: errorMessage,
      });
    }
  }

  @SubscribeMessage('requestTimerState')
  async handleRequestTimerState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (!clientInfo) {
        client.emit('error', {
          message: 'Client not found',
        });
        return;
      }

      // Get current timer state
      const timerState = await this.examService.getCurrentTimerState(
        data.examId,
      );

      // For students, send individual timer update
      if (clientInfo.role === UserRole.STUDENT) {
        const sessionKey = `${data.examId}_${clientInfo.userId}`;
        const studentSession = this.studentSessions.get(sessionKey);

        // Send centralized timer state to student (same as instructors)
        client.emit('timerUpdate', timerState);
        this.logger.log(
          `Sent centralized timer state to student ${clientInfo.userId} for exam ${data.examId}`,
        );
      } else {
        // For instructors/admins, send general timer state
        client.emit('timerUpdate', timerState);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting timer state: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to get timer state',
        error: errorMessage,
      });
    }
  }

  /**
   * Handles connection health check requests from clients
   * Responds with current connection status and network quality
   * @param client - The WebSocket client requesting health check
   * @param data - Contains any additional health check parameters
   */
  @SubscribeMessage('connectionHealthCheck')
  handleConnectionHealthCheck(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const networkQuality = this.networkQuality.get(client.id) || 'unknown';
    const lastPing = this.lastPingTimes.get(client.id);
    const connectionAge = lastPing
      ? new Date().getTime() - lastPing.getTime()
      : 0;

    client.emit('connectionHealthResponse', {
      status: 'connected',
      networkQuality,
      connectionAge,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Health check for client ${client.id}: quality=${networkQuality}, age=${connectionAge}ms`,
    );
  }

  /**
   * Handles client reconnection requests with session recovery
   * Attempts to restore previous session state and timer information
   * @param client - The WebSocket client requesting reconnection
   * @param data - Contains examId, userId, and optional session recovery data
   */
  @SubscribeMessage('requestReconnection')
  async handleRequestReconnection(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { examId: string; userId: string; lastKnownState?: any },
  ) {
    try {
      const { examId, userId } = data;
      const sessionKey = `${examId}_${userId}`;
      const existingSession = this.studentSessions.get(sessionKey);

      if (existingSession) {
        // Update session with new socket
        existingSession.socketId = client.id;
        existingSession.isConnected = true;

        // Send current session state to client
        client.emit('reconnectionResponse', {
          success: true,
          sessionRestored: true,
          timerState: existingSession.timerState,
          message: 'Session successfully restored',
        });

        this.logger.log(
          `Session restored for user ${userId} in exam ${examId}`,
        );
      } else {
        client.emit('reconnectionResponse', {
          success: false,
          sessionRestored: false,
          message: 'No existing session found',
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      client.emit('reconnectionResponse', {
        success: false,
        sessionRestored: false,
        message: 'Reconnection failed',
        error: errorMessage,
      });
    }
  }

  /**
   * Handles student selection by instructors
   * Updates the selected student for timer management interface
   * @param client - The WebSocket client (instructor) making the selection
   * @param data - Contains examId and studentId for the selection
   */
  @SubscribeMessage('selectStudent')
  handleSelectStudent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string; studentId: string },
  ) {
    try {
      const clientInfo = this.clients.get(client.id);
      if (
        !clientInfo ||
        (clientInfo.role !== UserRole.INSTRUCTOR &&
          clientInfo.role !== UserRole.ADMIN)
      ) {
        client.emit('error', {
          message: 'Unauthorized: Only instructors can select students',
        });
        return;
      }

      const sessionKey = `${data.examId}_${data.studentId}`;
      const studentSession = this.studentSessions.get(sessionKey);

      if (!studentSession) {
        client.emit('error', {
          message: 'Student session not found',
        });
        return;
      }

      // Send selected student details to instructor with individual timer state
      client.emit('studentSelected', {
        studentId: data.studentId,
        studentName: studentSession.userName,
        isConnected: studentSession.isConnected,
        joinedAt: studentSession.joinedAt,
        timerState: studentSession.timerState,
      });

      this.logger.log(
        `Instructor ${clientInfo.userId} selected student ${data.studentId} in exam ${data.examId}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error selecting student: ${errorMessage}`);
      client.emit('error', {
        message: 'Failed to select student',
        error: errorMessage,
      });
    }
  }

  // Helper methods
  /**
   * Retrieves all student sessions for a specific exam
   * Filters sessions by examId and returns sorted array by join time
   * @param examId - The exam ID to filter sessions for
   * @returns Array of student session data sorted by join time
   */
  private getStudentSessionsForExam(examId: string): any[] {
    const sessions: any[] = [];

    this.studentSessions.forEach((session, _key) => {
      if (session.examId === examId) {
        sessions.push({
          studentId: session.studentId,
          userName: session.userName,
          isConnected: session.isConnected,
          joinedAt: session.joinedAt,
          timerState: {
            status: session.timerState.status,
            remainingTime: session.timerState.remainingTime,
            totalTime: session.timerState.totalTime,
            timeAdjustment: session.timerState.timeAdjustment,
            startedAt: session.timerState.startedAt,
            pausedAt: session.timerState.pausedAt,
          },
        });
      }
    });

    return sessions.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }

  /**
   * Broadcasts student session updates to all clients in an exam room
   * Sends updated student list and timer states to instructors
   * @param examId - The exam ID to broadcast updates for
   */
  private broadcastStudentSessionUpdate(examId: string) {
    const studentSessions = this.getStudentSessionsForExam(examId);

    // Send to all clients in exam room (instructors will use this)
    this.server.to(examId).emit('studentSessionsUpdate', {
      examId: examId,
      students: studentSessions,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcasts timer updates to all clients in an exam room
   * Can be called from external services to sync timer states
   * @param examId - The exam ID to broadcast timer updates for
   */
  async broadcastTimerUpdate(examId: string) {
    try {
      // Get all student sessions for this exam
      const studentSessions = this.getStudentSessionsForExam(examId);

      // Send individual timer updates to instructors for each student
      this.server.to(examId).emit('studentSessionsUpdate', {
        examId,
        students: studentSessions,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error broadcasting timer update: ${errorMessage}`);
    }
  }

  /**
   * Gets the count of connected clients for a specific exam
   * @param examId - The exam ID to count clients for
   * @returns Number of connected clients in the exam room
   */
  getConnectedClientsCount(examId: string): number {
    const examRoom = this.examRooms.get(examId);
    return examRoom ? examRoom.size : 0;
  }

  /**
   * Starts a countdown timer interval for an individual student
   * Updates remaining time every second and broadcasts updates to clients
   * Handles timer completion and automatic cleanup
   * @param sessionKey - The unique session key (examId_studentId) for the student
   */
  private startStudentTimerInterval(sessionKey: string) {
    // Clear existing interval if any
    const existingInterval = this.studentTimerIntervals.get(sessionKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      const studentSession = this.studentSessions.get(sessionKey);
      if (!studentSession || studentSession.timerState.status !== 'running') {
        clearInterval(interval);
        this.studentTimerIntervals.delete(sessionKey);
        return;
      }

      // Decrease remaining time
      studentSession.timerState.remainingTime -= 1;

      // Check if timer has finished
      if (studentSession.timerState.remainingTime <= 0) {
        studentSession.timerState.remainingTime = 0;
        studentSession.timerState.status = 'stopped';
        clearInterval(interval);
        this.studentTimerIntervals.delete(sessionKey);

        // Notify student that time is up
        if (studentSession.isConnected) {
          this.server.to(studentSession.socketId).emit('timerFinished', {
            examId: studentSession.examId,
            studentId: studentSession.studentId,
            timestamp: new Date().toISOString(),
          });
        }

        this.logger.log(
          `Timer finished for student ${studentSession.studentId} in exam ${studentSession.examId}`,
        );
      }

      // Update session
      this.studentSessions.set(sessionKey, studentSession);

      // Send timer update to student
      if (studentSession.isConnected) {
        this.server.to(studentSession.socketId).emit('timerUpdate', {
          status: studentSession.timerState.status,
          remainingTime: studentSession.timerState.remainingTime,
          totalTime: studentSession.timerState.totalTime,
          timeAdjustment: studentSession.timerState.timeAdjustment,
          examId: studentSession.examId,
          studentId: studentSession.studentId,
        });
      }

      // Send individual timer update to instructors for this specific student
      this.server.to(studentSession.examId).emit('timerUpdate', {
        status: studentSession.timerState.status,
        remainingTime: studentSession.timerState.remainingTime,
        totalTime: studentSession.timerState.totalTime,
        timeAdjustment: studentSession.timerState.timeAdjustment,
        examId: studentSession.examId,
        studentId: studentSession.studentId,
        startedAt: studentSession.timerState.startedAt,
        pausedAt: studentSession.timerState.pausedAt,
      });

      // Broadcast updated student sessions to instructors
      void this.broadcastStudentSessionUpdate(studentSession.examId);
    }, 1000); // Update every second

    this.studentTimerIntervals.set(sessionKey, interval);
  }

  /**
   * Stops and cleans up the timer interval for an individual student
   * Clears the interval and removes it from the tracking map
   * @param sessionKey - The unique session key (examId_studentId) for the student
   */
  private stopStudentTimerInterval(sessionKey: string) {
    const interval = this.studentTimerIntervals.get(sessionKey);
    if (interval) {
      clearInterval(interval);
      this.studentTimerIntervals.delete(sessionKey);
    }
  }

  /**
   * Initializes connection monitoring for a client
   * Sets up tracking for connection quality and ping times
   * @param client - The WebSocket client to monitor
   */
  private initializeConnectionMonitoring(client: Socket): void {
    // Initialize ping tracking
    this.lastPingTimes.set(client.id, new Date());

    // Set up ping response monitoring
    client.on('pong', () => {
      const now = new Date();
      const lastPing = this.lastPingTimes.get(client.id);

      if (lastPing) {
        const latency = now.getTime() - lastPing.getTime();
        this.updateNetworkQuality(client.id, latency);
      }

      this.lastPingTimes.set(client.id, now);
    });
  }

  /**
   * Sets up heartbeat mechanism for connection monitoring
   * Sends periodic pings to detect connection issues early
   * @param client - The WebSocket client to set up heartbeat for
   */
  private setupHeartbeat(client: Socket): void {
    const heartbeatInterval = setInterval(() => {
      if (client.connected) {
        // Send ping and record time
        this.lastPingTimes.set(client.id, new Date());
        client.emit('ping');

        // Check for missed pongs (connection issues)
        const lastPing = this.lastPingTimes.get(client.id);
        if (lastPing && new Date().getTime() - lastPing.getTime() > 30000) {
          this.logger.warn(
            `Client ${client.id} appears to have connection issues - no pong received`,
          );
          this.networkQuality.set(client.id, 'poor');
        }
      } else {
        // Clean up if client is disconnected
        clearInterval(heartbeatInterval);
        this.connectionHeartbeats.delete(client.id);
      }
    }, 15000); // Send heartbeat every 15 seconds

    this.connectionHeartbeats.set(client.id, heartbeatInterval);
  }

  /**
   * Sets up additional connection event listeners for better error handling
   * Monitors connection errors, timeouts, and other network issues
   * @param client - The WebSocket client to set up listeners for
   */
  private setupConnectionEventListeners(client: Socket): void {
    // Handle connection errors
    client.on('error', (error) => {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      this.networkQuality.set(client.id, 'unstable');
    });

    // Handle ping timeout
    client.on('ping_timeout', () => {
      this.logger.warn(`Ping timeout for client ${client.id}`);
      this.networkQuality.set(client.id, 'poor');
    });

    // Handle transport close
    client.on('disconnect', (reason) => {
      this.logger.log(`Client ${client.id} disconnected due to: ${reason}`);

      // Log different disconnect reasons for analysis
      if (reason === 'transport close' || reason === 'ping timeout') {
        this.logger.warn(
          `Network-related disconnection for client ${client.id}: ${reason}`,
        );
      }
    });
  }

  /**
   * Updates network quality based on connection latency
   * Categorizes connection quality for adaptive behavior
   * @param clientId - The client ID to update quality for
   * @param latency - The measured latency in milliseconds
   */
  private updateNetworkQuality(clientId: string, latency: number): void {
    let quality: 'good' | 'poor' | 'unstable';

    if (latency < 100) {
      quality = 'good';
    } else if (latency < 500) {
      quality = 'poor';
    } else {
      quality = 'unstable';
    }

    const previousQuality = this.networkQuality.get(clientId);
    if (previousQuality !== quality) {
      this.logger.log(
        `Network quality changed for client ${clientId}: ${previousQuality} -> ${quality} (latency: ${latency}ms)`,
      );
      this.networkQuality.set(clientId, quality);

      // Emit network quality update to client for adaptive behavior
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit('networkQualityUpdate', { quality, latency });
      }
    }
  }

  /**
   * Cleans up connection monitoring resources for a disconnected client
   * Prevents memory leaks by removing all tracking data
   * @param clientId - The client ID to clean up resources for
   */
  private cleanupConnectionMonitoring(clientId: string): void {
    // Clear heartbeat interval
    const heartbeat = this.connectionHeartbeats.get(clientId);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.connectionHeartbeats.delete(clientId);
    }

    // Clean up tracking data
    this.lastPingTimes.delete(clientId);

    this.logger.log(`Cleaned up connection monitoring for client ${clientId}`);
  }

  /**
   * Handles client reconnection with enhanced session recovery
   * Implements exponential backoff and session state restoration
   * @param client - The reconnecting WebSocket client
   * @param examId - The exam ID for the reconnection
   * @param userId - The user ID for the reconnection
   */
  private handleReconnection(
    client: Socket,
    examId: string,
    userId: string,
  ): void {
    const reconnectionKey = `${userId}_${examId}`;
    const attempts = this.connectionAttempts.get(reconnectionKey) || 0;

    // Increment reconnection attempts
    this.connectionAttempts.set(reconnectionKey, attempts + 1);

    // Log reconnection attempt
    this.logger.log(
      `Reconnection attempt ${attempts + 1} for user ${userId} in exam ${examId}`,
    );

    // Reset attempts counter on successful reconnection
    setTimeout(() => {
      if (client.connected) {
        this.connectionAttempts.delete(reconnectionKey);
        this.logger.log(
          `Successful reconnection for user ${userId} in exam ${examId}`,
        );
      }
    }, 5000);
  }
}
