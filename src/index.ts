import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve } from 'node:path';
import winston, { transports } from 'winston';

import { version } from '../package.json';
import { schema as searchImageSchema, getHandler as getSearchImageHandler } from '~/tools/search_image';
import { schema as persistImageSchema, getHandler as getPersistImageHandler } from '~/tools/persist_image';
import { createLogger } from '~/logger';

const logger = createLogger({
  level: process.argv.includes('--debug') ? 'debug' : 'info',
  format: winston.format.json({ ...(process.argv.includes('--pretty-print') && { space: 2 }) }),
  defaultMeta: { service: 'mcp-google-images-search' },
  transports: [new transports.File({ filename: resolve(__dirname, '..', 'logs', 'info.log') })],
});
const server = new McpServer({ name: 'Google images search', version });

server.tool('search_image', 'Search the image(s) online', searchImageSchema, getSearchImageHandler());
server.tool(
  'persist_image',
  'Store image at URL to folder relative to current workspace. If targetPath does not exist, the tool will create it automatically.',
  persistImageSchema,
  getPersistImageHandler(),
);

server.connect(new StdioServerTransport()).then(() => logger.info('server connected'));
