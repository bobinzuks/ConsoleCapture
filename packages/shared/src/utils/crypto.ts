/**
 * Cryptographic utilities for secure operations
 */

import * as crypto from 'crypto';

/**
 * Generate a secure random string
 */
export function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hash a password using bcrypt-compatible method
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  // Note: In production, use bcrypt library
  // This is a placeholder implementation
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, saltRounds * 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, originalHash] = hash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 12000, 64, 'sha512').toString('hex');
  return verifyHash === originalHash;
}

/**
 * Generate an API key
 */
export function generateApiKey(): string {
  const randomPart = generateRandomString(40);
  return `cc_${randomPart}`;
}

/**
 * Generate a webhook secret
 */
export function generateWebhookSecret(): string {
  return generateRandomString(32);
}

/**
 * Hash data using SHA-256
 */
export function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create HMAC signature for webhook verification
 */
export function createHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmacSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(ciphertext: string, key: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a cryptographically secure token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Constant-time string comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
