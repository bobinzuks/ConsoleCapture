/**
 * MCP Tools for Cloud Server
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { DatabaseService } from '../services/database.js';
import { logger } from '../utils/logger.js';

const db = new DatabaseService();

// Tool schemas
const SearchLogsSchema = z.object({
  query: z.string(),
  type: z.enum(['log', 'warn', 'error', 'info', 'debug']).optional(),
  limit: z.number().optional().default(50),
});

const FilterLogsSchema = z.object({
  recordingId: z.string(),
  type: z.enum(['log', 'warn', 'error', 'info', 'debug']).optional(),
  limit: z.number().optional().default(100),
});

const AnalyzeErrorsSchema = z.object({
  recordingId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const CompareSessionsSchema = z.object({
  sessionIds: z.array(z.string()).min(2).max(5),
});

export function registerTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'search_logs',
          description: 'Full-text search across console logs',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              type: {
                type: 'string',
                enum: ['log', 'warn', 'error', 'info', 'debug'],
                description: 'Filter by log type',
              },
              limit: {
                type: 'number',
                description: 'Max results',
                default: 50,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'filter_logs',
          description: 'Filter logs from a recording',
          inputSchema: {
            type: 'object',
            properties: {
              recordingId: { type: 'string' },
              type: {
                type: 'string',
                enum: ['log', 'warn', 'error', 'info', 'debug'],
              },
              limit: { type: 'number', default: 100 },
            },
            required: ['recordingId'],
          },
        },
        {
          name: 'analyze_errors',
          description: 'Analyze error patterns and trends',
          inputSchema: {
            type: 'object',
            properties: {
              recordingId: { type: 'string' },
              dateFrom: { type: 'string' },
              dateTo: { type: 'string' },
            },
          },
        },
        {
          name: 'compare_sessions',
          description: 'Compare multiple sessions',
          inputSchema: {
            type: 'object',
            properties: {
              sessionIds: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 5,
              },
            },
            required: ['sessionIds'],
          },
        },
        {
          name: 'export_logs',
          description: 'Export logs in various formats',
          inputSchema: {
            type: 'object',
            properties: {
              recordingId: { type: 'string' },
              format: {
                type: 'string',
                enum: ['json', 'txt', 'csv'],
              },
            },
            required: ['recordingId', 'format'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};
    const user = (extra as any).user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    logger.debug(`Executing tool: ${toolName}`, { userId: user.id });

    try {
      switch (toolName) {
        case 'search_logs': {
          const params = SearchLogsSchema.parse(args);
          const results = await db.searchConsoleEvents(params.query, {
            userId: user.id,
            organizationId: user.organizationId,
            type: params.type,
            limit: params.limit,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query: params.query,
                    totalResults: results.length,
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'filter_logs': {
          const params = FilterLogsSchema.parse(args);
          const logs = await db.getConsoleEvents(params.recordingId, {
            type: params.type,
            limit: params.limit,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ logs }, null, 2),
              },
            ],
          };
        }

        case 'analyze_errors': {
          const params = AnalyzeErrorsSchema.parse(args);
          const errors = await db.searchConsoleEvents('', {
            userId: user.id,
            type: 'error',
            limit: 1000,
          });

          // Simple error analysis
          const errorsByMessage: Record<string, number> = {};
          for (const error of errors) {
            const msg = error.message.substring(0, 100); // First 100 chars
            errorsByMessage[msg] = (errorsByMessage[msg] || 0) + 1;
          }

          const topErrors = Object.entries(errorsByMessage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([message, count]) => ({ message, count }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    totalErrors: errors.length,
                    uniqueErrors: Object.keys(errorsByMessage).length,
                    topErrors,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'compare_sessions': {
          const params = CompareSessionsSchema.parse(args);
          const sessions = await Promise.all(
            params.sessionIds.map((id) => db.getSession(id))
          );

          // Filter out nulls and verify access
          const validSessions = sessions.filter((s) => {
            if (!s) return false;
            return (
              s.userId === user.id || s.organizationId === user.organizationId
            );
          });

          const comparison = validSessions.map((session) => ({
            id: session!.id,
            startTime: session!.startTime,
            endTime: session!.endTime,
            totalDuration: session!.metadata.totalDuration,
            totalEvents: session!.metadata.totalEvents,
            recordingsCount: session!.metadata.recordingIds.length,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ sessions: comparison }, null, 2),
              },
            ],
          };
        }

        case 'export_logs': {
          const params = z
            .object({
              recordingId: z.string(),
              format: z.enum(['json', 'txt', 'csv']),
            })
            .parse(args);

          const logs = await db.getConsoleEvents(params.recordingId);

          let exported: string;
          switch (params.format) {
            case 'json':
              exported = JSON.stringify(logs, null, 2);
              break;
            case 'txt':
              exported = logs
                .map(
                  (log) =>
                    `[${new Date(log.timestamp).toISOString()}] [${log.type.toUpperCase()}] ${log.message}`
                )
                .join('\n');
              break;
            case 'csv':
              exported =
                'timestamp,type,message\n' +
                logs
                  .map(
                    (log) =>
                      `"${new Date(log.timestamp).toISOString()}","${log.type}","${log.message.replace(/"/g, '""')}"`
                  )
                  .join('\n');
              break;
          }

          return {
            content: [{ type: 'text', text: exported }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, error);
      throw error;
    }
  });

  logger.info('Cloud tools registered');
}
