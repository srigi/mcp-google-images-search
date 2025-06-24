# Google images search MCP

Query for Google images directly in editor/IDE and view search results directly in chat history.

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
       "command": "/Users/srigi/.nodenv/shims/node",
       "args": [
         "/Path/to/project/folder/src/index.js"
       ],
       "env": {
         "API_KEY": "..."
         "SEARCH_ENGINE_ID": "...",
       },
       "autoApprove": [
         "search_image"
       ]
     }
   }
   ```

You can also run `pnpm dev` for continual re-build, but you still have to restart MPC server in IDE to apply the changes!
