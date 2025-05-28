# Google Images Search Tool

A simplified, type-safe Google Images search tool for the MCP (Model Context Protocol) server.

## Overview

This tool provides a complete solution for searching Google Images with:

- **Zod validation** for API response validation
- **TypeScript types** for full type safety
- **Utility functions** for easy integration
- **Error handling** with custom error types
- **Pagination support** for browsing results

## File Structure

```
src/tools/search_image/
├── index.ts          # Main tool export (MCP tool handler)
├── utils.ts          # Core utility functions with inline types
└── README.md         # This documentation
```

## Quick Start

### Using the MCP Tool

The tool is automatically registered with the MCP server and can be called with:

```json
{
  "tool": "search_image",
  "arguments": {
    "q": "PC battlestation",
    "count": 4,
    "startIndex": 1,
    "safe": "off"
  }
}
```

### Using the Utility Functions

```typescript
import { searchImages } from '~/tools/search_image/utils.js';

// Advanced search
const result = await searchImages({
  query: 'gaming setup',
  count: 6,
  startIndex: 1,
  safe: 'medium',
});
```

## API Reference

### Tool Parameters

- `q` (string, required): Search query for images
- `count` (number, optional): Number of results to return (1-10, default: 4)
- `startIndex` (number, optional): Starting index for pagination (default: 1)
- `safe` (enum, optional): Safe search setting ('off' | 'medium' | 'high', default: 'off')

### Utility Functions

#### `searchImages(options: SearchOptions): Promise<SearchResult>`

Search function with full parameter control.

### Types

#### `SearchResult`

```typescript
interface SearchResult {
  items: SearchItem[]; // Array of search results
  previousPageIdx?: number; // Start index for previous page
  nextPageIdx?: number; // Start index for next page
  totalResults: number; // Total number of results available
  searchTerms: string; // The actual search terms used
}
```

#### `SearchItem`

```typescript
interface SearchItem {
  title: string; // Image title
  htmlTitle: string; // HTML-formatted title
  link: string; // Direct link to the image
  displayLink: string; // Display URL of the source site
  mime: string; // MIME type
  image: Image; // Image metadata
}
```

#### `Image`

```typescript
interface Image {
  contextLink: string; // Link to the page containing the image
  height: number; // Image height in pixels
  width: number; // Image width in pixels
  byteSize: number; // Image file size in bytes
  thumbnailLink: string; // Link to thumbnail version
  thumbnailHeight: number; // Thumbnail height
  thumbnailWidth: number; // Thumbnail width
}
```

## Error Handling

The tool uses a custom `GoogleSearchError` class for API-related errors:

```typescript
try {
  const result = await searchImages({ query: 'test' });
} catch (error) {
  if (error instanceof GoogleSearchError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.status} ${error.statusText}`);
  }
}
```

## Pagination

Use the `previousPageIdx` and `nextPageIdx` values for pagination:

```typescript
// Get first page
const page1 = await searchImages({
  query: 'mechanical keyboard',
  count: 4,
  startIndex: 1,
});

// Get next page
if (page1.nextPageIdx) {
  const page2 = await searchImages({
    query: 'mechanical keyboard',
    count: 4,
    startIndex: page1.nextPageIdx,
  });
}
```

## Environment Variables

The tool requires these environment variables:

- `API_KEY`: Google API Key
- `SEARCH_ENGINE_ID`: Google Custom Search Engine ID

These are validated using Zod in `~/env.ts`.

## Examples

See `examples.ts` for complete usage examples including:

- Basic search queries
- Advanced search with options
- Pagination handling
- Error handling patterns
