import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';

export class ReviewService {
  async createReview(hireId: string, fromUserId: string, toUserId: string, rating: number, comment?: string, categories?: string[]) {
    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire || (hire.karigarId !== fromUserId && hire.malikId !== fromUserId)) {
      throw new ValidationError('Not authorized');
    }

    const review = await prisma.review.create({
      data: {
        hireId,
        fromUserId,
        toUserId,
        rating,
        comment,
        categories: (categories || []) as any,
      },
    });

    // Update user rating
    const reviews = await prisma.review.findMany({ where: { toUserId } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    if (hire.karigarId === toUserId) {
      await prisma.karigarProfile.update({
        where: { userId: toUserId },
        data: { averageRating: avgRating, totalReviews: reviews.length },
      });
    }

    return review;
  }

  async getReviews(userId: string, page: number, limit: number) {
    const { skip, take } = getSkipTake(page, limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { toUserId: userId },
        include: { fromUser: { select: { id: true, phone: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { toUserId: userId } }),
    ]);

    return { reviews, total, page, limit };
  }

  async getAverageRating(userId: string) {
    const reviews = await prisma.review.findMany({ where: { toUserId: userId } });

    if (reviews.length === 0) {
      return { userId, averageRating: 0, totalReviews: 0 };
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return { userId, averageRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length };
  }
}
