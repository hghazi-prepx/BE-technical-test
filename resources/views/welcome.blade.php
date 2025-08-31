<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>PrepX Timer - Real-Time Exam Timer System</title>
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
    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .auth-section {
      text-align: center;
      margin: 2rem 0;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 4px;
    }
    .exams-section {
      margin: 2rem 0;
    }
    .exam-card {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
      background: #fafafa;
    }
    .exam-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }
    .exam-meta {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0.25rem 0;
    }
    .exam-actions {
      margin-top: 1rem;
    }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      margin: 0.25rem;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid #d1d5db;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
    .btn-secondary {
      background: white;
      color: #374151;
    }
    .btn-secondary:hover {
      background: #f9fafb;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .feature-list li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      margin-right: 0.5rem;
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
        <p>Welcome, <strong>{{ auth()->user()->name }}</strong> ({{ ucfirst(auth()->user()->role) }})</p>
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
            <div>{{ $exam->description }}</div>
          @endif
          <div class="exam-meta">Duration: {{ gmdate('H:i:s', $exam->default_duration_seconds) }}</div>
          <div class="exam-meta">Created by: {{ $exam->creator->name }}</div>
          <div class="exam-meta">Status: Active</div>

          <div class="exam-actions">
            <a href="/timer/{{ $exam->id }}" class="btn btn-primary">Open Timer</a>
          </div>
        </div>
      @empty
        <p>No exams available. Create one first!</p>
      @endforelse
    </div>
    @endauth

    <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
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

    @unless(auth()->check())
    <div style="margin-top: 2rem; padding: 1rem; background: #fef3c7; border-radius: 4px;">
      <h4>Demo Accounts</h4>
      <p><strong>Admin:</strong> admin@example.com / password</p>
      <p><strong>Proctor 1:</strong> proctor@example.com / password</p>
      <p><strong>Proctor 2:</strong> instructor@example.com / password</p>
      <p><strong>Student 1:</strong> student1@example.com / password</p>
      <p><strong>Student 2:</strong> student2@example.com / password</p>
      <p><strong>Student 3:</strong> student3@example.com / password</p>
    </div>
    @endunless
  </div>
</body>
</html>

