import axios from 'axios';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { formatWhatsappPhone } from '../../shared/utils/whatsapp.util';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import logger from '../../shared/middleware/logger.middleware';

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
    if (payload.object !== 'whatsapp_business_account') {
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
          await this.processIncomingMessage(msg, value);
        }
      }
    }
  }

  /**
   * Process a single incoming message: check duplicate, store in db, then trigger potential bot response
   */
  private async processIncomingMessage(msg: any, value: any): Promise<void> {
    const waMessageId = msg.id;
    const phoneNumber = '+' + msg.from; // Add + for standard database formatting
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
      content = `[${msg.type.toUpperCase()} Message]`;
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
        `https://graph.facebook.com/v23.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
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
      const dbPhone = toPhone.startsWith('+') ? toPhone : `+${toPhone}`;
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
    const dbPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const cleanPhone = phoneNumber.replace('+', ''); // also check without + if stored differently

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        OR: [
          { phoneNumber: dbPhone },
          { phoneNumber: phoneNumber },
          { phoneNumber: '+' + cleanPhone }
        ]
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

    // Sort by last message timestamp descending
    return conversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
