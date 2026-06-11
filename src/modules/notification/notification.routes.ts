import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getNotifications, markAsRead, markAllAsRead } from './notification.controller';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);
router.post('/read-all', authMiddleware, markAllAsRead);

export default router;
