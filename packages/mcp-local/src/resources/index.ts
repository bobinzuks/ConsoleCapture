/**
 * MCP Resources registration
 *
 * Resources provide read-only access to data that can be used as context.
 * They should be lightweight and avoid heavy computation.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  readRecordings,
  readRecording,
  readSessions,
  readSession,
  readLogs,
} from '../utils/storage.js';
import { logger } from '../utils/logger.js';

const RESOURCE_PREFIX = 'console-capture://';

/**
 * Register all MCP resources with the server
 */
export function registerResources(server: Server): void {
  // List all available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug('Handling ListResources request');

    try {
      const recordings = await readRecordings();
      const sessions = await readSessions();

      const resources = [];

      // Add resources for each recording
      for (const recording of recordings) {
        resources.push({
          uri: `${RESOURCE_PREFIX}logs/${recording.id}`,
          name: `Console Logs: ${recording.title}`,
          mimeType: 'application/json',
          description: `Console logs for recording "${recording.title}"`,
        });

        resources.push({
          uri: `${RESOURCE_PREFIX}recordings/${recording.id}`,
          name: `Recording: ${recording.title}`,
          mimeType: 'application/json',
          description: `Recording metadata for "${recording.title}"`,
        });
      }

      // Add resources for each session
      for (const session of sessions) {
        resources.push({
          uri: `${RESOURCE_PREFIX}sessions/${session.id}`,
          name: `Session ${session.id}`,
          mimeType: 'application/json',
          description: `Session metadata and events`,
        });
      }

      logger.info(`Listed ${resources.length} resources`);
      return { resources };
    } catch (error) {
      logger.error('Failed to list resources:', error);
      throw new Error('Failed to list resources');
    }
  });

  // Read a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    logger.debug(`Handling ReadResource request for URI: ${uri}`);

    if (!uri.startsWith(RESOURCE_PREFIX)) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }

    const path = uri.slice(RESOURCE_PREFIX.length);
    const [resourceType, resourceId] = path.split('/');

    try {
      let content: unknown;

      switch (resourceType) {
        case 'logs': {
          if (!resourceId) {
            throw new Error('Recording ID is required for logs resource');
          }
          const logs = await readLogs(resourceId);
          content = logs;
          break;
        }

        case 'recordings': {
          if (!resourceId) {
            throw new Error('Recording ID is required');
          }
          const recording = await readRecording(resourceId);
          if (!recording) {
            throw new Error(`Recording not found: ${resourceId}`);
          }
          content = recording;
          break;
        }

        case 'sessions': {
          if (!resourceId) {
            throw new Error('Session ID is required');
          }
          const session = await readSession(resourceId);
          if (!session) {
            throw new Error(`Session not found: ${resourceId}`);
          }
          content = session;
          break;
        }

        default:
          throw new Error(`Unknown resource type: ${resourceType}`);
      }

      logger.info(`Successfully read resource: ${uri}`);

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(content, null, 2),
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to read resource ${uri}:`, error);
      throw error;
    }
  });

  logger.info('Resources registered successfully');
}
