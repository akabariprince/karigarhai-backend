import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { PaymentService } from './payment.service';
import { z } from 'zod';

const paymentService = new PaymentService();

export const initiatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.body;
  const result = await paymentService.initiatePayment(hireId, req.user.userId);
  sendResponse(res, 201, 'Payment initiated', result);
});

export const handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  await paymentService.handleRazorpayWebhook(req.body, signature);
  res.json({ success: true });
});

export const getPaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const result = await paymentService.getPaymentStatus(hireId, req.user.userId);
  sendResponse(res, 200, 'Payment status fetched', result);
});

export const raiseDispute = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { paymentId } = req.params;
  const { reason } = req.body;
  const result = await paymentService.raiseDispute(paymentId, req.user.userId, reason);
  sendResponse(res, 200, 'Dispute raised', result);
});

export const resolveDispute = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { paymentId } = req.params;
  const { resolution } = req.body;
  const result = await paymentService.resolveDispute(paymentId, resolution);
  sendResponse(res, 200, 'Dispute resolved', result);
});

export const releasePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const result = await paymentService.releasePayment(hireId, req.user.userId);
  sendResponse(res, 200, 'Payment released from escrow successfully', result);
});
