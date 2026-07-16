import app from './app';
import logger from './infrastructure/logging/logger';
import config from './config';
import {
  closeRedisConnection,
  closeWorkerRedisConnection,
} from './infrastructure/redis/connection';
import { startNotificationWorker, closeNotificationWorker } from './infrastructure/workers/notification.worker';

const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

startNotificationWorker();

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  server.close(async (err) => {
    if (err) {
      logger.error('Error during server close', { error: err.message });
      process.exit(1);
    }

    await closeNotificationWorker();
    await closeWorkerRedisConnection();
    await closeRedisConnection();
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});
