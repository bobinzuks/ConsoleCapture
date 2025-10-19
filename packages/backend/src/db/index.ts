/**
 * Database initialization and connection management
 * Using Knex.js for PostgreSQL + TimescaleDB
 */

import knex, { Knex } from 'knex';
import { logger } from '@console-capture/shared';
import * as path from 'path';

let db: Knex | null = null;

/**
 * Database configuration
 */
export function getDatabaseConfig(): Knex.Config {
  const env = process.env.NODE_ENV || 'development';

  const config: Knex.Config = {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'consolecapture',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
      extension: 'ts',
    },
    debug: env === 'development' && process.env.DB_DEBUG === 'true',
  };

  return config;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<Knex> {
  if (db) {
    return db;
  }

  try {
    const config = getDatabaseConfig();
    db = knex(config);

    // Test connection
    await db.raw('SELECT 1');
    logger.info('Database connection established');

    // Run migrations in production
    if (process.env.NODE_ENV === 'production' && process.env.AUTO_MIGRATE === 'true') {
      logger.info('Running database migrations...');
      await db.migrate.latest();
      logger.info('Database migrations completed');
    }

    return db;
  } catch (error) {
    logger.error('Failed to initialize database', error as Error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    logger.info('Database connection closed');
  }
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> {
  const database = getDatabase();
  return database.transaction(callback);
}
