import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { NotificationService } from './notification.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';

const notificationService = new NotificationService();

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const result = await notificationService.getNotifications(req.user.userId, page, limit);
  sendResponse(res, 200, 'Notifications fetched', result.notifications, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { id } = req.params;
  const result = await notificationService.markAsRead(id);
  sendResponse(res, 200, 'Notification marked as read', result);
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await notificationService.markAllAsRead(req.user.userId);
  sendResponse(res, 200, 'All notifications marked as read');
});
