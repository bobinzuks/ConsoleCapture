# ConsoleCapture MCP Cloud Server

Production-ready cloud MCP server for ConsoleCapture using HTTP/SSE transport.

## Features

- **HTTP/SSE transport** for remote connections
- **Authentication & Authorization** with JWT
- **Rate limiting** per tier
- **Usage tracking** and analytics
- **Advanced resources**: Logs, sessions, filters, teams
- **Powerful tools**: Search, analyze, compare, export
- **MCP prompts** for debug workflows
- **Type-safe** implementation with TypeScript

## Installation

```bash
npm install @console-capture/mcp-cloud
```

## Configuration

Set the following environment variables:

```bash
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/console_capture

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_ISSUER=console-capture-mcp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Usage

### Start Server

```bash
npm start
```

### API Endpoints

- `GET /health` - Health check
- `POST /mcp/connect` - Establish MCP connection (SSE)
- `POST /mcp/message` - Send MCP message

## Resources

- `console-capture://logs/{recordingId}` - Console logs
- `console-capture://sessions/{sessionId}` - Session metadata
- `console-capture://recordings/{recordingId}` - Recording details
- `console-capture://filters/{userId}` - User's saved filters
- `console-capture://teams/{organizationId}` - Team data

## Tools

- `search_logs` - Full-text search with Elasticsearch
- `filter_logs` - Advanced filtering
- `export_logs` - Export to multiple formats
- `analyze_errors` - Error pattern analysis
- `compare_sessions` - Compare multiple sessions
- `get_analytics` - Retrieve analytics data

## Prompts

- `debug_workflow` - Interactive debugging workflow
- `error_investigation` - Guided error investigation
- `performance_analysis` - Performance analysis template

## Authentication

All requests must include a valid JWT token:

```bash
Authorization: Bearer <jwt-token>
```

## Rate Limiting

Requests are rate-limited based on user tier:
- Free: 10 requests/minute
- Pro: 60 requests/minute
- Team: 300 requests/minute
- Enterprise: Unlimited

## Development

```bash
npm run dev      # Watch mode
npm run build    # Build for production
npm test         # Run tests
```

## License

MIT
