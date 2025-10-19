/**
 * Rate limiting middleware for ConsoleCapture backend
 * Implements tier-based rate limiting using Redis
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@console-capture/shared';
import { UserRole } from '@console-capture/shared';
import { ApplicationError } from './errorHandler';

// Rate limit configuration per tier
const RATE_LIMITS: Record<UserRole, { requests: number; window: number }> = {
  [UserRole.FREE]: { requests: 100, window: 3600 }, // 100 requests per hour
  [UserRole.PRO]: { requests: 1000, window: 3600 }, // 1000 requests per hour
  [UserRole.TEAM]: { requests: 5000, window: 3600 }, // 5000 requests per hour
  [UserRole.ENTERPRISE]: { requests: 50000, window: 3600 }, // 50000 requests per hour
  [UserRole.ADMIN]: { requests: 100000, window: 3600 }, // Unlimited (high limit)
};

// In-memory store for development (Redis would be used in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware
 * Limits requests based on user tier
 */
export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get user info from request (set by auth middleware)
    const userId = (req as any).user?.id;
    const userRole: UserRole = (req as any).user?.role || UserRole.FREE;

    // Use IP address if no user is authenticated
    const identifier = userId || req.ip || 'anonymous';

    // Get rate limit for user tier
    const rateLimit = RATE_LIMITS[userRole];

    // Get or create counter
    const now = Date.now();
    let counter = requestCounts.get(identifier);

    // Reset counter if window has expired
    if (!counter || now > counter.resetTime) {
      counter = {
        count: 0,
        resetTime: now + rateLimit.window * 1000,
      };
      requestCounts.set(identifier, counter);
    }

    // Increment counter
    counter.count++;

    // Check if limit exceeded
    if (counter.count > rateLimit.requests) {
      const resetIn = Math.ceil((counter.resetTime - now) / 1000);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimit.requests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': counter.resetTime.toString(),
        'Retry-After': resetIn.toString(),
      });

      throw new ApplicationError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED',
        {
          limit: rateLimit.requests,
          window: rateLimit.window,
          resetIn,
        }
      );
    }

    // Set rate limit headers
    const remaining = rateLimit.requests - counter.count;
    res.set({
      'X-RateLimit-Limit': rateLimit.requests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': counter.resetTime.toString(),
    });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Clean up expired counters periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, counter] of requestCounts.entries()) {
    if (now > counter.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute
