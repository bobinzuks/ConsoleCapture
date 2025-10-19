/**
 * ConsoleCapture Backend API Server
 * Main entry point following SPARC principles
 */

import express, { Express } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { logger } from '@console-capture/shared';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { apiRouter } from './api';
import { initializeDatabase } from './db';
import { initializeRedis } from './services/redis';
import { initializeS3 } from './services/s3';
import { initializeSearchEngine } from './services/search';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize application
 */
async function initializeApp(): Promise<void> {
  logger.info('Initializing ConsoleCapture Backend...');

  // Initialize external services
  try {
    await initializeDatabase();
    logger.info('Database initialized');

    await initializeRedis();
    logger.info('Redis initialized');

    await initializeS3();
    logger.info('S3 storage initialized');

    await initializeSearchEngine();
    logger.info('Search engine initialized');
  } catch (error) {
    logger.fatal('Failed to initialize services', error as Error);
    process.exit(1);
  }

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  }));

  // Parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // Logging middleware
  app.use(requestLogger);

  // Rate limiting
  app.use(rateLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
    });
  });

  // API routes
  app.use('/api', apiRouter);

  // Error handling
  app.use(errorHandler);

  // Start server
  app.listen(PORT, () => {
    logger.info(`ConsoleCapture Backend listening on port ${PORT}`, {
      environment: NODE_ENV,
      port: PORT,
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason as Error, {
    promise: String(promise),
  });
});

// Initialize and start
initializeApp().catch(error => {
  logger.fatal('Failed to start application', error);
  process.exit(1);
});

export { app };
