# ConsoleCapture MCP Integration Overview

This document provides a comprehensive overview of the Model Context Protocol (MCP) integration for ConsoleCapture.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables applications to provide context for Large Language Models (LLMs) in a standardized way. It allows LLMs like Claude to access data and perform actions through:

- **Resources**: Read-only data that provides context
- **Tools**: Actions the LLM can perform
- **Prompts**: Reusable prompt templates

## Architecture

ConsoleCapture provides two MCP server implementations:

### 1. Local MCP Server (`packages/mcp-local`)

**Purpose**: For individual developers using Claude Desktop or Cursor

**Transport**: stdio (standard input/output)

**Use Cases**:
- Local development
- Personal debugging workflows
- Offline access to console logs
- Integration with desktop AI tools

**Features**:
- File-based data storage
- No authentication required
- Lightweight and fast
- Easy setup

### 2. Cloud MCP Server (`packages/mcp-cloud`)

**Purpose**: Production-ready server for teams and organizations

**Transport**: HTTP with Server-Sent Events (SSE)

**Use Cases**:
- Team collaboration
- Production debugging
- Enterprise deployments
- Remote access to console data

**Features**:
- Database-backed storage (PostgreSQL + TimescaleDB)
- JWT authentication
- Rate limiting per tier
- Usage tracking and analytics
- Multi-user support
- Organization/team features

## Comparison Matrix

| Feature | Local Server | Cloud Server |
|---------|-------------|--------------|
| **Transport** | stdio | HTTP/SSE |
| **Storage** | File system | PostgreSQL + TimescaleDB |
| **Authentication** | None | JWT required |
| **Rate Limiting** | None | Tier-based |
| **Multi-user** | No | Yes |
| **Teams/Orgs** | No | Yes |
| **Analytics** | No | Yes |
| **Search** | Basic | Advanced (Elasticsearch) |
| **Deployment** | Desktop only | Cloud + Self-hosted |
| **Best for** | Individual developers | Teams & Production |

## Resources

Both servers expose the following resources:

### Common Resources

| Resource URI | Description |
|-------------|-------------|
| `console-capture://logs/{id}` | Console log events for a recording |
| `console-capture://sessions/{id}` | Session metadata and events |
| `console-capture://recordings/{id}` | Recording metadata and details |

### Cloud-Only Resources

| Resource URI | Description |
|-------------|-------------|
| `console-capture://filters/{userId}` | User's saved search filters |
| `console-capture://teams/{orgId}` | Team dashboard and analytics |

## Tools

### Local Server Tools

1. **search_logs**
   - Search across all console logs
   - Filter by log type (log, warn, error, info, debug)
   - Optionally filter by recording ID

2. **filter_logs**
   - Advanced filtering for a specific recording
   - Filter by type, date range
   - Limit results

3. **export_logs**
   - Export logs in JSON, TXT, or CSV format
   - Suitable for sharing and reporting

### Cloud Server Tools

All local tools, plus:

4. **analyze_errors**
   - Analyze error patterns and trends
   - Identify most common errors
   - Find error correlations

5. **compare_sessions**
   - Compare multiple sessions side-by-side
   - Identify differences in behavior
   - Track changes over time

6. **get_analytics**
   - Retrieve usage analytics
   - View metrics and trends
   - Export reports

## Prompts (Cloud Only)

Pre-built prompt templates for common workflows:

### 1. debug_workflow
```
I need help debugging console errors from recording {recordingId}.
```

Guides through:
- Identifying error messages
- Analyzing patterns
- Suggesting root causes
- Recommending debugging steps

### 2. error_investigation
```
I'm investigating this error: "{errorMessage}"
```

Helps with:
- Finding all occurrences
- Analyzing context
- Checking related issues
- Suggesting fixes

### 3. performance_analysis
```
Please analyze the performance of session {sessionId}.
```

Analyzes:
- Session duration and events
- Message types and frequency
- Error/warning patterns
- Optimization opportunities

## Security

### Local Server

- **No authentication**: Runs locally with user's file permissions
- **Data privacy**: All data stays on local machine
- **Access control**: OS-level file permissions

### Cloud Server

- **JWT authentication**: Required for all endpoints
- **Role-based access control**: Free, Pro, Team, Enterprise, Admin
- **Rate limiting**: Prevents abuse, varies by tier
- **Audit logging**: All actions logged to database
- **Encryption**: TLS in transit, AES-256 at rest

## Deployment Options

### Local Server

1. **Global Installation**
   ```bash
   npm install -g @console-capture/mcp-local
   console-capture-mcp
   ```

2. **Direct Execution**
   ```bash
   node packages/mcp-local/dist/index.js
   ```

