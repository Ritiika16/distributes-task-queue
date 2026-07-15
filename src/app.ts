import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import logger from './infrastructure/logging/logger';
import { requestIdMiddleware } from './api/middleware/requestId';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Compression
app.use(compression());

// Request ID
app.use(requestIdMiddleware);

// Logging with request ID
morgan.token('request-id', (req: Request) => req.id);
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
app.get('/health', (req: Request, res: Response) => {
  const uptime = process.uptime();
  res.json({
    status: 'ok',
    service: 'distributed-task-queue',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env['NODE_ENV'] === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

export default app;
