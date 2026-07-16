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

      const jobId = await notificationService.createNotificationJob(validationResult.data);

      res.status(201).json({
        success: true,
        jobId,
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