3. **Development**
   ```bash
   npm link
   console-capture-mcp
   ```

### Cloud Server

1. **Docker**
   ```bash
   docker run -p 3001:3001 console-capture/mcp-cloud
   ```

2. **Kubernetes**
   ```bash
   kubectl apply -f infrastructure/k8s/mcp-cloud/
   ```

3. **Manual**
   ```bash
   npm start
   ```

## Integration Guides

- [Claude Desktop Integration](./CLAUDE_DESKTOP_GUIDE.md)
- [Cursor Integration](./CURSOR_GUIDE.md)
- [Cloud MCP Deployment](./CLOUD_MCP_DEPLOYMENT.md) (coming soon)
- [API Authentication](./API_AUTHENTICATION.md) (coming soon)

## Performance Considerations

### Local Server

- **Memory**: ~50MB base, scales with data size
- **Startup**: < 1 second
- **Response time**: < 100ms for most operations
- **Max data**: Recommended < 10,000 recordings

### Cloud Server

- **Memory**: ~200MB base + worker threads
- **Startup**: 2-5 seconds
- **Response time**: < 200ms (p95)
- **Max data**: Unlimited (with proper indexing)
- **Scalability**: Horizontal scaling with load balancer

## Development Workflow

### Adding a New Tool

1. Define schema in `tools/index.ts`
2. Implement handler function
3. Add to tools list
4. Write tests
5. Update documentation

Example:

```typescript
// Define schema
const MyToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});

// Register tool
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'my_tool',
      description: 'Does something useful',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string' },
          param2: { type: 'number' },
        },
        required: ['param1'],
      },
    },
  ],
}));

// Handle execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const params = MyToolSchema.parse(request.params.arguments);
  // Implementation
  return { content: [{ type: 'text', text: result }] };
});
```

### Adding a New Resource

1. Define resource URI pattern
2. Add to ListResources handler
3. Implement ReadResource handler
4. Add access control checks
5. Update documentation

## Testing

### Local Server

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Manual testing with MCP Inspector
npx @modelcontextprotocol/inspector packages/mcp-local/dist/index.js
```

### Cloud Server

```bash
# Unit tests
npm test

# Integration tests (requires DB)
docker-compose up -d postgres redis
npm run test:integration

# E2E tests
npm run test:e2e
```

## Monitoring

### Local Server

- Logs to stderr (doesn't interfere with stdio)
- Set `LOG_LEVEL` environment variable
- Check Claude Desktop/Cursor logs

### Cloud Server

- Structured JSON logging
- Datadog APM integration
- Sentry error tracking
- Custom metrics via Prometheus

## Common Issues and Solutions

### Issue: MCP server not connecting

**Solution**:
1. Check server is running
2. Verify configuration syntax
3. Review server logs
4. Test server manually

### Issue: Authentication failing (Cloud)

**Solution**:
1. Verify JWT token is valid
2. Check token hasn't expired
3. Ensure correct issuer/secret
4. Review auth middleware logs

### Issue: Rate limit exceeded

**Solution**:
1. Check user tier limits
2. Implement request throttling
3. Consider upgrading tier
4. Review usage patterns

### Issue: Slow response times

**Solution**:
1. Check database query performance
2. Review data volume
3. Add proper indexes
4. Implement caching
5. Consider pagination

## Best Practices

1. **Data Management**
   - Keep recordings pruned
   - Archive old data
   - Implement lifecycle policies

2. **Security**
   - Never commit sensitive data
   - Use environment variables
   - Rotate JWT secrets regularly
   - Implement proper RBAC

3. **Performance**
   - Index frequently queried fields
   - Use pagination for large datasets
   - Implement caching strategically
   - Monitor query performance

4. **Development**
   - Write tests for all tools
   - Document schema changes
   - Follow TypeScript strict mode
   - Use linting and formatting

## Roadmap

### Short Term
- [ ] Elasticsearch integration for advanced search
- [ ] Real-time log streaming via WebSocket
- [ ] Saved filters and searches
- [ ] Export templates

### Medium Term
- [ ] AI-powered error analysis
- [ ] Automated root cause detection
- [ ] Integration with incident management
- [ ] Custom prompt templates

### Long Term
- [ ] Machine learning for pattern detection
- [ ] Predictive error analysis
- [ ] Advanced visualization tools
- [ ] Third-party integrations (Jira, Slack, etc.)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Support

- [Documentation](../README.md)
- [GitHub Issues](https://github.com/yourorg/console-capture/issues)
- [Discord Community](https://discord.gg/console-capture)
- [Email Support](mailto:support@console-capture.com)

## License

MIT - See [LICENSE](../../LICENSE) for details.
