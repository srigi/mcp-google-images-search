import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GoogleSearchError, SearchResult, getUtils } from './utils.js';
import { tryCatch } from '~/utils/tryCatch.js';
import { getLogger } from '~/logger';

export const schema = {
  count: z.number().min(1).max(10).optional().describe('Number of results to return (1-10, default: 2)'),
  query: z.string().describe('Search query for images'),
  safe: z.enum(['off', 'medium', 'high']).optional().describe('Safe search setting (default: off)'),
  startIndex: z.number().min(1).optional().describe('Starting index of next search result page (not needed for initial search request)'),
} as const;

const logger = () => getLogger('[🛠️ search_image]');

export function getHandler() {
  const { searchImages } = getUtils();

  const handler: ToolCallback<typeof schema> = async ({ count = 2, query, safe = 'off', startIndex }) => {
    logger().info('handler called', { count, query, safe, startIndex });

    const [err, res] = await tryCatch<GoogleSearchError, SearchResult>(searchImages({ count, query, safe, startIndex }));
    if (err != null) {
      return {
        _meta: {
          error: {
            type: 'GoogleSearchError',
            message: err.message,
            status: err.status,
            statusText: err.statusText,
          },
        },
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err.message}`,
          },
        ],
      };
    }

    const _meta = {
      itemsCount: res.items.length,
      nextPageIdx: res.nextPageIdx,
      previousPageIdx: res.previousPageIdx,
      searchTerms: res.searchTerms,
    };
    const result = {
      summary: {
        query: res.searchTerms,
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
    logger().info('handler success', { _meta, result });

    return {
      _meta,
      content: [
        {
          type: 'text' as const,
          text: `Search successfully returned ${count} images. StartIndex of the next search page is: ${result.summary.pagination.nextPageStartIndex}`,
        },
        ...result.items.map((i) => ({
          type: 'text' as const,
          text: `${i.index}: ${i.link}`,
        })),
      ],
    };
  };

  return handler;
}
