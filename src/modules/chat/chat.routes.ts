import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getOrCreateChat, getChats, getMessages, sendMessage, markMessagesAsRead } from './chat.controller';

const router = Router();

router.post('/', authMiddleware, getOrCreateChat);
router.get('/', authMiddleware, getChats);
router.get('/:chatId/messages', authMiddleware, getMessages);
router.post('/:chatId/messages', authMiddleware, sendMessage);
router.patch('/:chatId/read', authMiddleware, markMessagesAsRead);

export default router;
