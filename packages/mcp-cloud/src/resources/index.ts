/**
 * MCP Resources for Cloud Server
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseService } from '../services/database.js';
import { logger } from '../utils/logger.js';

const RESOURCE_PREFIX = 'console-capture://';
const db = new DatabaseService();

export function registerResources(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async (request, extra) => {
    logger.debug('Handling ListResources request');

    try {
      // Get user from context (set by auth middleware)
      const user = (extra as any).user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const resources = [];

      // Get user's recordings
      const recordings = await db.getRecordings(user.id);
      for (const recording of recordings) {
        resources.push(
          {
            uri: `${RESOURCE_PREFIX}logs/${recording.id}`,
            name: `Console Logs: ${recording.title}`,
            mimeType: 'application/json',
            description: `Console logs for "${recording.title}"`,
          },
          {
            uri: `${RESOURCE_PREFIX}recordings/${recording.id}`,
            name: `Recording: ${recording.title}`,
            mimeType: 'application/json',
            description: `Recording metadata`,
          }
        );
      }

      // Get user's sessions
      const sessions = await db.getSessions(user.id);
      for (const session of sessions) {
        resources.push({
          uri: `${RESOURCE_PREFIX}sessions/${session.id}`,
          name: `Session ${session.id}`,
          mimeType: 'application/json',
          description: 'Session metadata and events',
        });
      }

      // Add organization resource if user belongs to one
      if (user.organizationId) {
        resources.push({
          uri: `${RESOURCE_PREFIX}teams/${user.organizationId}`,
          name: 'Team Dashboard',
          mimeType: 'application/json',
          description: 'Team recordings and analytics',
        });
      }

      // Add filters resource
      resources.push({
        uri: `${RESOURCE_PREFIX}filters/${user.id}`,
        name: 'Saved Filters',
        mimeType: 'application/json',
        description: 'User saved search filters',
      });

      logger.info(`Listed ${resources.length} resources for user ${user.id}`);
      return { resources };
    } catch (error) {
      logger.error('Failed to list resources:', error);
      throw error;
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
    const uri = request.params.uri;
    logger.debug(`Reading resource: ${uri}`);

    const user = (extra as any).user;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!uri.startsWith(RESOURCE_PREFIX)) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }

    const path = uri.slice(RESOURCE_PREFIX.length);
    const [resourceType, resourceId] = path.split('/');

    try {
      let content: unknown;

      switch (resourceType) {
        case 'logs': {
          const events = await db.getConsoleEvents(resourceId, { limit: 1000 });
          content = events;
          break;
        }

        case 'recordings': {
          const recording = await db.getRecording(resourceId);
          if (!recording) {
            throw new Error('Recording not found');
          }
          // Verify access
          if (
            recording.userId !== user.id &&
            recording.organizationId !== user.organizationId
          ) {
            throw new Error('Access denied');
          }
          content = recording;
          break;
        }

        case 'sessions': {
          const session = await db.getSession(resourceId);
          if (!session) {
            throw new Error('Session not found');
          }
          if (
            session.userId !== user.id &&
            session.organizationId !== user.organizationId
          ) {
            throw new Error('Access denied');
          }
          content = session;
          break;
        }

        case 'teams': {
          if (user.organizationId !== resourceId) {
            throw new Error('Access denied');
          }
          const organization = await db.getOrganization(resourceId);
          const members = await db.getOrganizationMembers(resourceId);
          const recordings = await db.getRecordingsByOrganization(resourceId);

          content = {
            organization,
            members: members.length,
            totalRecordings: recordings.length,
            recentRecordings: recordings.slice(0, 10),
          };
          break;
        }

        case 'filters': {
          // This would normally come from a filters table
          // For now, return empty filters
          content = {
            userId: user.id,
            filters: [],
          };
          break;
        }

        default:
          throw new Error(`Unknown resource type: ${resourceType}`);
      }

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

  logger.info('Cloud resources registered');
}
