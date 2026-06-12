import axios from 'axios';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { formatWhatsappPhone, formatPhoneForDb } from '../../shared/utils/whatsapp.util';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import logger from '../../shared/middleware/logger.middleware';
import { emitToAdminWhatsapp } from '../../config/socket';

export class WhatsappService {
  /**
   * Verify WhatsApp Webhook Challenge (Meta verification)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string {
    if (mode && token) {
      if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logger.info('WhatsApp Webhook verified successfully.');
        return challenge;
      }
    }
    throw new ValidationError('Webhook verification token mismatch or invalid mode');
  }

  /**
   * Handle incoming Webhook payload from Meta
   */
  async handleWebhookPayload(payload: any): Promise<void> {
    logger.info('Received WhatsApp Webhook payload: %j', payload);
    try {
      if (payload.object !== 'whatsapp_business_account') {
        logger.warn(`Unexpected Webhook payload object: ${payload.object}`);
        return;
      }

      const entries = payload.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field !== 'messages') continue;

          const value = change.value || {};
          const messages = value.messages || [];

          for (const msg of messages) {
            try {
              await this.processIncomingMessage(msg, value);
            } catch (msgErr) {
              logger.error('Error processing incoming WhatsApp message:', msgErr);
            }
          }
        }
      }
    } catch (err) {
      logger.error('Error handling WhatsApp Webhook payload:', err);
    }
  }

  /**
   * Process a single incoming message: check duplicate, store in db, then trigger potential bot response
   */
  private async processIncomingMessage(msg: any, value: any): Promise<void> {
    if (!msg || !msg.id || !msg.from) {
      logger.warn('Skipping incoming message due to missing required fields (id or from): %j', msg);
      return;
    }

    const waMessageId = msg.id;
    const phoneNumber = formatPhoneForDb(msg.from);
    const timestamp = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : new Date();
    const messageType = (msg.type || 'TEXT').toUpperCase();
    
    // Extract text content or media details
    let content = '';
    if (msg.type === 'text') {
      content = msg.text?.body || '';
    } else if (msg.type === 'image') {
      content = '[Image] ' + (msg.image?.caption || '');
    } else if (msg.type === 'audio' || msg.type === 'voice') {
      content = '[Audio/Voice Note]';
    } else if (msg.type === 'video') {
      content = '[Video] ' + (msg.video?.caption || '');
    } else if (msg.type === 'document') {
      content = '[Document] ' + (msg.document?.filename || '');
    } else if (msg.type === 'location') {
      content = `[Location] Lat: ${msg.location?.latitude}, Lng: ${msg.location?.longitude}`;
    } else if (msg.type === 'button') {
      content = msg.button?.text || '';
    } else if (msg.type === 'interactive') {
      content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive Response]';
    } else {
      content = `[${messageType} Message]`;
    }

    const conversationId = value.metadata?.phone_number_id || null;

    // Check duplicate message ID
    const existing = await prisma.whatsAppMessage.findUnique({
      where: { waMessageId }
    });

    if (existing) {
      logger.info(`Duplicate WhatsApp message skipped. ID: ${waMessageId}`);
      return;
    }

    // Step 1: Store message in database (Guarantee persistence before bot triggers)
    const storedMessage = await prisma.whatsAppMessage.create({
      data: {
        waMessageId,
        phoneNumber,
        content,
        messageType,
        direction: 'INCOMING',
        conversationId,
        timestamp,
      }
    });

    logger.info(`Saved incoming WhatsApp message: ${storedMessage.id} from ${phoneNumber}`);

    // Broadcast incoming message via Socket.IO
    try {
      const unreadCount = await prisma.whatsAppMessage.count({
        where: {
          phoneNumber,
          direction: 'INCOMING',
          isRead: false
        }
      });

      const user = await this.getUserInfoByPhone(phoneNumber);
      const conversationUpdate = {
        phoneNumber,
        lastMessage: content,
        messageType,
        direction: 'INCOMING',
        timestamp: timestamp.toISOString(),
        waMessageId,
        user,
        unreadCount
      };

      emitToAdminWhatsapp('whatsapp:message', storedMessage);
      emitToAdminWhatsapp('whatsapp:conversation', conversationUpdate);
    } catch (socketErr) {
      logger.error('Error broadcasting incoming WhatsApp message via Socket.IO:', socketErr);
    }

    // Step 2: Trigger bot / AI reply processing (if any)
    try {
      await this.processBotResponse(storedMessage);
    } catch (botErr) {
      logger.error('Error in bot processing:', botErr);
    }
  }

  /**
   * Stub for Bot / AI Response logic
   */
  private async processBotResponse(message: any): Promise<void> {
    // Process bot / AI auto-replies here if needed.
    // e.g. check if the user is in an onboarding flow, responds to OTP, etc.
    logger.info(`Processing bot response logic for message ${message.id}`);
  }

  /**
   * Send WhatsApp text message using WhatsApp Cloud API and persist it
   */
  async sendTextMessage(toPhone: string, text: string): Promise<any> {
    if (!toPhone || !text) {
      throw new ValidationError('Recipient phone and message text are required');
    }

    const formattedPhone = formatWhatsappPhone(toPhone);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v25.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`
          }
        }
      );

      const responseData = response.data;
      const waMessageId = responseData.messages?.[0]?.id || `out_${Date.now()}`;
      
      // Persist the outgoing message
      const dbPhone = formatPhoneForDb(toPhone);
      const storedMessage = await prisma.whatsAppMessage.create({
        data: {
          waMessageId,
          phoneNumber: dbPhone,
          content: text,
          messageType: 'TEXT',
          direction: 'OUTGOING',
          conversationId: env.WHATSAPP_PHONE_NUMBER_ID,
          timestamp: new Date(),
        }
      });

      logger.info(`Persisted outgoing WhatsApp message: ${storedMessage.id} to ${dbPhone}`);

      // Broadcast outgoing message via Socket.IO
      try {
        const user = await this.getUserInfoByPhone(dbPhone);
        const conversationUpdate = {
          phoneNumber: dbPhone,
          lastMessage: text,
          messageType: 'TEXT',
          direction: 'OUTGOING',
          timestamp: storedMessage.timestamp.toISOString(),
          waMessageId,
          user,
          unreadCount: 0
        };

        emitToAdminWhatsapp('whatsapp:message', storedMessage);
        emitToAdminWhatsapp('whatsapp:conversation', conversationUpdate);
      } catch (socketErr) {
        logger.error('Error broadcasting outgoing WhatsApp message via Socket.IO:', socketErr);
      }

      return storedMessage;

    } catch (err: any) {
      logger.error('Failed to send WhatsApp message via Meta Cloud API:', err.response?.data || err.message);
      throw new ValidationError(`WhatsApp API Error: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  }

  /**
   * Retrieve all messages (history) for a specific phone number
   */
  async getConversationHistory(phoneNumber: string, limit = 50, offset = 0) {
    const dbPhone = formatPhoneForDb(phoneNumber);

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        phoneNumber: dbPhone
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: limit,
      skip: offset,
    });

    return messages;
  }

  /**
   * Get list of all active WhatsApp conversations (grouped by phone number with last message details)
   */
  async getActiveConversations() {
    // Group by phoneNumber and get last message. Raw SQL is cleanest for this in PostgreSQL.
    const conversations = await prisma.$queryRaw<Array<{
      phoneNumber: string;
      lastMessage: string;
      messageType: string;
      direction: string;
      timestamp: Date;
      waMessageId: string;
    }>>`
      SELECT DISTINCT ON ("phoneNumber")
        "phoneNumber",
        "content" as "lastMessage",
        "messageType",
        "direction",
        "timestamp",
        "waMessageId"
      FROM "WhatsAppMessage"
      ORDER BY "phoneNumber", "timestamp" DESC
    `;

    // Fetch matching registered users to enrich details
    const phoneNumbers = conversations.map(c => c.phoneNumber);
    const users = await prisma.user.findMany({
      where: { phone: { in: phoneNumbers } },
      include: {
        profile: true,
        karigarProfile: true,
        malikProfile: true,
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const userMap = new Map<string, any>();
    for (const u of users) {
      userMap.set(u.phone, {
        userId: u.id,
        name: u.profile ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim() : null,
        role: u.role,
        isVerified: u.isVerified,
        kycStatus: u.kycSubmissions?.[0]?.submissionStatus || null,
        rating: u.role === 'KARIGAR' ? u.karigarProfile?.averageRating : u.role === 'MALIK' ? u.malikProfile?.averageRating : null,
        city: u.profile?.city || null
      });
    }

    // Query unread incoming messages counts grouped by phone
    const unreadCounts = await prisma.whatsAppMessage.groupBy({
      by: ['phoneNumber'],
      where: {
        direction: 'INCOMING',
        isRead: false
      },
      _count: {
        id: true
      }
    });

    const unreadMap = new Map<string, number>();
    for (const item of unreadCounts) {
      unreadMap.set(item.phoneNumber, item._count.id);
    }

    const enriched = conversations.map(c => ({
      ...c,
      unreadCount: unreadMap.get(c.phoneNumber) || 0,
      user: userMap.get(c.phoneNumber) || null
    }));

    return enriched.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get registered user details by phone number
   */
  async getUserInfoByPhone(phoneNumber: string) {
    const dbPhone = formatPhoneForDb(phoneNumber);
    const u = await prisma.user.findUnique({
      where: { phone: dbPhone },
      include: {
        profile: true,
        karigarProfile: true,
        malikProfile: true,
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!u) return null;

    const commonData = {
      userId: u.id,
      name: u.profile ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim() : null,
      role: u.role,
      isVerified: u.isVerified,
      kycStatus: u.kycSubmissions?.[0]?.submissionStatus || null,
      rating: u.role === 'KARIGAR' ? u.karigarProfile?.averageRating : u.role === 'MALIK' ? u.malikProfile?.averageRating : null,
      city: u.profile?.city || null,
      state: u.profile?.state || null,
      email: u.profile?.email || null,
      createdAt: u.createdAt
    };

    if (u.role === 'KARIGAR' && u.karigarProfile) {
      return {
        ...commonData,
        experience: u.karigarProfile.experience,
        totalJobs: u.karigarProfile.totalJobs,
        totalHires: u.karigarProfile.totalHires,
        totalEarnings: u.karigarProfile.totalEarnings,
        hourlyRate: u.karigarProfile.hourlyRate,
        dailyRate: u.karigarProfile.dailyRate,
        trades: u.karigarProfile.trades,
      };
    }

    if (u.role === 'MALIK' && u.malikProfile) {
      return {
        ...commonData,
        businessName: u.malikProfile.businessName,
        businessCategory: u.malikProfile.businessCategory,
        businessDescription: u.malikProfile.businessDescription,
        totalJobs: u.malikProfile.totalJobs,
        totalHires: u.malikProfile.totalHires,
        totalSpent: u.malikProfile.totalSpent,
      };
    }

    return commonData;
  }

  /**
   * Mark all incoming messages in a conversation as read
   */
  async markConversationAsRead(phoneNumber: string): Promise<any> {
    const dbPhone = formatPhoneForDb(phoneNumber);

    const updateResult = await prisma.whatsAppMessage.updateMany({
      where: {
        phoneNumber: dbPhone,
        direction: 'INCOMING',
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Broadcast read event to all admin clients so they reset unread badge instantly
    try {
      emitToAdminWhatsapp('whatsapp:read', { phoneNumber: dbPhone });
    } catch (socketErr) {
      logger.error('Error emitting whatsapp:read via Socket.IO:', socketErr);
    }

    return { count: updateResult.count };
  }
}
