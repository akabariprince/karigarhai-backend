import { prisma } from '../../config/database';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';

export class NotificationService {
  async getNotifications(userId: string, page: number, limit: number) {
    const { skip, take } = getSkipTake(page, limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total, page, limit };
  }

  async markAsRead(notificationId: string) {
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const updated = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return updated;
  }
}
