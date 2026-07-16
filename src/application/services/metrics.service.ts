import { getNotificationQueue } from '../../infrastructure/queue/notification.queue';
import { getDLQQueue } from '../../infrastructure/queue/dlq.queue';
import { getRedisConnection } from '../../infrastructure/redis/connection';
import logger from '../../infrastructure/logging/logger';

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface DLQMetrics {
  waiting: number;
  completed: number;
  failed: number;
}

interface MetricsResponse {
  success: true;
  timestamp: string;
  notifications: QueueMetrics;
  deadLetterQueue: DLQMetrics;
  redis: {
    status: string;
  };
}

export class MetricsService {
  async getMetrics(): Promise<MetricsResponse> {
    const notificationQueue = getNotificationQueue();
    const dlqQueue = getDLQQueue();
    const redis = getRedisConnection();

    const notificationCounts = await notificationQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused'
    );
    const dlqCounts = await dlqQueue.getJobCounts('waiting', 'completed', 'failed');

    const metrics: MetricsResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      notifications: {
        waiting: notificationCounts['waiting'] || 0,
        active: notificationCounts['active'] || 0,
        completed: notificationCounts['completed'] || 0,
        failed: notificationCounts['failed'] || 0,
        delayed: notificationCounts['delayed'] || 0,
        paused: notificationCounts['paused'] || 0,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      deadLetterQueue: {
        waiting: dlqCounts['waiting'] || 0,
        completed: dlqCounts['completed'] || 0,
        failed: dlqCounts['failed'] || 0,
      },
      redis: {
        status: redis.status,
      },
    };

    logger.info('Metrics retrieved', {
      notifications: metrics.notifications,
      deadLetterQueue: metrics.deadLetterQueue,
      redisStatus: metrics.redis.status,
    });

    return metrics;
  }
}

export const metricsService = new MetricsService();
