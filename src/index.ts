import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { version } from '../package.json';
import { createLogger } from '~/utils/logger';
import { parseDebugArgs } from '~/utils/cli/parseDebugArgs';
import { tryCatch } from '~/utils/tryCatch';
import { schema as searchImageSchema, handler as searchImageHandler } from '~/tools/search_image';
import { schema as persistImageSchema, handler as persistImageHandler } from '~/tools/persist_image';

const [parseErr, debugConfig] = tryCatch<Error, ReturnType<typeof parseDebugArgs>>(parseDebugArgs);
if (parseErr != null) {
  console.error('Error parsing the --debug argument(s):', parseErr.message);
  process.exit(1);
}

const logger = createLogger({ debugConfig, prettyPrint: process.argv.includes('--pretty-print') });
const server = new McpServer({ name: 'Google images search', version });

server.tool('search_image', 'Search the image(s) online', searchImageSchema, searchImageHandler);
server.tool(
  'persist_image',
  'Store image at URL to folder relative to current workspace. If targetPath does not exist, the tool will create it automatically.',
  persistImageSchema,
  persistImageHandler,
);

server.connect(new StdioServerTransport()).then(() => logger.info('server connected'));
