import { v4 as uuidv4 } from 'uuid';
import { getNotificationQueue } from '../../infrastructure/queue/notification.queue';
import { NotificationInput } from '../../api/validators/notification.validator';
import logger from '../../infrastructure/logging/logger';

export class NotificationService {
  async createNotificationJob(data: NotificationInput): Promise<string> {
    try {
      const jobId = uuidv4();
      const queue = getNotificationQueue();

      const job = await queue.add('notification', data, { jobId });

      if (!job.id) {
        throw new Error('BullMQ failed to return job ID');
      }

      logger.info('Notification job enqueued', {
        jobId: job.id,
        type: data.type,
        recipient: data.recipient,
      });

      return job.id;
    } catch (error) {
      logger.error('Failed to enqueue notification job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw new Error('Failed to create notification job');
    }
  }
}

export const notificationService = new NotificationService();
