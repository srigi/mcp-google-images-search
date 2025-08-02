import { describe, it, expect } from 'vitest';

import { env } from '~/utils/env';
import { buildSearchUrl } from './utils';

describe('search_image/utils', () => {
  describe('buildSearchUrl', () => {
    it('should correctly build search query URL with default parameters', () => {
      const query = 'MCP diagram';
      const searchQueryURL = buildSearchUrl({ query, count: 4 });

      expect(searchQueryURL).toContain('https://www.googleapis.com/customsearch/v1');
      expect(searchQueryURL).toContain(`cx=${env.SEARCH_ENGINE_ID}`);
      expect(searchQueryURL).toContain(`key=${env.API_KEY}`);
      expect(searchQueryURL).toContain('q=MCP+diagram');
      expect(searchQueryURL).toContain('num=4');
      expect(searchQueryURL).toContain('searchType=image');
    });

    it('should correctly handle custom count parameter', () => {
      const query = 'test query';
      const count = 8;
      const searchQueryURL = buildSearchUrl({ query, count });

      expect(searchQueryURL).toContain(`num=${count}`);
    });

    it('should correctly handle custom startIndex parameter', () => {
      const query = 'test query';
      const startIndex = 11;
      const searchQueryURL = buildSearchUrl({ query, count: 2, startIndex });

      expect(searchQueryURL).toContain(`start=${startIndex}`);
    });

    it('should correctly handle custom safe parameter', () => {
      const query = 'test query';

      // Test 'medium' safe setting
      const mediumSafeURL = buildSearchUrl({ query, count: 2, safe: 'medium' });
      expect(mediumSafeURL).toContain('safe=medium');

      // Test 'high' safe setting
      const highSafeURL = buildSearchUrl({ query, count: 2, safe: 'high' });
      expect(highSafeURL).toContain('safe=high');

      // Test 'off' safe setting (explicit)
      const offSafeURL = buildSearchUrl({ query, count: 2, safe: 'off' });
      expect(offSafeURL).toContain('safe=off');
    });

    it('should correctly handle all custom parameters together', () => {
      const query = 'complex search query';
      const count = 6;
      const startIndex = 21;
      const safe = 'high';
      const searchQueryURL = buildSearchUrl({ query, count, startIndex, safe });

      expect(searchQueryURL).toContain('https://www.googleapis.com/customsearch/v1');
      expect(searchQueryURL).toContain(`cx=${env.SEARCH_ENGINE_ID}`);
      expect(searchQueryURL).toContain(`key=${env.API_KEY}`);
      expect(searchQueryURL).toContain('q=complex+search+query');
      expect(searchQueryURL).toContain(`num=${count}`);
      expect(searchQueryURL).toContain(`safe=${safe}`);
      expect(searchQueryURL).toContain('searchType=image');
      expect(searchQueryURL).toContain(`start=${startIndex}`);
    });

    it('should handle edge case values for count and startIndex', () => {
      const query = 'edge case test';

      // Test minimum values
      const minValuesURL = buildSearchUrl({ query, count: 1, startIndex: 1 });
      expect(minValuesURL).toContain('num=1');
      expect(minValuesURL).toContain('start=1');

      // Test maximum count value (as per schema, max is 10)
      const maxCountURL = buildSearchUrl({ query, count: 10 });
      expect(maxCountURL).toContain('num=10');

      // Test larger startIndex for pagination
      const largeStartIndexURL = buildSearchUrl({ query, count: 2, startIndex: 91 });
      expect(largeStartIndexURL).toContain('start=91');
    });
  });
});
