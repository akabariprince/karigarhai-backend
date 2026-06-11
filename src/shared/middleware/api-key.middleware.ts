import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware';

/**
 * API Key validation middleware
 * Checks for valid API key in Authorization header or x-api-key header
 * Format: "Bearer <api_key>" or direct key in x-api-key header
 *
 * Usage: app.use(apiKeyMiddleware) or on specific routes
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      success: false,
      message: 'API key not configured',
    });
    return;
  }

  // Check x-api-key header first
  let providedKey = req.headers['x-api-key'] as string;

  // If not found, check Authorization header (Bearer token)
  if (!providedKey) {
    const authHeader = req.headers['authorization'] as string;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.slice(7); // Remove "Bearer " prefix
    }
  }

  if (!providedKey) {
    res.status(401).json({
      success: false,
      message: 'API key is required',
      note: 'Provide in x-api-key header or Authorization: Bearer <key>',
    });
    return;
  }

  if (providedKey !== apiKey) {
    res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
    return;
  }

  next();
};

/**
 * Combined middleware: checks both JWT auth AND API key
 * Use this for routes that need both user authentication and API key
 */
export const apiKeyAndAuthMiddleware = [
  authMiddleware,
  apiKeyMiddleware,
];
