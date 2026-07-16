import { Queue } from 'bullmq';
import { getRedisConnection } from '../redis/connection';
import logger from '../logging/logger';

let notificationQueue: Queue | null = null;

export const getNotificationQueue = (): Queue => {
  if (notificationQueue) {
    return notificationQueue;
  }

  const redisConnection = getRedisConnection();

  notificationQueue = new Queue('notifications', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    connection: redisConnection as any,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });

  notificationQueue.on('error', (err) => {
    logger.error('Notification queue error', { error: err.message });
  });

  logger.info('Notification queue initialized');

  return notificationQueue;
};

export const closeNotificationQueue = async (): Promise<void> => {
  if (notificationQueue) {
    await notificationQueue.close();
    notificationQueue = null;
    logger.info('Notification queue closed');
  }
};
