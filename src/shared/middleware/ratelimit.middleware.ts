import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req:any) => {
    return req.user?.role === 'ADMIN';
  },
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
