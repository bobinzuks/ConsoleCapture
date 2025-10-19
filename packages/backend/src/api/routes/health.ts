/**
 * Health check routes
 */

import { Router } from 'express';
import { getDatabase } from '../../db';
import { getRedisClient } from '../../services/redis';

export const healthRouter = Router();

/**
 * Basic health check
 */
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check
 */
healthRouter.get('/detailed', async (req, res) => {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  // Check database
  try {
    const db = getDatabase();
    await db.raw('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  res.json(health);
});
