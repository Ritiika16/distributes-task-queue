import { Queue } from 'bullmq';
import { getRedisConnection } from '../redis/connection';
import logger from '../logging/logger';

let dlqQueue: Queue | null = null;

export const getDLQQueue = (): Queue => {
  if (dlqQueue) {
    return dlqQueue;
  }

  const redisConnection = getRedisConnection();

  dlqQueue = new Queue('notification-dlq', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    connection: redisConnection as any,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  });

  dlqQueue.on('error', (err) => {
    logger.error('DLQ error', { error: err.message });
  });

  logger.info('Dead Letter Queue initialized');

  return dlqQueue;
};

export const closeDLQQueue = async (): Promise<void> => {
  if (dlqQueue) {
    await dlqQueue.close();
    dlqQueue = null;
    logger.info('Dead Letter Queue closed');
  }
};
