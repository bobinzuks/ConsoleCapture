# ConsoleCapture Architecture Documentation

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ConsoleCapture Platform                           │
│                  Production-Ready Monetization Platform                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────────────────────────────┐
│                  │         │          Cloud Infrastructure             │
│  Chrome Browser  │────────▶│                                          │
│   + Extension    │  HTTPS  │  ┌────────────┐  ┌───────────────────┐  │
│  (Manifest V3)   │◀────────│  │   Load     │  │   API Gateway     │  │
│                  │         │  │  Balancer  │─▶│   (Rate Limit)    │  │
└──────────────────┘         │  └────────────┘  └─────────┬─────────┘  │
                             │                            │             │
                             │  ┌─────────────────────────▼──────────┐ │
                             │  │      Backend API Cluster           │ │
                             │  │  (Node.js/Express + TypeScript)    │ │
                             │  │                                     │ │
                             │  │  ┌──────────┐  ┌──────────────┐   │ │
                             │  │  │  Auth    │  │  Recording   │   │ │
                             │  │  │ Service  │  │   Service    │   │ │
                             │  │  └──────────┘  └──────────────┘   │ │
                             │  │                                     │ │
                             │  │  ┌──────────┐  ┌──────────────┐   │ │
                             │  │  │ Payment  │  │   Storage    │   │ │
                             │  │  │ Service  │  │   Service    │   │ │
                             │  │  └──────────┘  └──────────────┘   │ │
                             │  │                                     │ │
                             │  │  ┌──────────┐  ┌──────────────┐   │ │
                             │  │  │Analytics │  │    Search    │   │ │
                             │  │  │ Service  │  │   Service    │   │ │
                             │  │  └──────────┘  └──────────────┘   │ │
                             │  └─────────────────────────┬─────────┘ │
                             │                            │            │
                             │  ┌─────────────────────────▼─────────┐ │
                             │  │        Data Layer                 │ │
                             │  │                                    │ │
                             │  │  ┌──────────────────────────────┐ │ │
                             │  │  │   PostgreSQL + TimescaleDB   │ │ │
                             │  │  │   (Primary Database)         │ │ │
                             │  │  │   • Users, Organizations     │ │ │
                             │  │  │   • Recordings, Sessions     │ │ │
                             │  │  │   • Console Events (TSDB)    │ │ │
                             │  │  │   • Analytics (TSDB)         │ │ │
                             │  │  └──────────────────────────────┘ │ │
                             │  │                                    │ │
                             │  │  ┌──────────────────────────────┐ │ │
                             │  │  │         Redis Cluster        │ │ │
                             │  │  │   • Session Cache            │ │ │
                             │  │  │   • Rate Limiting            │ │ │
                             │  │  │   • Job Queue                │ │ │
                             │  │  └──────────────────────────────┘ │ │
                             │  │                                    │ │
                             │  │  ┌──────────────────────────────┐ │ │
                             │  │  │  Elasticsearch/MeiliSearch   │ │ │
                             │  │  │   • Full-text Search         │ │ │
                             │  │  │   • Log Analysis             │ │ │
                             │  │  │   • Advanced Filtering       │ │ │
                             │  │  └──────────────────────────────┘ │ │
                             │  │                                    │ │
                             │  │  ┌──────────────────────────────┐ │ │
                             │  │  │      S3 Object Storage       │ │ │
                             │  │  │   • Recording Files          │ │ │
                             │  │  │   • Thumbnails               │ │ │
                             │  │  │   • Exports                  │ │ │
                             │  │  └──────────────────────────────┘ │ │
                             │  └────────────────────────────────────┘ │
                             │                                          │
                             │  ┌────────────────────────────────────┐ │
                             │  │    MCP Integration Layer           │ │
                             │  │                                    │ │
                             │  │  ┌──────────────┐ ┌─────────────┐ │ │
                             │  │  │  MCP Local   │ │  MCP Cloud  │ │ │
                             │  │  │   Server     │ │   Server    │ │ │
                             │  │  │  (stdio)     │ │ (HTTP/SSE)  │ │ │
                             │  │  └──────────────┘ └─────────────┘ │ │
                             │  └────────────────────────────────────┘ │
                             │                                          │
                             │  ┌────────────────────────────────────┐ │
                             │  │    External Integrations           │ │
                             │  │  • Stripe (Payments)               │ │
                             │  │  • SendGrid (Email)                │ │
                             │  │  • Sentry (Error Tracking)         │ │
                             │  │  • Datadog (Monitoring)            │ │
                             │  │  • GitHub/JIRA/Slack (Webhooks)    │ │
                             │  └────────────────────────────────────┘ │
                             └──────────────────────────────────────────┘
