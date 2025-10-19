/**
 * Analytics routes
 * Analytics and metrics endpoints
 */

import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import {
  getRecordingAnalytics,
  getUserAnalytics,
  getOrganizationAnalytics,
  getViewsTimeSeries,
  getConsoleEvents,
  trackEvent,
} from '../../services/analytics';
import { AnalyticsEventType } from '@console-capture/shared';
import { UserRole } from '@console-capture/shared';

export const analyticsRouter = Router();

// All analytics routes require authentication
analyticsRouter.use(authenticate);

/**
 * Get recording analytics
 * GET /api/analytics/recordings/:recordingId
 */
analyticsRouter.get(
  '/recordings/:recordingId',
  [
    param('recordingId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors: errors.array(),
      });
    }

    const { recordingId } = req.params;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const analytics = await getRecordingAnalytics(recordingId, startDate, endDate);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timestamp: new Date(),
        requestId: req.requestId,
      },
    });
  })
);

/**
 * Get recording views time series
 * GET /api/analytics/recordings/:recordingId/timeseries
 */
analyticsRouter.get(
  '/recordings/:recordingId/timeseries',
  [
    param('recordingId').isUUID(),
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('interval').optional().isIn(['1 hour', '1 day', '1 week']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors: errors.array(),
      });
    }

    const { recordingId } = req.params;
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const interval = (req.query.interval as '1 hour' | '1 day' | '1 week') || '1 day';

    const timeSeries = await getViewsTimeSeries(recordingId, startDate, endDate, interval);

    res.json({
      success: true,
      data: {
        recordingId,
        startDate,
        endDate,
        interval,
        data: timeSeries,
      },
      metadata: {
        timestamp: new Date(),
        requestId: req.requestId,
      },
    });
  })
);

/**
 * Get console events for a recording
 * GET /api/analytics/recordings/:recordingId/console-events
 */
analyticsRouter.get(
  '/recordings/:recordingId/console-events',
  [
    param('recordingId').isUUID(),
    query('type').optional().isArray(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors: errors.array(),
      });
    }

    const { recordingId } = req.params;
    const type = req.query.type as string[] | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const { events, total } = await getConsoleEvents(recordingId, {
      type,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: events,
      metadata: {
        timestamp: new Date(),
        requestId: req.requestId,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          perPage: limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
      },
    });
  })
);

/**
 * Get user analytics
 * GET /api/analytics/users/:userId
 */
analyticsRouter.get(
  '/users/:userId',
  [
    param('userId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors: errors.array(),
      });
    }

    const { userId } = req.params;

    // Ensure user can only access their own analytics or is admin
    if (req.user!.id !== userId && req.user!.role !== UserRole.ADMIN) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const analytics = await getUserAnalytics(userId, startDate, endDate);

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timestamp: new Date(),
        requestId: req.requestId,
      },
    });
  })
);

/**
 * Get organization analytics
 * GET /api/analytics/organizations/:organizationId
 */
analyticsRouter.get(
  '/organizations/:organizationId',
  [
    param('organizationId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  requireRole(UserRole.TEAM, UserRole.ENTERPRISE, UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors: errors.array(),
      });
    }

    const { organizationId } = req.params;

    // Ensure user belongs to organization or is admin
    if (
      req.user!.organizationId !== organizationId &&
      req.user!.role !== UserRole.ADMIN
    ) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const analytics = await getOrganizationAnalytics(
      organizationId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: analytics,
      metadata: {
        timestamp: new Date(),
        requestId: req.requestId,
      },
    });
  })
);

/**
 * Track analytics event
 * POST /api/analytics/events
 */
analyticsRouter.post(
  '/events',
  [
    query('recordingId').isUUID(),
    query('eventType').isIn(Object.values(AnalyticsEventType)),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', {
        errors: errors.array(),
      });
    }

    const { recordingId, eventType } = req.body;
    const metadata = req.body.metadata || {};

    // Add request metadata
    metadata.userAgent = req.headers['user-agent'];
    metadata.ipAddress = req.ip;
    metadata.referrer = req.headers.referer;

    await trackEvent(
      recordingId,
      eventType as AnalyticsEventType,
      metadata,
      req.user?.id
    );

    res.json({
      success: true,
      data: {
        message: 'Event tracked successfully',
      },
      metadata: {
        timestamp: new Date(),
        requestId: req.requestId,
      },
    });
  })
);
