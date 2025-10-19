# Cursor Integration Guide

This guide shows you how to integrate the ConsoleCapture Local MCP Server with Cursor IDE.

## Prerequisites

- Cursor IDE installed
- Node.js 18+ installed
- ConsoleCapture Local MCP Server built and ready

## Installation

### 1. Build the Local MCP Server

```bash
cd packages/mcp-local
npm install
npm run build
```

### 2. Install Globally (Recommended)

```bash
npm install -g .
```

Or link for development:

```bash
npm link
```

## Configuration

### 1. Open Cursor Settings

1. Open Cursor
2. Go to Settings (Cmd/Ctrl + ,)
3. Search for "MCP" or navigate to Extensions > MCP

### 2. Configure MCP Server

Add the ConsoleCapture MCP server configuration:

**For Global Installation:**

```json
{
  "mcpServers": {
    "console-capture": {
      "command": "console-capture-mcp",
      "args": [],
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "/path/to/your/console-capture/data",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**For Local Development:**

```json
{
  "mcpServers": {
    "console-capture": {
      "command": "node",
      "args": [
        "/absolute/path/to/ConsoleCapture/packages/mcp-local/dist/index.js"
      ],
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "${workspaceFolder}/.console-capture/data",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 3. Set Up Data Directory

Create the data directory in your workspace:

```bash
mkdir -p .console-capture/data
mkdir -p .console-capture/data/logs
```

## Data Setup

### Workspace-Specific Data

For project-specific console captures, store data in your workspace:

```
your-project/
├── .console-capture/
│   └── data/
│       ├── recordings.json
│       ├── sessions.json
│       └── logs/
│           └── *.json
├── src/
└── package.json
```

### Global Data

For global access across all projects:

```bash
# Set in MCP configuration
CONSOLE_CAPTURE_DATA_DIR=$HOME/.console-capture/data
```

## Usage in Cursor

### 1. Activate MCP in Chat

Open Cursor's AI chat panel and ensure the ConsoleCapture MCP server is active (you should see it in the MCP servers list).

### 2. Ask Questions About Your Console Data

**Example Queries:**

```
Show me all error logs from my recordings
```

```
Search for "authentication failed" in console logs
```

```
What recordings do I have available?
```

```
Export logs from recording rec-001 as CSV
```

### 3. Use in Code Context

When debugging, you can reference console capture data:

```
@console-capture Find all errors related to API calls in my latest recording
```

### 4. Inline Tools

Use MCP tools directly in your workflow:

- **During Debugging**: Ask Claude to analyze error patterns
- **Code Review**: Reference console logs while reviewing code
- **Documentation**: Generate docs based on actual console behavior

## Advanced Usage

### Workspace Variables

Use Cursor's workspace variables in your MCP configuration:

```json
{
  "mcpServers": {
    "console-capture": {
      "command": "console-capture-mcp",
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "${workspaceFolder}/.console-capture/data",
        "LOG_LEVEL": "${env:CC_LOG_LEVEL}"
      }
    }
  }
}
```

### Project-Specific Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "console-capture": {
    "enabled": true,
    "dataDir": ".console-capture/data",
    "autoRefresh": true
  }
}
```

### Integration with Git

Add to `.gitignore`:

```
# Console Capture data (sensitive)
.console-capture/data/*.json

# But keep structure
!.console-capture/data/.gitkeep
```

Keep example data in version control:

```
.console-capture/
├── data/
│   └── .gitkeep
└── examples/
    ├── recordings.example.json
    └── sessions.example.json
```

## Troubleshooting

### MCP Server Not Showing Up

1. Restart Cursor completely
2. Check Cursor's extension logs
3. Verify MCP configuration syntax
4. Ensure Node.js is in PATH

### Connection Issues

1. Check server is running:
   ```bash
   console-capture-mcp
   ```

2. Verify data directory exists and is readable

3. Check Cursor's MCP status:
   - Open Command Palette (Cmd/Ctrl + Shift + P)
   - Type "MCP: Show Status"

### Data Not Loading

1. Verify JSON file format
2. Check file permissions
3. Review data directory path
4. Examine server logs in Cursor's output panel

## Best Practices

### 1. Workspace Organization

```
your-project/
├── .console-capture/
│   ├── data/              # Actual console capture data
│   ├── examples/          # Example/test data
│   └── README.md          # Instructions for team
├── .cursor/
│   └── mcp.json          # Cursor-specific MCP config
└── .gitignore            # Exclude sensitive data
```

### 2. Team Collaboration

Create a setup script for team members:

```bash
#!/bin/bash
# scripts/setup-console-capture.sh

echo "Setting up ConsoleCapture for Cursor..."

# Create data directory
mkdir -p .console-capture/data/logs

# Copy example data
cp .console-capture/examples/*.json .console-capture/data/

echo "✓ ConsoleCapture data directory created"
echo "✓ Example data copied"
echo ""
echo "Next steps:"
echo "1. Open Cursor"
echo "2. Verify MCP server is running (check MCP panel)"
echo "3. Try: 'Show me available console recordings'"
```

### 3. Automated Data Sync

Sync console capture data from Chrome extension:

```javascript
// scripts/sync-console-data.js
const fs = require('fs');
const path = require('path');

// Read from Chrome extension storage
// Export to .console-capture/data/

async function syncData() {
  // Implementation to export Chrome extension data
  // to Cursor-accessible format
}

syncData();
```

### 4. CI/CD Integration

Use console captures in CI for regression testing:

```yaml
# .github/workflows/test.yml
- name: Run tests with console capture
  env:
    CONSOLE_CAPTURE_DATA_DIR: ${{ github.workspace }}/.console-capture/data
  run: npm test
```

## Keyboard Shortcuts

Set up custom shortcuts in Cursor:

```json
{
  "keybindings": [
    {
      "key": "cmd+shift+c",
      "command": "mcp.console-capture.searchLogs"
    },
    {
      "key": "cmd+shift+e",
      "command": "mcp.console-capture.filterErrors"
    }
  ]
}
```

## Integration Examples

### 1. Debugging Workflow

```
1. User: "Show me errors from the last recording"
   → Claude uses filter_logs tool

2. User: "Explain this error: [paste error message]"
   → Claude analyzes with context

3. User: "Show similar errors across all recordings"
   → Claude uses search_logs tool

4. User: "Export these errors for the team"
   → Claude uses export_logs tool
```

### 2. Code Review

```
// During code review
User: "Check if this authentication flow has any console errors"
Claude: *searches logs for auth-related errors*
Claude: *provides analysis with code context*
```

### 3. Documentation

```
User: "Generate API error documentation from console logs"
Claude: *analyzes error patterns*
Claude: *generates markdown documentation*
```

## Performance Tips

1. **Limit Data Size**: Keep recordings pruned to recent/relevant ones
2. **Index Frequently**: Maintain good data organization
3. **Lazy Loading**: Only load full logs when needed
4. **Cache Results**: Use Cursor's caching for repeated queries

## Security Considerations

1. **Sensitive Data**: Never commit real console logs with PII
2. **API Keys**: Redact keys/tokens from console output
3. **Access Control**: Use file permissions appropriately
4. **Team Sharing**: Create sanitized example datasets

## Support Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Cursor Documentation](https://cursor.sh/docs)
- [ConsoleCapture API Reference](../API_REFERENCE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## Next Steps

- Explore [Cloud MCP Server](./CLOUD_MCP_GUIDE.md) for production use
- Set up [CI/CD Integration](./CI_CD_INTEGRATION.md)
- Learn about [Advanced Workflows](./ADVANCED_WORKFLOWS.md)
