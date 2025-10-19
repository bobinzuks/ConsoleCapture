/**
 * User repository for database operations
 * Follows repository pattern for data access
 */

import { Knex } from 'knex';
import { getDatabase } from '../index';
import { User, UserRole } from '@console-capture/shared';
import { logger } from '@console-capture/shared';

export class UserRepository {
  private db: Knex;
  private tableName = 'users';

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Create a new user
   */
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const [created] = await this.db(this.tableName)
        .insert({
          ...user,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      return this.mapToUser(created);
    } catch (error) {
      logger.error('User creation error', error as Error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.db(this.tableName).where({ id }).first();
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      logger.error('User find by ID error', error as Error, { id });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.db(this.tableName).where({ email }).first();
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      logger.error('User find by email error', error as Error, { email });
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const [updated] = await this.db(this.tableName)
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date(),
        })
        .returning('*');

      return this.mapToUser(updated);
    } catch (error) {
      logger.error('User update error', error as Error, { id });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      await this.db(this.tableName).where({ id }).delete();
    } catch (error) {
      logger.error('User deletion error', error as Error, { id });
      throw error;
    }
  }

  /**
   * List users with pagination
   */
  async list(options?: {
    limit?: number;
    offset?: number;
    role?: UserRole;
  }): Promise<{ users: User[]; total: number }> {
    try {
      const query = this.db(this.tableName);

      if (options?.role) {
        query.where({ role: options.role });
      }

      const total = await query.clone().count('* as count').first();
      const users = await query
        .limit(options?.limit || 20)
        .offset(options?.offset || 0)
        .orderBy('created_at', 'desc');

      return {
        users: users.map(this.mapToUser),
        total: Number(total?.count || 0),
      };
    } catch (error) {
      logger.error('User list error', error as Error);
      throw error;
    }
  }

  /**
   * Map database row to User type
   */
  private mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      emailVerified: row.email_verified,
      avatarUrl: row.avatar_url,
      metadata: row.metadata,
    };
  }
}

/**
 * Singleton user repository instance
 */
export const userRepository = new UserRepository();
