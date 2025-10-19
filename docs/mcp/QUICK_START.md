# MCP Quick Start Guide

Get started with ConsoleCapture MCP in 5 minutes.

## Choose Your Path

### Path A: Local Server (For Individual Developers)

Perfect if you want to use ConsoleCapture with Claude Desktop or Cursor on your local machine.

**Quick Setup:**

```bash
# 1. Build the server
cd packages/mcp-local
npm install && npm run build

# 2. Install globally
npm install -g .

# 3. Create data directory
mkdir -p ~/.console-capture/data/logs

# 4. Add sample data (optional)
cat > ~/.console-capture/data/recordings.json << 'EOF'
[
  {
    "id": "rec-001",
    "userId": "user-123",
    "title": "Example Recording",
    "description": "Test data",
    "quality": "1080p",
    "privacy": "private",
    "tags": ["test"],
    "duration": 60,
    "fileSize": 1024,
    "storageUrl": "local",
    "viewCount": 0,
    "metadata": {},
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
EOF

# 5. Configure Claude Desktop
# Add to ~/Library/Application Support/Claude/claude_desktop_config.json:
{
  "mcpServers": {
    "console-capture": {
      "command": "console-capture-mcp",
      "args": [],
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "$HOME/.console-capture/data"
      }
    }
  }
}

# 6. Restart Claude Desktop
# Done! Try asking Claude: "Show me my console recordings"
```

**Read More**: [Claude Desktop Guide](./CLAUDE_DESKTOP_GUIDE.md) | [Cursor Guide](./CURSOR_GUIDE.md)

---

### Path B: Cloud Server (For Teams & Production)

Perfect if you need multi-user access, authentication, and production-grade features.

**Quick Setup:**

```bash
# 1. Build the server
cd packages/mcp-cloud
npm install && npm run build

# 2. Set up environment
cp .env.example .env
# Edit .env with your database, Redis, etc.

# 3. Start dependencies (using Docker Compose)
cd ../..
docker-compose up -d postgres redis

# 4. Run migrations
cd packages/backend
npm run db:migrate

# 5. Start the MCP server
cd ../mcp-cloud
npm start

# 6. Test the server
curl http://localhost:3001/health

# 7. Get a JWT token (from your auth system)
# Then connect with:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/mcp/connect
```

**Production Deployment**: See [Cloud Deployment Guide](./CLOUD_MCP_DEPLOYMENT.md) (coming soon)

---

## Quick Test: Local Server

Test your local server installation:

```bash
# Run the server manually to test
console-capture-mcp

# You should see:
# [2025-01-15T10:00:00.000Z] [INFO] ConsoleCapture Local MCP Server started successfully
# [2025-01-15T10:00:00.000Z] [INFO] Server name: console-capture-local
# [2025-01-15T10:00:00.000Z] [INFO] Version: 1.0.0
# [2025-01-15T10:00:00.000Z] [INFO] Transport: stdio
```

Test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector console-capture-mcp
```

---

## Quick Test: Cloud Server

Test your cloud server:

```bash
# 1. Health check
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "service": "console-capture-mcp-cloud",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:00:00.000Z"
}

# 2. API info
curl http://localhost:3001/api/info

# Expected response:
{
  "name": "ConsoleCapture MCP Cloud Server",
  "version": "1.0.0",
  "protocol": "model-context-protocol",
  "transport": "http-sse",
  "features": {
    "resources": true,
    "tools": true,
    "prompts": true,
    "authentication": true,
    "rateLimiting": true,
    "usageTracking": true
  }
}
```

---

## Example Workflows

### Workflow 1: Debug Production Errors

**With Claude Desktop (Local Server):**

```
You: "Show me all error logs from my latest recording"

Claude: *Uses filter_logs tool*

You: "Analyze the most common errors"

Claude: *Searches and categorizes errors*

You: "Export these errors as CSV for the team"

Claude: *Uses export_logs tool*
```

### Workflow 2: Team Debugging (Cloud Server)

```
Developer: "Search for 'authentication failed' across all team recordings"

Claude: *Uses search_logs with team context*

Developer: "Compare sessions before and after the deploy"

Claude: *Uses compare_sessions tool*

Developer: "Create a summary report"

Claude: *Analyzes patterns and generates report*
```

### Workflow 3: Performance Analysis

```
You: "Analyze performance for session {sessionId}"

Claude: *Uses performance_analysis prompt*

Claude: *Provides detailed breakdown of:*
- Session duration and events
- Console message types
- Error/warning patterns
- Optimization recommendations
```

---

## Common Commands

### Local Server

```bash
# Start server
console-capture-mcp

# With debug logging
LOG_LEVEL=debug console-capture-mcp

# Custom data directory
CONSOLE_CAPTURE_DATA_DIR=/path/to/data console-capture-mcp
```

### Cloud Server

```bash
# Development
npm run dev

# Production
npm start

# With custom port
PORT=8080 npm start

# Check logs
npm run logs

# Run tests
npm test
```

---

## Troubleshooting

### Local Server Not Connecting

```bash
# 1. Check if server runs manually
console-capture-mcp

# 2. Verify data directory exists
ls ~/.console-capture/data

# 3. Check Claude Desktop config syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq

# 4. Restart Claude Desktop
```

### Cloud Server Issues

```bash
# 1. Check server is running
curl http://localhost:3001/health

# 2. Verify database connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Check Redis connection
redis-cli ping

# 4. Review logs
docker-compose logs mcp-cloud
```

### Authentication Errors

```bash
# Generate test JWT token (for development)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'test-user', email: 'test@example.com', name: 'Test', role: 'pro' },
  'your-secret-key',
  { issuer: 'console-capture-mcp', expiresIn: '24h' }
);
console.log(token);
"
```

---

## Next Steps

- 📚 Read the [MCP Overview](./MCP_OVERVIEW.md)
- 🔧 Explore [Advanced Configuration](./ADVANCED_CONFIG.md) (coming soon)
- 🤝 Join our [Discord Community](https://discord.gg/console-capture)
- 🐛 Report issues on [GitHub](https://github.com/yourorg/console-capture/issues)

---

## Quick Reference

### Resource URIs

```
console-capture://logs/{recordingId}
console-capture://sessions/{sessionId}
console-capture://recordings/{recordingId}
console-capture://filters/{userId}         # Cloud only
console-capture://teams/{organizationId}   # Cloud only
```

### Available Tools

**Local & Cloud:**
- `search_logs` - Search console logs
- `filter_logs` - Filter specific recording
- `export_logs` - Export in various formats

**Cloud Only:**
- `analyze_errors` - Error pattern analysis
- `compare_sessions` - Session comparison
- `get_analytics` - Retrieve analytics

### Environment Variables

**Local Server:**
- `CONSOLE_CAPTURE_DATA_DIR` - Data directory path
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

**Cloud Server:**
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `LOG_LEVEL` - Logging level

---

**Happy debugging! 🚀**
