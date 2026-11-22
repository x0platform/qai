import express from 'express';
import uploadRoutes from './routes/upload';
import webRoutes from './routes/web';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for cross-origin test execution
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Set-Cookie');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Routes
app.use('/api', uploadRoutes);
app.use('/', webRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500,
  });
});

let server: ReturnType<typeof app.listen> | null = null;

export function startServer(port: number = PORT): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve();
      return;
    }
    server = app.listen(port, () => {
      console.log(`Test app server listening on port ${port}`);
      resolve();
    });
    server.on('error', reject);
  });
}

export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => {
      server = null;
      console.log('Test app server stopped');
      resolve();
    });
  });
}

export { app };

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
