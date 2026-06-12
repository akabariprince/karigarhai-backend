import { Router } from 'express';
import { authMiddleware, roleGuardMiddleware } from '../../shared/middleware/auth.middleware';
import {
  verifyWebhook,
  handleWebhook,
  getConversations,
  getMessages,
  sendMessage,
  getUserInfo,
  markAsRead,
} from './whatsapp.controller';

const router = Router();

// Public webhook routes for Meta integrations
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Protected admin routes for retrieving/sending messages
router.get('/conversations', authMiddleware, roleGuardMiddleware(['ADMIN']), getConversations);
router.get('/conversations/:phoneNumber', authMiddleware, roleGuardMiddleware(['ADMIN']), getMessages);
router.get('/conversations/:phoneNumber/user-info', authMiddleware, roleGuardMiddleware(['ADMIN']), getUserInfo);
router.patch('/conversations/:phoneNumber/read', authMiddleware, roleGuardMiddleware(['ADMIN']), markAsRead);
router.post('/send', authMiddleware, roleGuardMiddleware(['ADMIN']), sendMessage);

export default router;
