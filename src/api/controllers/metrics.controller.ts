import { Request, Response } from 'express';
import { metricsService } from '../../application/services/metrics.service';
import logger from '../../infrastructure/logging/logger';

export class MetricsController {
  async getMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await metricsService.getMetrics();

      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Failed to retrieve metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve metrics',
      });
    }
  }
}

export const metricsController = new MetricsController();
