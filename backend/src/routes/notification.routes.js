import express from 'express';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notification.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('guide', 'user', 'admin'));

router.get('/', getMyNotifications);
router.post('/read-all', markAllNotificationsRead);
router.post('/:id/read', markNotificationRead);

export default router;
