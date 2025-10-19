/**
 * Usage tracking middleware
 */

import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { logger } from '../utils/logger.js';

/**
 * Track API usage for analytics and billing
 */
export async function usageTrackingMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  const startTime = Date.now();

  // Log request
  const requestData = {
    userId: req.user.id,
    organizationId: req.user.organizationId,
    userRole: req.user.role,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  logger.info('API request', requestData);

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const responseData = {
      ...requestData,
      statusCode: res.statusCode,
      duration,
    };

    logger.info('API response', responseData);

    // Here you would typically:
    // 1. Save to TimescaleDB analytics_events table
    // 2. Update usage quotas
    // 3. Track for billing purposes
    // Implementation would use the database service
  });

  next();
}
