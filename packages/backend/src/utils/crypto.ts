/**
 * Cryptographic utilities
 * Password hashing, JWT signing, API key generation
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserRole } from '@console-capture/shared';
import config from '../config';

const BCRYPT_ROUNDS = 12;

/**
 * Password hashing
 */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * JWT token generation and verification
 */

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  organizationId?: string;
  type: 'access' | 'refresh';
}

export function signJWT(payload: JWTPayload, expiresIn?: string): string {
  const secret = config.jwt.privateKey || config.jwt.secret;
  const options: jwt.SignOptions = {
    expiresIn: expiresIn || config.jwt.expiresIn,
    issuer: 'consolecapture',
    audience: 'consolecapture-api',
  };

  // Use RS256 if private key is available, otherwise HS256
  if (config.jwt.privateKey) {
    options.algorithm = 'RS256';
  }

  return jwt.sign(payload, secret, options);
}

export function verifyJWT(token: string): JWTPayload {
  const secret = config.jwt.publicKey || config.jwt.secret;
  const options: jwt.VerifyOptions = {
    issuer: 'consolecapture',
    audience: 'consolecapture-api',
  };

  return jwt.verify(token, secret, options) as JWTPayload;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Token pair generation
 */

export function generateTokenPair(userId: string, email: string, role: UserRole, organizationId?: string): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = signJWT(
    {
      sub: userId,
      email,
      role,
      organizationId,
      type: 'access',
    },
    config.jwt.expiresIn
  );

  const refreshToken = signJWT(
    {
      sub: userId,
      email,
      role,
      organizationId,
      type: 'refresh',
    },
    config.jwt.refreshExpiresIn
  );

  return { accessToken, refreshToken };
}

/**
 * API key generation
 */

export function generateApiKey(): { key: string; hash: string; preview: string } {
  // Generate 40 random characters
  const key = `cc_${crypto.randomBytes(30).toString('hex')}`;

  // Hash the key for storage
  const hash = crypto.createHmac('sha256', config.jwt.secret)
    .update(key)
    .digest('hex');

  // Create preview (first 8 characters after prefix)
  const preview = key.substring(0, 11) + '...';

  return { key, hash, preview };
}

export function hashApiKey(key: string): string {
  return crypto.createHmac('sha256', config.jwt.secret)
    .update(key)
    .digest('hex');
}

/**
 * Random token generation
 */

export function generateRandomToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Webhook signature
 */

export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto.createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
