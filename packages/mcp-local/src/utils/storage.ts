/**
 * Local storage utility for reading ConsoleCapture data
 * Reads from Chrome extension's local storage export or local JSON files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import type {
  Recording,
  Session,
  ConsoleEvent,
} from '@console-capture/shared';
import { logger } from './logger.js';

/**
 * Default data directory location
 */
const DEFAULT_DATA_DIR = path.join(
  homedir(),
  '.console-capture',
  'data'
);

/**
 * Get the data directory path from environment or use default
 */
export function getDataDirectory(): string {
  return process.env.CONSOLE_CAPTURE_DATA_DIR || DEFAULT_DATA_DIR;
}

/**
 * Ensure data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = getDataDirectory();
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    logger.error('Failed to create data directory:', error);
  }
}

/**
 * Read all recordings from local storage
 */
export async function readRecordings(): Promise<Recording[]> {
  await ensureDataDirectory();
  const dataDir = getDataDirectory();
  const recordingsFile = path.join(dataDir, 'recordings.json');

  try {
    const data = await fs.readFile(recordingsFile, 'utf-8');
    return JSON.parse(data) as Recording[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.debug('No recordings file found, returning empty array');
      return [];
    }
    logger.error('Failed to read recordings:', error);
    throw new Error('Failed to read recordings data');
  }
}

/**
 * Read a specific recording by ID
 */
export async function readRecording(recordingId: string): Promise<Recording | null> {
  const recordings = await readRecordings();
  return recordings.find((r) => r.id === recordingId) || null;
}

/**
 * Read all sessions from local storage
 */
export async function readSessions(): Promise<Session[]> {
  await ensureDataDirectory();
  const dataDir = getDataDirectory();
  const sessionsFile = path.join(dataDir, 'sessions.json');

  try {
    const data = await fs.readFile(sessionsFile, 'utf-8');
    return JSON.parse(data) as Session[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.debug('No sessions file found, returning empty array');
      return [];
    }
    logger.error('Failed to read sessions:', error);
    throw new Error('Failed to read sessions data');
  }
}

/**
 * Read a specific session by ID
 */
export async function readSession(sessionId: string): Promise<Session | null> {
  const sessions = await readSessions();
  return sessions.find((s) => s.id === sessionId) || null;
}

/**
 * Read console logs for a specific recording
 */
export async function readLogs(recordingId: string): Promise<ConsoleEvent[]> {
  await ensureDataDirectory();
  const dataDir = getDataDirectory();
  const logsFile = path.join(dataDir, 'logs', `${recordingId}.json`);

  try {
    const data = await fs.readFile(logsFile, 'utf-8');
    return JSON.parse(data) as ConsoleEvent[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.debug(`No logs file found for recording ${recordingId}`);
      return [];
    }
    logger.error(`Failed to read logs for recording ${recordingId}:`, error);
    throw new Error('Failed to read console logs');
  }
}

/**
 * Search logs across all recordings
 */
export async function searchLogs(
  query: string,
  options?: {
    type?: 'log' | 'warn' | 'error' | 'info' | 'debug';
    recordingId?: string;
  }
): Promise<ConsoleEvent[]> {
  const recordings = await readRecordings();
  const results: ConsoleEvent[] = [];

  // Filter recordings if recordingId specified
  const targetRecordings = options?.recordingId
    ? recordings.filter((r) => r.id === options.recordingId)
    : recordings;

  for (const recording of targetRecordings) {
    const logs = await readLogs(recording.id);

    for (const log of logs) {
      // Filter by type if specified
      if (options?.type && log.type !== options.type) {
        continue;
      }

      // Search in message
      if (log.message.toLowerCase().includes(query.toLowerCase())) {
        results.push(log);
      }
    }
  }

  return results;
}

/**
 * Export logs to various formats
 */
export async function exportLogs(
  recordingId: string,
  format: 'json' | 'txt' | 'csv'
): Promise<string> {
  const logs = await readLogs(recordingId);

  switch (format) {
    case 'json':
      return JSON.stringify(logs, null, 2);

    case 'txt':
      return logs
        .map((log) => {
          const timestamp = new Date(log.timestamp).toISOString();
          return `[${timestamp}] [${log.type.toUpperCase()}] ${log.message}`;
        })
        .join('\n');

    case 'csv':
      const header = 'timestamp,type,message,source,lineNumber\n';
      const rows = logs
        .map((log) => {
          const timestamp = new Date(log.timestamp).toISOString();
          const message = log.message.replace(/"/g, '""'); // Escape quotes
          const source = log.source || '';
          const lineNumber = log.lineNumber || '';
          return `"${timestamp}","${log.type}","${message}","${source}","${lineNumber}"`;
        })
        .join('\n');
      return header + rows;

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
