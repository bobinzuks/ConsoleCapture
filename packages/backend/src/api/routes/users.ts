/**
 * Users routes
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../../middleware/auth';
import { userRepository } from '../../db/repositories';
import { ApplicationError, asyncHandler } from '../../middleware/errorHandler';
import { UserRole } from '@console-capture/shared';

export const usersRouter = Router();

/**
 * Get current user profile
 * GET /api/users/me
 */
usersRouter.get(
  '/me',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApplicationError('User not found', 404, 'NOT_FOUND');
    }

    // Remove sensitive data
    const { metadata, ...safeUser } = user;

    res.json(safeUser);
  })
);

/**
 * Update current user profile
 * PATCH /api/users/me
 */
usersRouter.patch(
  '/me',
  authenticateJWT,
  [body('name').optional().trim().notEmpty(), body('avatarUrl').optional().isURL()],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { name, avatarUrl } = req.body;

    const user = await userRepository.update(userId, { name, avatarUrl });

    // Remove sensitive data
    const { metadata, ...safeUser } = user;

    res.json(safeUser);
  })
);

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
usersRouter.get(
  '/:id',
  authenticateJWT,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userRepository.findById(id);

    if (!user) {
      throw new ApplicationError('User not found', 404, 'NOT_FOUND');
    }

    // Remove sensitive data
    const { metadata, ...safeUser } = user;

    res.json(safeUser);
  })
);

/**
 * List users (Admin only)
 * GET /api/users
 */
usersRouter.get(
  '/',
  authenticateJWT,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const result = await userRepository.list({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });

    // Remove sensitive data
    const users = result.users.map(({ metadata, ...safeUser }) => safeUser);

    res.json({
      users,
      total: result.total,
    });
  })
);

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
usersRouter.delete(
  '/:id',
  authenticateJWT,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await userRepository.delete(id);
    res.status(204).send();
  })
);
