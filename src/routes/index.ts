import { Express, Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import jobRoutes from '../modules/job/job.routes';
import hireRoutes from '../modules/hire/hire.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import kycRoutes from '../modules/kyc/kyc.routes';
import chatRoutes from '../modules/chat/chat.routes';
import reviewRoutes from '../modules/review/review.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import adminRoutes from '../modules/admin/admin.routes';
import whatsappRoutes from '../modules/whatsapp/whatsapp.routes';

export const registerRoutes = (app: Express): void => {
  const apiRouter = Router();

  // Auth routes
  apiRouter.use('/auth', authRoutes);

  // User routes
  apiRouter.use('/users', userRoutes);

  // Job routes
  apiRouter.use('/jobs', jobRoutes);

  // Hire routes
  apiRouter.use('/hires', hireRoutes);

  // Payment routes
  apiRouter.use('/payments', paymentRoutes);

  // KYC routes
  apiRouter.use('/kyc', kycRoutes);

  // Chat routes
  apiRouter.use('/chats', chatRoutes);

  // Review routes
  apiRouter.use('/reviews', reviewRoutes);

  // Notification routes
  apiRouter.use('/notifications', notificationRoutes);

  // Admin routes
  apiRouter.use('/admin', adminRoutes);

  // WhatsApp routes
  apiRouter.use('/whatsapp', whatsappRoutes);

  // Mount all routes under /api/v1
  app.use('/api/v1', apiRouter);
};

export default registerRoutes;
