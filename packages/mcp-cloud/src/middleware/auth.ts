/**
 * Authentication middleware using JWT
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { User, UserRole } from '@console-capture/shared';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Verify JWT token and attach user to request
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as {
      sub: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId?: string;
    };

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      organizationId: decoded.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
    };

    logger.debug('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
      });
      return;
    }

    logger.error('Authentication error', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}
