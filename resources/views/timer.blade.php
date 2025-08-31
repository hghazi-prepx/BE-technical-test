<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <meta name="exam-id" content="{{ $exam->id }}" />
  <meta name="user-id" content="{{ auth()->id() ?? '' }}" />
  <meta name="user-role" content="{{ auth()->user()->role ?? 'guest' }}" />
  <title>PrepX Timer - {{ $exam->title }}</title>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://js.pusher.com/8.2/pusher.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.15.3/dist/echo.iife.js"></script>
  <script src="{{ asset('js/app.js') }}"></script>
    <script>
    // Pass Reverb configuration to frontend
    window.reverbConfig = {
      key: '{{ config("broadcasting.connections.reverb.key") }}',
      wsHost: '{{ config("broadcasting.connections.reverb.options.host") }}',
      wsPort: {{ config("broadcasting.connections.reverb.options.port") }},
      wssPort: {{ config("broadcasting.connections.reverb.options.port") }},
      forceTLS: {{ config("broadcasting.connections.reverb.options.useTLS") ? 'true' : 'false' }},
      encrypted: {{ config("broadcasting.connections.reverb.options.useTLS") ? 'true' : 'false' }}
    };

    console.log('Reverb configuration passed to frontend:', window.reverbConfig);

        // Initialize Laravel Echo with the configuration
    console.log('Using CDN Laravel Echo...');
    console.log('Echo global:', typeof Echo);
    console.log('Echo constructor:', Echo);

    try {
      console.log('Creating Echo instance...');
      window.Echo = new Echo({
        broadcaster: 'pusher',
        key: window.reverbConfig.key,
        wsHost: window.reverbConfig.wsHost,
        wsPort: window.reverbConfig.wsPort,
        wssPort: window.reverbConfig.wssPort,
        forceTLS: window.reverbConfig.forceTLS,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        encrypted: window.reverbConfig.encrypted,
        cluster: 'local',
        authEndpoint: '/broadcasting/auth',
      });

      console.log('Laravel Echo initialized with Reverb configuration:', window.Echo);
      console.log('Echo object keys:', Object.keys(window.Echo));
      console.log('Echo options:', window.Echo.options);
    } catch (error) {
      console.error('Failed to create Echo instance:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        reverbConfig: window.reverbConfig
      });

      // Create fallback Echo object
      window.Echo = {
        private: () => ({ listen: () => {} }),
        connector: {
          pusher: {
            connection: {
              state: 'disconnected',
              bind: () => {},
            },
          },
        },
      };
    }
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #1f2937;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    .exam-info {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .exam-info h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    .exam-info p {
      font-size: 1.125rem;
      color: #6b7280;
      font-weight: 500;
    }

    .timer {
      font-size: 4rem;
      font-weight: 700;
      text-align: center;
      margin: 2rem 0;
      color: #1f2937;
      font-family: 'Courier New', monospace;
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .timer.warning { color: #f59e0b; }
    .timer.danger { color: #ef4444; }
    .state {
      text-align: center;
      font-size: 1.25rem;
      margin: 1.5rem 0;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .state.running { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #166534; }
    .state.paused { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
    .state.idle { background: linear-gradient(135deg, #f3f4f6, #e5e7eb); color: #374151; }
    .state.finished { background: linear-gradient(135deg, #fecaca, #fca5a5); color: #991b1b; }

    .controls {
      display: flex;
      gap: 1rem;
      margin: 2rem 0;
      flex-wrap: wrap;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .controls button, .controls input, .controls select {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .controls button {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .controls button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
    }

    .controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .controls input, .controls select {
      background: white;
      color: #374151;
      border-color: #d1d5db;
    }

    .controls input:focus, .controls select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .status {
      text-align: center;
      margin: 1rem 0;
      padding: 1rem;
      border-radius: 12px;
      display: none;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .status.success { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #166534; }
    .status.error { background: linear-gradient(135deg, #fecaca, #fca5a5); color: #991b1b; }
    .status.warning { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }

    .connection-status {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .connected { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #166534; }
    .disconnected { background: linear-gradient(135deg, #fecaca, #fca5a5); color: #991b1b; }

    .metadata {
      font-size: 0.875rem;
      color: #6b7280;
      text-align: center;
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .user-info {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 20px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 1rem;
      box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
    }

    .role-badge {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: 0.5rem;
    }

    .student-controls {
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 16px;
      margin: 2rem 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .student-controls h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #1f2937;
      text-align: center;
    }

    .student-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .student-table th {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .student-table td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .student-table tr:hover {
      background: #f9fafb;
    }

    .student-timer-selector {
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      border-radius: 16px;
      margin: 2rem 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .student-timer-selector label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #374151;
      font-size: 1.125rem;
    }

    .student-timer-selector select {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font-size: 1rem;
      min-width: 300px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .student-timer-selector select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .student-timer-selector select:hover {
      border-color: #667eea;
    }

    .selected-student-info {
      margin-top: 1rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border-radius: 8px;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 0.875rem;
      display: none;
    }

    .selected-student-info.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="exam-info">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h1>{{ $exam->title }}</h1>
          @if($exam->description)
            <p>{{ $exam->description }}</p>
          @endif
        </div>
        <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between;">
          <div class="user-info">
            Logged in as: <strong>{{ auth()->user()->name }}</strong>
            <span class="role-badge">{{ ucfirst(auth()->user()->role) }}</span>
          </div>
          <form method="POST" action="{{ route('logout') }}" style="margin: 0;">
            @csrf
            <button type="submit" style="
              padding: 0.75rem 1.5rem;
              background: linear-gradient(135deg, #ef4444, #dc2626);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.875rem;
              font-weight: 600;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
            ">Logout</button>
          </form>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <div id="connection-status" class="connection-status disconnected">Connecting...</div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <div id="server-time-offset" style="
          padding: 0.5rem;
          background: #1f2937;
          color: #10b981;
          border-radius: 4px;
          font-size: 0.75rem;
          font-family: monospace;
        ">Server Sync: --</div>
        <a href="/" style="
          padding: 0.5rem 1rem;
          background: #6b7280;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 0.875rem;
        ">Back to Home</a>
      </div>
    </div>

    <!-- Student Timer Selector -->
    @if(auth()->user() && in_array(auth()->user()->role, ['proctor', 'admin']))
    <div class="student-timer-selector">
      <label for="timer-student-selector">Select Student Timer to Display:</label>
      <select id="timer-student-selector">
        <option value="">Exam Timer (Default)</option>
      </select>
      <div id="selected-student-info" class="selected-student-info">
        <span id="student-timer-label"></span>
        <span id="student-adjustment-info"></span>
      </div>
    </div>
    @endif

    <div class="timer" id="timer">--:--:--</div>

    <div class="state" id="state">Loading...</div>

    <div class="status" id="status"></div>

    @if(auth()->user() && in_array(auth()->user()->role, ['proctor', 'admin']))
    <div class="controls">
      <div id="control-mode-indicator" style="
        text-align: center;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
      ">Controlling: All Students</div>
      <button onclick="start()" id="start-btn">Start</button>
      <button onclick="pause()" id="pause-btn">Pause</button>
      <button onclick="resume()" id="resume-btn">Resume</button>
      <button onclick="resetTimer()" id="reset-btn">Reset</button>
    </div>

    <div class="controls">
      <input id="adj" type="number" value="60" step="5" placeholder="Seconds" />
      <button onclick="adjustAll()">Adjust Timer</button>
    </div>



    <!-- Student Timer Status Table -->
    <div class="student-controls">
      <h3>Student Timer Status</h3>
      <button onclick="refreshStudentStatuses()" style="margin-bottom: 1rem; background: linear-gradient(135deg, #6b7280, #4b5563);">Refresh Statuses</button>
      <div id="student-status-table" style="overflow-x: auto;">
        <table class="student-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Status</th>
              <th>Remaining Time</th>
              <th>Adjustments</th>
            </tr>
          </thead>
          <tbody id="student-status-tbody">
            <tr>
              <td colspan="4" style="padding: 1rem; text-align: center; color: #6b7280;">Click "Refresh Statuses" to load student information</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    @endif

    <div class="metadata">
      <div>Server Time: <span id="server-time">--</span></div>
      <div>Version: <span id="version">--</span></div>
      <div>State: <span id="detailed-state">--</span></div>
    </div>
  </div>

<script>
// Set up axios defaults
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').content;
axios.defaults.withCredentials = true; // Important for session cookies
axios.defaults.headers.common['Accept'] = 'application/json';

const examId = document.querySelector('meta[name="exam-id"]').content;
const userId = document.querySelector('meta[name="user-id"]').content;
const userRole = document.querySelector('meta[name="user-role"]').content;

console.log('Timer page initialized with:', { examId, userId, userRole });
console.log('CSRF token:', document.querySelector('meta[name="csrf-token"]').content);

let state = 'idle';
let duration = 0, startedAt = null, pausedAt = null, pausedTotal = 0, globalAdjust = 0, studentAdjust = 0, serverOffset = 0;
let renderInterval = null;
let lastUpdateTime = null;



function iso(s) { return s ? new Date(s) : null; }
function nowServer() { return new Date(Date.now() + serverOffset); }
function pad(n){ return String(n).padStart(2,'0'); }
function fmt(sec) {
  const h=Math.floor(sec/3600);
  const m=Math.floor((sec%3600)/60);
  const s=sec%60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

  // Server time offset for perfect synchronization
  let serverTimeOffset = 0;

  // Update server time offset when receiving server time sync
  function updateServerTimeOffset(event) {
    const serverTime = new Date(event.server_time);
    const clientTime = new Date();
    serverTimeOffset = serverTime - clientTime;

    // Update the display
    const offsetEl = document.getElementById('server-time-offset');
    if (offsetEl) {
      const offsetSeconds = Math.round(serverTimeOffset / 1000);
      if (Math.abs(offsetSeconds) <= 1) {
        offsetEl.textContent = 'Server Sync: ✓';
        offsetEl.style.color = '#10b981'; // Green
      } else if (Math.abs(offsetSeconds) <= 5) {
        offsetEl.textContent = `Server Sync: ${offsetSeconds}s`;
        offsetEl.style.color = '#f59e0b'; // Yellow
      } else {
        offsetEl.textContent = `Server Sync: ${offsetSeconds}s`;
        offsetEl.style.color = '#ef4444'; // Red
      }
    }

    console.log('Server time offset updated:', {
      serverTime: serverTime.toISOString(),
      clientTime: clientTime.toISOString(),
      offset: serverTimeOffset,
      offsetSeconds: Math.round(serverTimeOffset / 1000)
    });
  }

function remaining() {
  // Use server time if available, otherwise fall back to client time
  const T = serverTimeOffset ? new Date(Date.now() + serverTimeOffset) : nowServer();
  let elapsed = 0;

  // Safety check for undefined state
  if (!state) {
    return duration || 0;
  }

  if (state === 'running' && startedAt) {
    // When running: elapsed = (now - startedAt) - pausedTotal
    elapsed = Math.floor((T - startedAt) / 1000) - pausedTotal;
  } else if (state === 'paused' && startedAt && pausedAt) {
    // When paused: elapsed = (pausedAt - startedAt) - pausedTotal
    elapsed = Math.floor((pausedAt - startedAt) / 1000) - pausedTotal;
  }

  const r = duration + globalAdjust + studentAdjust - elapsed;

  // Debug logging for timing calculations
  if (state === 'running' && Math.random() < 0.01) { // Log 1% of the time to avoid spam
    console.log('Timer calculation debug:', {
      state: state,
      duration: duration,
      globalAdjust: globalAdjust,
      studentAdjust: studentAdjust,
      pausedTotal: pausedTotal,
      elapsed: elapsed,
      remaining: r,
      startedAt: startedAt,
      now: T
    });
  }

  return Math.max(0, r);
}

function render(){
  // Safety check - don't render if state is not initialized
  if (!state) {
    console.log('Render called before state initialized, skipping...');
    return;
  }

  const remainingSeconds = remaining();
  const timerEl = document.getElementById('timer');
  const stateEl = document.getElementById('state');

  // Update timer display with real-time countdown
  if (timerEl) {
  timerEl.textContent = fmt(remainingSeconds);

  // Color coding based on time remaining
  timerEl.className = 'timer';
  if (remainingSeconds <= 300 && remainingSeconds > 60) {
    timerEl.classList.add('warning');
  } else if (remainingSeconds <= 60) {
    timerEl.classList.add('danger');
    }
  }

  // Safely update state display
  if (stateEl && state) {
  stateEl.textContent = state.charAt(0).toUpperCase() + state.slice(1);
  stateEl.className = `state ${state}`;
  } else if (stateEl) {
    stateEl.textContent = 'Loading...';
    stateEl.className = 'state idle';
  }

  // Update metadata safely
  const serverTimeEl = document.getElementById('server-time');
  const detailedStateEl = document.getElementById('detailed-state');

  if (serverTimeEl) {
    serverTimeEl.textContent = nowServer().toLocaleTimeString();
  }

  if (detailedStateEl && state) {
    detailedStateEl.textContent = state;
  }

  // Store last update time for performance tracking
  lastUpdateTime = Date.now();
}

function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';

  // Add visual feedback to timer when actions are performed
  if (type === 'success') {
    const timerEl = document.getElementById('timer');
    timerEl.style.transform = 'scale(1.05)';
    timerEl.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
      timerEl.style.transform = 'scale(1)';
    }, 200);
  }

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

async function hydrate(){
  try {
    console.log('Attempting to hydrate timer for exam:', examId);

    // Check if Echo is ready before making the request
    if (window.Echo && window.Echo.socketId) {
      console.log('Echo is ready, socketId:', window.Echo.socketId());
    } else {
      console.log('Echo not ready yet, proceeding without socketId');
    }

    const { data } = await axios.get(`/api/exams/${examId}/timer`);
    console.log('Timer data received:', data);

    const t = data.data;

    state = t.state;
    duration = t.duration_seconds;
    startedAt = iso(t.started_at);
    pausedAt = iso(t.paused_at);
    pausedTotal = t.paused_total_seconds;
    globalAdjust = t.global_adjust_seconds;
    studentAdjust = t.student_adjust_seconds || 0;
    serverOffset = new Date(t.server_time) - new Date();

    document.getElementById('version').textContent = t.version;

    // Only start render interval if we have valid data
    if (state && duration > 0) {
      if (!renderInterval) {
        renderInterval = setInterval(render, 100); // More frequent updates for smoother countdown
      }

    // Initial render to show current state
    render();
    console.log('Timer hydrated - State:', state, 'Remaining:', remaining(), 'Started at:', startedAt);
    } else {
      console.log('Timer data not ready yet, skipping render interval');
    }

    updateConnectionStatus(true);
  } catch (error) {
    console.error('Failed to hydrate:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    showStatus(`Failed to load timer state: ${error.response?.status} ${error.response?.statusText}`, 'error');
    updateConnectionStatus(false);
  }
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connection-status');
  statusEl.textContent = connected ? 'Connected' : 'Disconnected';
  statusEl.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
}

// Timer control functions
window.start = async () => {
  try {
    const selectedStudentId = document.getElementById('timer-student-selector')?.value;
    console.log('Start button clicked - Selected student ID:', selectedStudentId, 'Type:', typeof selectedStudentId);

    if (selectedStudentId && selectedStudentId !== '') {
      // Start timer for specific student
      const response = await axios.post(`/api/exams/${examId}/timer/start-student`, { student_id: selectedStudentId });
      console.log('Start student response:', response.data);
      showStatus(`Timer started for selected student`, 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    } else {
      // Start timer for all students (exam timer)
      const response = await axios.post(`/api/exams/${examId}/timer/start-all`);
      console.log('Start all students response:', response.data);
      showStatus('Timer started for all students', 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    }

    // Update version from response
    if (response?.data?.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'running';
    startedAt = new Date(); // Use current time as start time
    pausedAt = null;

    // Force immediate render update
    render();

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to start timer', 'error');
  }
}

window.pause = async () => {
  try {
    const selectedStudentId = document.getElementById('timer-student-selector')?.value;
    console.log('Pause button clicked - Selected student ID:', selectedStudentId, 'Type:', typeof selectedStudentId);

    if (selectedStudentId && selectedStudentId !== '') {
      // Pause timer for specific student
      const response = await axios.post(`/api/exams/${examId}/timer/pause-student`, { student_id: selectedStudentId });
      console.log('Pause student response:', response.data);
      showStatus(`Timer paused for selected student`, 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    } else {
      // Pause timer for all students (exam timer)
      const response = await axios.post(`/api/exams/${examId}/timer/pause-all`);
      console.log('Pause all students response:', response.data);
      showStatus('Timer paused for all students', 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    }

    // Update version from response
    if (response?.data?.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'paused';
    pausedAt = new Date(); // Use current time as pause time

    // Force immediate render update
    render();

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to pause timer', 'error');
  }
}

window.resume = async () => {
  try {
    const selectedStudentId = document.getElementById('timer-student-selector')?.value;
    console.log('Resume button clicked - Selected student ID:', selectedStudentId, 'Type:', typeof selectedStudentId);

    if (selectedStudentId && selectedStudentId !== '') {
      // Resume timer for specific student
      const response = await axios.post(`/api/exams/${examId}/timer/resume-student`, { student_id: selectedStudentId });
      console.log('Resume student response:', response.data);
      showStatus(`Timer resumed for selected student`, 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    } else {
      // Resume timer for all students (exam timer)
      const response = await axios.post(`/api/exams/${examId}/timer/resume-all`);
      console.log('Resume all students response:', response.data);
      showStatus('Timer resumed for all students', 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    }

    // Update version from response
    if (response?.data?.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'running';
    // Don't adjust start time here - let the server handle it
    // The server will send the correct started_at time via WebSocket
    pausedAt = null;

    // Force immediate render update
    render();

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    console.error('Resume error:', error.response?.data);
    showStatus(error.response?.data?.message || 'Failed to resume timer', 'error');
  }
}

window.resetTimer = async () => {
  const selectedStudentId = document.getElementById('timer-student-selector')?.value;
  console.log('Reset button clicked - Selected student ID:', selectedStudentId, 'Type:', typeof selectedStudentId);

  if (selectedStudentId && selectedStudentId !== '') {
    if (!confirm('Are you sure you want to reset the timer for the selected student?')) return;
  } else {
    if (!confirm('Are you sure you want to reset the timer for all students?')) return;
  }

  try {
    let response;

    if (selectedStudentId && selectedStudentId !== '') {
      // Reset timer for specific student
      response = await axios.post(`/api/exams/${examId}/timer/reset-student`, { student_id: selectedStudentId });
      console.log('Reset student response:', response.data);
      showStatus(`Timer reset for selected student`, 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    } else {
      // Reset timer for all students (exam timer)
      response = await axios.post(`/api/exams/${examId}/timer/reset-all`);
      console.log('Reset all students response:', response.data);
      showStatus('Timer reset for all students', 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    }

    // Update version from response
    if (response?.data?.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'idle';
    startedAt = null;
    pausedAt = null;
    pausedTotal = 0;

    // Force immediate render update
    render();

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to reset timer', 'error');
  }
}

window.adjustAll = async () => {
  const seconds = parseInt(document.getElementById('adj').value || 0, 10);
  if (seconds === 0) return;

  const selectedStudentId = document.getElementById('timer-student-selector')?.value;
  console.log('Adjust button clicked - Selected student ID:', selectedStudentId, 'Type:', typeof selectedStudentId);

  try {
    let response;

    if (selectedStudentId && selectedStudentId !== '') {
      // Adjust timer for specific student
      response = await axios.post(`/api/exams/${examId}/timer/adjust-student`, {
        student_id: selectedStudentId,
        seconds
      });
      console.log('Adjust student response:', response.data);
      showStatus(`Adjusted selected student by ${seconds > 0 ? '+' : ''}${seconds} seconds`, 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    } else {
      // Adjust timer for all students (exam timer)
      response = await axios.post(`/api/exams/${examId}/timer/adjust`, { seconds });
    console.log('Adjust all response:', response.data);
      showStatus(`Adjusted all students by ${seconds > 0 ? '+' : ''}${seconds} seconds`, 'success');

      // Refresh student statuses to show updated state
      if (typeof refreshStudentStatuses === 'function') {
        refreshStudentStatuses();
      }
    }

    // Update version from response
    if (response?.data?.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    if (selectedStudentId) {
      studentAdjust += seconds; // Add to student-specific adjustment
    } else {
      globalAdjust += seconds; // Add to global adjustment
    }

    // Force immediate render update
    render();

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to adjust timer', 'error');
  }
};



  // WebSocket initialization
  (async function initWS(){
    // Wait a bit for Echo to be properly initialized
    await new Promise(resolve => setTimeout(resolve, 1000));

    await hydrate();

    // Use the globally initialized Echo object
    console.log('Checking Echo object:', window.Echo);
    console.log('Echo type:', typeof window.Echo);
    console.log('Echo private method:', typeof window.Echo?.private);

    if (window.Echo && typeof window.Echo.private === 'function') {
      console.log('Laravel Echo initialized successfully with private method');
    } else {
      console.warn('Laravel Echo not properly initialized, attempting to reinitialize...');

      try {
        // Try to reinitialize Echo
        window.Echo = new Echo({
          broadcaster: 'reverb',
          key: '{{ config("broadcasting.connections.reverb.key") }}',
          wsHost: '{{ config("broadcasting.connections.reverb.options.host") }}',
          wsPort: {{ config("broadcasting.connections.reverb.options.port") }},
          wssPort: {{ config("broadcasting.connections.reverb.options.port") }},
          forceTLS: {{ config("broadcasting.connections.reverb.options.useTLS") ? 'true' : 'false' }},
          enabledTransports: ['ws', 'wss'],
          disableStats: true,
          encrypted: {{ config("broadcasting.connections.reverb.options.useTLS") ? 'true' : 'false' }},
        });
        console.log('Laravel Echo reinitialized successfully');
      } catch (error) {
        console.error('Failed to initialize Echo:', error);
        // Create a dummy Echo object to prevent errors
        window.Echo = {
          private: () => ({
            listen: () => {},
          }),
          connector: {
            pusher: {
              connection: {
                state: 'disconnected',
                bind: () => {},
              },
            },
          },
        };
      }
    }

    // Listen to general timer channel
  try {
    const ch = Echo.private(`exams.${examId}.timer`);
    console.log('Successfully subscribed to timer channel:', `exams.${examId}.timer`);

    ch.listen('.TimerSynced', (e) => {
      console.log('Timer synced event received:', e);
      console.log('Event details:', {
        state: e.state,
        version: e.version,
        timestamp: new Date().toISOString(),
        userRole: userRole,
        userId: userId
      });

    // Update timer state from broadcast
    if (e.state) state = e.state;
    if (e.duration_seconds) duration = e.duration_seconds;
    if (e.started_at) startedAt = new Date(e.started_at);
    if (e.paused_at) pausedAt = new Date(e.paused_at);
    if (e.paused_total_seconds !== undefined) {
      console.log('Updating pausedTotal from WebSocket:', pausedTotal, '->', e.paused_total_seconds);
      pausedTotal = e.paused_total_seconds;
    }
    if (e.global_adjust_seconds !== undefined) globalAdjust = e.global_adjust_seconds;
    if (e.server_time) serverOffset = new Date(e.server_time) - new Date();

    if (e.version) {
      document.getElementById('version').textContent = e.version;
    }

    // Force immediate render update for real-time response
    render();
    updateConnectionStatus(true);

    // Show status message for state changes
    if (e.state && e.state !== 'idle') {
      showStatus(`Timer ${e.state} via WebSocket`, 'success');
    }
  });

  } catch (error) {
    console.error('Failed to subscribe to timer channel:', error);
    showStatus('Failed to subscribe to real-time updates', 'error');
  }

  // Listen to server time synchronization channel
  try {
    const timeCh = Echo.channel('server.time');
    console.log('Successfully subscribed to server time channel: server.time');

    timeCh.listen('.server.time.sync', (e) => {
      console.log('Server time sync received:', e);

      // Update server time offset for perfect synchronization
      updateServerTimeOffset(e);
    });
  } catch (error) {
    console.error('Failed to subscribe to server time channel:', error);
  }

  // If user is a student, also listen to their personal channel
  if (userRole === 'student' && userId) {
    try {
      const studentCh = Echo.private(`exams.${examId}.students.${userId}.timer`);
      console.log('Successfully subscribed to student channel:', `exams.${examId}.students.${userId}.timer`);

      studentCh.listen('.TimerSynced', (e) => {
        console.log('Student timer synced event received:', e);

        // Update student-specific adjustments
        if (e.target_student_id == userId) {
          // Update student adjustment immediately
          if (e.delta_seconds !== undefined) {
            studentAdjust += e.delta_seconds;
            console.log(`Student adjustment updated: ${studentAdjust} seconds`);
          }

          // Force immediate render update
          render();

          // Show status for student-specific changes
          if (e.delta_seconds) {
            const sign = e.delta_seconds > 0 ? '+' : '';
            showStatus(`Student time adjusted by ${sign}${e.delta_seconds} seconds via WebSocket`, 'success');
          }
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to student channel:', error);
      showStatus('Failed to subscribe to student-specific updates', 'error');
    }
  }

  // Handle WebSocket connection events
  if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connection) {
    Echo.connector.pusher.connection.bind('connected', () => {
      console.log('WebSocket connected successfully');
      updateConnectionStatus(true);
      showStatus('WebSocket connected - Real-time updates enabled', 'success');
      hydrate(); // Resync on reconnect
    });

    Echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('WebSocket disconnected');
      updateConnectionStatus(false);
      showStatus('WebSocket disconnected - Real-time updates disabled', 'error');
    });

    Echo.connector.pusher.connection.bind('error', (error) => {
      console.error('WebSocket error:', error);
      updateConnectionStatus(false);
      showStatus('WebSocket connection error', 'error');
    });
  } else {
    console.warn('Echo connector structure not as expected:', Echo.connector);
  }

    // Check WebSocket connection status
  setTimeout(() => {
    let connectionState = 'unknown';
    if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connection) {
      connectionState = Echo.connector.pusher.connection.state;
    } else if (Echo.connector && Echo.connector.connection) {
      connectionState = Echo.connector.connection.state;
    }

    if (connectionState === 'connected') {
      showStatus('Real-time synchronization active', 'success');
    } else {
      showStatus('Real-time synchronization not available - Timer will work without live updates', 'warning');

      // Set up polling as fallback when WebSocket fails
      setInterval(() => {
        let currentState = 'unknown';
        if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connection) {
          currentState = Echo.connector.pusher.connection.state;
        } else if (Echo.connector && Echo.connector.connection) {
          currentState = Echo.connector.connection.state;
        }

        if (currentState !== 'connected') {
          hydrate(); // Refresh timer data every 5 seconds as fallback
        }
      }, 5000);
    }
  }, 3000);

  // Populate users dropdown when page loads
  if (userRole === 'proctor' || userRole === 'admin') {
    populateUsersDropdown();
  }

  // Populate individual student dropdown for admin/proctor
  if (userRole === 'proctor' || userRole === 'admin') {
    populateIndividualStudentDropdown();
    populateTimerStudentSelector();
  }

  // Load default timer initially
  await loadDefaultTimer();

  // Function to populate individual student dropdown
  async function populateIndividualStudentDropdown() {
    try {
      const response = await axios.get(`/api/exams/${examId}/users`);
      const users = response.data;

      const select = document.getElementById('individual-student-id');
      if (select) {
        select.innerHTML = '<option value="">Select Student</option>';
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = `${user.name} (${user.email})`;
          select.appendChild(option);
        });
        }
      } catch (error) {
      console.error('Failed to load individual student users:', error);
    }
  }

  // Function to populate timer student selector
  async function populateTimerStudentSelector() {
    try {
      const response = await axios.get(`/api/exams/${examId}/users`);
      const users = response.data;

      const select = document.getElementById('timer-student-selector');
      if (select) {
        // Keep the default option and add student options
        select.innerHTML = '<option value="">Exam Timer (Default)</option>';
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = `${user.name} (${user.email})`;
          select.appendChild(option);
        });

        // Add event listener for timer switching
        select.addEventListener('change', handleTimerStudentChange);
      }
    } catch (error) {
      console.error('Failed to load timer student selector:', error);
    }
  }

    // Function to handle timer student selection change
  async function handleTimerStudentChange() {
    const selectedStudentId = document.getElementById('timer-student-selector').value;
    const studentInfo = document.getElementById('selected-student-info');
    const studentLabel = document.getElementById('student-timer-label');
    const studentAdjustment = document.getElementById('student-adjustment-info');
    const controlModeIndicator = document.getElementById('control-mode-indicator');

    console.log('Student selection changed - Selected ID:', selectedStudentId, 'Type:', typeof selectedStudentId);

    if (!selectedStudentId) {
      // Show default exam timer
      studentInfo.style.display = 'none';
      // Update control mode indicator
      if (controlModeIndicator) {
        controlModeIndicator.textContent = 'Controlling: All Students';
        console.log('Control mode set to: All Students');
      }
      // Reset to default timer state
      await loadDefaultTimer();
      return;
    }

    try {
      // Get student's timer state
      const response = await axios.get(`/api/exams/${examId}/timer/student/${selectedStudentId}`);
      const studentTimer = response.data;

      // Update the display to show student's timer
      studentLabel.textContent = `Showing timer for: ${studentTimer.student_name}`;

      if (studentTimer.student_adjust_seconds !== 0) {
        studentAdjustment.textContent = ` (${studentTimer.student_adjust_seconds > 0 ? '+' : ''}${studentTimer.student_adjust_seconds}s adjustment)`;
    } else {
        studentAdjustment.textContent = '';
      }

      studentInfo.style.display = 'block';

      // Update control mode indicator
      if (controlModeIndicator) {
        controlModeIndicator.textContent = `Controlling: ${studentTimer.student_name}`;
        console.log('Control mode set to:', studentTimer.student_name);
      }

      // Update the timer display with student's timer
      await loadStudentTimer(selectedStudentId);

    } catch (error) {
      console.error('Failed to load student timer:', error);
      showStatus('Failed to load student timer', 'error');
    }
  }

  // Function to load default exam timer
  async function loadDefaultTimer() {
    try {
      const response = await axios.get(`/api/exams/${examId}/timer`);
      const timerData = response.data;

      // Update global timer state
      state = timerData.state;
      duration = timerData.duration_seconds;
      startedAt = timerData.started_at ? new Date(timerData.started_at) : null;
      pausedAt = timerData.paused_at ? new Date(timerData.paused_at) : null;
      pausedTotal = timerData.paused_total_seconds || 0;
      globalAdjust = timerData.global_adjust_seconds || 0;
      studentAdjust = 0; // Reset student adjustment for default timer

            // Update display
      updateTimerDisplay();
      updateStateDisplay();

      // Start render interval if not already running and we have valid data
      if (!renderInterval && state && duration > 0) {
        renderInterval = setInterval(render, 100);
      }

    } catch (error) {
      console.error('Failed to load default timer:', error);
    }
  }

  // Function to load specific student timer
  async function loadStudentTimer(studentId) {
    try {
      const response = await axios.get(`/api/exams/${examId}/timer/student/${studentId}`);
      const studentTimer = response.data;

      // Update timer state with student's specific data
      state = studentTimer.state;
      duration = studentTimer.duration_seconds;
      startedAt = studentTimer.started_at ? new Date(studentTimer.started_at) : null;
      pausedAt = studentTimer.paused_at ? new Date(studentTimer.paused_at) : null;
      pausedTotal = studentTimer.paused_total_seconds || 0;
      globalAdjust = studentTimer.global_adjust_seconds || 0;
      studentAdjust = studentTimer.student_adjust_seconds || 0;

            // Update display
      updateTimerDisplay();
      updateStateDisplay();

      // Start render interval if not already running and we have valid data
      if (!renderInterval && state && duration > 0) {
        renderInterval = setInterval(render, 100);
      }

    } catch (error) {
      console.error('Failed to load student timer:', error);
    }
  }

  // Function to update timer display
  function updateTimerDisplay() {
    const remainingSeconds = remaining();
    const timerEl = document.getElementById('timer');

    if (timerEl) {
      // Update timer display with real-time countdown
      timerEl.textContent = fmt(remainingSeconds);

      // Color coding based on time remaining
      timerEl.classList.remove('warning', 'danger');
      if (remainingSeconds <= 300 && remainingSeconds > 60) {
        timerEl.classList.add('warning');
      } else if (remainingSeconds <= 60) {
        timerEl.classList.add('danger');
      }
    }
  }

  // Function to update state display
  function updateStateDisplay() {
    const stateEl = document.getElementById('state');

    if (stateEl && state) {
      stateEl.textContent = state.charAt(0).toUpperCase() + state.slice(1);
      stateEl.className = `state ${state}`;

      // Update metadata
      const detailedStateEl = document.getElementById('detailed-state');
      if (detailedStateEl) {
        detailedStateEl.textContent = state;
      }
    } else if (stateEl) {
      stateEl.textContent = 'Loading...';
      stateEl.className = 'state idle';
    }
  }

















  window.refreshStudentStatuses = async () => {
    try {
      console.log('Refreshing student statuses...');
      const response = await axios.get(`/api/exams/${examId}/timer/all-students-states`);
      console.log('Student statuses response:', response.data);

      const tbody = document.getElementById('student-status-tbody');
      if (tbody) {
        tbody.innerHTML = ''; // Clear existing rows

        if (response.data.data && response.data.data.length > 0) {
          response.data.data.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${student.student_id}</td>
              <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${student.state}</td>
              <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${fmt(student.remaining_seconds)}</td>
              <td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">${student.student_adjust_seconds > 0 ? '+' : ''}${student.student_adjust_seconds}s</td>
            `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: #6b7280;">No students found</td></tr>';
        }
      }
      showStatus('Student statuses refreshed', 'success');
    } catch (error) {
      console.error('Failed to refresh student statuses:', error);
      showStatus('Failed to refresh student statuses: ' + error.message, 'error');
    }
  };
})();
</script>
</body>
</html>

