# Project Overview

This is an MCP (Model Context Protocol) server for Google Images Search that allows searching and downloading images through Google Custom Search API. The server provides two main tools: `search_image` for finding images and `persist_image` for downloading them to local storage.

## Development commands

### building

- `pnpm build` - Production build using ncc (creates dist/cli.js executable)
- `pnpm build:tsc` - TypeScript compilation with alias resolution
- `pnpm dev` - Development mode with file watching (uses chokidar to recompile on changes)

### testing and quality

- `pnpm test` - Run tests using Vitest
- `pnpm lint` - Run ESLint checks
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm tsc` - TypeScript type checking without emitting files

## Architecture

### key dependencies

- `@modelcontextprotocol/sdk` - MCP server framework
- `winston` - Logging (logs to `logs/info.log`)
- `zod` - Schema validation for tool parameters

### core Structure

- **Entry Point**: `src/index.ts` - Sets up MCP server with Winston logging and registers tools
- **Tools**: Located in `src/tools/` directory with separate folders for each tool
- **Utilities**: `src/utils/tryCatch.ts` - Error handling utility for async operations

### tool architecture

Each tool follows a consistent pattern:

- `index.ts` - Exports schema and handler factory function
- `utils.ts` - Business logic and API integration
- `README.md` - Tool documentation

### error handling

The codebase uses a custom `tryCatch` utility that wraps operations in a Result-like pattern returning `[error, data]` tuples. This provides type-safe error handling without throwing exceptions.

### environment variables

- `API_KEY` - Google Cloud API key
- `SEARCH_ENGINE_ID` - Google Custom Search Engine ID

## Tool Details

### search_image

- **Purpose**: Search for images using Google Custom Search API
- **Location**: `src/tools/search_image/`
- **Key Parameters**: query (required), count (1-10), safe search settings
- **Returns**: Image metadata with thumbnails and full-size links

### persist_image

- **Purpose**: Download images from URLs to local workspace
- **Location**: `src/tools/persist_image/`
- **Key Parameters**: url, targetPath, workspacePath
- **Features**: Automatic directory creation, MIME type detection, security validation

## Debugging & development

- Always follow the code-style rules defined in .editorconfig & eslint.config.mjs
- Write TypeScript only source, don't attempt to edit any .js files in src/ folder (ignore .js files entirely!)
- Don't use relative imports, try to use `~` alias primarily. There is only one exception to this rule - importing sources from `this` folder and subfolder(s) (example `import util from './util'` inside of src/tool/TOOL_NAME/source.ts)

# AI agent specific instructions

- Don't attempt to start development (`pnpm dev`), inspector (`pnpm dev:inspector`), final build (`pnpm build`) processes or starting the main process (`pnpm start`)
- You're allowed to use other (P)NPM scripts to aid your work
