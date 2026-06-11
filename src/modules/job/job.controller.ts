import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { JobService } from './job.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';
import { FileUploadUtil } from '../../shared/utils/file-upload.util';
import { R2_CONFIG } from '../../config/r2';
import {
  createJobSchema,
  updateJobSchema,
  jobFeedSchema,
} from './job.validator';

const jobService = new JobService();

export const createJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const userId = req.user.userId;
  const body = { ...req.body };

  // Parse type-coerced form fields
  if (body.fixedPrice !== undefined && body.fixedPrice !== '') body.fixedPrice = Number(body.fixedPrice);
  if (body.hourlyRate !== undefined && body.hourlyRate !== '') body.hourlyRate = Number(body.hourlyRate);
  if (body.dailyRate !== undefined && body.dailyRate !== '') body.dailyRate = Number(body.dailyRate);
  if (body.totalDays !== undefined && body.totalDays !== '') body.totalDays = Number(body.totalDays);
  if (body.latitude !== undefined && body.latitude !== '') body.latitude = Number(body.latitude);
  if (body.longitude !== undefined && body.longitude !== '') body.longitude = Number(body.longitude);
  
  if (typeof body.trades === 'string') {
    body.trades = body.trades.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
  if (typeof body.requiredSkills === 'string') {
    body.requiredSkills = body.requiredSkills.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  // Handle file uploads
  const files = req.files as {
    images?: Express.Multer.File[];
    voiceNote?: Express.Multer.File[];
  } | undefined;

  const imageUrls: string[] = [];
  let voiceNoteUrl: string | undefined = undefined;

  if (files) {
    if (files.images && files.images.length > 0) {
      for (const img of files.images) {
        const uploadResult = await FileUploadUtil.uploadToR2Generic({
          fileBuffer: img.buffer,
          fileName: img.originalname,
          mimeType: img.mimetype,
          path: 'jobs/images',
          userId,
        });
        imageUrls.push(`${R2_CONFIG.publicUrl}/${uploadResult.fileKey}`);
      }
    }

    if (files.voiceNote && files.voiceNote.length > 0) {
      const audio = files.voiceNote[0];
      const uploadResult = await FileUploadUtil.uploadToR2Generic({
        fileBuffer: audio.buffer,
        fileName: audio.originalname,
        mimeType: audio.mimetype,
        path: 'jobs/voices',
        userId,
      });
      voiceNoteUrl = `${R2_CONFIG.publicUrl}/${uploadResult.fileKey}`;
    }
  }

  body.imageUrls = imageUrls;
  if (voiceNoteUrl) {
    body.voiceNoteUrl = voiceNoteUrl;
  }

  const validation = createJobSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await jobService.createJob(userId, validation.data);
  sendResponse(res, 201, 'Job created', result);
});

export const getJobById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const result = await jobService.getJobById(jobId);
  sendResponse(res, 200, 'Job fetched', result);
});

export const getMyJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(
    req.query.page as string,
    req.query.limit as string
  );
  const status = req.query.status as string;

  const result = await jobService.getJobsByMalik(req.user.userId, page, limit, status);
  sendResponse(res, 200, 'Jobs fetched', result.jobs, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const updateJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { jobId } = req.params;

  const validation = updateJobSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await jobService.updateJob(jobId, req.user.userId, validation.data);
  sendResponse(res, 200, 'Job updated', result);
});

export const deleteJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { jobId } = req.params;
  const result = await jobService.deleteJob(jobId, req.user.userId);
  sendResponse(res, 204, result.message);
});

export const getJobFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const validation = jobFeedSchema.safeParse({
    lat: parseFloat(req.query.lat as string),
    lng: parseFloat(req.query.lng as string),
    trades: req.query.trades ? (req.query.trades as string).split(',') : undefined,
    radius: req.query.radius ? parseInt(req.query.radius as string) : 5,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  });

  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await jobService.getJobFeed(req.user.userId, validation.data);
  sendResponse(res, 200, 'Job feed fetched', result.jobs, undefined, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

export const applyForJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { jobId } = req.params;
  const { coverLetter } = req.body;

  const result = await jobService.applyForJob(jobId, req.user.userId, coverLetter);
  sendResponse(res, 201, 'Application submitted', result);
});

export const getMyApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(
    req.query.page as string,
    req.query.limit as string
  );

  const result = await jobService.getMyApplications(req.user.userId, page, limit);
  sendResponse(res, 200, 'Applications fetched', result.applications, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const shortlistApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { jobId, applicationId } = req.params;
  const result = await jobService.shortlistApplication(jobId, applicationId, req.user.userId);
  sendResponse(res, 200, 'Application shortlisted', result);
});

export const rejectApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { jobId, applicationId } = req.params;
  const result = await jobService.rejectApplication(jobId, applicationId, req.user.userId);
  sendResponse(res, 200, 'Application rejected', result);
});
