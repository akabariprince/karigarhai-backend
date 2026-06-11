import { NextFunction, Response } from 'express';
import { AppError } from '../errors/AppError';
import { AuthRequest, sendResponse } from '../utils/response.util';
import logger from './logger.middleware';

export const errorMiddleware = (
  error: Error | AppError,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    const { statusCode, message, isOperational } = error;

    if (!isOperational) {
      logger.error('Non-operational error:', {
        message: error.message,
        stack: error.stack,
        requestId: req.requestId,
      });
    }

    sendResponse(res, statusCode, message);
    return;
  }

  logger.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    requestId: req.requestId,
  });

  sendResponse(res, 500, 'Internal server error');
};
