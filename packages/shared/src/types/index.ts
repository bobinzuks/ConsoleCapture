/**
 * Shared TypeScript types for ConsoleCapture platform
 * Following SPARC principles for explicit type definitions
 */

// ============= USER & AUTHENTICATION =============

export enum UserRole {
  FREE = 'free',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  subscriptionId?: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  maxUsers: number;
  maxStorage: number; // in bytes
  maxRecordings: number;
  allowedDomains: string[];
  ssoEnabled: boolean;
  samlConfig?: SAMLConfig;
  customBranding?: CustomBranding;
}

export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  signatureAlgorithm: string;
}

export interface CustomBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  tier: UserRole;
  status: SubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, unknown>;
}

// ============= CONSOLE RECORDINGS =============

export enum RecordingQuality {
  SD = '720p',
  HD = '1080p',
  UHD = '4k',
}

export enum RecordingPrivacy {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
  PASSWORD_PROTECTED = 'password_protected',
}

export enum ExportFormat {
  CAST = 'cast', // Asciinema format
  GIF = 'gif',
  MP4 = 'mp4',
  WEBM = 'webm',
  SVG = 'svg',
  JSON = 'json',
}

export interface Recording {
  id: string;
  userId: string;
  organizationId?: string;
  sessionId: string;
  title: string;
  description?: string;
  quality: RecordingQuality;
  privacy: RecordingPrivacy;
  passwordHash?: string;
  tags: string[];
  duration: number; // in seconds
  fileSize: number; // in bytes
  storageUrl: string;
  thumbnailUrl?: string;
  viewCount: number;
  metadata: RecordingMetadata;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface RecordingMetadata {
  width: number;
  height: number;
  shell: string;
  terminalType: string;
  environment?: Record<string, string>;
  browserInfo?: BrowserInfo;
  consoleEvents?: ConsoleEvent[];
  customMetadata?: Record<string, unknown>;
}

export interface BrowserInfo {
  userAgent: string;
  browserName: string;
  browserVersion: string;
  os: string;
  platform: string;
}

export interface ConsoleEvent {
  timestamp: number;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  args?: unknown[];
  stackTrace?: string;
  source?: string;
  lineNumber?: number;
}

// ============= SESSIONS =============

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

export interface Session {
  id: string;
  userId: string;
  organizationId?: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  metadata: SessionMetadata;
  events: SessionEvent[];
}

export interface SessionMetadata {
  url?: string;
  pageTitle?: string;
  recordingIds: string[];
  totalDuration: number;
  totalEvents: number;
}

export interface SessionEvent {
  timestamp: number;
  type: string;
  data: unknown;
}

// ============= ANALYTICS =============

export interface AnalyticsEvent {
  id: string;
  recordingId: string;
  userId?: string;
  eventType: AnalyticsEventType;
  timestamp: Date;
  metadata: AnalyticsMetadata;
}

export enum AnalyticsEventType {
  VIEW = 'view',
  PLAY = 'play',
  PAUSE = 'pause',
  SEEK = 'seek',
  COMPLETE = 'complete',
  EXPORT = 'export',
  SHARE = 'share',
  EMBED = 'embed',
}

export interface AnalyticsMetadata {
  duration?: number;
  position?: number;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  deviceType?: string;
}

export interface AnalyticsSummary {
  recordingId: string;
  totalViews: number;
  uniqueViews: number;
  avgCompletionRate: number;
  avgWatchTime: number;
  topReferrers: Array<{ url: string; count: number }>;
  deviceBreakdown: Record<string, number>;
  geoBreakdown: Record<string, number>;
}

// ============= FEATURE FLAGS =============

export enum FeatureFlag {
  // Phase 0 Features
  UNLIMITED_RECORDINGS = 'unlimited_recordings',
  CLOUD_STORAGE = 'cloud_storage',
  HD_RECORDING = 'hd_recording',
  UHD_RECORDING = 'uhd_recording',
  ADVANCED_EXPORT = 'advanced_export',
  REMOVE_WATERMARK = 'remove_watermark',
  CUSTOM_BRANDING = 'custom_branding',
  PRIVATE_RECORDINGS = 'private_recordings',
  PASSWORD_PROTECTION = 'password_protection',
  ADVANCED_EDITING = 'advanced_editing',
  ANALYTICS = 'analytics',

  // Phase 1 Features
  MCP_LOCAL_ACCESS = 'mcp_local_access',

  // Phase 2 Features
  MCP_CLOUD_ACCESS = 'mcp_cloud_access',
  API_ACCESS = 'api_access',
  ADVANCED_SEARCH = 'advanced_search',

