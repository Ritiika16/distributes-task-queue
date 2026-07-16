import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getNotificationQueue } from '../queue/notification.queue';
import { getDLQQueue } from '../queue/dlq.queue';
import logger from '../logging/logger';

let serverAdapter: ExpressAdapter | null = null;

export const createDashboard = (): ExpressAdapter => {
  if (serverAdapter) {
    return serverAdapter;
  }

  const notificationQueue = getNotificationQueue();
  const dlqQueue = getDLQQueue();

  serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(notificationQueue), new BullMQAdapter(dlqQueue)],
    serverAdapter,
  });

  logger.info('Bull Board initialized');

  return serverAdapter;
};

export const getDashboardRouter = () => {
  const adapter = createDashboard();
  return adapter.getRouter();
};
