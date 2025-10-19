/**
 * Shared constants for ConsoleCapture platform
 */

// ============= STORAGE LIMITS =============

export const STORAGE_LIMITS = {
  FREE: 1024 * 1024 * 1024, // 1GB
  PRO: 20 * 1024 * 1024 * 1024, // 20GB
  TEAM: -1, // Unlimited
  ENTERPRISE: -1, // Unlimited
} as const;

export const RECORDING_LIMITS = {
  FREE: 25,
  PRO: -1, // Unlimited
  TEAM: -1,
  ENTERPRISE: -1,
} as const;

export const RECORDING_DURATION_LIMITS = {
  FREE: 600, // 10 minutes
  PRO: -1, // Unlimited
  TEAM: -1,
  ENTERPRISE: -1,
} as const;

// ============= RATE LIMITS =============

export const API_RATE_LIMITS = {
  FREE: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
  },
  PRO: {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  TEAM: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
  },
  ENTERPRISE: {
    requestsPerMinute: 10000,
    requestsPerHour: 100000,
    requestsPerDay: -1, // Unlimited
  },
} as const;

// ============= FILE FORMATS =============

export const SUPPORTED_EXPORT_FORMATS = {
  FREE: ['cast', 'json'],
  PRO: ['cast', 'json', 'gif', 'mp4', 'webm'],
  TEAM: ['cast', 'json', 'gif', 'mp4', 'webm', 'svg'],
  ENTERPRISE: ['cast', 'json', 'gif', 'mp4', 'webm', 'svg'],
} as const;

export const MAX_FILE_SIZES = {
  RECORDING: 100 * 1024 * 1024, // 100MB per recording
  THUMBNAIL: 1024 * 1024, // 1MB
  AVATAR: 2 * 1024 * 1024, // 2MB
  CUSTOM_LOGO: 5 * 1024 * 1024, // 5MB
} as const;

// ============= QUALITY SETTINGS =============

export const RECORDING_QUALITY_SETTINGS = {
  '720p': {
    width: 1280,
    height: 720,
    bitrate: 2500,
    fps: 30,
  },
  '1080p': {
    width: 1920,
    height: 1080,
    bitrate: 5000,
    fps: 30,
  },
  '4k': {
    width: 3840,
    height: 2160,
    bitrate: 15000,
    fps: 60,
  },
} as const;

// ============= WEBHOOK EVENTS =============

export const WEBHOOK_EVENTS = [
  'recording.created',
  'recording.updated',
  'recording.deleted',
  'recording.exported',
  'session.started',
  'session.ended',
  'user.created',
  'user.updated',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'team.member.added',
  'team.member.removed',
  'analytics.threshold.reached',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ============= ERROR CODES =============

export const ERROR_CODES = {
  // Authentication errors (1000-1099)
  UNAUTHORIZED: 'ERR_1000_UNAUTHORIZED',
  INVALID_TOKEN: 'ERR_1001_INVALID_TOKEN',
  TOKEN_EXPIRED: 'ERR_1002_TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'ERR_1003_INSUFFICIENT_PERMISSIONS',
  EMAIL_NOT_VERIFIED: 'ERR_1004_EMAIL_NOT_VERIFIED',

  // User errors (1100-1199)
  USER_NOT_FOUND: 'ERR_1100_USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'ERR_1101_USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'ERR_1102_INVALID_CREDENTIALS',
  USER_SUSPENDED: 'ERR_1103_USER_SUSPENDED',

  // Subscription errors (1200-1299)
  SUBSCRIPTION_NOT_FOUND: 'ERR_1200_SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_INACTIVE: 'ERR_1201_SUBSCRIPTION_INACTIVE',
  PAYMENT_FAILED: 'ERR_1202_PAYMENT_FAILED',
  FEATURE_NOT_AVAILABLE: 'ERR_1203_FEATURE_NOT_AVAILABLE',
  QUOTA_EXCEEDED: 'ERR_1204_QUOTA_EXCEEDED',

  // Recording errors (1300-1399)
  RECORDING_NOT_FOUND: 'ERR_1300_RECORDING_NOT_FOUND',
  RECORDING_LIMIT_REACHED: 'ERR_1301_RECORDING_LIMIT_REACHED',
  STORAGE_LIMIT_REACHED: 'ERR_1302_STORAGE_LIMIT_REACHED',
  DURATION_LIMIT_EXCEEDED: 'ERR_1303_DURATION_LIMIT_EXCEEDED',
  INVALID_RECORDING_FORMAT: 'ERR_1304_INVALID_RECORDING_FORMAT',
  RECORDING_PROCESSING_FAILED: 'ERR_1305_RECORDING_PROCESSING_FAILED',
  RECORDING_PASSWORD_REQUIRED: 'ERR_1306_RECORDING_PASSWORD_REQUIRED',
  RECORDING_PASSWORD_INVALID: 'ERR_1307_RECORDING_PASSWORD_INVALID',

  // Rate limit errors (1400-1499)
  RATE_LIMIT_EXCEEDED: 'ERR_1400_RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'ERR_1401_TOO_MANY_REQUESTS',

  // Validation errors (1500-1599)
  INVALID_INPUT: 'ERR_1500_INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'ERR_1501_MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'ERR_1502_INVALID_EMAIL',
  INVALID_URL: 'ERR_1503_INVALID_URL',
  INVALID_FILE_TYPE: 'ERR_1504_INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'ERR_1505_FILE_TOO_LARGE',

  // Server errors (1600-1699)
  INTERNAL_SERVER_ERROR: 'ERR_1600_INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'ERR_1601_DATABASE_ERROR',
  STORAGE_ERROR: 'ERR_1602_STORAGE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'ERR_1603_EXTERNAL_SERVICE_ERROR',
  CACHE_ERROR: 'ERR_1604_CACHE_ERROR',

  // MCP errors (1700-1799)
  MCP_CONNECTION_ERROR: 'ERR_1700_MCP_CONNECTION_ERROR',
  MCP_INVALID_REQUEST: 'ERR_1701_MCP_INVALID_REQUEST',
  MCP_RESOURCE_NOT_FOUND: 'ERR_1702_MCP_RESOURCE_NOT_FOUND',
  MCP_TOOL_EXECUTION_FAILED: 'ERR_1703_MCP_TOOL_EXECUTION_FAILED',
} as const;

// ============= REGEX PATTERNS =============

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

// ============= DATE FORMATS =============

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
} as const;

