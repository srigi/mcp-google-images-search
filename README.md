# Google images search MCP

Query for Google images directly in editor/IDE and view search results directly in chat history. Also download and persist images from URLs to your local project.

With help of [Is the Google images API still available?](https://old.reddit.com/r/googlecloud/comments/126efns/is_the_google_images_api_still_available/)

## Requirements

- [direnv](https://direnv.net/#getting-started) (for development)
- Node.js v20
- PNPM v10

## Getting started

1. copy [`.envrc (example)`](<.envrc%20(example)>) into `.envrc`

2. Create a custom search engine for Google at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/controlpanel/all)
   - enable **image search**
   - fill **Search engine ID** to `.envrc`
   - custom search engine will also create an **API key** in [console.cloud.google.com/YOUR_PROJECT_ID](https://console.cloud.google.com/apis/credentials), fill that value too

3. install PNPM dependencies

   ```
   pnpm install
   ```

4. build the TypeScript

   ```
   pnpm build
   ```

5. add your MCP to the IDE using JSON

   ```json
   "mcpServers": {
     "googleImagesSearch": {
       "command": "node",
       "args": [
         "/Path/to/project/folder/src/index.js"
       ],
       "env": {
         "API_KEY": "..."
         "SEARCH_ENGINE_ID": "...",
       },
       "autoApprove": [
         "search_image",
         "persist_image"
       ]
     }
   }
   ```

_Note: if you rebuild MCP's sources, you must restart MPC server in IDE to apply the changes!_

## MCP development

If you're interested in hacking/modifying of this MCP, the best approach is to:

1. start MCP web inspector

   ```
   pnpx @modelcontextprotocol/inspector
   ```

2. open the inspector URL that includes the `MCP_PROXY_AUTH_TOKEN` (reported on the terminal)

3. in the second terminal session start project in the "dev" mode (TypeScript compiler in watch mode)

   ```
   pnpm dev
   ```

4. in the inspector's UI fill the Command: `node` and Arguments: `/Path/to/project/folder/src/index.js`, then click "▷ Connect"

5. click "List Tools" to see the MPC's tools, invoke them with desired arguments

6. inspect the [log file](logs/info.log) for debugging

## Available Tools

### search_image

Search for images using Google Custom Search API.

**Parameters:**

- `query` (string, required): Search query for images
- `count` (number, optional): Number of results to return (1-10, default: 2)
- `safe` (string, optional): Safe search setting - 'off', 'medium', 'high' (default: 'off')
- `startIndex` (number, optional): Starting index for pagination (default: 1)

### persist_image

Download and save images from URLs to your local project directory.

**Parameters:**

- `link` (string, required): URL to the full-quality image
- `path` (string, required): Relative path where to save the image (can be folder or folder/filename.ext)

**Features:**

- Automatic file extension detection from MIME type
- Directory creation if needed
- Security validation (prevents directory traversal)
- Content type validation (images only)
- File size limits (max 10MB)
- Supports JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF
