import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/metrics', (req, res) => metricsController.getMetrics(req as any, res));

export default router;
