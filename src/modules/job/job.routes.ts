import { Router } from 'express';
import { authMiddleware, roleGuardMiddleware } from '../../shared/middleware/auth.middleware';
import { jobUpload, multerErrorHandler } from '../../shared/middleware/multer.middleware';
import {
  createJob,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
  getJobFeed,
  applyForJob,
  getMyApplications,
  shortlistApplication,
  rejectApplication,
} from './job.controller';

const router = Router();

// Malik routes
router.post(
  '/',
  authMiddleware,
  roleGuardMiddleware(['MALIK']),
  jobUpload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'voiceNote', maxCount: 1 },
  ]),
  multerErrorHandler,
  createJob
);
router.get('/my-jobs', authMiddleware, roleGuardMiddleware(['MALIK']), getMyJobs);
router.patch('/:jobId', authMiddleware, roleGuardMiddleware(['MALIK']), updateJob);
router.delete('/:jobId', authMiddleware, roleGuardMiddleware(['MALIK']), deleteJob);
router.post('/:jobId/:applicationId/shortlist', authMiddleware, roleGuardMiddleware(['MALIK']), shortlistApplication);
router.post('/:jobId/:applicationId/reject', authMiddleware, roleGuardMiddleware(['MALIK']), rejectApplication);

// Karigar routes
router.get('/feed', authMiddleware, roleGuardMiddleware(['KARIGAR']), getJobFeed);
router.post('/:jobId/apply', authMiddleware, roleGuardMiddleware(['KARIGAR']), applyForJob);
router.get('/applications/my', authMiddleware, roleGuardMiddleware(['KARIGAR']), getMyApplications);

// Public routes
router.get('/:jobId', getJobById);

export default router;
