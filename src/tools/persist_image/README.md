# persist_image Tool

MCP tool for downloading and saving images to the local workspace with robust validation and security.

## Usage

### MCP Tool Call

```json
{
  "tool": "persist_image",
  "arguments": {
    "url": "https://example.com/image.jpg",
    "targetPath": "assets/downloaded-image.jpg",
    "workspacePath": "/Users/srigi/Developer/lab/mcp-google-images-search"
  }
}
```

### Direct Function Call

```typescript
import { getUtils } from './utils.js';
import { resolve } from 'node:path';

const logger = console; // Replace with actual logger
const { fetchImage, prepareTargetPath } = getUtils(logger);

const workspacePath = '/Users/srigi/Developer/lab/mcp-google-images-search';
const targetPath = 'assets/downloaded-image.jpg';
const fullTargetPath = await prepareTargetPath(workspacePath, targetPath);

const result = await fetchImage('https://example.com/image.jpg', fullTargetPath);
console.log(`Image saved to: ${result.filePersistPath}`);
```

## Parameters

| Parameter       | Type   | Required | Description                                   |
| --------------- | ------ | -------- | --------------------------------------------- |
| `url`           | string | ✓        | URL of the image to download                  |
| `targetPath`    | string | ✓        | Relative path (folder or folder/filename.ext) |
| `workspacePath` | string | ✓        | Absolute path of the current workspace        |

### Path Handling

The `targetPath` parameter is flexible:

1.  **Directory only**: `images/` - Infers filename from the URL and adds appropriate extension (e.g., `images/sunset.jpg`).

TODO

2.  **Full path with extension**: `images/photo.jpg`
    - Saves the file exactly as specified.
3.  **Path without extension**: `images/photo`
    - Automatically adds extension based on the image's MIME type (e.g., `photo.png`).

## Security & Validation

The tool enforces strict checks to ensure safe operations:

- **Path Security**: Prevents directory traversal attacks by ensuring `targetPath` is within the `workspacePath`.
- **URL Validation**: Ensures the provided `url` is a valid URL.
- **Content Type**: Only allows downloading of common image MIME types.
- **File Size**: Rejects files larger than 10MB.
- **Directory Creation**: Automatically creates target directories if they don't exist.

## Error Codes

The `PersistImageError` class provides specific error codes for different failure scenarios:

- `INVALID_PATH`: Target path is outside the project directory.
- `FETCH_FAILED`: Network error during image download.
- `HTTP_ERROR`: Non-2xx HTTP response from the image URL (e.g., 404, 500).
- `NO_RESPONSE_BODY`: No content received from the URL.
- `INVALID_CONTENT_TYPE`: Downloaded file is not a supported image type.
- `FILE_TOO_LARGE`: Downloaded file exceeds the 10MB size limit.
- `DIRECTORY_CREATE_FAILED`: Failed to create the target directory.
- `SAVE_FAILED`: Error writing the file to disk.
- `STAT_FAILED`: Failed to get file statistics after saving.

## Supported Image Types

- `image/jpeg`, `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`
- `image/svg+xml`
- `image/bmp`
- `image/tiff`
- `image/avif`

## Common Issues

- **`INVALID_PATH`**: Ensure `targetPath` does not use `..` or absolute paths outside the workspace.
- **`HTTP_ERROR` (404/403)**: Verify the image URL is correct and accessible.
- **`INVALID_CONTENT_TYPE`**: Confirm the URL points to an actual image file.
- **Network Issues**: Check internet connection if `FETCH_FAILED` occurs.
