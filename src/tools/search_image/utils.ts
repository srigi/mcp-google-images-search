import { z } from 'zod';

import { env } from '~/env.js';

export interface SearchOptions {
  query: string;
  count?: number;
  startIndex?: number;
  safe?: 'off' | 'medium' | 'high';
}

export interface SearchResult {
  items: SearchItem[];
  previousPageIdx?: number;
  nextPageIdx?: number;
  totalResults: number;
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

const GoogleSearchResponseSchema = z.object({
  kind: z.string(),
  queries: z.object({
    previousPage: z
      .array(
        z.object({
          totalResults: z.string(),
          searchTerms: z.string(),
          count: z.number(),
          startIndex: z.number(),
          safe: z.string(),
        }),
      )
      .optional(),
    request: z.array(
      z.object({
        totalResults: z.string(),
        searchTerms: z.string(),
        count: z.number(),
        startIndex: z.number(),
        safe: z.string(),
      }),
    ),
    nextPage: z
      .array(
        z.object({
          totalResults: z.string(),
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

/**
 * Builds the Google Custom Search API URL with the provided search options
 */
export function buildSearchUrl({ query, count = 4, startIndex = 1, safe = 'off' }: SearchOptions): string {
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('cx', env.SEARCH_ENGINE_ID);
  url.searchParams.append('key', env.API_KEY);
  url.searchParams.append('num', count.toString());
  url.searchParams.append('q', query);
  url.searchParams.append('safe', safe);
  url.searchParams.append('searchType', 'image');
  url.searchParams.append('startIndex', startIndex.toString());

  return url.toString();
}

/**
 * Performs a Google Custom Search API request for images
 */
export async function searchImages({ query, count = 4, startIndex = 1, safe = 'off' }: SearchOptions): Promise<SearchResult> {
  const url = buildSearchUrl({ query, count, startIndex, safe });

  const response = await fetch(url);
  if (!response.ok) {
    throw new GoogleSearchError(`Google Search API request failed: ${response.statusText}`, response.status, response.statusText);
  }

  const data = await response.json();
  let validatedData;

  try {
    validatedData = GoogleSearchResponseSchema.parse(data);
  } catch (err) {
    throw new GoogleSearchError(`Invalid response format from Google Search API: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // extract pagination information
  const requestQuery = validatedData.queries.request[0];
  const previousPageIdx = validatedData.queries.previousPage?.[0]?.startIndex;
  const nextPageIdx = validatedData.queries.nextPage?.[0]?.startIndex;

  return {
    items: validatedData.items || [],
    previousPageIdx,
    nextPageIdx,
    totalResults: parseInt(requestQuery.totalResults, 10),
    searchTerms: requestQuery.searchTerms,
  };
}
