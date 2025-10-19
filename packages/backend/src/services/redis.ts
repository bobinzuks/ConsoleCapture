/**
 * Redis caching service
 * Session storage, rate limiting, and caching
 */

import Redis, { Redis as RedisClient } from 'ioredis';
import { logger } from '@console-capture/shared';
import config from '../config';

let redis: RedisClient | null = null;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<RedisClient> {
  if (redis) {
    return redis;
  }

  try {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error', error);
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    // Test connection
    await redis.ping();
    logger.info('Redis connection established');

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis', error as Error);
    throw error;
  }
}

/**
 * Get Redis instance
 */
export function getRedis(): RedisClient {
  if (!redis) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redis;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Cache helper functions
 */

export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const client = getRedis();
  const serialized = JSON.stringify(value);

  if (ttlSeconds) {
    await client.setex(key, ttlSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis();
  const value = await client.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function deleteCache(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedis();
  const keys = await client.keys(pattern);

  if (keys.length > 0) {
    await client.del(...keys);
  }
}

/**
 * Session management
 */

export async function setSession(sessionId: string, data: any, ttlSeconds = 3600): Promise<void> {
  await setCache(`session:${sessionId}`, data, ttlSeconds);
}

export async function getSession<T>(sessionId: string): Promise<T | null> {
  return getCache<T>(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteCache(`session:${sessionId}`);
}

/**
 * Rate limiting
 */

export async function incrementRateLimit(
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttl: number }> {
  const client = getRedis();
  const rateLimitKey = `ratelimit:${key}`;

  const multi = client.multi();
  multi.incr(rateLimitKey);
  multi.ttl(rateLimitKey);

  const results = await multi.exec();

  if (!results) {
    throw new Error('Failed to execute rate limit increment');
  }

  const count = results[0][1] as number;
  let ttl = results[1][1] as number;

  // Set expiry on first request
  if (ttl === -1) {
    await client.expire(rateLimitKey, windowSeconds);
    ttl = windowSeconds;
  }

  return { count, ttl };
}

export async function getRateLimitCount(key: string): Promise<number> {
  const client = getRedis();
  const count = await client.get(`ratelimit:${key}`);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Distributed locking
 */

export async function acquireLock(
  lockKey: string,
  ttlSeconds = 30
): Promise<boolean> {
  const client = getRedis();
  const result = await client.set(`lock:${lockKey}`, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

export async function releaseLock(lockKey: string): Promise<void> {
  await deleteCache(`lock:${lockKey}`);
}

/**
 * Queue operations (for background jobs)
 */

export async function enqueue(queueName: string, data: any): Promise<void> {
  const client = getRedis();
  await client.lpush(`queue:${queueName}`, JSON.stringify(data));
}

export async function dequeue(queueName: string): Promise<any | null> {
  const client = getRedis();
  const value = await client.rpop(`queue:${queueName}`);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function getQueueLength(queueName: string): Promise<number> {
  const client = getRedis();
  return client.llen(`queue:${queueName}`);
}
