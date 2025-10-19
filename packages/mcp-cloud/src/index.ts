/**
 * ConsoleCapture Cloud MCP Server
 *
 * Production-ready MCP server with HTTP/SSE transport,
 * authentication, rate limiting, and usage tracking.
 *
 * @packageDocumentation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { usageTrackingMiddleware } from './middleware/usageTracking.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

import { registerResources } from './resources/index.js';
import { registerTools } from './tools/index.js';
import { registerPrompts } from './prompts/index.js';

/**
 * Initialize Express application
 */
function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'console-capture-mcp-cloud',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API info endpoint (no auth required)
  app.get('/api/info', (req, res) => {
    res.json({
      name: 'ConsoleCapture MCP Cloud Server',
      version: '1.0.0',
      protocol: 'model-context-protocol',
      transport: 'http-sse',
      features: {
        resources: true,
        tools: true,
        prompts: true,
        authentication: true,
        rateLimiting: true,
        usageTracking: true,
      },
    });
  });

  return app;
}

/**
 * Initialize MCP server
 */
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'console-capture-cloud',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // Register all MCP handlers
  registerResources(server);
  registerTools(server);
  registerPrompts(server);

  // Error handler
  server.onerror = (error) => {
    logger.error('MCP Server error:', error);
  };

  return server;
}

/**
 * Main server startup
 */
async function main() {
  try {
    const app = createApp();
    const mcpServer = createMCPServer();

    // MCP connection endpoint with auth and rate limiting
    // This endpoint uses SSE transport for bi-directional communication
    app.post(
      '/mcp/connect',
      authMiddleware,
      rateLimitMiddleware,
      usageTrackingMiddleware,
      async (req, res) => {
        try {
          logger.info('New MCP connection request', {
            userId: (req as any).user?.id,
          });

          // Create SSE transport for this connection
          const transport = new SSEServerTransport('/mcp/messages', res);

          // Connect MCP server to this transport
          await mcpServer.connect(transport);

          logger.info('MCP connection established', {
            userId: (req as any).user?.id,
          });
        } catch (error) {
          logger.error('Failed to establish MCP connection:', error);
          res.status(500).json({
            error: 'Failed to establish MCP connection',
          });
        }
      }
    );

    // Message endpoint for client-to-server communication
    app.post(
      '/mcp/messages',
      authMiddleware,
      rateLimitMiddleware,
      usageTrackingMiddleware,
      express.json(),
      async (req, res) => {
        try {
          // Messages are handled by the SSE transport
          res.status(200).json({ received: true });
        } catch (error) {
          logger.error('Failed to handle MCP message:', error);
          res.status(500).json({
            error: 'Failed to process message',
          });
        }
      }
    );

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Create HTTP server
    const httpServer = createServer(app);

    // Start server
    const port = config.port;
    httpServer.listen(port, () => {
      logger.info(`ConsoleCapture MCP Cloud Server started`);
      logger.info(`Port: ${port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Health check: http://localhost:${port}/health`);
      logger.info(`MCP endpoint: http://localhost:${port}/mcp/connect`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main();
