/**
 * Search service for ConsoleCapture backend
 * Handles full-text search using Elasticsearch or MeiliSearch
 */

import { Client } from '@elastic/elasticsearch';
import { logger } from '@console-capture/shared';

let searchClient: Client | null = null;
let searchEngine: 'elasticsearch' | 'meilisearch' | 'none' = 'none';

/**
 * Initialize search engine
 */
export async function initializeSearchEngine(): Promise<void> {
  const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
  const meilisearchUrl = process.env.MEILISEARCH_URL;

  try {
    if (elasticsearchUrl) {
      searchEngine = 'elasticsearch';
      searchClient = new Client({
        node: elasticsearchUrl,
        auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
          ? {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD,
            }
          : undefined,
      });

      // Test connection
      await searchClient.ping();
      logger.info('Elasticsearch initialized successfully');
    } else if (meilisearchUrl) {
      searchEngine = 'meilisearch';
      logger.warn('MeiliSearch initialization not fully implemented');
    } else {
      searchEngine = 'none';
      logger.warn('No search engine configured, search features will be limited');
    }
  } catch (error) {
    logger.error('Failed to initialize search engine', error as Error);
    searchEngine = 'none';
  }
}

/**
 * Get search client instance
 */
export function getSearchClient(): Client {
  if (!searchClient) {
    throw new Error('Search client not initialized');
  }
  return searchClient;
}

/**
 * Search service for managing indexed data
 */
export class SearchService {
  private client: Client | null;
  private indexName: string = 'console-recordings';

  constructor() {
    this.client = searchClient;
  }

  /**
   * Index a recording
   */
  async indexRecording(recording: {
    id: string;
    title: string;
    description?: string;
    tags: string[];
    userId: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.client) {
      logger.warn('Search not available, skipping indexing');
      return;
    }

    try {
      await this.client.index({
        index: this.indexName,
        id: recording.id,
        document: {
          ...recording,
          createdAt: recording.createdAt.toISOString(),
        },
      });

      logger.info('Recording indexed successfully', { id: recording.id });
    } catch (error) {
      logger.error('Recording indexing error', error as Error, { id: recording.id });
    }
  }

  /**
   * Search recordings
   */
  async searchRecordings(query: {
    text?: string;
    userId?: string;
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    recordings: Array<{ id: string; score: number; data: unknown }>;
    total: number;
  }> {
    if (!this.client) {
      return { recordings: [], total: 0 };
    }

    try {
      const must: unknown[] = [];

      // Text search
      if (query.text) {
        must.push({
          multi_match: {
            query: query.text,
            fields: ['title^2', 'description', 'tags'],
          },
        });
      }

      // User filter
      if (query.userId) {
        must.push({
          term: { userId: query.userId },
        });
      }

      // Tags filter
      if (query.tags && query.tags.length > 0) {
        must.push({
          terms: { tags: query.tags },
        });
      }

      // Date range filter
      if (query.fromDate || query.toDate) {
        must.push({
          range: {
            createdAt: {
              gte: query.fromDate?.toISOString(),
              lte: query.toDate?.toISOString(),
            },
          },
        });
      }

      const result = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: { must },
          },
          from: query.offset || 0,
          size: query.limit || 20,
          sort: [{ createdAt: { order: 'desc' } }],
        },
      });

      const recordings = (result.hits.hits || []).map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        data: hit._source,
      }));

      const total = typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

      return { recordings, total };
    } catch (error) {
      logger.error('Search error', error as Error, { query });
      return { recordings: [], total: 0 };
    }
  }

  /**
   * Delete recording from index
   */
  async deleteRecording(id: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.delete({
        index: this.indexName,
        id,
      });

      logger.info('Recording removed from index', { id });
    } catch (error) {
      logger.error('Recording deletion from index error', error as Error, { id });
    }
  }

  /**
   * Create index with mappings
   */
  async createIndex(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const exists = await this.client.indices.exists({ index: this.indexName });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: { type: 'text' },
                description: { type: 'text' },
                tags: { type: 'keyword' },
                userId: { type: 'keyword' },
                createdAt: { type: 'date' },
                metadata: { type: 'object', enabled: false },
              },
            },
          },
        });

        logger.info('Search index created successfully', { index: this.indexName });
      }
    } catch (error) {
      logger.error('Index creation error', error as Error);
    }
  }
}

/**
 * Singleton search service instance
 */
export const searchService = new SearchService();
