import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';

export class ChatService {
  async getOrCreateChat(hireId: string, user1Id: string, user2Id: string) {
    let chat = await prisma.chat.findUnique({ where: { hireId } });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { hireId, user1Id, user2Id },
      });
    }

    return chat;
  }

  async getChats(userId: string, page: number, limit: number) {
    const { skip, take } = getSkipTake(page, limit);

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
          user1: { select: { id: true, phone: true } },
          user2: { select: { id: true, phone: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        skip,
        take,
        orderBy: { lastMessageAt: 'desc' },
      }),
      prisma.chat.count({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      }),
    ]);

    return { chats, total, page, limit };
  }

  async getMessages(chatId: string, page: number, limit: number) {
    const { skip, take } = getSkipTake(page, limit);

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { chatId },
        include: { sender: { select: { id: true, phone: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chatMessage.count({ where: { chatId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  }

  async sendMessage(chatId: string, senderId: string, data: any) {
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundError('Chat not found');

    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        type: data.type || 'TEXT',
        text: data.text,
        mediaUrl: data.mediaUrl,
        mediaDuration: data.mediaDuration,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date(), lastMessage: data.text },
    });

    return message;
  }

  async markMessagesAsRead(chatId: string, userId: string) {
    const updated = await prisma.chatMessage.updateMany({
      where: { chatId, isRead: false, NOT: { senderId: userId } },
      data: { isRead: true, readAt: new Date() },
    });

    return updated;
  }
}