// ============= CACHE KEYS =============

export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  RECORDING: (id: string) => `recording:${id}`,
  SESSION: (id: string) => `session:${id}`,
  ORGANIZATION: (id: string) => `organization:${id}`,
  SUBSCRIPTION: (id: string) => `subscription:${id}`,
  ANALYTICS: (recordingId: string) => `analytics:${recordingId}`,
  RATE_LIMIT: (userId: string) => `ratelimit:${userId}`,
} as const;

// ============= CACHE TTL (in seconds) =============

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// ============= MCP CONFIGURATION =============

export const MCP_CONFIG = {
  LOCAL: {
    TRANSPORT: 'stdio',
    TIMEOUT: 30000, // 30 seconds
  },
  CLOUD: {
    TRANSPORT: 'http',
    SSE_ENABLED: true,
    TIMEOUT: 60000, // 60 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  },
} as const;

// ============= SECURITY =============

export const SECURITY_CONFIG = {
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  PASSWORD_SALT_ROUNDS: 12,
  SESSION_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  CSRF_TOKEN_LENGTH: 32,
  API_KEY_LENGTH: 40,
  WEBHOOK_SECRET_LENGTH: 32,
} as const;

// ============= COMPLIANCE =============

export const COMPLIANCE_STANDARDS = {
  SOC2: {
    name: 'SOC 2 Type II',
    description: 'Security, availability, processing integrity, confidentiality, and privacy',
    requirements: [
      'Encryption at rest and in transit',
      'Access controls and authentication',
      'Audit logging',
      'Incident response procedures',
      'Vendor management',
    ],
  },
  GDPR: {
    name: 'General Data Protection Regulation',
    description: 'EU data protection and privacy regulation',
    requirements: [
      'Data minimization',
      'Right to be forgotten',
      'Data portability',
      'Consent management',
      'Data breach notification',
    ],
  },
  HIPAA: {
    name: 'Health Insurance Portability and Accountability Act',
    description: 'US healthcare data protection',
    requirements: [
      'PHI encryption',
      'Access controls',
      'Audit trails',
      'BAA agreements',
      'Risk assessments',
    ],
  },
  CCPA: {
    name: 'California Consumer Privacy Act',
    description: 'California privacy regulation',
    requirements: [
      'Data disclosure',
      'Opt-out mechanisms',
      'Data deletion',
      'Non-discrimination',
    ],
  },
} as const;

// ============= MONITORING THRESHOLDS =============

export const MONITORING_THRESHOLDS = {
  ERROR_RATE: 0.01, // 1% error rate triggers alert
  LATENCY_P95: 2000, // 2 seconds
  LATENCY_P99: 5000, // 5 seconds
  CPU_USAGE: 80, // 80% CPU usage
  MEMORY_USAGE: 85, // 85% memory usage
  DISK_USAGE: 90, // 90% disk usage
  DATABASE_CONNECTIONS: 80, // 80% of max connections
} as const;
