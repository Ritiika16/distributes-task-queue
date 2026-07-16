import { Job } from 'bullmq';
import { getDLQQueue } from '../../infrastructure/queue/dlq.queue';
import logger from '../../infrastructure/logging/logger';

interface DLQJobData {
  originalJobId: string;
  type: string;
  recipient: string;
  subject: string;
  message: string;
  attemptsMade: number;
  failedReason: string;
  failedAt: string;
}

export const moveToDLQ = async (
  job: Job,
  failedReason: string
): Promise<void> => {
  const dlqQueue = getDLQQueue();

  const dlqData: DLQJobData = {
    originalJobId: job.id as string,
    type: job.data.type,
    recipient: job.data.recipient,
    subject: job.data.subject,
    message: job.data.message,
    attemptsMade: job.attemptsMade,
    failedReason,
    failedAt: new Date().toISOString(),
  };

  await dlqQueue.add('failed-notification', dlqData, {
    jobId: `dlq-${job.id}`,
  });

  logger.info('Job moved to Dead Letter Queue', {
    originalJobId: job.id,
    failureReason: failedReason,
  });
};