```

## Chrome Extension Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    Chrome Extension (Manifest V3)                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐                                             │
│  │  Page Context    │  (injected.js)                              │
│  │                  │                                              │
│  │  • Intercept     │  Original console methods:                  │
│  │    console.*     │  console.log, warn, error, info, debug     │
│  │  • Serialize     │          ▼                                  │
│  │    arguments     │  Wrapped with interceptor                   │
│  │  • Forward to    │          ▼                                  │
│  │    content       │  Serialize & send to content script        │
│  └────────┬─────────┘                                             │
│           │ postMessage                                            │
│           ▼                                                         │
│  ┌──────────────────┐                                             │
│  │  Content Script  │  (content.js)                               │
│  │                  │                                              │
│  │  • Message       │  Listen for postMessage from injected      │
│  │    bridge        │          ▼                                  │
│  │  • Filter &      │  Validate message source                    │
│  │    validate      │          ▼                                  │
│  │  • Forward to    │  Forward to background service worker      │
│  │    background    │                                              │
│  └────────┬─────────┘                                             │
│           │ chrome.runtime.sendMessage                             │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Background Service Worker  (background.js)              │    │
│  │                                                            │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │  Recording State Machine                           │  │    │
│  │  │                                                      │  │    │
│  │  │  States: IDLE → RECORDING → PAUSED → COMPLETED    │  │    │
│  │  │                                                      │  │    │
│  │  │  • Track session ID                                 │  │    │
│  │  │  • Aggregate events in memory                       │  │    │
│  │  │  • Manage recording metadata                        │  │    │
│  │  │  • Enforce quota limits                             │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                            │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │  Storage Manager                                    │  │    │
│  │  │                                                      │  │    │
│  │  │  chrome.storage.local:                              │  │    │
│  │  │  • sessions[]      - Local session history         │  │    │
│  │  │  • settings        - User preferences              │  │    │
│  │  │  • isRecording     - Current state                  │  │    │
│  │  │  • authToken       - API authentication            │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                            │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │  API Communication                                  │  │    │
│  │  │                                                      │  │    │
│  │  │  fetch(API_ENDPOINT + '/api/...')                   │  │    │
│  │  │  • Upload recordings                                │  │    │
│  │  │  • Sync settings                                    │  │    │
│  │  │  • Check quota                                      │  │    │
│  │  │  • Authenticate                                     │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────┘    │
│           ▲                                                         │
│           │ chrome.runtime.onMessage                                │
│           │                                                         │
│  ┌────────┴─────────┐         ┌────────────────┐                 │
│  │  Popup UI        │         │ DevTools Panel │                 │
│  │  (popup.tsx)     │         │ (panel.tsx)    │                 │
│  │                  │         │                 │                 │
│  │  • Start/Stop    │         │ • View logs    │                 │
│  │  • View status   │         │ • Filters      │                 │
│  │  • Settings      │         │ • Export       │                 │
│  └──────────────────┘         └────────────────┘                 │
└────────────────────────────────────────────────────────────────────┘
```

