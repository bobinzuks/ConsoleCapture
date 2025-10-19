# Claude Desktop Integration Guide

This guide shows you how to integrate the ConsoleCapture Local MCP Server with Claude Desktop.

## Prerequisites

- Claude Desktop installed
- Node.js 18+ installed
- ConsoleCapture Local MCP Server built and ready

## Installation

### 1. Build the Local MCP Server

```bash
cd packages/mcp-local
npm install
npm run build
```

### 2. Install Globally (Optional but Recommended)

```bash
npm install -g .
```

Or link for development:

```bash
npm link
```

## Configuration

### 1. Locate Claude Desktop Configuration

The configuration file is located at:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. Add ConsoleCapture MCP Server

Open the configuration file and add the ConsoleCapture server to the `mcpServers` section:

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

### If Not Installed Globally

If you didn't install globally, use the direct path:

```json
{
  "mcpServers": {
    "console-capture": {
      "command": "node",
      "args": [
        "/absolute/path/to/ConsoleCapture/packages/mcp-local/dist/index.js"
      ],
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "/path/to/your/console-capture/data",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 3. Set Up Data Directory

Create the data directory and add your console capture data:

```bash
mkdir -p ~/.console-capture/data
mkdir -p ~/.console-capture/data/logs
```

The expected structure is:

```
~/.console-capture/data/
├── recordings.json      # List of all recordings
├── sessions.json        # List of all sessions
└── logs/
    ├── recording-1.json # Console events for recording 1
    ├── recording-2.json # Console events for recording 2
    └── ...
```

### Example Data Files

**recordings.json:**
```json
[
  {
    "id": "rec-001",
    "userId": "user-123",
    "title": "Production Bug Investigation",
    "description": "Investigating login issues",
    "quality": "1080p",
    "privacy": "private",
    "tags": ["bug", "production", "login"],
    "duration": 3600,
    "fileSize": 1024000,
    "storageUrl": "s3://bucket/rec-001",
    "viewCount": 5,
    "metadata": {},
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

**sessions.json:**
```json
[
  {
    "id": "session-001",
    "userId": "user-123",
    "status": "completed",
    "startTime": "2025-01-15T10:00:00Z",
    "endTime": "2025-01-15T11:00:00Z",
    "metadata": {
      "url": "https://app.example.com",
      "pageTitle": "Dashboard",
      "recordingIds": ["rec-001"],
      "totalDuration": 3600,
      "totalEvents": 150
    },
    "events": []
  }
]
```

**logs/recording-1.json:**
```json
[
  {
    "timestamp": 1705315200000,
    "type": "log",
    "message": "User logged in successfully",
    "args": [],
    "source": "auth.js",
    "lineNumber": 42
  },
  {
    "timestamp": 1705315210000,
    "type": "error",
    "message": "Failed to fetch user profile",
    "args": [],
    "stackTrace": "Error: Network request failed...",
    "source": "profile.js",
    "lineNumber": 89
  }
]
```

## Restart Claude Desktop

After modifying the configuration, restart Claude Desktop for the changes to take effect.

## Usage

Once configured, you can interact with ConsoleCapture data through Claude:

### Example Queries

1. **List Available Resources**
   ```
   What console capture resources do I have access to?
   ```

2. **Search Logs**
   ```
   Search for "error" in my console logs
   ```

3. **Filter Specific Logs**
   ```
   Show me all error logs from recording rec-001
   ```

4. **Export Logs**
   ```
   Export the console logs from recording rec-001 as CSV
   ```

5. **Analyze Sessions**
   ```
   Show me details about session session-001
   ```

### Available Tools

- **search_logs**: Search console logs with optional type filtering
- **filter_logs**: Filter logs from a specific recording
- **export_logs**: Export logs in JSON, TXT, or CSV format

### Available Resources

- **console-capture://logs/{recordingId}**: Access console logs
- **console-capture://recordings/{recordingId}**: Recording metadata
- **console-capture://sessions/{sessionId}**: Session information

## Troubleshooting

### Server Not Starting

1. Check Claude Desktop logs:
   - **macOS**: `~/Library/Logs/Claude/`
   - **Windows**: `%APPDATA%\Claude\logs\`
   - **Linux**: `~/.config/Claude/logs/`

2. Verify the server can run manually:
   ```bash
   console-capture-mcp
   # or
   node /path/to/mcp-local/dist/index.js
   ```

3. Check environment variables are set correctly

### No Data Available

1. Verify data directory path is correct
2. Ensure data files exist and have correct format
3. Check file permissions
4. Review server logs in stderr output

### Permission Issues

Ensure Claude Desktop has permission to:
- Execute the Node.js binary
- Read the data directory
- Access the console-capture-mcp command

## Advanced Configuration

### Custom Log Level

Set the log level for debugging:

```json
{
  "mcpServers": {
    "console-capture": {
      "command": "console-capture-mcp",
      "args": [],
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### Multiple Servers

You can run multiple MCP servers simultaneously:

```json
{
  "mcpServers": {
    "console-capture-local": {
      "command": "console-capture-mcp",
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "~/.console-capture/local"
      }
    },
    "console-capture-production": {
      "command": "console-capture-mcp",
      "env": {
        "CONSOLE_CAPTURE_DATA_DIR": "~/.console-capture/production"
      }
    }
  }
}
```

## Best Practices

1. **Keep Data Organized**: Maintain a clean directory structure
2. **Regular Backups**: Back up your console capture data
3. **Data Privacy**: Don't store sensitive data in recordings
4. **Version Control**: Keep recordings.json and sessions.json in version control (without sensitive data)
5. **Monitor Logs**: Check server logs regularly for issues

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review server logs
- Open an issue on GitHub
- Contact support

## Next Steps

- Learn about [Cursor Integration](./CURSOR_GUIDE.md)
- Explore [Cloud MCP Server](./CLOUD_MCP_GUIDE.md) for production use
- Read [API Reference](../API_REFERENCE.md)
