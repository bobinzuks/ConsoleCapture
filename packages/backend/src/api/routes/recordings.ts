/**
 * Recordings routes
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { recordingService } from '../../services/recording';
import { authenticateJWT, AuthenticatedRequest } from '../../middleware/auth';
import { ApplicationError, asyncHandler } from '../../middleware/errorHandler';
import { RecordingQuality, RecordingPrivacy } from '@console-capture/shared';

export const recordingsRouter = Router();

/**
 * Create recording
 * POST /api/recordings
 */
recordingsRouter.post(
  '/',
  authenticateJWT,
  [
    body('title').trim().notEmpty(),
    body('quality').isIn(Object.values(RecordingQuality)),
    body('privacy').isIn(Object.values(RecordingPrivacy)),
    body('duration').isInt({ min: 0 }),
    body('eventCount').isInt({ min: 0 }),
    body('tags').optional().isArray(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;

    const recording = await recordingService.createRecording({
      ...req.body,
      userId,
      organizationId,
    });

    res.status(201).json(recording);
  })
);

/**
 * Get recording
 * GET /api/recordings/:id
 */
recordingsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const recording = await recordingService.getRecording(id);
    res.json(recording);
  })
);

/**
 * List recordings
 * GET /api/recordings
 */
recordingsRouter.get(
  '/',
  authenticateJWT,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('tags').optional(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { limit, offset, tags } = req.query;

    const result = await recordingService.listRecordings(userId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      tags: tags ? String(tags).split(',') : undefined,
    });

    res.json(result);
  })
);

/**
 * Update recording
 * PATCH /api/recordings/:id
 */
recordingsRouter.patch(
  '/:id',
  authenticateJWT,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('privacy').optional().isIn(Object.values(RecordingPrivacy)),
    body('tags').optional().isArray(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApplicationError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const userId = req.user!.id;

    const recording = await recordingService.updateRecording(id, userId, req.body);

    res.json(recording);
  })
);

/**
 * Delete recording
 * DELETE /api/recordings/:id
 */
recordingsRouter.delete(
  '/:id',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    await recordingService.deleteRecording(id, userId);

    res.status(204).send();
  })
);

/**
 * Get upload URL
 * POST /api/recordings/:id/upload-url
 */
recordingsRouter.post(
  '/:id/upload-url',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const uploadUrl = await recordingService.generateUploadUrl(userId, id);

    res.json({ uploadUrl });
  })
);

/**
 * Get download URL
 * GET /api/recordings/:id/download-url
 */
recordingsRouter.get(
  '/:id/download-url',
  authenticateJWT,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const downloadUrl = await recordingService.generateDownloadUrl(userId, id);

    res.json({ downloadUrl });
  })
);
