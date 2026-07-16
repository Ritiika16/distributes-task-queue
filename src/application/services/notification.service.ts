import { v4 as uuidv4 } from 'uuid';
import { getNotificationQueue } from '../../infrastructure/queue/notification.queue';
import { NotificationInput } from '../../api/validators/notification.validator';
import logger from '../../infrastructure/logging/logger';
import { idempotencyService } from '../../infrastructure/idempotency/idempotency';

export class NotificationService {
  async createNotificationJob(
    data: NotificationInput,
    idempotencyKey?: string
  ): Promise<{ jobId: string; duplicate: boolean }> {
    try {
      if (idempotencyKey) {
        const existingJobId = await idempotencyService.checkAndStore(
          idempotencyKey,
          'placeholder'
        );

        if (existingJobId) {
          logger.info('Existing job returned', {
            idempotencyKey,
            existingJobId,
          });
          return { jobId: existingJobId, duplicate: true };
        }
      }

      const jobId = uuidv4();
      const queue = getNotificationQueue();

      const job = await queue.add('notification', data, { jobId });

      if (!job.id) {
        throw new Error('BullMQ failed to return job ID');
      }

      if (idempotencyKey) {
        await idempotencyService.checkAndStore(idempotencyKey, job.id);
      }

      logger.info('Notification job enqueued', {
        jobId: job.id,
        type: data.type,
        recipient: data.recipient,
      });

      return { jobId: job.id, duplicate: false };
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
