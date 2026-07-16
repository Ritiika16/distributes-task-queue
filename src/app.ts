import express, { Response, RequestHandler, ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import logger from './infrastructure/logging/logger';
import { requestIdMiddleware } from './api/middleware/requestId';
import { getRedisConnection } from './infrastructure/redis/connection';
import notificationRoutes from './api/routes/notification.routes';

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