## Backend API Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Server                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP Request                                                    │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                       │   │
│  │                                                          │   │
│  │  1. Helmet         - Security headers                   │   │
│  │  2. CORS           - Cross-origin resource sharing      │   │
│  │  3. Body Parser    - JSON/URL encoding                  │   │
│  │  4. Compression    - gzip response compression          │   │
│  │  5. Request Logger - Winston structured logging         │   │
│  │  6. Rate Limiter   - Tier-based rate limiting          │   │
│  │  7. Auth           - JWT/API key verification          │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Router Layer                                           │   │
│  │                                                          │   │
│  │  /api/auth/*        - Authentication endpoints          │   │
│  │  /api/users/*       - User management                   │   │
│  │  /api/recordings/*  - Recording CRUD                    │   │
│  │  /api/sessions/*    - Session management                │   │
│  │  /api/analytics/*   - Analytics & metrics               │   │
│  │  /api/search/*      - Full-text search                  │   │
│  │  /api/webhooks/*    - Webhook management                │   │
│  │  /api/admin/*       - Admin operations                  │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Controller Layer                                       │   │
│  │                                                          │   │
│  │  • Request validation (express-validator)               │   │
│  │  • Extract parameters                                    │   │
│  │  • Call service layer                                    │   │
│  │  • Format response                                       │   │
│  │  • Handle errors                                         │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Service Layer (Business Logic)                        │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │   Auth       │  │  Recording   │  │   Storage   │  │   │
│  │  │   Service    │  │   Service    │  │   Service   │  │   │
│  │  │              │  │              │  │             │  │   │
│  │  │ • Login      │  │ • Create     │  │ • Upload    │  │   │
│  │  │ • Register   │  │ • Update     │  │ • Download  │  │   │
│  │  │ • OAuth      │  │ • Delete     │  │ • Delete    │  │   │
│  │  │ • SAML       │  │ • Export     │  │ • Presign   │  │   │
│  │  │ • JWT        │  │ • List       │  │             │  │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │   Payment    │  │  Analytics   │  │   Search    │  │   │
│  │  │   Service    │  │   Service    │  │   Service   │  │   │
│  │  │              │  │              │  │             │  │   │
│  │  │ • Subscribe  │  │ • Track      │  │ • Index     │  │   │
│  │  │ • Upgrade    │  │ • Aggregate  │  │ • Query     │  │   │
│  │  │ • Cancel     │  │ • Report     │  │ • Filter    │  │   │
│  │  │ • Webhook    │  │              │  │             │  │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Repository Layer (Data Access)                         │   │
│  │                                                          │   │
│  │  • Database queries (Knex.js)                           │   │
│  │  • Transactions                                          │   │
│  │  • Connection pooling                                    │   │
│  │  • Query optimization                                    │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  External Services                                      │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │   │
│  │  │ PostgreSQL  │  │    Redis    │  │ Elasticsearch│   │   │
│  │  │ TimescaleDB │  │             │  │ MeiliSearch  │   │   │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │   │
│  │  │     S3      │  │   Stripe    │  │  SendGrid    │   │   │
│  │  │   MinIO     │  │             │  │              │   │   │
│  │  └─────────────┘  └─────────────┘  └──────────────┘   │   │
│  └──────────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Recording Creation

```
1. User clicks "Start Recording" in extension popup
   │
   ▼
2. Popup sends message to background service worker
   Message: { type: 'START_RECORDING', payload: { quality: '1080p' } }
   │
   ▼
3. Background worker:
   - Generates session ID
   - Sets recording state to ACTIVE
   - Updates chrome.storage.local
   - Returns session ID to popup
   │
   ▼
4. Popup sends message to content script
   Message: { type: 'START_RECORDING' }
   │
   ▼
5. Content script injects injected.js into page
   - Script intercepts console.* methods
   - Wraps original methods with interceptor
   │
   ▼
6. When console.log() is called in page:
   - Interceptor captures arguments
   - Serializes arguments to JSON
   - Calls original console.log()
   - Posts message to content script
   │
   ▼
7. Content script receives postMessage:
   - Validates message source
   - Forwards to background worker
   Message: { type: 'CONSOLE_LOG', payload: { timestamp, type, message, args } }
   │
   ▼
8. Background worker:
   - Appends event to events array
   - Updates event count
   - Maintains last 10,000 events in memory
   │
   ▼
9. User clicks "Stop Recording"
   │
   ▼
10. Background worker:
    - Creates session object with all events
    - Saves to chrome.storage.local
    - Optionally uploads to API:
      POST /api/sessions
      POST /api/recordings
    │
    ▼
11. API backend:
    - Validates JWT token
    - Checks recording quota
    - Creates session record in PostgreSQL
    - Inserts console events into TimescaleDB
    - Returns presigned S3 URL for file upload
    │
    ▼
12. Extension uploads recording file to S3
    PUT <presigned-url>
    Body: JSON session data
    │
    ▼
13. Extension confirms upload
    PATCH /api/recordings/:id
    Body: { storageUrl, fileSize }
    │
    ▼
14. Backend:
    - Updates recording metadata
    - Triggers background jobs:
      * Generate thumbnail
      * Index in Elasticsearch
      * Update usage statistics
      * Send webhooks
    │
    ▼
15. Recording available for playback and analysis
```

## Security Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Network Security                                 │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  • TLS 1.3 for all connections                       │ │
│  │  • WAF (Web Application Firewall)                    │ │
│  │  • DDoS protection                                    │ │
│  │  • IP whitelisting for admin endpoints              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 2: Application Security                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  • Helmet.js security headers                        │ │
│  │  • CORS with origin whitelisting                     │ │
│  │  • Rate limiting per tier                            │ │
│  │  • Input validation and sanitization                │ │
│  │  • SQL injection prevention (parameterized queries)  │ │
│  │  • XSS protection                                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 3: Authentication & Authorization                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  JWT (RS256):                                        │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  Header:    { alg: "RS256", typ: "JWT" }      │ │ │
│  │  │  Payload:   { sub, role, exp, iat }            │ │ │
│  │  │  Signature: RS256(privateKey)                  │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  OAuth2 Flow (Google):                              │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  1. User → Google login                        │ │ │
│  │  │  2. Google → Redirect with auth code           │ │ │
│  │  │  3. Backend → Exchange code for tokens         │ │ │
│  │  │  4. Backend → Create/link user account         │ │ │
│  │  │  5. Backend → Issue JWT tokens                 │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  SAML 2.0 (Enterprise):                             │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  1. User → IdP login                           │ │ │
│  │  │  2. IdP → SAML assertion                       │ │ │
│  │  │  3. Backend → Verify signature                 │ │ │
│  │  │  4. Backend → Extract attributes               │ │ │
│  │  │  5. Backend → Issue JWT tokens                 │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                                                      │ │
│  │  API Keys:                                           │ │
│  │  Format: cc_[40 random chars]                       │ │
│  │  Storage: HMAC-SHA256 hash in database             │ │
│  │  Scopes: recordings:read, recordings:write, etc.   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 4: Data Security                                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Encryption at Rest:                                 │ │
│  │  • PostgreSQL: AES-256 encryption                   │ │
│  │  • S3: Server-side encryption (SSE-S3)              │ │
│  │  • Redis: AOF encryption                            │ │
│  │                                                      │ │
│  │  Encryption in Transit:                              │ │
│  │  • TLS 1.3 for all connections                      │ │
│  │  • Certificate pinning in extension                │ │
│  │                                                      │ │
│  │  Sensitive Data Handling:                            │ │
│  │  • PII redaction in logs                            │ │
│  │  • Password hashing (bcrypt, 12 rounds)             │ │
│  │  • Secret rotation (90 days)                        │ │
│  │  • Secure secret storage (AWS Secrets Manager)     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 5: Audit & Compliance                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  • All actions logged to audit_logs table           │ │
│  │  • Immutable audit trail (TimescaleDB)              │ │
│  │  • Compliance exports (GDPR, SOC 2)                 │ │
│  │  • Data retention policies                          │ │
│  │  • Right to be forgotten implementation             │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Production Deployment                        │
│                   (Kubernetes on AWS/GCP/Azure)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Ingress Layer                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  CloudFlare / AWS CloudFront                         │ │ │
│  │  │  • CDN for static assets                             │ │ │
│  │  │  • DDoS protection                                    │ │ │
│  │  │  • SSL/TLS termination                               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │           │                                                 │ │
│  │           ▼                                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Load Balancer (AWS ALB / GCP Load Balancer)        │ │ │
│  │  │  • Health checks                                     │ │ │
│  │  │  • SSL termination                                   │ │ │
│  │  │  • Request routing                                   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Kubernetes Cluster                                        │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Backend API Deployment                            │   │ │
│  │  │  • Replicas: 3-10 (auto-scaling)                   │   │ │
│  │  │  • Resource limits: 2 CPU, 4GB RAM per pod        │   │ │
│  │  │  • Rolling updates                                  │   │ │
│  │  │  • Health probes (liveness, readiness)            │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  MCP Cloud Deployment                              │   │ │
│  │  │  • Replicas: 2-5 (auto-scaling)                    │   │ │
│  │  │  • Resource limits: 1 CPU, 2GB RAM per pod        │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Background Workers                                 │   │ │
│  │  │  • Export processing                                │   │ │
│  │  │  • Thumbnail generation                             │   │ │
│  │  │  • Analytics aggregation                            │   │ │
│  │  │  • Webhook delivery                                 │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│           │                                                      │
│           ▼                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Managed Data Services                                     │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  AWS RDS PostgreSQL / Cloud SQL                    │   │ │
│  │  │  • TimescaleDB extension                           │   │ │
│  │  │  • Multi-AZ deployment                             │   │ │
│  │  │  • Automated backups (daily)                       │   │ │
│  │  │  • Read replicas for scaling                       │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  AWS ElastiCache / Cloud Memorystore (Redis)      │   │ │
│  │  │  • Cluster mode enabled                            │   │ │
│  │  │  • Auto-failover                                   │   │ │
│  │  │  • Data persistence (AOF)                          │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  AWS Elasticsearch / Elastic Cloud                │   │ │
│  │  │  • 3-node cluster                                  │   │ │
│  │  │  • Snapshot to S3                                  │   │ │
│  │  │  • Kibana for analytics                            │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  AWS S3 / Google Cloud Storage                     │   │ │
│  │  │  • Versioning enabled                              │   │ │
│  │  │  • Lifecycle policies                              │   │ │
│  │  │  • Cross-region replication                        │   │ │
│  │  │  • CloudFront distribution                         │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Monitoring & Observability                               │ │
│  │                                                             │ │
│  │  • Datadog APM - Application performance monitoring       │ │
│  │  • Sentry - Error tracking and alerting                   │ │
│  │  • CloudWatch / Stackdriver - Infrastructure metrics      │ │
│  │  • PagerDuty - On-call alerting                           │ │
│  │  • Grafana - Custom dashboards                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Scalability Strategy

### Horizontal Scaling

- **Backend API**: Auto-scaling based on CPU/memory (3-10 replicas)
- **MCP Servers**: Auto-scaling based on request rate (2-5 replicas)
- **Workers**: Queue-based scaling (scale on queue depth)
- **Databases**: Read replicas for query distribution

### Vertical Scaling

- **Database**: Upgrade instance size as data grows
- **Redis**: Increase memory for larger cache
- **Elasticsearch**: Add nodes for better performance

### Data Partitioning

- **TimescaleDB**: Automatic chunking by time (7-day chunks)
- **PostgreSQL**: Schema per organization (for enterprise)
- **S3**: Partition by user ID and date

### Caching Strategy

- **L1 (Application)**: In-memory cache for hot data
- **L2 (Redis)**: Distributed cache for session/frequently accessed data
- **L3 (CDN)**: Edge caching for static assets and recordings

## Monitoring & Alerts

### Key Metrics

1. **Application Metrics**
   - API response time (p50, p95, p99)
   - Error rate
   - Request throughput
   - Active users

2. **Infrastructure Metrics**
   - CPU utilization
   - Memory usage
   - Network I/O
   - Disk I/O

3. **Business Metrics**
   - New signups
   - Conversion rate (free → paid)
   - Churn rate
   - MRR/ARR

### Alert Thresholds

- Error rate > 1% → Warning
- Error rate > 5% → Critical
- P95 latency > 2s → Warning
- P95 latency > 5s → Critical
- Database CPU > 80% → Warning
- Database connections > 80% → Critical

---

This architecture is designed for:
- **High availability** (99.9% uptime SLA)
- **Horizontal scalability** (handle 10K+ concurrent users)
- **Security** (SOC 2, GDPR, HIPAA compliance ready)
- **Performance** (< 200ms p95 response time)
- **Cost efficiency** (auto-scaling, lifecycle policies)
