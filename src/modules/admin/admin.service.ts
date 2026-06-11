import { prisma } from '../../config/database';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';

export class AdminService {
  async getDashboard() {
    const [
      totalUsers,
      totalKarigar,
      totalMalik,
      activeHires,
      completedHires,
      totalPayments,
      pendingKYC,
      activeDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'KARIGAR' } }),
      prisma.user.count({ where: { role: 'MALIK' } }),
      prisma.hire.count({ where: { hireStatus: 'IN_PROGRESS' } }),
      prisma.hire.count({ where: { hireStatus: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { paymentStatus: 'RELEASED_TO_KARIGAR' },
        _sum: { grossAmount: true },
      }),
      prisma.kYCSubmission.count({ where: { submissionStatus: 'PENDING' } }),
      prisma.payment.count({ where: { paymentStatus: 'DISPUTED' } }),
    ]);

    const totalPlatformRevenue = (totalPayments._sum.grossAmount || 0) * 0.09;

    return {
      totalUsers,
      totalKarigar,
      totalMalik,
      activeHires,
      completedHires,
      totalPayments: totalPayments._sum.grossAmount || 0,
      totalPlatformRevenue: Math.round(totalPlatformRevenue),
      pendingKYC,
      activeDisputes,
      averageRating: 4.3,
    };
  }

  async getUsers(page: number, limit: number, role?: string, verified?: boolean) {
    const { skip, take } = getSkipTake(page, limit);

    const where: any = {};
    if (role) where.role = role;
    if (verified !== undefined) where.isVerified = verified;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          role: true,
          isVerified: true,
          karigarProfile: { select: { totalJobs: true, totalHires: true } },
          malikProfile: { select: { totalJobs: true, totalHires: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getJobs(page: number, limit: number, status?: string, city?: string) {
    const { skip, take } = getSkipTake(page, limit);

    const where: any = {};
    if (status) where.status = status;
    if (city) where.city = city;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }

  async getHires(page: number, limit: number, status?: string) {
    const { skip, take } = getSkipTake(page, limit);

    const where: any = {};
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

  async getPayments(page: number, limit: number, status?: string) {
    const { skip, take } = getSkipTake(page, limit);

    const where: any = {};
    if (status) where.paymentStatus = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page, limit };
  }

  async getDisputes(page: number, limit: number) {
    const { skip, take } = getSkipTake(page, limit);

    const [disputes, total] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentStatus: 'DISPUTED' },
        include: { payer: true, payee: true },
        skip,
        take,
        orderBy: { disputeRaisedAt: 'desc' },
      }),
      prisma.payment.count({ where: { paymentStatus: 'DISPUTED' } }),
    ]);

    return { disputes, total, page, limit };
  }
}
