/**
 * Authentication middleware for ConsoleCapture backend
 * Validates JWT tokens and API keys
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@console-capture/shared';
import { UserRole } from '@console-capture/shared';
import { ApplicationError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

/**
 * JWT authentication middleware
 * Validates JWT token from Authorization header
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApplicationError('No authorization header', 401, 'UNAUTHORIZED');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApplicationError('Invalid authorization header format', 401, 'UNAUTHORIZED');
    }

    const token = parts[1];

    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as {
      sub: string;
      email: string;
      role: UserRole;
      organizationId?: string;
    };

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApplicationError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApplicationError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    authenticateJWT(req, res, next);
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware
 * Requires user to have specific role or higher
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApplicationError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new ApplicationError(
          'Insufficient permissions',
          403,
          'FORBIDDEN',
          { required: allowedRoles, current: userRole }
        )
      );
    }

    next();
  };
}

/**
 * API key authentication middleware
 * Validates API key from X-API-Key header
 */
export function authenticateAPIKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new ApplicationError('No API key provided', 401, 'UNAUTHORIZED');
    }

    // Validate API key format
    if (!apiKey.startsWith('cc_') || apiKey.length !== 43) {
      throw new ApplicationError('Invalid API key format', 401, 'INVALID_API_KEY');
    }

    // TODO: Validate API key against database
    // For now, just attach placeholder user info
    logger.warn('API key validation not fully implemented');

    next();
  } catch (error) {
    next(error);
  }
}
