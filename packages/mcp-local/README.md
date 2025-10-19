# ConsoleCapture MCP Local Server

Local MCP server for ConsoleCapture using stdio transport. Designed for integration with Claude Desktop and Cursor.

## Features

- **stdio transport** for local communication
- **Resources**: Access to logs, sessions, and recordings
- **Tools**: Search, filter, and export console logs
- **Type-safe** implementation with TypeScript
- **Zero configuration** for quick setup

## Installation

```bash
npm install -g @console-capture/mcp-local
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "console-capture": {
      "command": "console-capture-mcp",
      "args": []
    }
  }
}
```

### With Cursor

Add to your Cursor MCP configuration.

## Resources

- `console-capture://logs/{recordingId}` - Access console logs
- `console-capture://sessions/{sessionId}` - Session metadata
- `console-capture://recordings/{recordingId}` - Recording details

## Tools

- `search_logs` - Search console logs with query
- `filter_logs` - Filter logs by type, date range
- `export_logs` - Export logs to various formats

## Development

```bash
npm run dev      # Watch mode
npm run build    # Build for production
npm test         # Run tests
```

## License

MIT
