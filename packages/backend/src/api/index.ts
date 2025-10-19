/**
 * API router for ConsoleCapture backend
 * Aggregates all route modules
 */

import { Router } from 'express';
import { authRouter } from './routes/auth';
import { recordingsRouter } from './routes/recordings';
import { usersRouter } from './routes/users';
import { healthRouter } from './routes/health';
import { analyticsRouter } from './routes/analytics';

export const apiRouter = Router();

// Mount route modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/recordings', recordingsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/analytics', analyticsRouter);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'ConsoleCapture API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      recordings: '/api/recordings',
      users: '/api/users',
      health: '/api/health',
      analytics: '/api/analytics',
    },
  });
});
