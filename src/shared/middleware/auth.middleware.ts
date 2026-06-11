import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthError, ForbiddenError } from '../errors/AppError';
import { AuthRequest } from '../utils/response.util';
import { prisma } from '../../config/database';

interface JwtPayload {
  userId: string;
  role: string;
  sessionId: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      throw new AuthError('Invalid or expired token');
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AuthError('Session revoked, expired, or not found');
    }

    req.user = {
      userId: payload.userId,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const roleGuardMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthError('User not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};

