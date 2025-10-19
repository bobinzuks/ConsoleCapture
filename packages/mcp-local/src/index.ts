#!/usr/bin/env node

/**
 * ConsoleCapture Local MCP Server
 *
 * Provides local access to ConsoleCapture data via Model Context Protocol
 * using stdio transport for integration with Claude Desktop and Cursor.
 *
 * @packageDocumentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';
import { logger } from './utils/logger.js';

/**
 * Main server initialization and startup
 */
async function main() {
  try {
    // Create MCP server instance
    const server = new Server(
      {
        name: 'console-capture-local',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Register all resources (logs, sessions, recordings)
    registerResources(server);

    // Register all tools (search, filter, export)
    registerTools(server);

    // Set up error handler
    server.onerror = (error) => {
      logger.error('MCP Server error:', error);
    };

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    logger.info('ConsoleCapture Local MCP Server started successfully');
    logger.info('Server name: console-capture-local');
    logger.info('Version: 1.0.0');
    logger.info('Transport: stdio');
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
main();
