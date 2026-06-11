import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { ReviewService } from './review.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';

const reviewService = new ReviewService();

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId, toUserId, rating, comment, categories } = req.body;
  const result = await reviewService.createReview(hireId, req.user.userId, toUserId, rating, comment, categories);
  sendResponse(res, 201, 'Review created', result);
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const result = await reviewService.getReviews(userId, page, limit);
  sendResponse(res, 200, 'Reviews fetched', result.reviews, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const getAverageRating = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const result = await reviewService.getAverageRating(userId);
  sendResponse(res, 200, 'Average rating fetched', result);
});