  // Phase 3 Features
  TEAM_COLLABORATION = 'team_collaboration',
  TEAM_ANALYTICS = 'team_analytics',
  CUSTOM_DOMAIN = 'custom_domain',
  SSO_INTEGRATION = 'sso_integration',
  SLACK_INTEGRATION = 'slack_integration',
  GITHUB_INTEGRATION = 'github_integration',
  ADMIN_CONTROLS = 'admin_controls',
  PRIORITY_SUPPORT = 'priority_support',
  UNLIMITED_STORAGE = 'unlimited_storage',
  SELF_HOSTED = 'self_hosted',
  COMPLIANCE_FEATURES = 'compliance_features',
  SLA_GUARANTEE = 'sla_guarantee',
  DEDICATED_SUPPORT = 'dedicated_support',
  CUSTOM_INTEGRATIONS = 'custom_integrations',
  DATA_RESIDENCY = 'data_residency',
  WHITE_LABEL = 'white_label',
}

// Feature flag mapping by tier
export const TIER_FEATURES: Record<UserRole, FeatureFlag[]> = {
  [UserRole.FREE]: [],
  [UserRole.PRO]: [
    FeatureFlag.UNLIMITED_RECORDINGS,
    FeatureFlag.CLOUD_STORAGE,
    FeatureFlag.HD_RECORDING,
    FeatureFlag.ADVANCED_EXPORT,
    FeatureFlag.REMOVE_WATERMARK,
    FeatureFlag.PRIVATE_RECORDINGS,
    FeatureFlag.PASSWORD_PROTECTION,
    FeatureFlag.ADVANCED_EDITING,
    FeatureFlag.ANALYTICS,
    FeatureFlag.MCP_LOCAL_ACCESS,
  ],
  [UserRole.TEAM]: [
    FeatureFlag.UNLIMITED_RECORDINGS,
    FeatureFlag.CLOUD_STORAGE,
    FeatureFlag.HD_RECORDING,
    FeatureFlag.UHD_RECORDING,
    FeatureFlag.ADVANCED_EXPORT,
    FeatureFlag.REMOVE_WATERMARK,
    FeatureFlag.CUSTOM_BRANDING,
    FeatureFlag.PRIVATE_RECORDINGS,
    FeatureFlag.PASSWORD_PROTECTION,
    FeatureFlag.ADVANCED_EDITING,
    FeatureFlag.ANALYTICS,
    FeatureFlag.MCP_LOCAL_ACCESS,
    FeatureFlag.MCP_CLOUD_ACCESS,
    FeatureFlag.API_ACCESS,
    FeatureFlag.ADVANCED_SEARCH,
    FeatureFlag.TEAM_COLLABORATION,
    FeatureFlag.TEAM_ANALYTICS,
    FeatureFlag.GITHUB_INTEGRATION,
  ],
  [UserRole.ENTERPRISE]: Object.values(FeatureFlag),
  [UserRole.ADMIN]: Object.values(FeatureFlag),
};

// ============= API TYPES =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  pagination?: PaginationMetadata;
  rateLimit?: RateLimitMetadata;
}

export interface PaginationMetadata {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RateLimitMetadata {
  limit: number;
  remaining: number;
  reset: Date;
}

// ============= MCP TYPES =============

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

// ============= PRICING TIERS =============

export interface PricingTier {
  id: UserRole;
  name: string;
  price: number; // monthly price in cents
  yearlyPrice: number; // yearly price in cents
  features: FeatureFlag[];
  limits: TierLimits;
  stripePriceId: string;
  stripeYearlyPriceId: string;
}

export interface TierLimits {
  maxRecordings: number; // -1 for unlimited
  maxStorage: number; // in bytes, -1 for unlimited
  maxRecordingDuration: number; // in seconds, -1 for unlimited
  maxTeamMembers: number; // -1 for unlimited
  apiRateLimit: number; // requests per minute
}

// Default pricing configuration
export const PRICING_TIERS: Record<UserRole, Omit<PricingTier, 'stripePriceId' | 'stripeYearlyPriceId'>> = {
  [UserRole.FREE]: {
    id: UserRole.FREE,
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    features: [],
    limits: {
      maxRecordings: 25,
      maxStorage: 1024 * 1024 * 1024, // 1GB
      maxRecordingDuration: 600, // 10 minutes
      maxTeamMembers: 1,
      apiRateLimit: 10,
    },
  },
  [UserRole.PRO]: {
    id: UserRole.PRO,
    name: 'Pro',
    price: 800, // $8/month
    yearlyPrice: 8000, // $80/year (2 months free)
    features: TIER_FEATURES[UserRole.PRO],
    limits: {
      maxRecordings: -1,
      maxStorage: 20 * 1024 * 1024 * 1024, // 20GB
      maxRecordingDuration: -1,
      maxTeamMembers: 1,
      apiRateLimit: 100,
    },
  },
  [UserRole.TEAM]: {
    id: UserRole.TEAM,
    name: 'Team',
    price: 1900, // $19/user/month
    yearlyPrice: 19000, // $190/user/year
    features: TIER_FEATURES[UserRole.TEAM],
    limits: {
      maxRecordings: -1,
      maxStorage: -1,
      maxRecordingDuration: -1,
      maxTeamMembers: -1,
      apiRateLimit: 1000,
    },
  },
  [UserRole.ENTERPRISE]: {
    id: UserRole.ENTERPRISE,
    name: 'Enterprise',
    price: -1, // Custom pricing
    yearlyPrice: -1,
    features: TIER_FEATURES[UserRole.ENTERPRISE],
    limits: {
      maxRecordings: -1,
      maxStorage: -1,
      maxRecordingDuration: -1,
      maxTeamMembers: -1,
      apiRateLimit: 10000,
    },
  },
  [UserRole.ADMIN]: {
    id: UserRole.ADMIN,
    name: 'Admin',
    price: 0,
    yearlyPrice: 0,
    features: TIER_FEATURES[UserRole.ADMIN],
    limits: {
      maxRecordings: -1,
      maxStorage: -1,
      maxRecordingDuration: -1,
      maxTeamMembers: -1,
      apiRateLimit: -1,
    },
  },
};
