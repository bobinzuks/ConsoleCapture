/**
 * MCP Prompts for Cloud Server
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

export function registerPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'debug_workflow',
          description: 'Interactive debugging workflow for console errors',
          arguments: [
            {
              name: 'recordingId',
              description: 'Recording ID to debug',
              required: true,
            },
          ],
        },
        {
          name: 'error_investigation',
          description: 'Guided error investigation process',
          arguments: [
            {
              name: 'errorMessage',
              description: 'Error message to investigate',
              required: true,
            },
          ],
        },
        {
          name: 'performance_analysis',
          description: 'Performance analysis template',
          arguments: [
            {
              name: 'sessionId',
              description: 'Session ID to analyze',
              required: true,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    const args = request.params.arguments || {};

    logger.debug(`Getting prompt: ${promptName}`);

    switch (promptName) {
      case 'debug_workflow':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need help debugging console errors from recording ${args.recordingId}.

Please help me:
1. Identify all error messages
2. Analyze error patterns and frequency
3. Suggest potential root causes
4. Recommend debugging steps

Use the following tools:
- filter_logs to get error logs
- analyze_errors to find patterns
- search_logs to investigate related issues`,
              },
            },
          ],
        };

      case 'error_investigation':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I'm investigating this error: "${args.errorMessage}"

Please help me:
1. Search for all occurrences of this error
2. Analyze when and where it occurs
3. Check for related errors or warnings
4. Suggest potential fixes based on the error context

Use search_logs and filter_logs tools to gather information.`,
              },
            },
          ],
        };

      case 'performance_analysis':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please analyze the performance of session ${args.sessionId}.

Help me understand:
1. Total session duration and event count
2. Types and frequency of console messages
3. Any error or warning patterns
4. Recommendations for optimization

Use the following resources:
- console-capture://sessions/${args.sessionId}
- console-capture://logs for the session's recordings`,
              },
            },
          ],
        };

      default:
        throw new Error(`Unknown prompt: ${promptName}`);
    }
  });

  logger.info('Cloud prompts registered');
}
