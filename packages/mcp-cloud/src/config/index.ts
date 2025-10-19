/**
 * Configuration management for MCP Cloud Server
 */

import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export interface Config {
  env: string;
  port: number;
  cors: {
    origins: string[];
  };
  jwt: {
    secret: string;
    issuer: string;
    expiresIn: string;
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    url: string;
  };
  elasticsearch: {
    node: string;
  };
  rateLimit: {
    windowMs: number;
    free: number;
    pro: number;
    team: number;
    enterprise: number;
  };
  s3: {
    endpoint?: string;
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    issuer: process.env.JWT_ISSUER || 'console-capture-mcp',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/console_capture',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    free: parseInt(process.env.RATE_LIMIT_FREE || '10', 10),
    pro: parseInt(process.env.RATE_LIMIT_PRO || '60', 10),
    team: parseInt(process.env.RATE_LIMIT_TEAM || '300', 10),
    enterprise: parseInt(process.env.RATE_LIMIT_ENTERPRISE || '10000', 10),
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET || 'console-capture',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
};

// Validate required configuration
if (config.env === 'production') {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
