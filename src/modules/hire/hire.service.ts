import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';
import redis from '../../config/redis';

export class HireService {
  async createHire(malikId: string, jobId: string, applicationId: string, karigarId: string, agreedPrice: number) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.malikId !== malikId) throw new ValidationError('Unauthorized');

    const hire = await prisma.hire.create({
      data: {
        jobId,
        malikId,
        karigarId,
        hireStatus: 'CONFIRMED',
        agreedPrice,
      },
    });

    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { applicationStatus: 'HIRED' },
    });

    return hire;
  }

  async getHireById(hireId: string) {
    const hire = await prisma.hire.findUnique({
      where: { id: hireId },
      include: { job: true, malik: true, karigar: true },
    });

    if (!hire) throw new NotFoundError('Hire not found');
    return hire;
  }

  async getHires(userId: string, page: number, limit: number, status?: string) {
    const { skip, take } = getSkipTake(page, limit);

    const where: any = {
      OR: [
        { malikId: userId },
        { karigarId: userId },
      ],
    };

    if (status) where.hireStatus = status;

    const [hires, total] = await Promise.all([
      prisma.hire.findMany({
        where,
        include: { job: true, malik: true, karigar: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hire.count({ where }),
    ]);

    return { hires, total, page, limit };
  }

  async updateHireStatus(hireId: string, userId: string, status: string) {
    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire) throw new NotFoundError('Hire not found');
    if (hire.malikId !== userId && hire.karigarId !== userId) throw new ValidationError('Unauthorized');

    const updated = await prisma.hire.update({
      where: { id: hireId },
      data: { hireStatus: status as any },
    });

    return updated;
  }

  async completeHire(hireId: string, userId: string, completionPhotoUrls: string[]) {
    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire) throw new NotFoundError('Hire not found');
    if (hire.karigarId !== userId) throw new ValidationError('Only Karigar can complete hire');

    const updated = await prisma.hire.update({
      where: { id: hireId },
      data: {
        hireStatus: 'COMPLETED',
        completedAt: new Date(),
        completionPhotoUrls,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        hireId,
        payerId: hire.malikId,
        payeeId: hire.karigarId,
        grossAmount: hire.agreedPrice,
        platformFee: Math.round(hire.agreedPrice * 0.09),
        karigarAmount: Math.round(hire.agreedPrice * 0.91),
        paymentStatus: 'PENDING',
      },
    });

    return updated;
  }

  async cancelHire(hireId: string, userId: string, reason: string) {
    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire) throw new NotFoundError('Hire not found');

    const updated = await prisma.hire.update({
      where: { id: hireId },
      data: {
        hireStatus: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    return updated;
  }

  async updateLocation(hireId: string, userId: string, lat: number, lng: number) {
    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire) throw new NotFoundError('Hire not found');
    if (hire.karigarId !== userId) throw new ValidationError('Only Karigar can update location');

    const locationData = { lat, lng, updatedAt: new Date().toISOString() };
    const cacheKey = `location:${hireId}`;

    if (redis) {
      await redis.setex(cacheKey, 600, JSON.stringify(locationData));
    }

    return locationData;
  }
}
