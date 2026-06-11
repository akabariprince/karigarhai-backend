import { prisma } from '../../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors/AppError';
import { calculateDistance, getGridCell } from '../../shared/utils/validation.util';
import { getPaginationParams, getSkipTake } from '../../shared/utils/pagination.util';
import { FileUploadUtil } from '../../shared/utils/file-upload.util';
import redis from '../../config/redis';
import {
  CreateJobInput,
  UpdateJobInput,
  JobFiltersInput,
  JobFeedInput,
} from './job.validator';

export class JobService {
  async signJob(job: any) {
    if (!job) return job;
    if (job.voiceNoteUrl) {
      job.voiceNoteUrl = await FileUploadUtil.getSignedUrlIfNeeded(job.voiceNoteUrl);
    }
    if (job.imageUrls && job.imageUrls.length > 0) {
      job.imageUrls = await FileUploadUtil.getSignedUrlsBatchIfNeeded(job.imageUrls);
    }
    if (job.malik && job.malik.profile && job.malik.profile.profilePhotoUrl) {
      job.malik.profile.profilePhotoUrl = await FileUploadUtil.getSignedUrlIfNeeded(job.malik.profile.profilePhotoUrl);
    }
    return job;
  }

  async signJobs(jobs: any[]) {
    return Promise.all(jobs.map(job => this.signJob(job)));
  }

  async createJob(malikId: string, data: CreateJobInput) {
    const malik = await prisma.user.findUnique({ where: { id: malikId } });
    if (!malik || malik.role !== 'MALIK') throw new ValidationError('User is not a Malik');

    const job = await prisma.job.create({
      data: {
        malikId,
        title: data.title,
        description: data.description,
        category: data.category,
        trades: data.trades,
        priceType: data.priceType,
        fixedPrice: data.fixedPrice,
        hourlyRate: data.hourlyRate,
        dailyRate: data.dailyRate,
        totalDays: data.totalDays,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        locality: data.locality,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        requiredSkills: data.requiredSkills || [],
        imageUrls: data.imageUrls || [],
        voiceNoteUrl: data.voiceNoteUrl,
        workRadius: parseInt(data.workRadius || '5'),
      },
    });

    return this.signJob(job);
  }

  async getJobById(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        malik: {
          select: {
            id: true,
            phone: true,
            profile: true,
          }
        },
        applications: {
          include: {
            karigar: {
              include: {
                profile: true,
                karigarProfile: true,
              }
            }
          }
        },
      },
    });

    if (!job) throw new NotFoundError('Job not found');
    return this.signJob(job);
  }

  async getJobsByMalik(malikId: string, page: number, limit: number, status?: string) {
    const { skip, take } = getSkipTake(page, limit);

    const where: any = { malikId };
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    const signedJobs = await this.signJobs(jobs);
    return { jobs: signedJobs, total, page, limit };
  }

  async updateJob(jobId: string, malikId: string, data: UpdateJobInput) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job not found');
    if (job.malikId !== malikId) throw new ValidationError('Not authorized');

    const updateData: any = { ...data };
    if (data.workRadius) {
      updateData.workRadius = parseInt(data.workRadius);
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return this.signJob(updated);
  }

  async deleteJob(jobId: string, malikId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job not found');
    if (job.malikId !== malikId) throw new ValidationError('Not authorized');

    await prisma.job.delete({ where: { id: jobId } });
    return { message: 'Job deleted' };
  }

  async getJobFeed(karigarId: string, input: JobFeedInput) {
    const { page, limit } = getPaginationParams(input.page?.toString(), input.limit?.toString());
    const { skip, take } = getSkipTake(page, limit);

    const gridCell = getGridCell(input.lat, input.lng);
    const cacheKey = `jobs:feed:${karigarId}:${gridCell}:${input.radius}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const userTrades = await prisma.karigarProfile.findUnique({
      where: { userId: karigarId },
      select: { trades: true },
    });

    const userApplied = await prisma.jobApplication.findMany({
      where: { karigarId },
      select: { jobId: true },
    });

    const appliedJobIds = userApplied.map((a) => a.jobId);

    const user = await prisma.user.findUnique({
      where: { id: karigarId },
      include: { profile: true },
    });
    const userCity = user?.profile?.city;

    const jobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
        NOT: { id: { in: appliedJobIds } },
        ...(userCity ? { city: { equals: userCity, mode: 'insensitive' } } : {}),
        ...(userTrades?.trades.length
          ? { trades: { hasSome: userTrades.trades } }
          : {}),
      },
      take: 100,
      include: { malik: true },
    });

    const nearbyJobs = jobs
      .map((job) => ({
        ...job,
        distance: calculateDistance(input.lat, input.lng, job.latitude, job.longitude),
      }))
      .filter((job) => userCity ? true : job.distance <= input.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(skip, skip + take);

    const signedJobs = await this.signJobs(nearbyJobs);
    const result = { jobs: signedJobs, total: nearbyJobs.length, page, limit };

    if (redis) {
      await redis.setex(cacheKey, 120, JSON.stringify(result));
    }

    return result;
  }

  async applyForJob(jobId: string, karigarId: string, coverLetter?: string) {
    const [job, existingApp, karigarUser] = await Promise.all([
      prisma.job.findUnique({ where: { id: jobId } }),
      prisma.jobApplication.findUnique({
        where: { jobId_karigarId: { jobId, karigarId } },
      }),
      prisma.user.findUnique({
        where: { id: karigarId },
        include: { profile: true },
      }),
    ]);

    if (!job) throw new NotFoundError('Job not found');
    if (existingApp) throw new ConflictError('Already applied to this job');

    if (job.city && karigarUser?.profile?.city) {
      if (job.city.trim().toLowerCase() !== karigarUser.profile.city.trim().toLowerCase()) {
        throw new ValidationError(`You can only apply to jobs in your registered city (${karigarUser.profile.city})`);
      }
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        karigarId,
        coverLetter,
        applicationStatus: 'APPLIED',
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { totalApplications: { increment: 1 } },
    });

    return application;
  }

  async getMyApplications(karigarId: string, page: number, limit: number) {
    const { skip, take } = getSkipTake(page, limit);

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { karigarId },
        include: { job: true },
        skip,
        take,
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.jobApplication.count({ where: { karigarId } }),
    ]);

    const signedApps = await Promise.all(
      applications.map(async (app) => {
        if (app.job) {
          app.job = await this.signJob(app.job);
        }
        return app;
      })
    );

    return { applications: signedApps, total, page, limit };
  }

  async shortlistApplication(jobId: string, applicationId: string, malikId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.malikId !== malikId) throw new ValidationError('Not authorized');

    const app = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { applicationStatus: 'SHORTLISTED', shortlistedAt: new Date() },
      include: { job: true, karigar: true },
    });

    if (app.job) {
      app.job = await this.signJob(app.job);
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { selectedCount: { increment: 1 } },
    });

    return app;
  }

  async rejectApplication(jobId: string, applicationId: string, malikId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.malikId !== malikId) throw new ValidationError('Not authorized');

    const app = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { applicationStatus: 'REJECTED', rejectedAt: new Date() },
    });

    return app;
  }
}
