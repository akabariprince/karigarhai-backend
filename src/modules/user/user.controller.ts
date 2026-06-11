import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { UserService } from './user.service';
import { FileUploadUtil } from '../../shared/utils/file-upload.util';
import { R2_CONFIG } from '../../config/r2';
import {
  updateProfileSchema,
  updateKarigarProfileSchema,
  updateMalikProfileSchema,
  updateFcmTokenSchema,
} from './user.validator';

const userService = new UserService();

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await userService.getProfile(req.user.userId);
  sendResponse(res, 200, 'Profile fetched', result);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const userId = req.user.userId;
  const body = { ...req.body };

  if (body.latitude !== undefined && body.latitude !== '') body.latitude = Number(body.latitude);
  if (body.longitude !== undefined && body.longitude !== '') body.longitude = Number(body.longitude);

  const file = req.file;
  if (file) {
    const uploadResult = await FileUploadUtil.uploadToR2Generic({
      fileBuffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      path: 'users/avatars',
      userId,
    });
    body.profilePhotoUrl = `${R2_CONFIG.publicUrl}/${uploadResult.fileKey}`;
  }

  const validation = updateProfileSchema.safeParse(body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await userService.updateProfile(userId, validation.data);
  sendResponse(res, 200, 'Profile updated', result);
});

export const getPublicProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const result = await userService.getPublicProfile(userId);
  sendResponse(res, 200, 'Profile fetched', result);
});

export const updateKarigarProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const validation = updateKarigarProfileSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await userService.updateKarigarProfile(req.user.userId, validation.data);
  sendResponse(res, 200, 'Karigar profile updated', result);
});

export const updateMalikProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const validation = updateMalikProfileSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await userService.updateMalikProfile(req.user.userId, validation.data);
  sendResponse(res, 200, 'Malik profile updated', result);
});

export const updateFcmToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const validation = updateFcmTokenSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await userService.updateFcmToken(req.user.userId, validation.data);
  sendResponse(res, 200, 'FCM token updated', result);
});

export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await userService.getUserStats(req.user.userId);
  sendResponse(res, 200, 'Stats fetched', result);
});
