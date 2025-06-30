# Google Images Search MCP

Query for Google images from your editor/IDE and view search results as visual previews in your conversation. Then download and persist the selected image(s) to your local project.

**The unique feature** of this MCP is that it displays search results directly in the chat history as actual images, not just text descriptions or links. This visual integration currently works with [**Cline**](https://cline.bot/) and [**Windsurf**](https://windsurf.com/editor) only.

## Usage & Requirements

### Requirements

- Node.js v20+
- Google Cloud Platform account (free tier sufficient)
- Compatible IDE: Cline or Windsurf

### Setup Guide

Follow these steps to set up your Google Images Search MCP:

#### Step 1: Create Google Custom search engine

1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all)
2. Click **"Add"** to create a new search engine
3. In **"Sites to search"**, enter `*` (asterisk) to search the entire web
4. Give your search engine a name (e.g., "My Image Search")
5. In the search engine settings, enable **"Image search"** option
6. Click **"Create"**
7. Copy the **Search engine ID** - you'll need this for configuration

#### Step 2: Get Google API Key

1. Go to [Google Cloud Console API Credentials](https://console.cloud.google.com/apis/credentials)
2. If you don't have a project, create one
3. Click **"+ CREATE CREDENTIALS"** → **"API key"**
4. Copy the generated API key
5. (Optional) Restrict the API key to "Custom Search API" for security

#### Step 3: Configure MCP in Your IDE

Add the following configuration to your MCP settings:

```json
{
  "mcpServers": {
    "googleImagesSearch": {
      "command": "npx",
      "args": ["-y", "@srigi/mcp-google-images-search"],
      "env": {
        "API_KEY": "your-google-api-key-here",
        "SEARCH_ENGINE_ID": "your-search-engine-id-here"
      },
      "autoApprove": ["search_image", "persist_image"]
    }
  }
}
```

Replace `your-google-api-key-here` and `your-search-engine-id-here` with the values from steps 1 and 2.

### Usage Example

Here's how to use the MCP once configured:

1. **Search for images**: Ask your AI assistant to search for images

   ```
   Search for image of F-22 in-air
   ```

2. **Get more results**: Request additional search results

   ```
   Show me 3 more images
   ```

3. **Save an image**: Ask to save a specific result to your project
   ```
   Save the 3rd image to the "assets" folder
   ```

The MCP will display the search results as actual images in your chat history, and you can easily save any of them to your local project directory.

## Development & Dev-Requirements

Feel free to join development of this MCP. Quality contribution is welcomed.

### Development requirements

- Node.js v20+
- [direnv](https://direnv.net/#getting-started)
- PNPM v10

### Development setup

For development, you need to start the dev build and use a different MCP configuration that points to the continuously recompiled source files:

#### Step 1: Configure Environment

1. Copy [`.envrc (example)`](<.envrc%20(example)>) to `.envrc`
2. Fill in your `API_KEY` and `SEARCH_ENGINE_ID` in `.envrc`

#### Step 2: Install Dependencies

```bash
pnpm install
```

#### Step 3: Start Development Mode

```bash
pnpm dev
```

This starts TypeScript compiler in watch mode, continuously recompiling changes.

#### Step 4: Configure IDE for Development

Use this MCP configuration for development (replace the path with your actual project path):

```json
{
  "mcpServers": {
    "googleImagesSearch": {
      "command": "node",
      "args": ["/absolute/path/to/project/src/index.js"],
      "env": {
        "API_KEY": "your-google-api-key-here",
        "SEARCH_ENGINE_ID": "your-search-engine-id-here"
      },
      "autoApprove": ["search_image", "persist_image"]
    }
  }
}
```

#### Development Tools

For debugging and testing, you can start the MCP inspector:

```bash
pnpx @modelcontextprotocol/inspector
```

Open the inspector URL that includes the `MCP_PROXY_AUTH_TOKEN` (reported on the terminal). In the inspector's UI fill the same **Command:** and **Arguments:** as in above MCP configuration, then click "▷ Connect". Finally click "List Tools" to see the MPC's tools, and invoke them with desired arguments.

Check the [log file](logs/info.log) for debugging information.

_Note: When you make changes to the source code, the dev build will automatically recompile, but you may need to restart the MCP server in your IDE to apply the changes._

## Available Tools

### [search_image](src/tools/search_image/README.md)

Search for images using Google Custom Search API.

**Parameters:**

- `query` (string, required): Search query for images
- `count` (number, optional): Number of results to return (1-10, default: 2)
- `safe` (string, optional): Safe search setting - 'off', 'medium', 'high' (default: 'off')
- `startIndex` (number, optional): Starting index for pagination (default: 1)

### [persist_image](src/tools/persist_image/README.md)

Download and save images from URLs to your local project directory.

**Parameters:**

- `link` (string, required): URL to the full-quality image
- `path` (string, required): Relative path where to save the image (can be folder or folder/filename.ext)

**Features:**

- Automatic file extension detection from MIME type
- Directory creation if needed
- Security validation (prevents directory traversal)
- Content type validation (images only)
- Supports JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF

## TODO

- add example usage screencast
- open GH issue for image support in the chat history:
  - Augment
  - Claude (desktop)
  - Copilot
  - Cursor
  - RooCode
  - Zed

- allow specifying of the output file in the chat
- configurable logging severity
- log directory in user profile folder (AppData\Roaming, Library/Application Support) or configurable
- image fetch timeout & retry
