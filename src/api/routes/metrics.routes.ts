import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/metrics:
 *   get:
 *     summary: Get queue metrics
 *     description: Retrieves current metrics for the notification queue, dead letter queue, and Redis connection status.
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/metrics', (req, res) => metricsController.getMetrics(req as any, res));

export default router;
