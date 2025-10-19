/**
 * Request logging middleware for ConsoleCapture backend
 * Logs all incoming requests with relevant metadata
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@console-capture/shared';

/**
 * Request logger middleware
 * Logs request details and response times
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}
