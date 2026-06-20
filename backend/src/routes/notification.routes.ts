import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.get('/', authenticate, notificationController.list);
router.patch('/:id/read', authenticate, notificationController.markRead);
router.patch('/read-all', authenticate, notificationController.markAllRead);

export default router;
