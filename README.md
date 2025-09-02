# Prep Doctor - Exam Management System

A comprehensive exam management system with real-time WebSocket integration, built with NestJS backend and React frontend.

## 🚀 Project Overview

Prep Doctor is a modern exam management system that allows users to:

-   **Create and manage exams** with configurable durations
-   **Take exams in real-time** with live timers and pause/resume functionality
-   **Monitor exam progress** with live updates across multiple devices
-   **Manage exam states** automatically (Pending → InProgress → Paused → Completed/Expired)

## 🏗️ Architecture

```
prep_doctor/
├── server/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication & JWT
│   │   ├── exam/          # Exam management & WebSocket
│   │   ├── user/          # User management
│   │   └── database/      # Database seeding
│   ├── package.json
│   └── README.md
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API & WebSocket services
│   │   └── hooks/         # Custom React hooks
│   ├── package.json
│   └── README.md
└── README.md               # This file
```

## ✨ Key Features

### 🔐 Authentication

-   JWT-based user authentication
-   Role-based access control (Admin, User)
-   Secure password hashing

### 📝 Exam Management

-   Create exams with custom durations
-   Real-time exam status tracking
-   Automatic status transitions
-   Pause/resume functionality

### 🌐 Real-time Communication

-   WebSocket integration for live updates
-   Multi-tab synchronization
-   Live timer updates
-   Instant status broadcasting

### ⏱️ Timer System

-   Accurate countdown timers
-   Pause time tracking
-   Progress visualization
-   Automatic expiration handling

## 🛠️ Technology Stack

### Backend

-   **Framework**: NestJS 10.x
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: TypeORM
-   **WebSockets**: Socket.IO
-   **Authentication**: JWT + Passport
-   **Scheduling**: Cron jobs

### Frontend

-   **Framework**: React 18
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Routing**: React Router v6
-   **State Management**: React Hooks
-   **WebSockets**: Socket.IO Client

## 🚀 Quick Start

### Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   PostgreSQL database
-   Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd prep_doctor
```

### 2. Backend Setup

```bash
cd server
npm install --legacy-peer-deps

# Create .env file with database credentials
cp .env.example .env
# Edit .env with your database settings

# Start development server
npm run start:dev
```

### 3. Frontend Setup

```bash
cd client
npm install

# Start development server
npm start
```

### 4. Access Application

-   **Backend**: http://localhost:3000
-   **Frontend**: http://localhost:3001
-   **Default Login**: admin / 12345678

## 📡 API Documentation

### Authentication

-   `POST /auth/login` - User login

### Exams

-   `GET /exams` - List all exams
-   `POST /exams` - Create new exam
-   `GET /exams/:id` - Get exam details
-   `PATCH /exams/:id/pause` - Pause exam
-   `POST /exams/:id/unpause` - Resume exam

### WebSocket Events

-   `ExamUpdated-{examId}` - Real-time exam updates

## 🔌 Real-time Features

### WebSocket Integration

-   **Automatic Connection** - Connects on app startup
-   **Event Broadcasting** - All clients receive updates
-   **Room Management** - Exam-specific communication
-   **Connection Status** - Visual connection indicators

### Live Updates

-   **Exam Status Changes** - Instant status updates
-   **Timer Synchronization** - Multi-tab timer sync
-   **Pause/Resume** - Real-time control updates

## 🧪 Testing

### Backend Testing

```bash
cd server
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### Frontend Testing

```bash
cd client
npm test              # Run test suite
npm run build         # Production build
```

## 📊 Database Schema

### Users

-   `id`, `username`, `password`, `role`

### Exams

-   `id`, `name`, `startDate`, `period`, `status`, `pausedAt`, `totalPausedTime`, `traineeId`, `createdAt`

### Relationships

-   Users can create multiple exams
-   Exams track pause/resume history
-   Automatic status management via cron jobs

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**

    - Check backend server is running
    - Verify CORS configuration
    - Check browser console for errors

2. **Timer Calculation Errors**

    - Verify exam data format
    - Check time unit consistency
    - Review console logs

3. **Database Connection Issues**
    - Verify PostgreSQL is running
    - Check database credentials
    - Ensure database exists

### Debug Information

-   Extensive console logging
-   WebSocket connection status
-   API request/response details
-   Timer calculation breakdown

## 🔄 Development Workflow

1. **Feature Development**

    - Create feature branch
    - Implement backend API
    - Implement frontend UI
    - Test integration
    - Submit pull request

2. **Testing Strategy**

    - Unit tests for business logic
    - Integration tests for API
    - Manual testing for UI/UX
    - WebSocket functionality verification

3. **Code Quality**
    - TypeScript strict mode
    - ESLint configuration
    - Consistent formatting
    - Component reusability

## 📦 Deployment

### Backend Deployment

```bash
cd server
npm run build
npm run start:prod
```

### Frontend Deployment

```bash
cd client
npm run build
# Deploy build/ folder to static hosting
```

### Environment Configuration

-   Production database credentials
-   JWT secret keys
-   CORS origins
-   WebSocket URLs

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

-   Create an issue in the repository
-   Check the troubleshooting sections in individual READMEs
-   Review console logs for debugging information
-   Contact the development team

## 🙏 Acknowledgments

-   NestJS team for the excellent framework
-   React team for the frontend library
-   Socket.IO for real-time communication
-   Tailwind CSS for the styling framework

---

**Happy Coding! 🚀**
