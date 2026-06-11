import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createReview, getReviews, getAverageRating } from './review.controller';

const router = Router();

router.post('/', authMiddleware, createReview);
router.get('/:userId', getReviews);
router.get('/:userId/average', getAverageRating);

export default router;
