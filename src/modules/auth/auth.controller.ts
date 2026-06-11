import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { AuthService } from './auth.service';
import { checkUserSchema, sendOtpSchema, verifyOtpSchema, refreshTokenSchema, adminLoginSchema, changePasswordSchema } from './auth.validator';

const authService = new AuthService();

export const checkUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = checkUserSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await authService.checkUser(validation.data);
  sendResponse(res, 200, 'User status checked successfully', result);
});

export const sendOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = sendOtpSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await authService.sendOtp(validation.data);
  sendResponse(res, 200, result.message, result);
});

export const verifyOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = verifyOtpSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await authService.verifyOtp(validation.data);
  sendResponse(res, 201, 'OTP verified successfully', result);
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = refreshTokenSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await authService.refreshToken(validation.data);
  sendResponse(res, 200, 'Token refreshed successfully', result);
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await authService.logout(req.user.sessionId);
  sendResponse(res, 200, result.message);
});

export const adminLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = adminLoginSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await authService.adminLogin(validation.data);
  sendResponse(res, 200, 'Admin logged in successfully', result);
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const validation = changePasswordSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    sendResponse(res, 422, 'Validation failed', undefined, errors);
    return;
  }

  const result = await authService.changePassword(req.user.userId, validation.data);
  sendResponse(res, 200, result.message);
});
