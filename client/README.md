# Prep Doctor - Frontend Client

A React-based frontend application for the Prep Doctor exam management system with real-time WebSocket integration.

## 🚀 Features

-   **User Authentication** - Login/logout functionality
-   **Exam Management** - View, pause, and resume exams
-   **Real-time Updates** - Live exam status updates via WebSocket
-   **Responsive Design** - Modern UI with Tailwind CSS
-   **Timer System** - Real-time exam countdown with pause/resume
-   **Status Tracking** - Visual indicators for exam states

## 🛠️ Tech Stack

-   **Framework**: React 18
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **State Management**: React Hooks
-   **Routing**: React Router v6
-   **HTTP Client**: Fetch API
-   **WebSockets**: Socket.IO Client
-   **Build Tool**: Create React App
-   **Package Manager**: npm

## 📋 Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   Backend server running (see server README)
-   Modern web browser

## 🔧 Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd prep_doctor/client
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Environment Configuration**
   Create a `.env` file in the client directory (optional):
    ```env
    REACT_APP_API_BASE_URL=http://localhost:3000
    REACT_APP_WEBSOCKET_URL=http://localhost:3000
    ```

## 🚀 Running the Application

### Development Mode

```bash
npm start
```

The application will open at `http://localhost:3001`

### Production Build

```bash
npm run build
npm run serve
```

### Testing

```bash
npm test
```

## 🏗️ Project Structure

```
client/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ExamTimer.tsx      # Exam timer component
│   │   └── ProtectedRoute.tsx # Authentication guard
│   ├── hooks/
│   │   └── useExamTimer.ts    # Timer logic hook
│   ├── pages/
│   │   ├── Login.tsx          # Login page
│   │   ├── Exams.tsx          # Exams list page
│   │   └── ExamDetail.tsx     # Individual exam page
│   ├── services/
│   │   ├── api.ts             # HTTP API service
│   │   └── socket.ts          # WebSocket service
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── App.tsx                # Main application component
│   ├── index.tsx              # Application entry point
│   └── index.css              # Global styles
├── package.json
├── tailwind.config.js         # Tailwind CSS configuration
└── postcss.config.js          # PostCSS configuration
```

## 🔌 WebSocket Integration

### Real-time Features

-   **Live Exam Updates** - Exam status changes appear instantly
-   **Timer Synchronization** - Multiple tabs show synchronized timers
-   **Status Broadcasting** - All connected clients receive updates

### WebSocket Events

-   **Connection**: Automatically connects to backend WebSocket server
-   **Exam Updates**: Listens for `ExamUpdated-{examId}` events
-   **Room Management**: Joins/leaves exam-specific rooms

## 📱 User Interface

### Pages

1. **Login** (`/login`)

    - Username/password authentication
    - JWT token storage

2. **Exams List** (`/exams`)

    - View all available exams
    - Search functionality
    - Real-time status updates

3. **Exam Detail** (`/exam/:id`)
    - Live timer display
    - Pause/resume controls
    - WebSocket connection status
    - Exam information

### Components

-   **ExamTimer** - Countdown timer with progress bar
-   **ProtectedRoute** - Authentication guard for protected pages
-   **Navigation** - Header with logout functionality

## 🎨 Styling

### Tailwind CSS

-   Utility-first CSS framework
-   Responsive design
-   Custom color scheme
-   Component-based styling

### CSS Features

-   CSS reset and base styles
-   Custom animations
-   Responsive breakpoints
-   Dark/light theme support

## 🔐 Authentication

### Login Flow

1. User enters credentials
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. Protected routes check token validity

### Token Management

-   Automatic token inclusion in API requests
-   Token expiration handling
-   Secure logout functionality

## 📡 API Integration

### HTTP Endpoints

-   **Authentication**: Login endpoint
-   **Exams**: CRUD operations for exam management
-   **Real-time**: WebSocket connection for live updates

### Request Handling

-   Automatic authorization headers
-   Error handling and user feedback
-   Response transformation for data consistency

## ⏱️ Timer System

### Features

-   **Real-time Countdown** - Updates every second
-   **Pause/Resume** - Accurate time tracking
-   **Progress Bar** - Visual progress indication
-   **Status Display** - Current exam state

### Time Calculations

-   **Period**: Exam duration in minutes
-   **Elapsed Time**: Time spent on exam
-   **Paused Time**: Total time exam was paused
-   **Remaining Time**: Calculated remaining duration

## 🚨 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**

    - Check backend server is running
    - Verify WebSocket URL configuration
    - Check browser console for connection errors

2. **Timer Calculation Errors**

    - Verify exam data format
    - Check time unit consistency
    - Review console logs for calculation details

3. **Styling Not Applied**

    - Ensure Tailwind CSS is properly configured
    - Check PostCSS configuration
    - Verify CSS imports in index.css

4. **API Requests Failing**
    - Check backend server status
    - Verify API base URL configuration
    - Check authentication token validity

### Debug Information

The application includes extensive logging:

-   WebSocket connection status
-   API request/response details
-   Timer calculation breakdown
-   Component lifecycle events

## 🧪 Testing

### Manual Testing

1. **Login Flow** - Test authentication
2. **Exam Navigation** - Browse exam list and details
3. **Real-time Updates** - Open multiple tabs and test synchronization
4. **Timer Functionality** - Test pause/resume and countdown

### Browser Testing

-   Chrome (recommended)
-   Firefox
-   Safari
-   Edge

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

### Build Output

-   Optimized JavaScript bundles
-   Minified CSS
-   Static assets
-   Service worker (if configured)

### Deployment

-   Build output in `build/` folder
-   Deploy to any static hosting service
-   Configure environment variables for production

## 🔄 Development Workflow

1. **Feature Development**

    - Create feature branch
    - Implement functionality
    - Test with backend
    - Submit pull request

2. **Testing**

    - Manual testing of features
    - WebSocket functionality verification
    - Cross-browser compatibility
    - Responsive design testing

3. **Code Quality**
    - TypeScript strict mode
    - ESLint configuration
    - Consistent code formatting
    - Component reusability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

-   Create an issue in the repository
-   Check the troubleshooting section
-   Review console logs for debugging information
-   Contact the development team
