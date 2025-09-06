front URL:
https://prepx-timer.onrender.com
swagger URL:
https://prepx-timer.onrender.com/api/docs
API URL:
https://prepx-timer.onrender.com/api


# PrepX Timer API

A comprehensive real-time timer synchronization system built with NestJS, MongoDB, and WebSockets for managing online exam timers with advanced instructor controls, student participation, and authentication system.

## Features

### Core Features
- **Real-time Timer Synchronization**: WebSocket-based real-time updates across all connected clients
- **Advanced Authentication System**: JWT-based authentication with role-based access control (RBAC)
- **Instructor Controls**: Complete timer management (start, pause, reset, adjust)
- **Individual Student Timers**: Per-student time adjustments and tracking
- **Multi-client Support**: Multiple students and instructors can connect simultaneously
- **Persistent Storage**: MongoDB integration for exam and timer data persistence
- **RESTful API**: Complete REST endpoints for timer and user management
- **Interactive Frontend**: Built-in responsive web interface with real-time updates

### Frontend Features
- **Dual Interface**: Separate login and exam management interfaces
- **Real-time Dashboard**: Live timer display with connection status
- **Student Management**: Real-time student connection monitoring
- **Timer Controls**: Intuitive controls for instructors (start/pause/reset/adjust)
- **Individual Timer Adjustment**: Granular time control for specific students
- **Responsive Design**: Modern UI that works on desktop and mobile devices
- **Connection Status**: Real-time WebSocket connection monitoring
- **Exam Management**: Create, join, and manage exams through the interface

### Security Features
- **Role-Based Access Control**: Student and Instructor roles with different permissions
- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: Bcrypt hashing for secure password storage
- **Protected Routes**: API endpoints protected based on user roles

## Technology Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.IO WebSockets
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator and class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Language**: TypeScript

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm package manager

## Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd prepx-timer-api
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/prepx-timer
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # Server
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB**:
   - For local MongoDB: `mongod`
   - Or ensure MongoDB Atlas connection is available

## Running the Application

### Development Mode (with auto-reload)
```bash
npm run start:dev
```
This command starts the server in development mode with automatic restart on file changes.

### Production Build
```bash
# Build the application
npm run build

# Start in production mode
npm run start
```

### Development with Debug
```bash
npm run start:debug
```

### Access Points
- **Main Application**: http://localhost:3000/
- **Login Interface**: http://localhost:3000/login.html
- **Exam Interface**: http://localhost:3000/index.html
- **API Endpoints**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student" // optional, defaults to "student"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "role": "student",
    "isActive": true
  },
  "accessToken": "jwt_token_here"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### Exam Management

#### Create Exam (Instructor Only)
```http
POST /api/exams
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "title": "Mathematics Final Exam",
  "description": "Final exam for Math 101",
  "duration": 3600
}
```

#### Get Exam Details
```http
GET /api/exams/:examId
```

#### Get Timer State
```http
GET /api/exams/:examId/timer
```

### Timer Controls (Instructor Only)

#### Start Timer
```http
POST /api/exams/:examId/timer/start
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "action": "start"
}
```

#### Pause Timer
```http
POST /api/exams/:examId/timer/pause
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "action": "pause"
}
```

#### Reset Timer
```http
POST /api/exams/:examId/timer/reset
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "action": "reset"
}
```

#### Adjust Timer
```http
PUT /api/exams/:examId/timer/adjust
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "timeAdjustment": 300,
  "studentIds": ["student1", "student2"]
}
```

### Student Management

#### Connect Student to Exam

```http
POST /api/exams/:examId/students/:studentId
```

#### Disconnect Student from Exam

```http
DELETE /api/exams/:examId/students/:studentId
```

#### Get Student Timer

```http
GET /api/exams/:examId/students/:studentId/timer
```

## WebSocket Events

### WebSocket Authentication

WebSocket connections can be authenticated by including the JWT token:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

### Client to Server Events

#### Join Exam
```javascript
socket.emit('joinExam', {
  examId: 'exam123',
  userId: 'user123',
  userType: 'student', // or 'instructor'
});
```

#### Timer Controls (Instructor Only)
```javascript
// Start timer
socket.emit('startTimer', {
  examId: 'exam123',
  instructorId: 'instructor123',
});

// Pause timer
socket.emit('pauseTimer', {
  examId: 'exam123',
  instructorId: 'instructor123',
});

// Reset timer
socket.emit('resetTimer', {
  examId: 'exam123',
  instructorId: 'instructor123',
});

// Adjust timer
socket.emit('adjustTimer', {
  examId: 'exam123',
  instructorId: 'instructor123',
  timeAdjustment: 300,
  studentIds: ['student1', 'student2'],
});
```

#### Request Timer State
```javascript
socket.emit('requestTimerState', {
  examId: 'exam123',
});
```

### Server to Client Events

#### Timer Update

```javascript
socket.on('timerUpdate', (data) => {
  console.log('Timer updated:', data);
  // data contains: examId, remainingTime, status, lastUpdated
});
```

