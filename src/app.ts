import express, { Response, RequestHandler, ErrorRequestHandler, Request } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import logger from './infrastructure/logging/logger';
import { requestIdMiddleware } from './api/middleware/requestId';
import { getRedisConnection } from './infrastructure/redis/connection';
import notificationRoutes from './api/routes/notification.routes';
import metricsRoutes from './api/routes/metrics.routes';
import { getDashboardRouter } from './infrastructure/dashboard/dashboard';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Compression
app.use(compression());

// Request ID
app.use(requestIdMiddleware as RequestHandler);

// Logging with request ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
morgan.token('request-id', (req: any) => req.id);
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms [:request-id]', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.get('/health', (async (_req: any, res: Response) => {
  const uptime = process.uptime();
  let redisStatus = 'disconnected';

  try {
    const redis = getRedisConnection();
    if (redis.status === 'ready') {
      await redis.ping();
      redisStatus = 'connected';
    }
  } catch (error) {
    redisStatus = 'error';
  }

  res.json({
    status: 'ok',
    service: 'distributed-task-queue',
    uptime: Math.floor(uptime),
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
}) as RequestHandler);

// API routes
app.use('/api/v1', notificationRoutes);
app.use('/api/v1', metricsRoutes);

// Bull Board dashboard with Basic Auth
const dashboardAuth = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') {
    res.status(401).json({ error: 'Invalid authorization header' });
    return;
  }

  const token = parts[1] as string;
  const auth = Buffer.from(token, 'base64').toString().split(':');
  const username = auth[0];
  const password = auth[1];

  const validUsername = process.env['BULLBOARD_USERNAME'];
  const validPassword = process.env['BULLBOARD_PASSWORD'];

  if (username === validUsername && password === validPassword) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

app.use('/admin/queues', dashboardAuth as RequestHandler, getDashboardRouter());

logger.info('Dashboard mounted at /admin/queues');

// 404 handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
app.use(((req: any, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}) as RequestHandler);

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
app.use(((err: Error, req: any, res: Response) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env['NODE_ENV'] === 'production' ? 'An unexpected error occurred' : err.message,
  });
}) as ErrorRequestHandler);

export default app;
