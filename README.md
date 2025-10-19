# ConsoleCapture - Enterprise Console Recording Platform

![ConsoleCapture Logo](docs/assets/logo.png)

A complete, production-ready console capture and recording platform with MCP (Model Context Protocol) integration, enterprise features, and comprehensive monetization capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

## Overview

ConsoleCapture is a comprehensive platform for capturing, recording, analyzing, and sharing console/terminal sessions. Built with enterprise-grade features and following the AI-Optimized Gamified Task Blueprint v7.1 framework, it includes:

- **Chrome Extension** (Manifest V3) for browser console capture
- **Cloud Backend** (Node.js/TypeScript) with PostgreSQL + TimescaleDB
- **MCP Integration** (Local stdio + Cloud HTTP/SSE)
- **Advanced Analytics** with Elasticsearch/MeiliSearch
- **Enterprise Features** (SSO/SAML, team collaboration, compliance)
- **25+ Premium Add-ons** with freemium pricing model

## Features

### Phase 0: Foundation (Months 1-4)

- ✅ **Chrome Extension (Manifest V3)**
  - Real-time console capture with injected script
  - Background service worker for recording management
  - Popup UI for recording controls
  - DevTools panel integration

- ✅ **Cloud Backend**
  - Node.js/TypeScript API server
  - PostgreSQL + TimescaleDB for time-series data
  - RESTful API with comprehensive endpoints
  - User authentication (OAuth, JWT)

- ✅ **Freemium Pricing Tiers**
  - Free: 25 public recordings/month, 1GB storage
  - Pro: $8/month - Unlimited recordings, 20GB storage
  - Team: $19/user/month - Team features, unlimited storage
  - Enterprise: Custom pricing - Full compliance, on-premise

- ✅ **Payment Integration**
  - Stripe integration for subscriptions
  - Webhook handling for payment events
  - Automatic tier management

- ✅ **Cloud Storage**
  - S3-compatible storage (AWS S3/MinIO)
  - Automatic file uploads
  - Lifecycle policies for cost optimization

- ✅ **Basic Analytics**
  - View counts and engagement metrics
  - User activity tracking
  - Performance monitoring

### Phase 1: Local MCP Prototype (Months 5-6)

- ✅ **Local stdio MCP Server**
  - TypeScript implementation
  - MCP SDK integration (@modelcontextprotocol/sdk)
  - Read-only resources (logs, sessions)
  - Basic tools (search_logs, filter_logs, export_logs)

- 📝 **Documentation**
  - Claude Desktop integration guide
  - Cursor IDE setup instructions
  - API documentation

### Phase 2: Cloud MCP Production (Months 7-12)

- 🚧 **Production MCP Server**
  - HTTP/SSE transport for cloud deployment
  - Full MCP resources (logs, sessions, filters, teams)
  - Complete tool suite (search, analyze, compare, export)
  - MCP prompts for debug workflows
  - Authentication & authorization
  - Rate limiting & usage tracking

- 🚧 **Advanced Search**
  - Elasticsearch/MeiliSearch integration
  - Full-text search across recordings
  - Advanced filtering and querying

- 🚧 **Redis Caching**
  - Performance optimization
  - Session management
  - Rate limit tracking

### Phase 3: Enterprise & Scale (Year 2+)

- 🚧 **Team Collaboration**
  - Shared libraries
  - Role-based permissions
  - Team analytics dashboard

- 🚧 **SSO/SAML Integration**
  - Enterprise identity providers
  - Okta, Azure AD, OneLogin support

- 🚧 **SOC 2 Compliance**
  - Audit logging
  - Encryption at rest and in transit
  - Compliance certifications

- 🚧 **Advanced Integrations**
  - JIRA, Slack, GitHub, Teams
  - Custom webhooks
  - API access with rate limiting

- 🚧 **On-Premise Deployment**
  - Self-hosted option
  - Air-gapped environments
  - Custom SLAs

- 🚧 **White-Label Capabilities**
  - Custom branding
  - Custom domains
  - Embedded player customization

### All 25 Premium Add-Ons

1. ✅ Unlimited recordings
2. ✅ 20GB-unlimited cloud storage
3. ✅ 1080p/4K recording quality
4. ✅ Advanced export formats (GIF, MP4, WebM, SVG)
5. ✅ Remove watermarks + custom branding
6. ✅ Private recordings with passwords
7. ✅ Advanced editing (trim, annotations, blur)
8. ✅ Analytics (view counts, engagement)
9. 🚧 GitHub integration
10. 🚧 API access (tiered)
11. 🚧 Team collaboration (shared libraries, permissions)
12. 🚧 Team analytics dashboard
13. 🚧 Custom domains
14. 🚧 SSO integration
15. 🚧 Slack/Teams integrations
16. 🚧 Admin controls
17. 🚧 Priority support
18. ✅ Unlimited storage
19. 🚧 Self-hosted option
20. 🚧 SOC 2/HIPAA/GDPR compliance
21. 🚧 99.9% SLA
22. 🚧 24/7 support
23. 🚧 Custom integrations
24. 🚧 Data residency options
25. 🚧 White-label option

