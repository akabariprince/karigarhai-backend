import { Router } from 'express';
import { authMiddleware, roleGuardMiddleware } from '../../shared/middleware/auth.middleware';
import { apiKeyMiddleware } from '../../shared/middleware/api-key.middleware';
import { kycUpload, multerErrorHandler } from '../../shared/middleware/multer.middleware';
import {
  submitKYC,
  submitKYCWithDocuments,
  getKYCStatus,
  getKYCSubmissions,
  getKYCSubmissionForReview,
  approveKYC,
  rejectKYC,
} from './kyc.controller';

const router = Router();

// User endpoints
router.post('/submit', authMiddleware, submitKYC);
router.post(
  '/submit-with-documents',
  authMiddleware,
  kycUpload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
  ]),
  multerErrorHandler,
  submitKYCWithDocuments
);
router.get('/status', authMiddleware, getKYCStatus);

// Admin endpoints (with API key + role guard)
router.get('/admin/submissions', authMiddleware, roleGuardMiddleware(['ADMIN']), getKYCSubmissions);

// Admin endpoint with API key for secure document retrieval
router.get(
  '/admin/submission/:submissionId/review',
  authMiddleware,
  roleGuardMiddleware(['ADMIN']),
  getKYCSubmissionForReview
);

router.patch('/admin/:userId/approve', authMiddleware, roleGuardMiddleware(['ADMIN']), approveKYC);
router.patch('/admin/:userId/reject', authMiddleware, roleGuardMiddleware(['ADMIN']), rejectKYC);

export default router;
