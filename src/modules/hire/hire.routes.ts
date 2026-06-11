import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  createHire,
  getHireById,
  getHires,
  updateHireStatus,
  completeHire,
  cancelHire,
  updateLocation,
} from './hire.controller';

const router = Router();

router.post('/', authMiddleware, createHire);
router.get('/', authMiddleware, getHires);
router.get('/:hireId', authMiddleware, getHireById);
router.patch('/:hireId/status', authMiddleware, updateHireStatus);
router.post('/:hireId/complete', authMiddleware, completeHire);
router.post('/:hireId/cancel', authMiddleware, cancelHire);
router.post('/:hireId/location/update', authMiddleware, updateLocation);

export default router;
