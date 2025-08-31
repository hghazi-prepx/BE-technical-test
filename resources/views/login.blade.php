<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>PrepX Timer - Login</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 400px;
      margin: 0 auto;
      background: #f8fafc;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: #1f2937;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover {
      background: #2563eb;
    }
    .error {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .demo-accounts {
      margin-top: 2rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    .demo-accounts h3 {
      margin: 0 0 0.5rem 0;
      color: #374151;
    }
    .demo-accounts div {
      margin: 0.25rem 0;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1 style="margin: 0;">PrepX Timer Login</h1>
      <a href="/" style="
        padding: 0.5rem 1rem;
        background: #6b7280;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 0.875rem;
      ">Back to Home</a>
    </div>

    <form method="POST" action="/login">
      @csrf

      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" value="{{ old('email') }}" required>
        @error('email')
          <div class="error">{{ $message }}</div>
        @enderror
      </div>

      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
        @error('password')
          <div class="error">{{ $message }}</div>
        @enderror
      </div>

      <button type="submit">Login</button>
    </form>

    <div class="demo-accounts">
      <h3>Demo Accounts:</h3>
      <div><strong>Admin:</strong> admin@example.com / password</div>
      <div><strong>Proctor 1:</strong> proctor@example.com / password</div>
      <div><strong>Proctor 2:</strong> instructor@example.com / password</div>
      <div><strong>Student 1:</strong> student1@example.com / password</div>
      <div><strong>Student 2:</strong> student2@example.com / password</div>
      <div><strong>Student 3:</strong> student3@example.com / password</div>
    </div>
  </div>
</body>
</html>

