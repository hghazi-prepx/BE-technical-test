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
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background: #f8fafc;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .exam-info {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .timer {
      font-size: 4rem;
      font-weight: 700;
      text-align: center;
      margin: 2rem 0;
      color: #1f2937;
      font-family: 'Courier New', monospace;
    }
    .timer.warning { color: #f59e0b; }
    .timer.danger { color: #ef4444; }
    .state {
      text-align: center;
      font-size: 1.2rem;
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      border-radius: 4px;
    }
    .state.running { background: #dcfce7; color: #166534; }
    .state.paused { background: #fef3c7; color: #92400e; }
    .state.idle { background: #f3f4f6; color: #374151; }
    .state.finished { background: #fecaca; color: #991b1b; }
    .controls {
      display: flex;
      gap: 0.5rem;
      margin: 2rem 0;
      flex-wrap: wrap;
      justify-content: center;
    }
    .controls button, .controls input, .controls select {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }
    .controls button:hover {
      background: #f9fafb;
    }
    .controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .status {
      text-align: center;
      margin: 1rem 0;
      padding: 0.5rem;
      border-radius: 4px;
      display: none;
    }
    .status.success { background: #dcfce7; color: #166534; }
    .status.error { background: #fecaca; color: #991b1b; }
    .connection-status {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    .connected { background: #dcfce7; color: #166534; }
    .disconnected { background: #fecaca; color: #991b1b; }
    .metadata {
      font-size: 0.875rem;
      color: #6b7280;
      text-align: center;
      margin-top: 2rem;
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
        <div style="display: flex; gap: 1rem; align-items: center;">
          <span style="color: #6b7280; font-size: 0.875rem;">
            Logged in as: {{ auth()->user()->name }} ({{ auth()->user()->role }})
          </span>
          <button onclick="testWebSocket()" style="
            padding: 0.5rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
          ">Test WebSocket</button>
                          <button onclick="connectWebSocket()" style="
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Connect WebSocket</button>
        <button onclick="testBroadcasting()" style="
          padding: 0.5rem 1rem;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Broadcasting</button>
        <button onclick="debugTimerState()" style="
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Debug Timer</button>
        <button onclick="testWebSocketEvents()" style="
          padding: 0.5rem 1rem;
          background: #ec4899;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Events</button>
        <button onclick="checkWebSocketStatus()" style="
          padding: 0.5rem 1rem;
          background: #14b8a6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Check Status</button>
        <button onclick="testWebSocketEndpoint()" style="
          padding: 0.5rem 1rem;
          background: #f97316;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Endpoint</button>
        <button onclick="checkUserPermissions()" style="
          padding: 0.5rem 1rem;
          background: #06b6d4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Check User</button>
        @if(auth()->user()->role === 'admin')
        <button onclick="testBroadcasting()" style="
          padding: 0.5rem 1rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Broadcast</button>
        @endif
        <button onclick="testBroadcastingAuth()" style="
          padding: 0.5rem 1rem;
          background: #059669;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Auth</button>
        <button onclick="testPauseResumeTiming()" style="
          padding: 0.5rem 1rem;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Timing</button>
        @if(auth()->user()->role === 'admin')
        <button onclick="testTimerState()" style="
          padding: 0.5rem 1rem;
          background: #0891b2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Timer State</button>
        @endif
        <button onclick="startServerTimeBroadcast()" style="
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Start Time Sync</button>
        <button onclick="testServerTimeSync()" style="
          padding: 0.5rem 1rem;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        ">Test Time Sync</button>
          <form method="POST" action="{{ route('logout') }}" style="margin: 0;">
            @csrf
            <button type="submit" style="
              padding: 0.5rem 1rem;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.875rem;
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

    <div class="timer" id="timer">--:--:--</div>

    <div class="state" id="state">Loading...</div>

    <div class="status" id="status"></div>

    @if(auth()->user() && in_array(auth()->user()->role, ['proctor', 'admin']))
    <div class="controls">
      <button onclick="start()" id="start-btn">Start</button>
      <button onclick="pause()" id="pause-btn">Pause</button>
      <button onclick="resume()" id="resume-btn">Resume</button>
      <button onclick="resetTimer()" id="reset-btn">Reset</button>
    </div>

    <div class="controls">
      <input id="adj" type="number" value="60" step="5" placeholder="Seconds" />
      <button onclick="adjustAll()">Adjust All</button>
      <select id="student-id" placeholder="Select Student (optional)">
        <option value="">Select Student (optional)</option>
      </select>
      <button onclick="adjustStudent()">Adjust Student</button>
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

// Function to populate users dropdown
async function populateUsersDropdown() {
  try {
    const response = await axios.get(`/api/exams/${examId}/users`);
    const users = response.data;

    const select = document.getElementById('student-id');
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select Student (optional)</option>';

    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.name} (${user.email})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

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
  const remainingSeconds = remaining();
  const timerEl = document.getElementById('timer');
  const stateEl = document.getElementById('state');

  // Update timer display with real-time countdown
  timerEl.textContent = fmt(remainingSeconds);

  // Color coding based on time remaining
  timerEl.className = 'timer';
  if (remainingSeconds <= 300 && remainingSeconds > 60) {
    timerEl.classList.add('warning');
  } else if (remainingSeconds <= 60) {
    timerEl.classList.add('danger');
  }

  stateEl.textContent = state.charAt(0).toUpperCase() + state.slice(1);
  stateEl.className = `state ${state}`;

  // Update metadata
  document.getElementById('server-time').textContent = nowServer().toLocaleTimeString();
  document.getElementById('detailed-state').textContent = state;

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

    if (!renderInterval) renderInterval = setInterval(render, 100); // More frequent updates for smoother countdown

    // Initial render to show current state
    render();
    console.log('Timer hydrated - State:', state, 'Remaining:', remaining(), 'Started at:', startedAt);

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
    const response = await axios.post(`/api/exams/${examId}/timer/start`);
    console.log('Start response:', response.data);

    // Update version from response
    if (response.data.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'running';
    startedAt = new Date(); // Use current time as start time
    pausedAt = null;

    // Force immediate render update
    render();
    showStatus('Timer started');

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to start timer', 'error');
  }
}

window.pause = async () => {
  try {
    const response = await axios.post(`/api/exams/${examId}/timer/pause`);
    console.log('Pause response:', response.data);

    // Update version from response
    if (response.data.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'paused';
    pausedAt = new Date(); // Use current time as pause time

    // Force immediate render update
    render();
    showStatus('Timer paused');

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to pause timer', 'error');
  }
}

window.resume = async () => {
  try {
    const response = await axios.post(`/api/exams/${examId}/timer/resume`);
    console.log('Resume response:', response.data);

    // Update version from response
    if (response.data.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'running';
    // Don't adjust start time here - let the server handle it
    // The server will send the correct started_at time via WebSocket
    pausedAt = null;

    // Force immediate render update
    render();
    showStatus('Timer resumed');

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    console.error('Resume error:', error.response?.data);
    showStatus(error.response?.data?.message || 'Failed to resume timer', 'error');
  }
}

window.resetTimer = async () => {
  if (!confirm('Are you sure you want to reset the timer?')) return;
  try {
    const response = await axios.post(`/api/exams/${examId}/timer/reset`);
    console.log('Reset response:', response.data);

    // Update version from response
    if (response.data.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    state = 'idle';
    startedAt = null;
    pausedAt = null;
    pausedTotal = 0;

    // Force immediate render update
    render();
    showStatus('Timer reset');

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to reset timer', 'error');
  }
}

window.adjustAll = async () => {
  const seconds = parseInt(document.getElementById('adj').value || 0, 10);
  if (seconds === 0) return;

  try {
    const response = await axios.post(`/api/exams/${examId}/timer/adjust`, { seconds });
    console.log('Adjust all response:', response.data);

    // Update version from response
    if (response.data.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    globalAdjust += seconds; // Add to existing adjustment

    // Force immediate render update
    render();
    showStatus(`Adjusted all students by ${seconds > 0 ? '+' : ''}${seconds} seconds`);

    // Refresh timer data to get accurate server state
    setTimeout(() => hydrate(), 100);
  } catch (error) {
    showStatus(error.response?.data?.message || 'Failed to adjust timer', 'error');
  }
};

window.adjustStudent = async () => {
  const seconds = parseInt(document.getElementById('adj').value || 0, 10);
  const studentId = document.getElementById('student-id').value;

  if (seconds === 0 || !studentId) {
    showStatus('Please enter both seconds and select a student', 'error');
    return;
  }

  try {
    const response = await axios.post(`/api/exams/${examId}/timer/adjust`, { seconds, student_id: studentId });
    console.log('Adjust student response:', response.data);

    // Update version from response
    if (response.data.version) {
      document.getElementById('version').textContent = response.data.version;
    }

    // Immediately update local state for instant UI response
    if (parseInt(studentId) == userId) {
      studentAdjust += seconds; // Add to existing student adjustment
    }

    // Force immediate render update
    render();

    // Get student name for better user experience
    const studentSelect = document.getElementById('student-id');
    const selectedOption = studentSelect.options[studentSelect.selectedIndex];
    const studentName = selectedOption ? selectedOption.textContent : `ID ${studentId}`;

    showStatus(`Adjusted ${studentName} by ${seconds > 0 ? '+' : ''}${seconds} seconds`);

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

    // Test WebSocket connection
  setTimeout(() => {
    // Check different possible connection state locations
    let connectionState = 'unknown';
    if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connection) {
      connectionState = Echo.connector.pusher.connection.state;
      console.log('WebSocket connection test - State (pusher):', connectionState);
    } else if (Echo.connector && Echo.connector.connection) {
      connectionState = Echo.connector.connection.state;
      console.log('WebSocket connection test - State (direct):', connectionState);
    } else {
      console.log('WebSocket connection test - No connector found');
    }

    console.log('Echo configuration:', {
      broadcaster: Echo.options?.broadcaster,
      key: Echo.options?.key,
      wsHost: Echo.options?.wsHost,
      wsPort: Echo.options?.wsPort,
      forceTLS: Echo.options?.forceTLS,
      encrypted: Echo.options?.encrypted
    });

    if (connectionState === 'connected') {
      console.log('WebSocket connection test successful');
      showStatus('Real-time synchronization active', 'success');
    } else {
      console.warn('WebSocket connection test failed - State:', connectionState);
      showStatus('Real-time synchronization not available - Timer will work without live updates', 'error');

      // Set up polling as fallback when WebSocket fails
      console.log('Setting up polling fallback for timer updates');
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

      // Add manual WebSocket test function
  window.testWebSocket = () => {
    console.log('Testing WebSocket connection...');
    console.log('Echo object:', Echo);
    console.log('Echo object keys:', Object.keys(Echo));
    console.log('Echo options:', Echo.options);
    console.log('Echo connector:', Echo.connector);

    // Log all available methods on Echo
    console.log('Available methods on Echo:', Object.getOwnPropertyNames(Object.getPrototypeOf(Echo)));

    // Check different possible connection state locations
    let connectionState = 'unknown';
    if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connection) {
      connectionState = Echo.connector.pusher.connection.state;
      console.log('Connection state (pusher):', connectionState);
    } else if (Echo.connector && Echo.connector.connection) {
      connectionState = Echo.connector.connection.state;
      console.log('Connection state (direct):', connectionState);
    } else if (Echo.connection) {
      connectionState = Echo.connection.state;
      console.log('Connection state (Echo direct):', connectionState);
    } else {
      console.log('Connection state: No connector found');
    }

    if (connectionState === 'connected') {
      showStatus('WebSocket is connected and working', 'success');
    } else {
      showStatus('WebSocket is not connected', 'error');

      // Try to connect manually using different methods
      console.log('Attempting manual connection...');
      try {
        if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connect) {
          Echo.connector.pusher.connect();
          showStatus('Manual connection attempt initiated (pusher)', 'success');
        } else if (Echo.connector && Echo.connector.connect) {
          Echo.connector.connect();
          showStatus('Manual connection attempt initiated (direct)', 'success');
        } else if (Echo.connection && Echo.connection.connect) {
          Echo.connection.connect();
          showStatus('Manual connection attempt initiated (Echo connection)', 'success');
        } else if (Echo.connect) {
          Echo.connect();
          showStatus('Manual connection attempt initiated (Echo)', 'success');
        } else {
          console.log('No connect method found. Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(Echo)));
          showStatus('No connect method found - check console for available methods', 'error');
        }
      } catch (error) {
        console.error('Manual connection failed:', error);
        showStatus('Manual connection failed: ' + error.message, 'error');
      }
    }
  };

  // Add function to manually connect WebSocket
  window.connectWebSocket = () => {
    console.log('Attempting to connect WebSocket...');
    try {
      // Try to connect to the WebSocket server using different methods
      if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connect) {
        Echo.connector.pusher.connect();
        showStatus('WebSocket connection attempt initiated (pusher)', 'success');
      } else if (Echo.connector && Echo.connector.connect) {
        Echo.connector.connect();
        showStatus('WebSocket connection attempt initiated (direct)', 'success');
      } else if (Echo.connect) {
        Echo.connect();
        showStatus('WebSocket connection attempt initiated (Echo)', 'success');
      } else {
        showStatus('No connect method found', 'error');
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      showStatus('Failed to connect WebSocket: ' + error.message, 'error');
    }
  };

  // Add function to test broadcasting
  window.testBroadcasting = () => {
    console.log('Testing broadcasting configuration...');
    console.log('Broadcasting driver:', '{{ config("broadcasting.default") }}');
    console.log('Reverb config:', {
      host: '{{ config("broadcasting.connections.reverb.options.host") }}',
      port: '{{ config("broadcasting.connections.reverb.options.port") }}',
      scheme: '{{ config("broadcasting.connections.reverb.options.scheme") }}'
    });
    showStatus('Broadcasting config logged to console', 'success');
  };

  // Add function to debug timer state
  window.debugTimerState = () => {
    console.log('Current timer state:', {
      state: state,
      duration: duration,
      startedAt: startedAt,
      pausedAt: pausedAt,
      pausedTotal: pausedTotal,
      globalAdjust: globalAdjust,
      studentAdjust: studentAdjust,
      remaining: remaining(),
      serverOffset: serverOffset
    });
    showStatus('Timer state logged to console', 'success');
  };

    // Add function to test WebSocket event reception
  window.testWebSocketEvents = () => {
    console.log('Testing WebSocket event reception...');
    console.log('Echo object:', Echo);
    console.log('Echo type:', typeof Echo);
    console.log('Echo constructor:', Echo.constructor.name);

    // Check different possible connection state locations
    let connectionState = 'unknown';
    if (Echo.connector && Echo.connector.pusher && Echo.connector.pusher.connection) {
      connectionState = Echo.connector.pusher.connection.state;
      console.log('Connection state (pusher):', connectionState);
    } else if (Echo.connector && Echo.connector.connection) {
      connectionState = Echo.connector.connection.state;
      console.log('Connection state (direct):', connectionState);
    } else if (Echo.connection) {
      connectionState = Echo.connection.state;
      console.log('Connection state (Echo direct):', connectionState);
    } else {
      console.log('Connection state: No connector found');
    }

    // Test if we can access the channels
    try {
      console.log('Attempting to create private channel...');
      const testChannel = Echo.private(`exams.${examId}.timer`);
      console.log('Test channel created:', testChannel);
      console.log('Channel type:', typeof testChannel);
      console.log('Channel methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(testChannel)));
      showStatus('WebSocket channels accessible', 'success');
    } catch (error) {
      console.error('Failed to create test channel:', error);
      showStatus('WebSocket channels not accessible', 'error');
    }
  };

  // Add function to test WebSocket endpoint
  window.testWebSocketEndpoint = async () => {
    try {
      console.log('Testing WebSocket endpoint...');
      const response = await axios.get('/test-websocket');
      console.log('WebSocket endpoint response:', response.data);
      showStatus('WebSocket endpoint working', 'success');
    } catch (error) {
      console.error('WebSocket endpoint test failed:', error);
      showStatus('WebSocket endpoint failed: ' + error.message, 'error');
    }
  };

  // Add function to check WebSocket status
  window.checkWebSocketStatus = () => {
    console.log('=== WebSocket Status Check ===');
    console.log('Echo object:', window.Echo);
    console.log('Echo type:', typeof window.Echo);

    if (window.Echo) {
      console.log('Echo object keys:', Object.keys(window.Echo));
      console.log('Echo options:', window.Echo.options);
      console.log('Echo connector:', window.Echo.connector);

      // Check socket ID
      try {
        const socketId = window.Echo.socketId();
        console.log('Socket ID:', socketId);
        console.log('Socket ID type:', typeof socketId);
        console.log('Socket ID valid:', socketId && socketId.length > 0);
      } catch (error) {
        console.log('Socket ID error:', error.message);
      }

      // Check connection state
      if (window.Echo.connector && window.Echo.connector.pusher && window.Echo.connector.pusher.connection) {
        console.log('Connection state:', window.Echo.connector.pusher.connection.state);
        console.log('Connection ready:', window.Echo.connector.pusher.connection.state === 'connected');
      } else {
        console.log('No pusher connector found');
      }

      // Check if private method works
      try {
        const testChannel = window.Echo.private(`exams.${examId}.timer`);
        console.log('Private channel creation:', testChannel ? 'Success' : 'Failed');
      } catch (error) {
        console.log('Private channel error:', error.message);
      }
    } else {
      console.log('Echo object not available');
    }

    showStatus('WebSocket status checked - see console', 'success');
  };

  // Add function to check user permissions
  window.checkUserPermissions = async () => {
    try {
      console.log('Checking user permissions...');
      const response = await axios.get('/check-user');
      console.log('User permissions response:', response.data);
      showStatus('User permissions checked - see console', 'success');
    } catch (error) {
      console.error('User permissions check failed:', error);
      showStatus('User permissions check failed: ' + error.message, 'error');
    }
  };

  // Add function to test broadcasting manually
  window.testBroadcasting = async () => {
    try {
      console.log('Testing manual broadcasting...');
      const response = await axios.get(`/test-broadcast/${examId}`);
      console.log('Broadcast test response:', response.data);
      showStatus('Manual broadcast test completed', 'success');
    } catch (error) {
      console.error('Broadcast test failed:', error);
      showStatus('Broadcast test failed: ' + error.message, 'error');
    }
  };

  // Add function to test broadcasting authentication
  window.testBroadcastingAuth = async () => {
    try {
      console.log('Testing broadcasting authentication...');

      // Get the real socket ID from Echo
      let socketId = null;
      if (window.Echo && window.Echo.socketId) {
        try {
          socketId = window.Echo.socketId();
          console.log('Real socket ID:', socketId);
        } catch (error) {
          console.warn('Could not get socket ID:', error);
        }
      }

      if (!socketId) {
        showStatus('No socket ID available - Echo not connected', 'error');
        return;
      }

      const response = await axios.get('/broadcasting/auth', {
        params: {
          socket_id: socketId,
          channel_name: `exams.${examId}.timer`
        }
      });
      console.log('Broadcasting auth response:', response.data);
      showStatus('Broadcasting authentication working', 'success');
    } catch (error) {
      console.error('Broadcasting auth failed:', error);
      showStatus('Broadcasting auth failed: ' + error.message, 'error');
    }
  };

    // Add function to test pause/resume timing
  window.testPauseResumeTiming = () => {
    console.log('Testing pause/resume timing logic...');
    console.log('Current timer state:', {
      state: state,
      duration: duration,
      startedAt: startedAt,
      pausedAt: pausedAt,
      pausedTotal: pausedTotal,
      remaining: remaining(),
      globalAdjust: globalAdjust,
      studentAdjust: studentAdjust
    });

    if (state === 'running' && startedAt) {
      const elapsed = Math.floor((new Date() - startedAt) / 1000);
      const expectedRemaining = duration + globalAdjust + studentAdjust - pausedTotal - elapsed;
      console.log('Timing calculation:', {
        elapsed: elapsed,
        expectedRemaining: expectedRemaining,
        actualRemaining: remaining(),
        difference: expectedRemaining - remaining()
      });
    }

    showStatus('Pause/resume timing test completed - check console', 'success');
  };

  // Add function to test timer state from server
  window.testTimerState = async () => {
    try {
      console.log('Testing timer state from server...');
      const response = await axios.get(`/test-timer/${examId}`);
      console.log('Timer state response:', response.data);

      // Also check the actual timer API to see the current state
      console.log('Checking actual timer API...');
      const timerResponse = await axios.get(`/api/exams/${examId}/timer`);
      console.log('Actual timer API response:', timerResponse.data);

      showStatus('Timer state test completed - check console', 'success');
    } catch (error) {
      console.error('Timer state test failed:', error);
      showStatus('Timer state test failed: ' + error.message, 'error');
    }
  };

  // Add function to start server time broadcasting
  window.startServerTimeBroadcast = async () => {
    try {
      console.log('Starting server time broadcast...');
      const response = await axios.post('/start-server-time-broadcast');
      console.log('Server time broadcast started:', response.data);
      showStatus('Server time synchronization started!', 'success');

      // Also test the server time sync immediately
      setTimeout(() => {
        testServerTimeSync();
      }, 2000);
    } catch (error) {
      console.error('Failed to start server time broadcast:', error);
      showStatus('Failed to start server time sync: ' + error.message, 'error');
    }
  };

  // Add function to test server time synchronization
  window.testServerTimeSync = () => {
    console.log('Testing server time synchronization...');
    console.log('Current server time offset:', serverTimeOffset);
    console.log('Client time:', new Date().toISOString());
    console.log('Adjusted time:', new Date(Date.now() + serverTimeOffset).toISOString());

    showStatus('Server time sync test completed - check console', 'success');
  };

  // Populate users dropdown when page loads
  if (userRole === 'proctor' || userRole === 'admin') {
    populateUsersDropdown();
  }
})();
</script>
</body>
</html>

