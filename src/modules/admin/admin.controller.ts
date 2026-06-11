import { Response } from 'express';
import { AuthRequest, sendResponse, asyncHandler } from '../../shared/utils/response.util';
import { AdminService } from './admin.service';
import { getPaginationParams } from '../../shared/utils/pagination.util';

const adminService = new AdminService();

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const result = await adminService.getDashboard();
  sendResponse(res, 200, 'Dashboard metrics fetched', result);
});

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const role = req.query.role as string;
  const verified = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;

  const result = await adminService.getUsers(page, limit, role, verified);
  sendResponse(res, 200, 'Users fetched', result.users, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const getJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const status = req.query.status as string;
  const city = req.query.city as string;

  const result = await adminService.getJobs(page, limit, status, city);
  sendResponse(res, 200, 'Jobs fetched', result.jobs, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const getHires = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const status = req.query.status as string;

  const result = await adminService.getHires(page, limit, status);
  sendResponse(res, 200, 'Hires fetched', result.hires, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);
  const status = req.query.status as string;

  const result = await adminService.getPayments(page, limit, status);
  sendResponse(res, 200, 'Payments fetched', result.payments, undefined, {
    page,
    limit,
    total: result.total,
  });
});

export const getDisputes = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    sendResponse(res, 401, 'Unauthorized');
    return;
  }

  const { page, limit } = getPaginationParams(req.query.page as string, req.query.limit as string);

  const result = await adminService.getDisputes(page, limit);
  sendResponse(res, 200, 'Disputes fetched', result.disputes, undefined, {
    page,
    limit,
    total: result.total,
  });
});
