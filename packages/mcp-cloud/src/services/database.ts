/**
 * Database service using Knex
 */

import knex, { Knex } from 'knex';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type {
  Recording,
  Session,
  ConsoleEvent,
  User,
  Organization,
} from '@console-capture/shared';

let db: Knex | null = null;

/**
 * Get database instance
 */
export function getDatabase(): Knex {
  if (!db) {
    db = knex({
      client: 'postgresql',
      connection: config.database.url,
      pool: {
        min: config.database.pool.min,
        max: config.database.pool.max,
      },
      acquireConnectionTimeout: 10000,
    });

    logger.info('Database connection initialized');
  }

  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
    db = null;
  }
}

/**
 * Database query functions
 */
export class DatabaseService {
  private db: Knex;

  constructor() {
    this.db = getDatabase();
  }

  // Users
  async getUser(userId: string): Promise<User | null> {
    return this.db('users').where({ id: userId }).first();
  }

  async getUserWithOrganization(
    userId: string
  ): Promise<(User & { organization?: Organization }) | null> {
    const user = await this.db('users')
      .where({ 'users.id': userId })
      .leftJoin('organizations', 'users.organizationId', 'organizations.id')
      .select('users.*', 'organizations.*')
      .first();

    return user;
  }

  // Recordings
  async getRecordings(userId: string, limit = 50): Promise<Recording[]> {
    return this.db('recordings')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }

  async getRecording(recordingId: string): Promise<Recording | null> {
    return this.db('recordings').where({ id: recordingId }).first();
  }

  async getRecordingsByOrganization(
    organizationId: string,
    limit = 50
  ): Promise<Recording[]> {
    return this.db('recordings')
      .where({ organizationId })
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }

  // Sessions
  async getSessions(userId: string, limit = 50): Promise<Session[]> {
    return this.db('sessions')
      .where({ userId })
      .orderBy('startTime', 'desc')
      .limit(limit);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.db('sessions').where({ id: sessionId }).first();
  }

  // Console Events
  async getConsoleEvents(
    recordingId: string,
    options?: {
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ConsoleEvent[]> {
    let query = this.db('console_events')
      .where({ recordingId })
      .orderBy('timestamp', 'asc');

    if (options?.type) {
      query = query.where({ type: options.type });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query;
  }

  async searchConsoleEvents(
    query: string,
    options?: {
      userId?: string;
      organizationId?: string;
      type?: string;
      limit?: number;
    }
  ): Promise<ConsoleEvent[]> {
    let dbQuery = this.db('console_events')
      .whereRaw('message ILIKE ?', [`%${query}%`])
      .orderBy('timestamp', 'desc');

    if (options?.userId) {
      dbQuery = dbQuery
        .join('recordings', 'console_events.recordingId', 'recordings.id')
        .where('recordings.userId', options.userId);
    }

    if (options?.organizationId) {
      dbQuery = dbQuery
        .join('recordings', 'console_events.recordingId', 'recordings.id')
        .where('recordings.organizationId', options.organizationId);
    }

    if (options?.type) {
      dbQuery = dbQuery.where('console_events.type', options.type);
    }

    if (options?.limit) {
      dbQuery = dbQuery.limit(options.limit);
    }

    return dbQuery;
  }

  // Organization
  async getOrganization(organizationId: string): Promise<Organization | null> {
    return this.db('organizations').where({ id: organizationId }).first();
  }

  async getOrganizationMembers(organizationId: string): Promise<User[]> {
    return this.db('users').where({ organizationId });
  }
}
