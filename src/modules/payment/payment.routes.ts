import { Router } from 'express';
import { authMiddleware, roleGuardMiddleware } from '../../shared/middleware/auth.middleware';
import { initiatePayment, handleWebhook, getPaymentStatus, raiseDispute, resolveDispute, releasePayment } from './payment.controller';

const router = Router();

router.post('/initiate', authMiddleware, initiatePayment);
router.post('/webhook', handleWebhook);
router.post('/:hireId/release', authMiddleware, releasePayment);
router.get('/:hireId', authMiddleware, getPaymentStatus);
router.post('/:paymentId/dispute', authMiddleware, raiseDispute);
router.patch('/:paymentId/resolve', authMiddleware, roleGuardMiddleware(['ADMIN']), resolveDispute);

export default router;
