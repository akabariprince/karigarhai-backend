import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { HireService } from './hire.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';
import { z } from 'zod';

const hireService = new HireService();

const createHireSchema = z.object({
  jobId: z.string(),
  applicationId: z.string(),
  karigarId: z.string(),
  agreedPrice: z.number().min(500).max(500000),
});

export const createHire = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const validation = createHireSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await hireService.createHire(
    req.user.userId,
    validation.data.jobId,
    validation.data.applicationId,
    validation.data.karigarId,
    validation.data.agreedPrice
  );
  sendResponse(res, 201, 'Hire created', result);
});

export const getHireById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const result = await hireService.getHireById(hireId);
  sendResponse(res, 200, 'Hire fetched', result);
});

export const getHires = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const status = req.query.status as string;

  const result = await hireService.getHires(req.user.userId, page, limit, status);
  sendResponse(res, 200, 'Hires fetched', result.hires, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const updateHireStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const { status } = req.body;

  const result = await hireService.updateHireStatus(hireId, req.user.userId, status);
  sendResponse(res, 200, 'Hire status updated', result);
});

export const completeHire = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const { completionPhotoUrls } = req.body;

  const result = await hireService.completeHire(hireId, req.user.userId, completionPhotoUrls || []);
  sendResponse(res, 200, 'Hire completed', result);
});

export const cancelHire = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const { reason } = req.body;

  const result = await hireService.cancelHire(hireId, req.user.userId, reason);
  sendResponse(res, 200, 'Hire cancelled', result);
});

export const updateLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { hireId } = req.params;
  const { lat, lng } = req.body;

  const result = await hireService.updateLocation(hireId, req.user.userId, lat, lng);
  sendResponse(res, 200, 'Location updated', result);
});
