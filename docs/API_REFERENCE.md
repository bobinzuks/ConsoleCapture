# ConsoleCapture API Reference

## Base URL

```
Production: https://api.console-capture.com
Staging: https://api-staging.console-capture.com
Development: http://localhost:3000
```

## Authentication

All API requests require authentication using JWT tokens in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Get Access Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "pro"
    }
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## User Management

### Get Current User

```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "pro",
    "organizationId": null,
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "subscription": {
      "tier": "pro",
      "status": "active",
      "currentPeriodEnd": "2024-02-01T00:00:00Z"
    }
  }
}
```

### Update User Profile

```http
PATCH /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Get Usage Statistics

```http
GET /api/users/me/usage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recordings": {
      "count": 42,
      "limit": -1,
      "storage": 5368709120,
      "storageLimit": 21474836480
    },
    "apiCalls": {
      "today": 150,
      "thisMonth": 4500,
      "rateLimit": 1000
    }
  }
}
```

## Recordings

### Create Recording

```http
POST /api/recordings
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "title": "My Console Recording",
  "description": "Debugging authentication flow",
  "quality": "1080p",
  "privacy": "private",
  "tags": ["debugging", "auth"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "My Console Recording",
    "description": "Debugging authentication flow",
    "quality": "1080p",
    "privacy": "private",
    "tags": ["debugging", "auth"],
    "duration": 0,
    "fileSize": 0,
    "storageUrl": "",
    "viewCount": 0,
    "createdAt": "2024-01-01T12:00:00Z",
    "uploadUrl": "https://s3.amazonaws.com/..."
  }
}
```

### List Recordings

```http
GET /api/recordings?page=1&perPage=20&privacy=private&tags=debugging
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `perPage` (number, default: 20, max: 100) - Items per page
- `privacy` (string) - Filter by privacy level
- `tags` (string) - Comma-separated tags
- `search` (string) - Search in title/description
- `sortBy` (string, default: createdAt) - Sort field
- `sortOrder` (string, default: desc) - Sort direction

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "title": "My Console Recording",
      "quality": "1080p",
      "privacy": "private",
      "duration": 120,
      "viewCount": 5,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "metadata": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 42,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Recording Details

```http
GET /api/recordings/:recordingId
Authorization: Bearer <token>
```

### Update Recording

```http
PATCH /api/recordings/:recordingId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "privacy": "public",
  "tags": ["production", "bugfix"]
}
```

### Delete Recording

```http
DELETE /api/recordings/:recordingId
Authorization: Bearer <token>
```

### Export Recording

```http
POST /api/recordings/:recordingId/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "format": "mp4",
  "quality": "1080p"
}
```

