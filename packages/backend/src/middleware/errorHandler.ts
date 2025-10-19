/**
 * Error handling middleware for ConsoleCapture backend
 * Follows SPARC principles for consistent error responses
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@console-capture/shared';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApplicationError extends Error implements ApiError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApplicationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details
  logger.error('API Error', err, {
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    code: err.code,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Format error response
  const errorResponse: {
    error: {
      message: string;
      code?: string;
      statusCode: number;
      details?: unknown;
      stack?: string;
    };
  } = {
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code,
      statusCode,
      details: err.details,
    },
  };

  // Include stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Not found error handler
 * Called when no route matches the request
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new ApplicationError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    'NOT_FOUND'
  );
  next(error);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
