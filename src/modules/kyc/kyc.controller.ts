import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { KYCService } from './kyc.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';

const kycService = new KYCService();

/**
 * Submit KYC with Aadhar and PAN documents
 * Expects multipart form data with:
 * - aadhaarNumber, panNumber, bankName, accountNumber, ifscCode
 * - aadhaarFront, aadhaarBack (image files, max 2MB each)
 */
export const submitKYCWithDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const files = req.files as {
    aadhaarFront?: Express.Multer.File[];
    aadhaarBack?: Express.Multer.File[];
  };

  const result = await kycService.submitKYCWithDocuments(req.user.userId, req.body, files);
  sendResponse(res, 201, 'KYC submitted successfully', result);
});

export const submitKYC = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await kycService.submitKYC(req.user.userId, req.body, req.files || {});
  sendResponse(res, 201, 'KYC submitted', result);
});

export const getKYCStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await kycService.getKYCStatus(req.user.userId);
  sendResponse(res, 200, 'KYC status fetched', result);
});

export const getKYCSubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const status = req.query.status as string;

  const result = await kycService.getKYCSubmissions(page, limit, status);
  sendResponse(res, 200, 'KYC submissions fetched', result.submissions, undefined, {
    page,
    limit,
    total: result.total,
  });
});

/**
 * Get KYC submission for review with signed document URLs
 * Admin endpoint - requires API key
 */
export const getKYCSubmissionForReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { submissionId } = req.params;
  const result = await kycService.getKYCSubmissionForReview(submissionId);
  sendResponse(res, 200, 'KYC submission retrieved with document URLs', result);
});

export const approveKYC = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { userId } = req.params;
  const result = await kycService.approveKYC(userId, req.user.userId);
  sendResponse(res, 200, 'KYC approved', result);
});

export const rejectKYC = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { userId } = req.params;
  const { reason } = req.body;
  const result = await kycService.rejectKYC(userId, req.user.userId, reason);
  sendResponse(res, 200, 'KYC rejected', result);
});
