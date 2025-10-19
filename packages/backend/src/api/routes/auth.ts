/**
 * Authentication routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../../services/auth';
import { userRepository } from '../../db/repositories';
import { ApplicationError, asyncHandler } from '../../middleware/errorHandler';
import { UserRole } from '@console-capture/shared';

export const authRouter = Router();

/**
 * Register new user
 * POST /api/auth/register
 */
authRouter.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApplicationError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const user = await userRepository.create({
      email,
      name,
      role: UserRole.FREE,
      emailVerified: false,
      metadata: { passwordHash },
    });

    // Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = authService.generateAccessToken(tokenPayload);
    const refreshToken = authService.generateRefreshToken(tokenPayload);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  })
);

/**
 * Login
 * POST /api/auth/login
 */
authRouter.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { email, password } = req.body;

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApplicationError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const passwordHash = user.metadata?.passwordHash as string;
    if (!passwordHash) {
      throw new ApplicationError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await authService.verifyPassword(password, passwordHash);
    if (!isValid) {
      throw new ApplicationError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = authService.generateAccessToken(tokenPayload);
    const refreshToken = authService.generateRefreshToken(tokenPayload);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  })
);

/**
 * Refresh token
 * POST /api/auth/refresh
 */
authRouter.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const payload = authService.verifyRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = authService.generateAccessToken(payload);
    const newRefreshToken = authService.generateRefreshToken(payload);

    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  })
);

/**
 * Logout
 * POST /api/auth/logout
 */
authRouter.post('/logout', asyncHandler(async (req, res) => {
  // TODO: Implement token blacklist
  res.json({ message: 'Logged out successfully' });
}));
