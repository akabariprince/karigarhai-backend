import { prisma } from '../../config/database';
import { razorpayClient } from '../../config/razorpay';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import crypto from 'crypto';
import { env } from '../../config/env';

export class PaymentService {
  async initiatePayment(hireId: string, userId: string) {
    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire || hire.malikId !== userId) throw new ValidationError('Unauthorized');

    const order = await razorpayClient.orders.create({
      amount: hire.agreedPrice * 100,
      currency: 'INR',
      receipt: hireId,
      notes: { hireId, userId },
    });

    const payment = await prisma.payment.create({
      data: {
        hireId,
        payerId: hire.malikId,
        payeeId: hire.karigarId,
        grossAmount: hire.agreedPrice,
        platformFee: Math.round(hire.agreedPrice * 0.09),
        karigarAmount: Math.round(hire.agreedPrice * 0.91),
        paymentStatus: 'PENDING',
        razorpayOrderId: order.id,
      },
    });

    return { razorpayOrderId: order.id, amount: hire.agreedPrice, currency: 'INR' };
  }

  async handleRazorpayWebhook(event: any, signature: string) {
    const body = JSON.stringify(event);
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new ValidationError('Invalid webhook signature');
    }

    if (event.event === 'payment.captured') {
      const { order_id, id: paymentId } = event.payload.payment.entity;

      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: order_id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: 'ESCROW_DEPOSITED',
            razorpayPaymentId: paymentId,
          },
        });

        await prisma.hire.update({
          where: { id: payment.hireId },
          data: { hireStatus: 'IN_PROGRESS' },
        });
      }
    }
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || (payment.payerId !== userId && payment.payeeId !== userId)) {
      throw new ValidationError('Unauthorized');
    }
    return payment;
  }

  async raiseDispute(paymentId: string, userId: string, reason: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.payerId !== userId) throw new ValidationError('Only payer can raise dispute');

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: 'DISPUTED',
        disputeRaisedAt: new Date(),
        disputeReason: reason,
      },
    });

    return updated;
  }

  async resolveDispute(paymentId: string, resolution: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError('Payment not found');

    let newStatus = 'RELEASED_TO_KARIGAR';
    if (resolution === 'REFUND') newStatus = 'REFUNDED';
    else if (resolution === 'SPLIT') newStatus = 'PARTIALLY_RELEASED';

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: newStatus as any,
        resolvedAt: new Date(),
      },
    });

    return updated;
  }

  async releasePayment(hireId: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: { hireId },
    });

    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.payerId !== userId) throw new ValidationError('Only the payer can release the payment');

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: 'RELEASED_TO_KARIGAR',
      },
    });

    await prisma.hire.update({
      where: { id: hireId },
      data: { hireStatus: 'COMPLETED' },
    });

    return updated;
  }
}
