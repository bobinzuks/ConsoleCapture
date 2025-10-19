/**
 * Application configuration
 * Centralized configuration management
 */

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'consolecapture',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'cc:',
  },

  // S3 Storage
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'consolecapture',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },

  // Elasticsearch
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    index: process.env.ELASTICSEARCH_INDEX || 'consolecapture',
  },

  // MeiliSearch (alternative to Elasticsearch)
  meilisearch: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || '',
    index: process.env.MEILISEARCH_INDEX || 'recordings',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    algorithm: 'RS256' as const,
    publicKey: process.env.JWT_PUBLIC_KEY,
    privateKey: process.env.JWT_PRIVATE_KEY,
  },

  // OAuth
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
    },
  },

  // SAML
  saml: {
    entryPoint: process.env.SAML_ENTRY_POINT || '',
    issuer: process.env.SAML_ISSUER || 'consolecapture',
    cert: process.env.SAML_CERT || '',
    callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:3000/api/auth/saml/callback',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Email
  email: {
    from: process.env.EMAIL_FROM || 'noreply@consolecapture.com',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    free: parseInt(process.env.RATE_LIMIT_FREE || '10'),
    pro: parseInt(process.env.RATE_LIMIT_PRO || '100'),
    team: parseInt(process.env.RATE_LIMIT_TEAM || '1000'),
    enterprise: parseInt(process.env.RATE_LIMIT_ENTERPRISE || '10000'),
  },

  // Application
  app: {
    name: 'ConsoleCapture',
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
} as const;

export default config;
