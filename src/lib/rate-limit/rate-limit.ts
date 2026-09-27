import { rateLimit } from 'express-rate-limit';

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
}

export function rateLimiter(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,

    standardHeaders: 'draft-8',
    legacyHeaders: false,

    message: {
      status: 429,
      message: 'Too many requests, please try again later.',
    },
  });
}
