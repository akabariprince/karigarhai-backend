import { Router } from 'express';
import { authMiddleware, roleGuardMiddleware } from '../../shared/middleware/auth.middleware';
import {
  getDashboard,
  getUsers,
  getJobs,
  getHires,
  getPayments,
  getDisputes,
} from './admin.controller';

const router = Router();

router.use(authMiddleware, roleGuardMiddleware(['ADMIN']));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/jobs', getJobs);
router.get('/hires', getHires);
router.get('/payments', getPayments);
router.get('/disputes', getDisputes);

export default router;
