/**
 * Recording repository
 * Database access layer for recordings
 */

import { Knex } from 'knex';
import { getDatabase } from '../db';
import {
  Recording,
  RecordingQuality,
  RecordingPrivacy,
  RecordingMetadata,
} from '@console-capture/shared';

export interface CreateRecordingData {
  userId: string;
  organizationId?: string;
  sessionId: string;
  title: string;
  description?: string;
  quality: RecordingQuality;
  privacy: RecordingPrivacy;
  passwordHash?: string;
  tags: string[];
  duration: number;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  metadata: RecordingMetadata;
}

export interface UpdateRecordingData {
  title?: string;
  description?: string;
  quality?: RecordingQuality;
  privacy?: RecordingPrivacy;
  passwordHash?: string;
  tags?: string[];
  thumbnailUrl?: string;
  metadata?: RecordingMetadata;
}

export interface ListRecordingsOptions {
  userId?: string;
  organizationId?: string;
  privacy?: RecordingPrivacy[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'view_count' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create a new recording
 */
export async function createRecording(data: CreateRecordingData): Promise<Recording> {
  const db = getDatabase();

  const [dbRecording] = await db('recordings')
    .insert({
      user_id: data.userId,
      organization_id: data.organizationId,
      session_id: data.sessionId,
      title: data.title,
      description: data.description,
      quality: data.quality,
      privacy: data.privacy,
      password_hash: data.passwordHash,
      tags: data.tags,
      duration: data.duration,
      file_size: data.fileSize,
      storage_url: data.storageUrl,
      thumbnail_url: data.thumbnailUrl,
      metadata: JSON.stringify(data.metadata),
      view_count: 0,
    })
    .returning('*');

  return mapRecordingFromDb(dbRecording);
}

/**
 * Get recording by ID
 */
export async function getRecordingById(id: string): Promise<Recording | null> {
  const db = getDatabase();

  const dbRecording = await db('recordings')
    .where({ id })
    .whereNull('deleted_at')
    .first();

  if (!dbRecording) {
    return null;
  }

  return mapRecordingFromDb(dbRecording);
}

/**
 * Update recording
 */
export async function updateRecording(
  id: string,
  data: UpdateRecordingData
): Promise<Recording | null> {
  const db = getDatabase();

  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.quality !== undefined) updateData.quality = data.quality;
  if (data.privacy !== undefined) updateData.privacy = data.privacy;
  if (data.passwordHash !== undefined) updateData.password_hash = data.passwordHash;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl;
  if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);

  const [dbRecording] = await db('recordings')
    .where({ id })
    .whereNull('deleted_at')
    .update(updateData)
    .returning('*');

  if (!dbRecording) {
    return null;
  }

  return mapRecordingFromDb(dbRecording);
}

/**
 * Soft delete recording
 */
export async function deleteRecording(id: string): Promise<boolean> {
  const db = getDatabase();

  const count = await db('recordings')
    .where({ id })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() });

  return count > 0;
}

/**
 * List recordings
 */
export async function listRecordings(
  options: ListRecordingsOptions
): Promise<{ recordings: Recording[]; total: number }> {
  const db = getDatabase();

  const query = db('recordings').whereNull('deleted_at');

  // Filters
  if (options.userId) {
    query.where({ user_id: options.userId });
  }

  if (options.organizationId) {
    query.where({ organization_id: options.organizationId });
  }

  if (options.privacy && options.privacy.length > 0) {
    query.whereIn('privacy', options.privacy);
  }

  if (options.tags && options.tags.length > 0) {
    query.where((builder) => {
      options.tags!.forEach((tag) => {
        builder.orWhereRaw('? = ANY(tags)', [tag]);
      });
    });
  }

  // Get total count
  const countQuery = query.clone();
  const [{ count }] = await countQuery.count('* as count');
  const total = parseInt(count as string, 10);

  // Sorting
  const sortBy = options.sortBy || 'created_at';
  const sortOrder = options.sortOrder || 'desc';
  query.orderBy(sortBy, sortOrder);

  // Pagination
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query.limit(limit).offset(offset);

  const dbRecordings = await query;

  return {
    recordings: dbRecordings.map(mapRecordingFromDb),
    total,
  };
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: string): Promise<void> {
  const db = getDatabase();

  await db('recordings')
    .where({ id })
    .whereNull('deleted_at')
    .increment('view_count', 1);
}

/**
 * Get recordings by session ID
 */
export async function getRecordingsBySessionId(sessionId: string): Promise<Recording[]> {
  const db = getDatabase();

  const dbRecordings = await db('recordings')
    .where({ session_id: sessionId })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc');

  return dbRecordings.map(mapRecordingFromDb);
}

/**
 * Get user's recording count
 */
export async function getUserRecordingCount(userId: string): Promise<number> {
  const db = getDatabase();

  const [{ count }] = await db('recordings')
    .where({ user_id: userId })
    .whereNull('deleted_at')
    .count('* as count');

  return parseInt(count as string, 10);
}

/**
 * Get user's total storage used
 */
export async function getUserStorageUsed(userId: string): Promise<number> {
  const db = getDatabase();

  const [{ total }] = await db('recordings')
    .where({ user_id: userId })
    .whereNull('deleted_at')
    .sum('file_size as total');

  return parseInt(total as string, 10) || 0;
}

/**
 * Map database recording to Recording type
 */
function mapRecordingFromDb(dbRecording: any): Recording {
  return {
    id: dbRecording.id,
    userId: dbRecording.user_id,
    organizationId: dbRecording.organization_id,
    sessionId: dbRecording.session_id,
    title: dbRecording.title,
    description: dbRecording.description,
    quality: dbRecording.quality,
    privacy: dbRecording.privacy,
    passwordHash: dbRecording.password_hash,
    tags: dbRecording.tags || [],
    duration: dbRecording.duration,
    fileSize: dbRecording.file_size,
    storageUrl: dbRecording.storage_url,
    thumbnailUrl: dbRecording.thumbnail_url,
    viewCount: dbRecording.view_count,
    metadata: typeof dbRecording.metadata === 'string'
      ? JSON.parse(dbRecording.metadata)
      : dbRecording.metadata,
    createdAt: dbRecording.created_at,
    updatedAt: dbRecording.updated_at,
    deletedAt: dbRecording.deleted_at,
  };
}
