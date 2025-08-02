import { z } from 'zod';

import { env } from '~/utils/env';
import { getLogger } from '~/utils/logger';
import { tryCatch } from '~/utils/tryCatch.js';

export interface SearchOptions {
  query: string;
  count: number;
  startIndex?: number;
  safe?: 'off' | 'medium' | 'high';
}

export interface SearchResult {
  items: SearchItem[];
  previousPageIdx?: number;
  nextPageIdx?: number;
  searchTerms: string;
}

interface SearchItem {
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  mime: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

export class GoogleSearchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
  ) {
    super(message);
    this.name = 'GoogleSearchError';
  }
}

const logger = () => getLogger('[🛠️ search_image/utils]');
const googleSearchResponseSchema = z.object({
  queries: z.object({
    previousPage: z
      .array(
        z.object({
          searchTerms: z.string(),
          count: z.number(),
          startIndex: z.number().optional(),
          safe: z.string(),
        }),
      )
      .optional(),
    request: z.array(
      z.object({
        searchTerms: z.string(),
        count: z.number(),
        startIndex: z.number(),
        safe: z.string(),
      }),
    ),
    nextPage: z
      .array(
        z.object({
          searchTerms: z.string(),
          count: z.number(),
          startIndex: z.number(),
          safe: z.string(),
        }),
      )
      .optional(),
  }),
  items: z.array(
    z.object({
      title: z.string(),
      htmlTitle: z.string(),
      link: z.string().url(),
      displayLink: z.string(),
      mime: z.string(),
      image: z.object({
        contextLink: z.string().url(),
        height: z.number(),
        width: z.number(),
        byteSize: z.number(),
        thumbnailLink: z.string().url(),
        thumbnailHeight: z.number(),
        thumbnailWidth: z.number(),
      }),
    }),
  ),
});

/**
 * Builds the Google Custom Search API URL with the provided search options
 */
export function buildSearchUrl({ count, query, safe, startIndex }: SearchOptions): string {
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('cx', env.SEARCH_ENGINE_ID);
  url.searchParams.append('key', env.API_KEY);
  url.searchParams.append('num', count.toString());
  url.searchParams.append('q', query);
  url.searchParams.append('searchType', 'image');

  if (safe != null) {
    url.searchParams.append('safe', safe);
  }
  if (startIndex != null) {
    url.searchParams.append('start', startIndex.toString());
  }

  return url.toString();
}

/**
 * Performs a Google Images search API request
 */
export async function searchImages({ count = 2, query, safe = 'off', startIndex }: SearchOptions): Promise<SearchResult> {
  const url = buildSearchUrl({ query, count, safe, startIndex });
  logger().info('searchImages() called', { count, query, safe, startIndex, url });

  const response = await fetch(url);
  if (!response.ok) {
    throw new GoogleSearchError(`Google Search API request failed: ${response.statusText}`, response.status, response.statusText);
  }

  const data = await response.json();
  logger().info('searchImages() response data', { data });

  const [validationErr, validatedData] = tryCatch(() => googleSearchResponseSchema.parse(data));
  if (validationErr != null) {
    throw new GoogleSearchError(`Invalid response format from Google Search API: ${validationErr.message}`);
  }

  // extract pagination information
  const requestQuery = validatedData.queries.request[0];
  const previousPageIdx = validatedData.queries.previousPage?.[0]?.startIndex;
  const nextPageIdx = validatedData.queries.nextPage?.[0]?.startIndex;

  return {
    items: validatedData.items || [],
    previousPageIdx,
    nextPageIdx,
    searchTerms: requestQuery.searchTerms,
  };
}
