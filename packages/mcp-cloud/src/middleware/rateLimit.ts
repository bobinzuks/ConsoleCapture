/**
 * Rate limiting middleware based on user tier
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { AuthenticatedRequest } from './auth.js';
import { UserRole } from '@console-capture/shared';

// Redis client for distributed rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for rate limiting
 */
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', err);
    });

    await redisClient.connect();
    logger.info('Redis client connected for rate limiting');
  }

  return redisClient;
}

/**
 * Get rate limit based on user role
 */
function getRateLimitForRole(role: UserRole): number {
  switch (role) {
    case UserRole.FREE:
      return config.rateLimit.free;
    case UserRole.PRO:
      return config.rateLimit.pro;
    case UserRole.TEAM:
      return config.rateLimit.team;
    case UserRole.ENTERPRISE:
    case UserRole.ADMIN:
      return config.rateLimit.enterprise;
    default:
      return config.rateLimit.free;
  }
}

/**
 * Custom rate limiter that uses Redis and varies by user tier
 */
export async function rateLimitMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required for rate limiting',
      });
      return;
    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const maxRequests = getRateLimitForRole(userRole);

    // Skip rate limiting for enterprise and admin
    if (
      userRole === UserRole.ENTERPRISE ||
      userRole === UserRole.ADMIN
    ) {
      logger.debug('Rate limit skipped for privileged user', { userId, userRole });
      next();
      return;
    }

    const redis = await getRedisClient();
    const key = `ratelimit:${userId}`;
    const windowMs = config.rateLimit.windowMs;

    // Get current request count
    const current = await redis.get(key);
    const requestCount = current ? parseInt(current, 10) : 0;

    if (requestCount >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        userId,
        userRole,
        requestCount,
        maxRequests,
      });

      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute for ${userRole} tier.`,
        retryAfter: Math.ceil(windowMs / 1000),
      });
      return;
    }

    // Increment counter
    const newCount = requestCount + 1;
    if (newCount === 1) {
      // First request in window, set expiry
      await redis.set(key, newCount.toString(), {
        PX: windowMs, // Expiry in milliseconds
      });
    } else {
      await redis.set(key, newCount.toString(), {
        KEEPTTL: true, // Keep existing TTL
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - newCount).toString());
    res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

    logger.debug('Rate limit check passed', {
      userId,
      userRole,
      requestCount: newCount,
      maxRequests,
    });

    next();
  } catch (error) {
    logger.error('Rate limiting error', error);
    // Don't block request on rate limiter error, but log it
    next();
  }
}

/**
 * Cleanup Redis connection on shutdown
 */
export async function closeRateLimitRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis client disconnected');
  }
}
