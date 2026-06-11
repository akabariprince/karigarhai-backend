import { Request, Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { WhatsappService } from './whatsapp.service';

const whatsappService = new WhatsappService();

/**
 * GET Verification endpoint for Meta webhook
 */
export const verifyWebhook = asyncHandler(async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = whatsappService.verifyWebhook(mode, token, challenge);
  res.status(200).send(result);
});

/**
 * POST Webhook message reception
 */
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  await whatsappService.handleWebhookPayload(req.body);
  res.status(200).json({ success: true });
});

/**
 * GET Active conversations list (grouped by phone, showing last message)
 * Admin only (role check is done in middleware)
 */
export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await whatsappService.getActiveConversations();
  sendResponse(res, 200, 'Conversations fetched successfully', result);
});

/**
 * GET Messages of a single conversation by phone number
 * Admin only
 */
export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const result = await whatsappService.getConversationHistory(phoneNumber, limit, offset);
  sendResponse(res, 200, 'Conversation history fetched successfully', result);
});

/**
 * POST Send WhatsApp message to phone number
 * Admin only
 */
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumber, text } = req.body;

  const result = await whatsappService.sendTextMessage(phoneNumber, text);
  sendResponse(res, 201, 'Message sent and stored successfully', result);
});
