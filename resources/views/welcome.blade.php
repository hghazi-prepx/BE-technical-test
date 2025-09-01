<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>PrepX Timer - Real-Time Exam Timer System</title>
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
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 3rem 2rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    .header h1 {
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    .header p {
      font-size: 1.25rem;
      color: #6b7280;
      font-weight: 500;
    }

    .auth-section {
      text-align: center;
      margin: 2rem 0;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    .auth-section p {
      font-size: 1.125rem;
      margin-bottom: 1.5rem;
      color: #374151;
    }

    .exams-section {
      margin: 2rem 0;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    .exams-section h2 {
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #1f2937;
      text-align: center;
    }

    .exam-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1rem 0;
      background: #ffffff;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .exam-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .exam-title {
      font-size: 1.375rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #1f2937;
    }

    .exam-meta {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .exam-meta::before {
      content: "•";
      color: #667eea;
      font-weight: bold;
    }

    .exam-meta:first-child::before {
      display: none;
    }

    .exam-actions {
      margin-top: 1.5rem;
      text-align: right;
    }

    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      margin: 0.25rem;
      border-radius: 8px;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
      transform: translateY(-2px);
    }

    .feature-list {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .feature-list li {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .feature-list li:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .feature-list li::before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      font-size: 1.25rem;
      background: #ecfdf5;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .features-section {
      margin-top: 3rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    .features-section h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #1f2937;
      text-align: center;
    }

    .user-info {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 1rem;
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
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .feature-list {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PrepX Real-Time Exam Timer</h1>
      <p>A production-ready real-time exam timer system with WebSocket synchronization</p>
    </div>

    <div class="auth-section">
      @auth
        <div class="user-info">
          Welcome, <strong>{{ auth()->user()->name }}</strong>
          <span class="role-badge">{{ ucfirst(auth()->user()->role) }}</span>
        </div>
        <form method="POST" action="/logout" style="display: inline;">
          @csrf
          <button type="submit" class="btn btn-secondary">Logout</button>
        </form>
      @else
        <p>Please login to access the timer system</p>
        <a href="/login" class="btn btn-primary">Login</a>
      @endauth
    </div>

    @auth
    <div class="exams-section">
      <h2>Available Exams</h2>

      @php
        $exams = \App\Models\Exam::with('creator')->get();
      @endphp

      @forelse($exams as $exam)
        <div class="exam-card">
          <div class="exam-title">{{ $exam->title }}</div>
          @if($exam->description)
            <div style="color: #6b7280; margin-bottom: 1rem;">{{ $exam->description }}</div>
          @endif
          <div class="exam-meta">Duration: {{ gmdate('H:i:s', $exam->default_duration_seconds) }}</div>
          <div class="exam-meta">Created by: {{ $exam->creator->name }}</div>
          <div class="exam-meta">Status: Active</div>

          <div class="exam-actions">
            <a href="/timer/{{ $exam->id }}" class="btn btn-primary">Open Timer</a>
          </div>
        </div>
      @empty
        <p style="text-align: center; color: #6b7280; padding: 2rem;">No exams available. Create one first!</p>
      @endforelse
    </div>
    @endauth

    <div class="features-section">
      <h3>System Features</h3>
      <ul class="feature-list">
        <li>Real-time timer synchronization via WebSockets</li>
        <li>Per-student time adjustments</li>
        <li>Proctor controls: start, pause, resume, reset</li>
        <li>Automatic reconnection and state rehydration</li>
        <li>Role-based access control</li>
        <li>Transaction-based state management</li>
        <li>Clock drift compensation</li>
        <li>Multiple concurrent sessions support</li>
      </ul>
    </div>
  </div>
</body>
</html>

