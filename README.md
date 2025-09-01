# PrepX Real-Time Exam Timer

A production-ready Laravel application implementing a synchronized, adjustable exam timer with real-time WebSocket updates for all students and proctors.

## Features

✅ **Real-time synchronization** via Laravel Reverb WebSockets  
✅ **Per-student time adjustments** with audit trail  
✅ **Proctor controls**: start, pause, resume, reset  
✅ **Role-based access control** (students vs proctors)  
✅ **Automatic reconnection** and state rehydration  
✅ **Transaction-based state management** with optimistic locking  
✅ **Clock drift compensation** with server time synchronization  
✅ **Concurrent session support** for multiple exams  

## Architecture

The system follows the specification with authoritative time on the server and local rendering on clients:

```
Instructor UI  ──REST──>  Laravel API  ──DB──> SQLite
      │                          │
      └─ WebSocket <─────────────┘ (Laravel Reverb)
      │
Students ───── WebSocket <─────────┘
```

### Key Components

- **ExamTimer**: Core timer state (`idle`, `running`, `paused`, `finished`)
- **TimerAdjustment**: Per-student or global time adjustments with audit trail
- **TimerService**: Business logic with transaction safety
- **TimerSynced Event**: WebSocket broadcast for real-time updates
- **ExamTimerController**: REST API for timer operations

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository>
cd prepx-timer
composer install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` or create a new `.env` file:

```env
APP_NAME="PrepX Timer"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Broadcasting Configuration
BROADCAST_DRIVER=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_APP_SECRET=local
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# Frontend WebSocket Configuration
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### 3. Database Setup

```bash
# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed demo data
php artisan db:seed --class=ExamSeeder
```

### 4. Start Services

**Terminal 1 - Laravel Server:**
```bash
php artisan serve
```

**Terminal 2 - WebSocket Server:**
```bash
php artisan reverb:start
```

### 5. Access the Application

Open your browser to `http://localhost:8000`

## User Accounts

The system includes the following user accounts for testing and demonstration:

### Admin Users
| ID | Name | Email | Password | Role | Permissions |
|----|------|-------|----------|------|-------------|
| 2 | Admin User | admin@example.com | password | admin | Full system access, can manage all timers and users |

### Proctor Users
| ID | Name | Email | Password | Role | Permissions |
|----|------|-------|----------|------|-------------|
| 3 | John Proctor | proctor@example.com | password | proctor | Can manage timers, start/pause/resume/reset, adjust time for all students |
| 4 | Sarah Instructor | instructor@example.com | password | proctor | Same permissions as John Proctor |

### Student Users
| ID | Name | Email | Password | Role | Permissions |
|----|------|-------|----------|------|-------------|
| 1 | Test User | test@example.com | password | student | View timer only, cannot control timer |
| 5 | Alice Student | student1@example.com | password | student | View timer only, can receive individual time adjustments |
| 6 | Bob Student | student2@example.com | password | student | View timer only, can receive individual time adjustments |
| 7 | Charlie Student | student3@example.com | password | student | View timer only, can receive individual time adjustments |

### Quick Login Reference
For testing purposes, you can use any of these accounts:

**Proctor/Admin Testing:**
- `admin@example.com` / `password` (Full access)
- `proctor@example.com` / `password` (Timer management)
- `instructor@example.com` / `password` (Timer management)

**Student Testing:**
- `student1@example.com` / `password` (Individual adjustments)
- `student2@example.com` / `password` (Individual adjustments)
- `student3@example.com` / `password` (Individual adjustments)

## Testing the System

### Acceptance Demo

1. **Login as Proctor**: Use `proctor@example.com` / `password`
2. **Open Timer**: Click "Open Timer" for the demo exam
3. **Open Second Window**: Open `/timer/1` in another browser window/tab
4. **Login as Student**: In the second window, login as `student1@example.com`
5. **Test Real-time Sync**:
   - Start timer in proctor window → both count down
   - Pause/resume → both reflect instantly
   - Add +60s to all → both update
   - Add -30s to student 1 only → only student's tab reflects change
6. **Test Reconnection**: Refresh student page → automatically resyncs

### API Endpoints

The REST API provides these endpoints (requires authentication):

