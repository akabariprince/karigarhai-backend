import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { jobUpload, multerErrorHandler } from '../../shared/middleware/multer.middleware';
import {
  getProfile,
  updateProfile,
  getPublicProfile,
  updateKarigarProfile,
  updateMalikProfile,
  updateFcmToken,
  getUserStats,
} from './user.controller';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, jobUpload.single('profilePhoto'), multerErrorHandler, updateProfile);
router.get('/:userId/public', getPublicProfile);
router.patch('/karigar-profile', authMiddleware, updateKarigarProfile);
router.patch('/malik-profile', authMiddleware, updateMalikProfile);
router.post('/fcm-token', authMiddleware, updateFcmToken);
router.get('/stats/mine', authMiddleware, getUserStats);

export default router;
