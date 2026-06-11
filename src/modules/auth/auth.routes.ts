import { Router } from 'express';
import { authLimiter } from '../../shared/middleware/ratelimit.middleware';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { checkUser, sendOtp, verifyOtp, refreshToken, logout, adminLogin, changePassword } from './auth.controller';

const router = Router();

router.post('/check-user', authLimiter, checkUser);
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/refresh', authLimiter, refreshToken);
router.post('/logout', authMiddleware, logout);
router.post('/admin/login', authLimiter, adminLogin);
router.patch('/change-password', authMiddleware, changePassword);

export default router;