```http
GET    /api/exams/{exam}/timer          # Get timer state
POST   /api/exams/{exam}/timer/start    # Start timer
POST   /api/exams/{exam}/timer/pause    # Pause timer
POST   /api/exams/{exam}/timer/resume   # Resume timer
POST   /api/exams/{exam}/timer/reset    # Reset timer
POST   /api/exams/{exam}/timer/adjust   # Adjust time
```

### Adjust Time API

```bash
# Add 60 seconds to all students
curl -X POST http://localhost:8000/api/exams/1/timer/adjust \
  -H "Content-Type: application/json" \
  -d '{"seconds": 60}'

# Subtract 30 seconds from student ID 2
curl -X POST http://localhost:8000/api/exams/1/timer/adjust \
  -H "Content-Type: application/json" \
  -d '{"seconds": -30, "student_id": 2, "reason": "Technical issue"}'
```

## Technical Implementation

### State Management

Timer state is managed server-side with these key fields:

- `duration_seconds`: Initial exam duration
- `state`: Current state (`idle`, `running`, `paused`, `finished`)
- `started_at`: When timer was started
- `paused_at`: When timer was paused (if applicable)
- `paused_total_seconds`: Total time paused
- `global_adjust_seconds`: Denormalized sum of global adjustments
- `version`: Optimistic concurrency control

### Time Calculation

Remaining time for a student is calculated as:

```php
remaining = duration + global_adjust + student_adjust - paused_total - elapsed_running
```

Where `elapsed_running` is:
- If `running`: `now() - started_at`
- If `paused`: `paused_at - started_at`

### WebSocket Events

The `TimerSynced` event broadcasts to:
1. `exams.{examId}.timer` - All participants
2. `exams.{examId}.students.{studentId}.timer` - Specific student (for personal adjustments)

### Database Schema

```sql
-- Core timer state
exam_timers (
  id, exam_id, duration_seconds, state, started_at, paused_at,
  paused_total_seconds, global_adjust_seconds, version, updated_by
)

-- Time adjustments audit trail
timer_adjustments (
  id, exam_timer_id, student_id, seconds, reason, created_by
)

-- Exam and student registration
exams (id, title, description, default_duration_seconds, ...)
exam_registrations (exam_id, student_id)
```

### Security & Authorization

- **Authentication**: Laravel Sanctum for API tokens
- **Authorization**: Policy-based permissions
  - Proctors: Can manage timers
  - Students: Can only view timers for registered exams
- **Channel Authorization**: Private WebSocket channels with role verification
- **Input Validation**: Time adjustments limited to ±1 hour

### Concurrency & Consistency

- **Pessimistic Locking**: `SELECT ... FOR UPDATE` in transactions
- **Atomic Operations**: All timer mutations in database transactions
- **Version Control**: Optimistic concurrency with version field
- **Audit Trail**: Complete history in `timer_adjustments` table

## Production Considerations

### WebSocket Scaling

For production, consider:
1. **Process Management**: Use Supervisor/systemd for Reverb
2. **Load Balancing**: Multiple Reverb instances behind a load balancer
3. **TLS Termination**: Nginx reverse proxy for WSS
4. **Monitoring**: Health checks and metrics collection

### Database

- **Indexes**: Already configured for performance
- **Cleanup**: Archive old adjustments periodically
- **Backup**: Regular database backups

### Error Handling

- **Network Recovery**: Automatic reconnection implemented
- **State Consistency**: Server-side validation prevents invalid states
- **User Feedback**: Clear error messages for validation failures

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure Reverb server is running: `php artisan reverb:start`
   - Check firewall settings for port 8080
   - Verify `.env` configuration

2. **Timer Not Syncing**
   - Check browser console for WebSocket errors
   - Verify user has proper permissions
   - Ensure exam registration exists

3. **Database Errors**
   - Run migrations: `php artisan migrate`
   - Check file permissions on SQLite database

### Logs

Check Laravel logs for detailed error information:
```bash
tail -f storage/logs/laravel.log
```

## Contributing

1. Follow Laravel coding standards
2. Add tests for new features
3. Update documentation for API changes
4. Ensure WebSocket events are properly tested

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
