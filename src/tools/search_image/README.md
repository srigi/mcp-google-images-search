# Google Images Search Tool

MCP tool for searching Google Images using the Custom Search API.

## Usage

### MCP Tool Call

```json
{
  "tool": "search_image",
  "arguments": {
    "query": "mechanical keyboard",
    "count": 4,
    "startIndex": 1,
    "safe": "off"
  }
}
```

### Direct Function Call

```typescript
import { searchImages } from './utils.js';

const result = await searchImages({
  query: 'gaming setup',
  count: 6,
  safe: 'medium',
});
```

## Parameters

| Parameter    | Type   | Required | Default | Description                          |
| ------------ | ------ | -------- | ------- | ------------------------------------ |
| `query`      | string | ✓        | -       | Search query                         |
| `count`      | number | -        | 2       | Results to return (1-10)             |
| `startIndex` | number | -        | 1       | Pagination start index               |
| `safe`       | enum   | -        | 'off'   | Safe search: 'off', 'medium', 'high' |

## Key Points

- **Rate Limits**: Google Custom Search API has daily quotas
- **Pagination**: Use `nextPageIdx` from results for next page
- **Image Links**: Direct links may expire; use `contextLink` for source page
- **Error Handling**: Throws `GoogleSearchError` for API failures

## Environment Setup

Required environment variables:

```bash
API_KEY=your_google_api_key
SEARCH_ENGINE_ID=your_custom_search_engine_id
```

## API Response Validation

The tool uses Zod schema validation to ensure type safety and data integrity from Google's API response.

### Raw Google API Response Example

```json
{
  "kind": "customsearch#search",
  "queries": {
    "request": [
      {
        "totalResults": "1240000",
        "searchTerms": "mechanical keyboard",
        "count": 2,
        "startIndex": 1,
        "safe": "off"
      }
    ],
    "nextPage": [
      {
        "totalResults": "1240000",
        "searchTerms": "mechanical keyboard",
        "count": 2,
        "startIndex": 3,
        "safe": "off"
      }
    ]
  },
  "items": [
    {
      "title": "Best Mechanical Keyboards 2024",
      "htmlTitle": "Best <b>Mechanical Keyboards</b> 2024",
      "link": "https://example.com/image.jpg",
      "displayLink": "example.com",
      "mime": "image/jpeg",
      "image": {
        "contextLink": "https://example.com/article",
        "height": 800,
        "width": 1200,
        "byteSize": 156789,
        "thumbnailLink": "https://encrypted-tbn0.gstatic.com/...",
        "thumbnailHeight": 150,
        "thumbnailWidth": 225
      }
    }
  ]
}
```

### Processed Tool Response

The validated response is transformed into a structured format:

```json
{
  "summary": {
    "query": "mechanical keyboard",
    "totalResults": 1240000,
    "itemsReturned": 2,
    "pagination": {
      "nextPageStartIndex": 3
    }
  },
  "items": [
    {
      "index": 1,
      "title": "Best Mechanical Keyboards 2024",
      "link": "https://example.com/image.jpg",
      "displayLink": "example.com",
      "mimeType": "image/jpeg",
      "image": {
        "contextLink": "https://example.com/article",
        "dimensions": "1200x800",
        "size": "153KB",
        "thumbnail": {
          "link": "https://encrypted-tbn0.gstatic.com/...",
          "dimensions": "225x150"
        }
      }
    }
  ]
}
```

### Validation Benefits

- **Type Safety**: Ensures all expected fields are present and correctly typed
- **Error Handling**: Catches malformed responses before processing
- **Data Transformation**: Converts raw API data into developer-friendly format
- **Pagination Support**: Extracts pagination indices for seamless browsing

## Common Issues

- **403 Forbidden**: Check API key and quotas
- **Invalid results**: Ensure Custom Search Engine has image search enabled
- **Empty results**: Try broader search terms or different safe search settings
- **Validation Errors**: Raw API response doesn't match expected schema (rare)
