# Prep Doctor - Backend Server

A NestJS-based backend server for the Prep Doctor exam management system with real-time WebSocket support.

## 🚀 Features

- **User Authentication** - JWT-based authentication system
- **Exam Management** - Create, read, update, and delete exams
- **Real-time Updates** - WebSocket integration for live exam status updates
- **Cron Jobs** - Automated exam status management
- **Database Integration** - PostgreSQL with TypeORM
- **CORS Support** - Configured for frontend integration

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **WebSockets**: Socket.IO
- **Scheduling**: @nestjs/schedule
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Git

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd prep_doctor/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the server directory:

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=prep_doctor

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   - Create a PostgreSQL database named `prep_doctor`
   - The application will automatically create tables on first run

## 🚀 Running the Application

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📡 API Endpoints

### Authentication

- `POST /auth/login` - User login

### Users

- `POST /users` - Create user
- `GET /users` - Get all users

### Exams

- `GET /exams` - Get all exams (requires search parameter)
- `POST /exams` - Create new exam
- `GET /exams/:id` - Get exam by ID
- `PATCH /exams/:id` - Update exam
- `DELETE /exams/:id` - Delete exam
- `PATCH /exams/:id/pause` - Pause exam
- `POST /exams/:id/unpause` - Resume exam
- `POST /exams/:id/assign-students` - Assign students to exam
- `DELETE /exams/:examId/students/:studentId` - Remove student from exam

### Database

- `POST /database/seed` - Seed database with initial data

## 🔌 WebSocket Events

The server emits the following WebSocket events:

- `ExamUpdated-{examId}` - Emitted when an exam status changes
  - Contains the updated exam object
  - Sent to all connected clients

## ⏰ Cron Jobs

- **Exam Status Checker** - Runs every 5 seconds
  - Automatically updates exam status based on time
  - Handles expired exams
  - Manages exam completion

## 🗄️ Database Schema

### Users Table

- `id` - Primary key
- `username` - Unique username
- `password` - Hashed password
- `role` - User role (Admin, User)

### Exams Table

- `id` - Primary key
- `name` - Exam name
- `startDate` - Exam start date
- `period` - Duration in minutes
- `status` - Current status (Pending, InProgress, Paused, Completed, Expired)
- `pausedAt` - When exam was paused
- `totalPausedTime` - Total paused time in milliseconds
- `traineeId` - Foreign key to users table
- `createdAt` - Creation timestamp

## 🔐 Authentication

- Uses JWT tokens for authentication
- Tokens expire after 24 hours
- Protected routes require valid JWT token in Authorization header
- Format: `Bearer <token>`

## 🌐 CORS Configuration

CORS is enabled for frontend integration:

- Origin: All origins (configurable)
- Methods: GET, POST, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization

## 📊 Logging

- Console logging for development
- Structured logging with timestamps
- WebSocket event logging
- API request/response logging

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Build

```bash
# Build the application
npm run build

# Build output will be in the `dist/` folder
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**

   - Change PORT in `.env` file
   - Kill process using port 3000

3. **JWT Errors**

   - Verify JWT_SECRET is set in `.env`
   - Check token expiration

4. **WebSocket Connection Issues**
   - Ensure CORS is properly configured
   - Check frontend is connecting to correct port

### Logs

Check the console output for:

- Database connection status
- WebSocket connection logs
- API request logs
- Cron job execution logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above