Legend: ✅ Implemented | 🚧 In Progress | 📝 Planned

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ConsoleCapture Platform                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐     ┌──────────────────────────────┐    │
│  │   Chrome      │────▶│      Cloud Backend           │    │
│  │   Extension   │     │  (Node.js + PostgreSQL +     │    │
│  │  (Manifest V3)│◀────│   TimescaleDB + Redis)       │    │
│  └───────────────┘     └──────────────┬───────────────┘    │
│                                        │                     │
│                         ┌──────────────┼──────────────┐     │
│                         │              │              │     │
│                    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐│
│                    │   S3    │   │Elastic- │   │   MCP   ││
│                    │ Storage │   │ search  │   │ Servers ││
│                    └─────────┘   └─────────┘   └─────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 MCP Integration Layer                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  • Local stdio server (Phase 1)                     │   │
│  │  • Cloud HTTP/SSE server (Phase 2)                  │   │
│  │  • Resources: logs, sessions, recordings            │   │
│  │  • Tools: search, analyze, export, compare          │   │
│  │  • Prompts: debug workflows, analysis templates     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend (Chrome Extension)**
- TypeScript
- React 18
- Webpack 5
- Chrome Extension Manifest V3

**Backend**
- Node.js 18+
- TypeScript 5
- Express.js
- PostgreSQL 15 + TimescaleDB
- Redis 7
- Elasticsearch 8 / MeiliSearch

**MCP Servers**
- @modelcontextprotocol/sdk
- stdio transport (local)
- HTTP/SSE transport (cloud)

**Infrastructure**
- Docker & Docker Compose
- Kubernetes (production)
- AWS S3 / MinIO (development)
- Terraform (IaC)

**Monitoring & Observability**
- Winston (logging)
- Sentry (error tracking)
- Datadog (metrics & APM)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/console-capture.git
cd console-capture
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your configuration
```

4. **Start infrastructure services**

```bash
docker-compose up -d postgres redis elasticsearch minio
```

5. **Run database migrations**

```bash
cd packages/backend
npm run db:migrate
npm run db:seed
```

6. **Start development servers**

```bash
# Terminal 1: Backend
npm run dev --workspace=@console-capture/backend

# Terminal 2: Extension (build and load in Chrome)
npm run build --workspace=@console-capture/extension

# Terminal 3: MCP Local Server
npm run dev --workspace=@console-capture/mcp-local
```

### Loading the Chrome Extension

1. Build the extension: `npm run build --workspace=@console-capture/extension`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `packages/extension/dist` directory

## Development

### Project Structure

```
console-capture/
├── packages/
│   ├── shared/               # Shared types, utilities, constants
│   ├── extension/            # Chrome extension
│   ├── backend/              # API server
│   ├── mcp-local/            # Local MCP server (stdio)
│   └── mcp-cloud/            # Cloud MCP server (HTTP/SSE)
├── docs/                     # Documentation
├── infrastructure/           # Terraform, Kubernetes configs
├── docker-compose.yml        # Development infrastructure
├── package.json              # Workspace configuration
└── turbo.json                # Monorepo build configuration
```

### Available Scripts

```bash
# Build all packages
npm run build

# Run all packages in development mode
npm run dev

# Run tests
npm run test
npm run test:coverage
npm run test:e2e

# Lint and format
npm run lint
npm run format

# Database operations
npm run db:migrate
npm run db:rollback
npm run db:seed

# Docker operations
npm run docker:build
npm run docker:up
npm run docker:down
```

### Testing

This project follows TDD (Test-Driven Development) with comprehensive test coverage:

- **Unit Tests**: Jest with ts-jest
- **Integration Tests**: Supertest for API testing
- **E2E Tests**: Playwright for end-to-end scenarios
- **Coverage Target**: 80%+ code coverage

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Deployment

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply configurations
kubectl apply -f infrastructure/k8s/

# Check deployment status
kubectl get pods -n console-capture
```

### Environment-Specific Deployments

- **Development**: Local Docker Compose
- **Staging**: Kubernetes cluster with staging configs
- **Production**: Kubernetes cluster with production configs, multi-region

See [Deployment Guide](docs/deployment.md) for detailed instructions.

## Documentation

- [API Documentation](docs/api/README.md)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)
- [MCP Integration Guide](docs/mcp-integration.md)
- [Architecture Overview](docs/architecture.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## Methodology

This project follows the **AI-Optimized Gamified Task Blueprint v7.1** framework:

- **SPARC Principles**: Symbolic Principles for AI-Driven Collaborative Development
- **SAPPO Ontology**: Software Architecture Problem Prediction Ontology
- **Targeted TDD**: Test-Driven Development with incremental complexity
- **Dual-Mode LLM Strategy**: Thinking Mode (complex reasoning) + Instruct Mode (precise code generation)
- **Gamification**: Experience points, badges, levels, leaderboards for continuous improvement

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- Documentation: https://docs.console-capture.com
- Email: support@console-capture.com
- Discord: https://discord.gg/console-capture
- GitHub Issues: https://github.com/yourusername/console-capture/issues

---

**Built with the AI-Optimized Gamified Task Blueprint v7.1**

Following SPARC principles and SAPPO ontology for production-ready, maintainable code.