#### Student Connection Updates

```javascript
socket.on('studentConnected', (data) => {
  console.log('Student connected:', data.studentId);
});

socket.on('studentDisconnected', (data) => {
  console.log('Student disconnected:', data.studentId);
});
```

#### Error Handling

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});
```

## Database Schema

### User Schema
```typescript
{
  _id: ObjectId,
  email: string, // unique
  password: string, // hashed with bcrypt
  firstName: string,
  lastName: string,
  role: 'student' | 'instructor',
  isActive: boolean, // default: true
  lastLogin: Date,
  profilePicture?: string, // optional
  createdAt: Date,
  updatedAt: Date
}
```

### Exam Schema
```typescript
{
  title: string,
  description: string,
  duration: number, // in seconds
  remainingTime: number, // in seconds
  status: 'stopped' | 'running' | 'paused' | 'completed',
  startedAt?: Date,
  pausedAt?: Date,
  completedAt?: Date,
  connectedStudents: string[], // array of student IDs
  instructorId: string, // reference to User._id
  createdAt: Date,
  updatedAt: Date
}
```

### Student Timer Schema
```typescript
{
  examId: string, // reference to Exam._id
  studentId: string, // reference to User._id
  timeAdjustment: number, // in seconds
  remainingTime: number, // in seconds
  status: 'active' | 'paused' | 'completed',
  lastSyncAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Interface Usage

### Login Interface (login.html)
The login interface provides authentication for both students and instructors:

1. **Access the login page**: http://localhost:3000/login.html
2. **Register new users** or login with existing credentials
3. **Role-based redirection** after successful authentication
4. **Responsive design** that works on all devices

### Main Exam Interface (index.html)
The main interface provides comprehensive exam and timer management:

#### For Instructors:
1. **Dashboard Access**: View and manage all exams
2. **Exam Creation**: Create new exams with title, description, and duration
3. **Timer Controls**: Start, pause, reset, and adjust exam timers
4. **Student Management**: Monitor connected students in real-time
5. **Individual Timer Adjustment**: Adjust time for specific students
6. **Real-time Updates**: See live connection status and timer updates

#### For Students:
1. **Exam Dashboard**: View available exams
2. **Join Exams**: Connect to active exams
3. **Timer Display**: View remaining time with real-time updates
4. **Connection Status**: Monitor WebSocket connection status
5. **Responsive Interface**: Optimized for various screen sizes

### Key Interface Features:
- **Real-time Timer Display**: Large, prominent timer with status indicators
- **Connection Monitoring**: Visual indicators for WebSocket connection status
- **Student List**: Live list of connected students with individual timer states
- **Control Panels**: Intuitive buttons for all timer operations
- **Notifications**: Real-time notifications for important events
- **Responsive Design**: Mobile-friendly interface that adapts to screen size
- **Modern UI**: Clean, professional design with smooth animations

## Development

### Project Structure

```
prepx-timer-api/
├── public/                    # Frontend files
│   ├── index.html            # Main exam interface
│   └── login.html            # Authentication interface
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── decorators/       # Custom decorators
│   │   ├── guards/           # Auth guards
│   │   └── strategies/       # Passport strategies
│   ├── config/               # Configuration files
│   │   └── app.config.ts
│   ├── dto/                  # Data Transfer Objects
│   │   ├── auth.dto.ts
│   │   ├── create-exam.dto.ts
│   │   └── adjust-timer.dto.ts
│   ├── exam/                 # Exam module
│   │   ├── exam.controller.ts
│   │   ├── exam.service.ts
│   │   └── exam.module.ts
│   ├── gateway/              # WebSocket gateway
│   │   ├── timer.gateway.ts
│   │   └── gateway.module.ts
│   ├── interfaces/           # TypeScript interfaces
│   │   └── timer-state.interface.ts
│   ├── schemas/              # MongoDB schemas
│   │   ├── user.schema.ts
│   │   ├── exam.schema.ts
│   │   └── student-timer.schema.ts
│   ├── swagger/              # API documentation
│   │   ├── swagger.config.ts
│   │   ├── swagger.decorators.ts
│   │   └── swagger.service.ts
│   ├── app.module.ts         # Main application module
│   └── main.ts              # Application entry point
├── test/                     # Test files
├── mongo-init/               # MongoDB initialization
├── package.json              # Dependencies and scripts
├── docker-compose.yml        # Docker configuration
├── AUTH-SYSTEM.md           # Authentication documentation
├── DOCKER-SETUP.md          # Docker setup guide
└── README.md                # This file
```

### Available Scripts

```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run start:dev

# Build the application
npm run build

# Start production server
npm start

# Start with debugging
npm run start:debug

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate test coverage report
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/prepx-timer

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# WebSocket Configuration
WS_CORS_ORIGIN=http://localhost:3000
```

### Security Considerations

- **JWT Secret**: Use a strong, randomly generated secret in production
- **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
- **CORS**: Configure appropriate origins for your deployment environment
- **Environment Variables**: Never commit `.env` files to version control
- **Rate Limiting**: Consider implementing rate limiting for production use

## Deployment

### Production Build

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Technical Choices & Architecture Decisions

### Backend Framework: NestJS
- **Why**: Provides enterprise-grade scalability with TypeScript support and dependency injection
- **Benefits**: Modular architecture, extensive ecosystem, built-in validation and authentication
- **Alternative Considered**: Express.js (rejected due to lack of structure for large applications)

### Database: MongoDB with Mongoose
- **Why**: Flexible document schema ideal for evolving exam and user requirements
- **Benefits**: Easy horizontal scaling, JSON-like documents match API responses, rich query capabilities
- **Alternative Considered**: PostgreSQL (rejected due to rigid schema requirements)

### Real-time Communication: Socket.IO
- **Why**: Most reliable WebSocket implementation with automatic fallback mechanisms
- **Benefits**: Automatic reconnection, room-based broadcasting, connection quality monitoring
- **Alternative Considered**: Native WebSockets (rejected due to lack of fallback and reconnection features)

### Authentication: JWT with Passport.js
- **Why**: Stateless authentication suitable for distributed systems and real-time connections
- **Benefits**: No server-side session storage, works seamlessly with WebSockets, role-based access control
- **Alternative Considered**: Session-based auth (rejected due to WebSocket complexity and scalability issues)

### Individual Student Timers Architecture
- **Why**: Prevents race conditions and allows granular time management per student
- **Benefits**: Each student can have different time adjustments without conflicts, better fault tolerance
- **Alternative Considered**: Centralized timer (rejected due to synchronization complexity and lack of individual control)

### TypeScript Throughout
- **Why**: Type safety reduces runtime errors and improves development experience
- **Benefits**: Better IDE support, compile-time error detection, self-documenting code
- **Alternative Considered**: JavaScript (rejected due to lack of type safety in complex real-time application)

## Implementation Assumptions

### System Scale & Usage
1. **Concurrent Users**: System designed for typical classroom sizes (< 100 students per exam)
2. **Exam Duration**: Maximum exam duration assumed to be reasonable (< 24 hours)
3. **Instructor-to-Student Ratio**: One instructor can manage multiple exams simultaneously
4. **Browser Support**: Modern browsers with WebSocket support assumed (Chrome 16+, Firefox 11+, Safari 7+)

### Network & Connectivity
5. **Network Reliability**: Brief disconnections (< 5 minutes) preserve timer state for seamless reconnection
6. **Internet Connectivity**: Students assumed to have stable internet connection during exams
7. **WebSocket Support**: All clients support WebSocket protocol with Socket.IO fallbacks

### User Management & Security
8. **User Enrollment**: Instructors manually enroll students in exams (no self-enrollment)
9. **Authentication Persistence**: JWT tokens valid for 24 hours (configurable for longer exams)
10. **Role Permissions**: Clear separation between student and instructor capabilities
11. **Password Security**: Users responsible for maintaining secure passwords (minimum 6 characters)

### Timer Precision & Behavior
12. **Timer Precision**: 1-second intervals sufficient for exam timing (no millisecond precision needed)
13. **Time Synchronization**: Server time is authoritative; client displays are for user experience
14. **Timer Persistence**: Running timers continue during brief disconnections and are restored on reconnection
15. **Adjustment Limits**: Time adjustments have reasonable limits to prevent abuse (configurable)

### Data & Storage
16. **Data Persistence**: All exam and timer data persisted to database for reliability
17. **Backup Strategy**: Database backup and recovery handled by deployment environment
18. **Data Retention**: Exam data retained indefinitely unless explicitly deleted by instructors

### Development & Deployment
19. **Environment Consistency**: Development, staging, and production environments use similar configurations
20. **MongoDB Availability**: MongoDB instance available and properly configured before application start
21. **Environment Variables**: All sensitive configuration stored in environment variables, not code

## Performance Considerations

- **WebSocket Connections**: Efficiently managed with automatic cleanup and connection pooling
- **Database Queries**: Optimized with proper indexing on frequently queried fields
- **Memory Usage**: Minimal overhead with event-driven architecture and garbage collection
- **Real-time Updates**: Optimized WebSocket broadcasting for minimal latency
- **Scalability**: Designed for horizontal scaling with stateless architecture
- **Caching**: In-memory caching for frequently accessed data

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

### Test Coverage

The project maintains high test coverage across:
- Authentication services
- Exam management
- Timer synchronization
- WebSocket events
- Database operations

## API Documentation

Interactive API documentation is available via Swagger UI:
- **Development**: http://localhost:3000/api
- **Production**: Configure based on your deployment URL

The documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify JWT token validity
   - Ensure proper network setup

3. **Authentication Errors**
   - Verify JWT secret configuration
   - Check token expiration
   - Ensure proper role assignments

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation as needed
- Follow the existing code style
- Use meaningful commit messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review the troubleshooting section
- Contact the development team

---

**PrepX Timer API** - A comprehensive real-time exam timer management system built with modern web technologies.