**Supported Formats:**
- `cast` - Asciinema format (all tiers)
- `json` - JSON format (all tiers)
- `gif` - Animated GIF (Pro+)
- `mp4` - Video format (Pro+)
- `webm` - WebM format (Pro+)
- `svg` - SVG animation (Team+)

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "550e8400-e29b-41d4-a716-446655440003",
    "status": "processing",
    "downloadUrl": null,
    "expiresAt": null
  }
}
```

### Get Export Status

```http
GET /api/recordings/:recordingId/exports/:exportId
Authorization: Bearer <token>
```

## Sessions

### Create Session

```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/app",
  "pageTitle": "My Application",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "platform": "MacIntel"
  }
}
```

### Get Session

```http
GET /api/sessions/:sessionId
Authorization: Bearer <token>
```

### Update Session

```http
PATCH /api/sessions/:sessionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "endTime": "2024-01-01T12:05:00Z"
}
```

### Add Console Event

```http
POST /api/sessions/:sessionId/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "timestamp": 1704110400000,
  "type": "error",
  "message": "Uncaught TypeError: Cannot read property 'foo' of undefined",
  "args": [],
  "stackTrace": "Error: ...",
  "source": "app.js",
  "lineNumber": 42
}
```

### Get Console Events

```http
GET /api/sessions/:sessionId/events?type=error&limit=100
Authorization: Bearer <token>
```

## Analytics

### Get Recording Analytics

```http
GET /api/analytics/recordings/:recordingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recordingId": "550e8400-e29b-41d4-a716-446655440002",
    "totalViews": 150,
    "uniqueViews": 87,
    "avgCompletionRate": 0.72,
    "avgWatchTime": 86.5,
    "topReferrers": [
      { "url": "https://github.com/...", "count": 45 },
      { "url": "https://dev.to/...", "count": 23 }
    ],
    "deviceBreakdown": {
      "desktop": 120,
      "mobile": 20,
      "tablet": 10
    },
    "geoBreakdown": {
      "US": 80,
      "UK": 25,
      "DE": 20,
      "FR": 15,
      "other": 10
    }
  }
}
```

### Track Analytics Event

```http
POST /api/analytics/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "recordingId": "550e8400-e29b-41d4-a716-446655440002",
  "eventType": "view",
  "metadata": {
    "referrer": "https://github.com/...",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## Search

### Search Recordings

```http
GET /api/search/recordings?q=authentication+error&type=error&dateFrom=2024-01-01
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (string, required) - Search query
- `type` (string) - Console event type filter
- `dateFrom` (string) - Start date (ISO 8601)
- `dateTo` (string) - End date (ISO 8601)
- `page` (number) - Page number
- `perPage` (number) - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "recordingId": "550e8400-e29b-41d4-a716-446655440002",
        "title": "Authentication Debug Session",
        "highlights": ["authentication <em>error</em> occurred"],
        "matchCount": 5,
        "relevance": 0.95
      }
    ],
    "total": 12,
    "took": 45
  }
}
```

### Search Console Events

```http
POST /api/search/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "Cannot read property",
  "filters": {
    "type": ["error"],
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    }
  },
  "page": 1,
  "perPage": 50
}
```

## Webhooks

### Create Webhook

```http
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/webhooks/console-capture",
  "events": ["recording.created", "recording.updated"],
  "secret": "whsec_your_webhook_secret"
}
```

### List Webhooks

```http
GET /api/webhooks
Authorization: Bearer <token>
```

### Delete Webhook

```http
DELETE /api/webhooks/:webhookId
Authorization: Bearer <token>
```

### Webhook Event Format

When an event occurs, ConsoleCapture sends a POST request to your webhook URL:

```json
{
  "id": "evt_550e8400",
  "event": "recording.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "recordingId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Console Recording"
  }
}
```

**Headers:**
- `X-ConsoleCapture-Signature`: HMAC-SHA256 signature for verification
- `X-ConsoleCapture-Event`: Event type
- `Content-Type`: application/json

## API Keys

### Create API Key

```http
POST /api/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production API Key",
  "scopes": ["recordings:read", "recordings:write", "analytics:read"],
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "name": "Production API Key",
    "key": "cc_1234567890abcdefghijklmnopqrstuvwxyz1234567",
    "scopes": ["recordings:read", "recordings:write", "analytics:read"],
    "expiresAt": "2025-01-01T00:00:00Z"
  }
}
```

**Note:** The full API key is only shown once. Store it securely.

### List API Keys

```http
GET /api/api-keys
Authorization: Bearer <token>
```

### Revoke API Key

```http
DELETE /api/api-keys/:keyId
Authorization: Bearer <token>
```

## Rate Limiting

All API endpoints are rate-limited based on your subscription tier:

- **Free**: 10 requests/minute, 100 requests/hour
- **Pro**: 100 requests/minute, 1,000 requests/hour
- **Team**: 1,000 requests/minute, 10,000 requests/hour
- **Enterprise**: 10,000 requests/minute, custom limits available

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704110460
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERR_1300_RECORDING_NOT_FOUND",
    "message": "Recording not found",
    "details": {
      "recordingId": "550e8400-e29b-41d4-a716-446655440002"
    }
  }
}
```

### Common Error Codes

- `ERR_1000_UNAUTHORIZED` - Authentication required
- `ERR_1001_INVALID_TOKEN` - Invalid or expired token
- `ERR_1203_FEATURE_NOT_AVAILABLE` - Feature not available in your plan
- `ERR_1204_QUOTA_EXCEEDED` - Quota limit exceeded
- `ERR_1300_RECORDING_NOT_FOUND` - Recording not found
- `ERR_1400_RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `ERR_1500_INVALID_INPUT` - Invalid request input

## Pagination

List endpoints support pagination with these query parameters:

- `page` (number, default: 1) - Page number
- `perPage` (number, default: 20, max: 100) - Items per page
- `sortBy` (string) - Sort field
- `sortOrder` (string: asc|desc) - Sort direction

**Response includes pagination metadata:**

```json
{
  "metadata": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Webhook Signature Verification

Verify webhook signatures to ensure requests come from ConsoleCapture:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ConsoleCaptureClient } from '@console-capture/sdk';

const client = new ConsoleCaptureClient({
  apiKey: 'cc_your_api_key_here',
  baseUrl: 'https://api.console-capture.com',
});

// Create recording
const recording = await client.recordings.create({
  sessionId: 'session_123',
  title: 'My Recording',
  privacy: 'private',
});

// Search recordings
const results = await client.search.recordings({
  query: 'authentication error',
  type: 'error',
});
```

### Python

```python
from console_capture import ConsoleCaptureClient

client = ConsoleCaptureClient(
    api_key='cc_your_api_key_here',
    base_url='https://api.console-capture.com'
)

# Create recording
recording = client.recordings.create(
    session_id='session_123',
    title='My Recording',
    privacy='private'
)

# Search recordings
results = client.search.recordings(
    query='authentication error',
    type='error'
)
```

## Support

For API support and questions:

- Documentation: https://docs.console-capture.com
- Email: api-support@console-capture.com
- Discord: https://discord.gg/console-capture
