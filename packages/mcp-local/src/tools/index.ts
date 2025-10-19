/**
 * MCP Tools registration
 *
 * Tools allow the LLM to perform actions and computations.
 * They can have side effects and perform more complex operations.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { searchLogs, exportLogs, readLogs } from '../utils/storage.js';
import { logger } from '../utils/logger.js';

/**
 * Schema for search_logs tool
 */
const SearchLogsSchema = z.object({
  query: z.string().describe('Search query string'),
  type: z
    .enum(['log', 'warn', 'error', 'info', 'debug'])
    .optional()
    .describe('Filter by console log type'),
  recordingId: z
    .string()
    .optional()
    .describe('Filter by specific recording ID'),
});

/**
 * Schema for filter_logs tool
 */
const FilterLogsSchema = z.object({
  recordingId: z.string().describe('Recording ID to filter logs from'),
  type: z
    .enum(['log', 'warn', 'error', 'info', 'debug'])
    .optional()
    .describe('Filter by console log type'),
  dateFrom: z
    .number()
    .optional()
    .describe('Filter logs from this timestamp (Unix ms)'),
  dateTo: z
    .number()
    .optional()
    .describe('Filter logs until this timestamp (Unix ms)'),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe('Maximum number of logs to return'),
});

/**
 * Schema for export_logs tool
 */
const ExportLogsSchema = z.object({
  recordingId: z.string().describe('Recording ID to export logs from'),
  format: z
    .enum(['json', 'txt', 'csv'])
    .describe('Export format'),
});

/**
 * Register all MCP tools with the server
 */
export function registerTools(server: Server): void {
  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling ListTools request');

    return {
      tools: [
        {
          name: 'search_logs',
          description:
            'Search console logs across all recordings with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query string',
              },
              type: {
                type: 'string',
                enum: ['log', 'warn', 'error', 'info', 'debug'],
                description: 'Filter by console log type',
              },
              recordingId: {
                type: 'string',
                description: 'Filter by specific recording ID',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'filter_logs',
          description:
            'Filter console logs from a specific recording with advanced criteria',
          inputSchema: {
            type: 'object',
            properties: {
              recordingId: {
                type: 'string',
                description: 'Recording ID to filter logs from',
              },
              type: {
                type: 'string',
                enum: ['log', 'warn', 'error', 'info', 'debug'],
                description: 'Filter by console log type',
              },
              dateFrom: {
                type: 'number',
                description: 'Filter logs from this timestamp (Unix ms)',
              },
              dateTo: {
                type: 'number',
                description: 'Filter logs until this timestamp (Unix ms)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of logs to return',
                default: 100,
              },
            },
            required: ['recordingId'],
          },
        },
        {
          name: 'export_logs',
          description:
            'Export console logs from a recording in various formats',
          inputSchema: {
            type: 'object',
            properties: {
              recordingId: {
                type: 'string',
                description: 'Recording ID to export logs from',
              },
              format: {
                type: 'string',
                enum: ['json', 'txt', 'csv'],
                description: 'Export format',
              },
            },
            required: ['recordingId', 'format'],
          },
        },
      ],
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    logger.debug(`Handling CallTool request for: ${toolName}`);

    try {
      switch (toolName) {
        case 'search_logs': {
          const params = SearchLogsSchema.parse(args);
          logger.info(`Searching logs with query: "${params.query}"`);

          const results = await searchLogs(params.query, {
            type: params.type,
            recordingId: params.recordingId,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query: params.query,
                    totalResults: results.length,
                    results: results.slice(0, 50), // Limit to first 50 for readability
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
          logger.info(`Filtering logs for recording: ${params.recordingId}`);

          let logs = await readLogs(params.recordingId);

          // Apply filters
          if (params.type) {
            logs = logs.filter((log) => log.type === params.type);
          }

          if (params.dateFrom) {
            logs = logs.filter((log) => log.timestamp >= params.dateFrom!);
          }

          if (params.dateTo) {
            logs = logs.filter((log) => log.timestamp <= params.dateTo!);
          }

          // Apply limit
          const limited = logs.slice(0, params.limit);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    recordingId: params.recordingId,
                    totalLogs: logs.length,
                    returnedLogs: limited.length,
                    filters: {
                      type: params.type,
                      dateFrom: params.dateFrom,
                      dateTo: params.dateTo,
                    },
                    logs: limited,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'export_logs': {
          const params = ExportLogsSchema.parse(args);
          logger.info(
            `Exporting logs for recording ${params.recordingId} as ${params.format}`
          );

          const exported = await exportLogs(params.recordingId, params.format);

          return {
            content: [
              {
                type: 'text',
                text: exported,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      logger.error(`Failed to execute tool ${toolName}:`, error);
      throw error;
    }
  });

  logger.info('Tools registered successfully');
}
