import { Worker, Job } from 'bullmq';
import { getWorkerRedisConnection } from '../redis/connection';
import logger from '../logging/logger';

let notificationWorker: Worker | null = null;

/**
 * Promise-based delay function for simulating processing time.
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process notification job based on type.
 * Simulates sending notifications without actual delivery.
 */
async function processNotificationJob(job: Job): Promise<void> {
  const { type, recipient, subject } = job.data;

  logger.info('Job active', { jobId: job.id, type, recipient });

  switch (type) {
    case 'email':
      logger.info('Sending email...', { jobId: job.id, recipient, subject });
      await delay(2000);
      logger.info('Email sent.', { jobId: job.id, recipient });
      break;

    case 'sms':
      await delay(1000);
      logger.info('SMS sent.', { jobId: job.id, recipient });
      break;

    case 'push':
      await delay(500);
      logger.info('Push notification sent.', { jobId: job.id, recipient });
      break;

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

/**
 * Initialize and start the notification worker.
 * Connects to the existing BullMQ queue and Redis connection.
 * Processes jobs from the 'notifications' queue.
 */
export const startNotificationWorker = (): Worker => {
  if (notificationWorker) {
    return notificationWorker;
  }

  const redisConnection = getWorkerRedisConnection();

  notificationWorker = new Worker(
    'notifications',
    async (job: Job) => {
      await processNotificationJob(job);
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      connection: redisConnection as any,
      concurrency: 5,
    }
  );

  notificationWorker.on('completed', (job) => {
    logger.info('Job completed', { jobId: job.id, type: job.data.type });
  });

  notificationWorker.on('failed', (job, err) => {
    logger.error('Job failed', {
      jobId: job?.id,
      type: job?.data.type,
      error: err.message,
    });
  });

  notificationWorker.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
  });

  logger.info('Notification worker started');

  return notificationWorker;
};

/**
 * Close the notification worker gracefully.
 * Should be called during application shutdown.
 */
export const closeNotificationWorker = async (): Promise<void> => {
  if (notificationWorker) {
    await notificationWorker.close();
    notificationWorker = null;
    logger.info('Notification worker closed');
  }
};
