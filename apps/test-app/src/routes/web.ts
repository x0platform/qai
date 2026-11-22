import express from 'express';
import cookieParser from 'cookie-parser';

const router = express.Router();

// In-memory user store (simulating a DB)
const users: Record<string, { id: string; username: string; password: string; role: string }> = {
  user1: { id: 'user1', username: 'alice', password: 'password123', role: 'admin' },
  user2: { id: 'user2', username: 'bob', password: 'password123', role: 'user' },
  user3: { id: 'user3', username: 'carol', password: 'password123', role: 'user' },
};

// Session store (simulating server-side sessions)
const sessions = new Map<string, { userId: string; createdAt: number }>();

// Cookie parser middleware
router.use(cookieParser());

// Generate session cookie
function setSessionCookie(res: express.Response, userId: string): void {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  sessions.set(sessionId, { userId, createdAt: Date.now() });
  res.cookie('session_id', sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 3600000, // 1 hour
    path: '/',
  });
}

// GET /login - Login page
router.get('/login', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - QAI Test App</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 320px; }
        h2 { margin-top: 0; color: #333; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }
        input { width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #0056b3; }
        .error { color: #dc3545; margin-bottom: 1rem; font-size: 0.875rem; display: none; }
        .success { color: #28a745; margin-bottom: 1rem; font-size: 0.875rem; display: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Login</h2>
        <div id="error" class="error">Invalid username or password</div>
        <div id="success" class="success"></div>
        <form id="loginForm">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required placeholder="Enter username">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required placeholder="Enter password">
          <button type="submit">Sign In</button>
        </form>
      </div>
      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const errorEl = document.getElementById('error');
          const successEl = document.getElementById('success');
          errorEl.style.display = 'none';
          successEl.style.display = 'none';
          try {
            const response = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
              credentials: 'include'
            });
            if (response.ok) {
              successEl.textContent = 'Login successful! Redirecting...';
              successEl.style.display = 'block';
              setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
            } else {
              errorEl.style.display = 'block';
            }
          } catch {
            errorEl.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// POST /api/login - Login API
router.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;

  const user = Object.values(users).find((u) => u.username === username && u.password === password);

  if (!user) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid username or password',
    });
    return;
  }

  setSessionCookie(res, user.id);

  res.json({
    status: 'success',
    message: 'Login successful',
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// GET /dashboard - Dashboard page (requires session)
router.get('/dashboard', (req, res) => {
  const sessionId = req.cookies?.session_id;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    res.redirect('/login');
    return;
  }

  const user = users[session.userId];

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - QAI Test App</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f5f5f5; }
        .navbar { background: #007bff; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .navbar a { color: white; text-decoration: none; margin-left: 1rem; }
        .content { padding: 2rem; max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        .welcome { background: #e7f3ff; padding: 1rem; border-radius: 4px; border-left: 4px solid #007bff; margin-bottom: 2rem; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1rem; }
        .btn-logout { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
        .btn-logout:hover { background: #c82333; }
      </style>
    </head>
    <body>
      <div class="navbar">
        <div>QAI Test Dashboard</div>
        <div>
          <span>Welcome, <strong>${user.username}</strong> (${user.role})</span>
          <button class="btn-logout" onclick="logout()">Logout</button>
        </div>
      </div>
      <div class="content">
        <div class="welcome">
          <h1>Welcome to the Dashboard</h1>
          <p>You are successfully logged in as <strong>${user.username}</strong> with role <strong>${user.role}</strong>.</p>
        </div>
        <div class="card">
          <h3>User Profile</h3>
          <p><strong>ID:</strong> ${user.id}</p>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p><strong>Session Active:</strong> Yes</p>
        </div>
        <div class="card">
          <h3>Navigation</h3>
          <ul>
            <li><a href="/api/users/${user.id}">View User API Endpoint</a></li>
            <li><a href="/api/upload">PDF Upload Page</a></li>
          </ul>
        </div>
      </div>
      <script>
        function logout() {
          fetch('/api/logout', { method: 'POST', credentials: 'include' })
            .then(() => { window.location.href = '/login'; });
        }
      </script>
    </body>
    </html>
  `);
});

// POST /api/logout - Logout
router.post('/api/logout', (req, res) => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('session_id', { path: '/' });
  res.json({ status: 'success', message: 'Logged out' });
});

// Helper: resolve user by numeric ID (1,2,3) or key (user1,user2,user3)
function resolveUser(id: string): { id: string; username: string; password: string; role: string } | undefined {
  if (users[id]) return users[id];
  const num = Number(id);
  if (!isNaN(num) && users[`user${num}`]) return users[`user${num}`];
  return undefined;
}

// GET /api/users/:id - Get user by ID (returns cookie-dependent data)
router.get('/api/users/:id', (req, res) => {
  const sessionId = req.cookies?.session_id;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
    return;
  }

  const user = resolveUser(req.params.id);
  if (!user) {
    res.status(404).json({
      status: 'error',
      message: 'User not found',
    });
    return;
  }

  res.json({
    status: 'success',
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      sessionUserId: session.userId,
      authenticated: true,
    },
  });
});

// POST /api/users/:id - Update user (cookie-dependent)
router.post('/api/users/:id', express.json(), (req, res) => {
  const sessionId = req.cookies?.session_id;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
    return;
  }

  const user = resolveUser(req.params.id);
  if (!user) {
    res.status(404).json({
      status: 'error',
      message: 'User not found',
    });
    return;
  }

  const { name } = req.body;

  res.json({
    status: 'success',
    message: `User ${user.username} updated`,
    data: {
      id: user.id,
      username: user.username,
      updatedName: name || user.username,
      updatedBy: session.userId,
    },
  });
});

// GET /api/session - Check session status
router.get('/api/session', (req, res) => {
  const sessionId = req.cookies?.session_id;
  const session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    res.json({ authenticated: false });
    return;
  }

  const user = users[session.userId];
  res.json({
    authenticated: true,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

export default router;
