import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GoogleSearchError, searchImages } from './utils.js';

export const schema = {
  count: z.number().min(1).max(10).optional().describe('Number of results to return (1-10, default: 4)'),
  query: z.string().describe('Search query for images'),
  safe: z.enum(['off', 'medium', 'high']).optional().describe('Safe search setting (default: off)'),
  startIndex: z.number().min(1).optional().describe('Starting index for pagination (default: 1)'),
} as const;

export const handler: ToolCallback<typeof schema> = async ({ count, query, safe, startIndex }) => {
  const _meta: Record<string, unknown> = {};

  try {
    const result = await searchImages({ count, query, safe, startIndex });
    _meta.itemsCount = result.items.length;
    _meta.nextPageIdx = result.nextPageIdx;
    _meta.previousPageIdx = result.previousPageIdx;
    _meta.searchTerms = result.searchTerms;
    _meta.totalResults = result.totalResults;

    const formattedResults = {
      summary: {
        query: result.searchTerms,
        totalResults: result.totalResults,
        itemsReturned: result.items.length,
        pagination: {
          previousPageStartIndex: result.previousPageIdx,
          nextPageStartIndex: result.nextPageIdx,
        },
      },
      items: result.items.map((item, index) => ({
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

    return {
      _meta,
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(formattedResults, null, 2),
        },
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
