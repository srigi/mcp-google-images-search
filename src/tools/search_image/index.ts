import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'winston';
import { z } from 'zod';

import { GoogleSearchError, searchImages } from './utils.js';

export const schema = {
  count: z.number().min(1).max(10).optional().describe('Number of results to return (1-10, default: 2)'),
  query: z.string().describe('Search query for images'),
  safe: z.enum(['off', 'medium', 'high']).optional().describe('Safe search setting (default: off)'),
  startIndex: z.number().min(1).optional().describe('Starting index for pagination (default: 1)'),
} as const;

export function getHandler(logger: Logger) {
  const handler: ToolCallback<typeof schema> = async ({ count = 2, query, safe = 'off', startIndex = 1 }) => {
    logger.info('search_image() tool called', { count, query, safe, startIndex });
    const _meta: Record<string, unknown> = {};

    try {
      const res = await searchImages({ count, query, safe, startIndex });
      _meta.itemsCount = res.items.length;
      _meta.nextPageIdx = res.nextPageIdx;
      _meta.previousPageIdx = res.previousPageIdx;
      _meta.searchTerms = res.searchTerms;
      _meta.totalResults = res.totalResults;

      const result = {
        summary: {
          query: res.searchTerms,
          totalResults: res.totalResults,
          itemsReturned: res.items.length,
          pagination: {
            previousPageStartIndex: res.previousPageIdx,
            nextPageStartIndex: res.nextPageIdx,
          },
        },
        items: res.items.map((item, index) => ({
          index: index + (startIndex || 1),
          title: item.title,
          link: item.link,
          displayLink: item.displayLink,
          mimeType: item.mime,
          image: {
            contextLink: item.image.contextLink,
            dimensions: `${item.image.width}x${item.image.height}`,
            size: `${Math.round(item.image.byteSize / 1024)}KB`,
            thumbnail: {
              link: item.image.thumbnailLink,
              dimensions: `${item.image.thumbnailWidth}x${item.image.thumbnailHeight}`,
            },
          },
        })),
      };
      logger.info('search_image() result', { result, _meta });

      return {
        _meta,
        content: [
          {
            type: 'text' as const,
            text: `Search successfully returned ${count} images. Index of the last image is: ${result.summary.pagination.nextPageStartIndex! - 1}`,
          },
          ...result.items.map((i) => ({
            type: 'text' as const,
            text: i.link,
          })),
        ],
      };
    } catch (err) {
      _meta.error =
        err instanceof GoogleSearchError
          ? {
              type: 'GoogleSearchError',
              message: err.message,
              status: err.status,
              statusText: err.statusText,
            }
          : {
              type: 'UnknownError',
              message: err instanceof Error ? err.message : 'Unknown error occurred',
            };

      return {
        _meta,
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  };

  return handler;
}
