/**
 * Validation utilities following SPARC principles
 */

import { REGEX_PATTERNS } from '../constants';
import { UserRole, RecordingQuality, RecordingPrivacy, ExportFormat } from '../types';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * Password validation
 * Requirements: minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
 */
export function validatePassword(password: string): boolean {
  return REGEX_PATTERNS.PASSWORD.test(password);
}

/**
 * Slug validation (for organizations, custom domains)
 */
export function validateSlug(slug: string): boolean {
  return REGEX_PATTERNS.SLUG.test(slug) && slug.length >= 3 && slug.length <= 63;
}

/**
 * UUID validation
 */
export function validateUUID(uuid: string): boolean {
  return REGEX_PATTERNS.UUID.test(uuid);
}

/**
 * URL validation
 */
export function validateUrl(url: string): boolean {
  return REGEX_PATTERNS.URL.test(url);
}

/**
 * Hex color validation
 */
export function validateHexColor(color: string): boolean {
  return REGEX_PATTERNS.HEX_COLOR.test(color);
}

/**
 * User role validation
 */
export function validateUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Recording quality validation
 */
export function validateRecordingQuality(quality: string): quality is RecordingQuality {
  return Object.values(RecordingQuality).includes(quality as RecordingQuality);
}

/**
 * Recording privacy validation
 */
export function validateRecordingPrivacy(privacy: string): privacy is RecordingPrivacy {
  return Object.values(RecordingPrivacy).includes(privacy as RecordingPrivacy);
}

/**
 * Export format validation
 */
export function validateExportFormat(format: string): format is ExportFormat {
  return Object.values(ExportFormat).includes(format as ExportFormat);
}

/**
 * File size validation
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Recording title validation
 */
export function validateRecordingTitle(title: string): boolean {
  return title.length >= 3 && title.length <= 200;
}

/**
 * Organization name validation
 */
export function validateOrganizationName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}

/**
 * Pagination parameters validation
 */
export function validatePaginationParams(page: number, perPage: number): boolean {
  return page >= 1 && perPage >= 1 && perPage <= 100;
}

/**
 * API key validation
 */
export function validateApiKey(apiKey: string): boolean {
  return /^cc_[a-zA-Z0-9]{40}$/.test(apiKey);
}

/**
 * Webhook URL validation
 */
export function validateWebhookUrl(url: string): boolean {
  return validateUrl(url) && (url.startsWith('https://') || url.startsWith('http://localhost'));
}

/**
 * Custom domain validation
 */
export function validateCustomDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate recording metadata
 */
export function validateRecordingMetadata(metadata: unknown): boolean {
  if (typeof metadata !== 'object' || metadata === null) {
    return false;
  }

  const meta = metadata as Record<string, unknown>;

  // Check required fields
  if (
    typeof meta.width !== 'number' ||
    typeof meta.height !== 'number' ||
    typeof meta.shell !== 'string' ||
    typeof meta.terminalType !== 'string'
  ) {
    return false;
  }

  // Validate dimensions
  if (meta.width < 1 || meta.width > 10000 || meta.height < 1 || meta.height > 10000) {
    return false;
  }

  return true;
}

/**
 * Validate JSON structure
 */
export function validateJson(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate;
}

/**
 * Validate timezone
 */
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Batch validation helper
 */
export function validateBatch<T>(
  items: T[],
  validator: (item: T) => boolean
): { valid: boolean; errors: Array<{ index: number; item: T }> } {
  const errors: Array<{ index: number; item: T }> = [];

  items.forEach((item, index) => {
    if (!validator(item)) {
      errors.push({ index, item });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
