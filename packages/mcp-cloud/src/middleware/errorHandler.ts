/**
 * Global error handling middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error', error, {
    method: req.method,
    path: req.path,
    body: req.body,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
  });
}
