# Authentication & Authorization System

This document explains the authentication and authorization system implemented in the PrepX Timer API.

## Overview

The system implements JWT-based authentication with role-based access control (RBAC) supporting two user types:
- **Students**: Can join exams and view timer states
- **Instructors**: Can create exams, manage timers, and perform all administrative tasks

## User Roles

### Student (`UserRole.STUDENT`)
- Join exams
- View exam details
- View timer states
- Connect/disconnect from exams
- View their individual timer

### Instructor (`UserRole.INSTRUCTOR`)
- All student permissions
- Create new exams
- Start/pause/reset timers
- Adjust timer duration
- Manage users (create, view, activate/deactivate, delete)
- Register new students and instructors

## API Endpoints

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

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

### User Management Endpoints (Instructor Only)

#### Get All Users
```http
GET /api/auth/users?role=student
Authorization: Bearer <instructor_jwt_token>
```

#### Register New Instructor
```http
POST /api/auth/register-instructor
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "email": "instructor@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Register New Student
```http
POST /api/auth/register-student
Authorization: Bearer <instructor_jwt_token>
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "firstName": "Bob",
  "lastName": "Johnson"
}
```

#### Toggle User Status
```http
PUT /api/auth/users/{userId}/toggle-status
Authorization: Bearer <instructor_jwt_token>
```

#### Delete User
```http
DELETE /api/auth/users/{userId}
Authorization: Bearer <instructor_jwt_token>
```

## Protected Exam Endpoints

### Instructor Only Endpoints
- `POST /api/exams` - Create exam
- `POST /api/exams/:id/timer/start` - Start timer
- `POST /api/exams/:id/timer/pause` - Pause timer
- `POST /api/exams/:id/timer/reset` - Reset timer
- `PUT /api/exams/:id/timer/adjust` - Adjust timer

### Public Endpoints (No Authentication Required)
- `GET /api/exams/:id` - Get exam details
- `GET /api/exams/:id/timer` - Get timer state
- `POST /api/exams/:id/students/:studentId` - Add student to exam
- `DELETE /api/exams/:id/students/:studentId` - Remove student from exam
- `GET /api/exams/:id/students/:studentId/timer` - Get student timer

## Usage Examples

### 1. Register and Login as Instructor

```bash
# Register instructor
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Instructor",
    "role": "instructor"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "password": "password123"
  }'
```

### 2. Create Exam (Instructor Only)

```bash
curl -X POST http://localhost:3000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <instructor_jwt_token>" \
  -d '{
    "title": "Math Exam",
    "duration": 3600,
    "description": "Final math examination"
  }'
```

### 3. Register Student (Instructor Only)

```bash
curl -X POST http://localhost:3000/api/auth/register-student \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <instructor_jwt_token>" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Student"
  }'
```

### 4. Student Login and Join Exam

```bash
# Student login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'

# Join exam (no auth required for this endpoint)
curl -X POST http://localhost:3000/api/exams/{examId}/students/{studentId}
```

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Minimum password length: 6 characters
- Passwords are never returned in API responses

### JWT Security
- Tokens expire after 24 hours (configurable)
- Secret key should be changed in production
- Tokens include user ID, email, and role

### Role-Based Access Control
- Global guards protect all endpoints by default
- Public endpoints are explicitly marked with `@Public()` decorator
- Role-specific endpoints use `@Roles()` decorator
- Unauthorized access returns 401/403 status codes

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String ("student" | "instructor"),
  isActive: Boolean (default: true),
  lastLogin: Date,
  profilePicture: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Access denied. Please login.",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 409 Conflict (User already exists)
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

## WebSocket Authentication

WebSocket connections can be authenticated by including the JWT token in the connection handshake:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

## Best Practices

1. **Always use HTTPS in production**
2. **Change JWT secret in production**
3. **Implement token refresh mechanism for long-lived applications**
4. **Log authentication attempts for security monitoring**
5. **Implement rate limiting for login endpoints**
6. **Use strong passwords and consider implementing password policies**
7. **Regularly rotate JWT secrets**
8. **Implement account lockout after failed login attempts**

## Migration Guide

If you have existing data without user authentication:

1. Create a default instructor account
2. Update existing exam records to include creator information
3. Migrate student identifiers to proper user accounts
4. Update client applications to include authentication headers

## Troubleshooting

### Common Issues

1. **"Invalid token" errors**
   - Check if token is expired
   - Verify JWT_SECRET matches between client and server
   - Ensure token is properly formatted in Authorization header

2. **"Insufficient permissions" errors**
   - Verify user role in JWT payload
   - Check if endpoint requires specific role
   - Ensure user account is active

3. **"User not found" errors**
   - Verify user exists in database
   - Check if user account is active
   - Ensure correct user ID in token payload