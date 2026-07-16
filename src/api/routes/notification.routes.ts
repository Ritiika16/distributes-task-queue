import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unsafe-argument
router.post('/jobs', async (req, res) => {
  await notificationController.createJob(req as any, res);
});

export default router;
