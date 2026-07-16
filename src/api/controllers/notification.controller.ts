import { Request, Response } from 'express';
import { notificationService } from '../../application/services/notification.service';
import { notificationSchema } from '../validators/notification.validator';
import logger from '../../infrastructure/logging/logger';

export class NotificationController {
  async createJob(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = notificationSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        });
        return;
      }

      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const result = await notificationService.createNotificationJob(
        validationResult.data,
        idempotencyKey
      );

      if (result.duplicate) {
        res.status(200).json({
          success: true,
          duplicate: true,
          jobId: result.jobId,
          status: 'already_exists',
        });
        return;
      }

      res.status(201).json({
        success: true,
        duplicate: false,
        jobId: result.jobId,
        status: 'queued',
      });
    } catch (error) {
      logger.error('Failed to create notification job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create notification job',
      });
    }
  }
}

export const notificationController = new NotificationController();
