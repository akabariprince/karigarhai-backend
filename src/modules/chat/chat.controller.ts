import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { ChatService } from './chat.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';

const chatService = new ChatService();

export const getOrCreateChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId, otherUserId } = req.body;
  const result = await chatService.getOrCreateChat(hireId, req.user.userId, otherUserId);
  sendResponse(res, 201, 'Chat created', result);
});

export const getChats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const result = await chatService.getChats(req.user.userId, page, limit);
  sendResponse(res, 200, 'Chats fetched', result.chats, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { chatId } = req.params;
  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const result = await chatService.getMessages(chatId, page, limit);
  sendResponse(res, 200, 'Messages fetched', result.messages, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { chatId } = req.params;
  const result = await chatService.sendMessage(chatId, req.user.userId, req.body);
  sendResponse(res, 201, 'Message sent', result);
});

export const markMessagesAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { chatId } = req.params;
  const result = await chatService.markMessagesAsRead(chatId, req.user.userId);
  sendResponse(res, 200, 'Messages marked as read', result);
});
