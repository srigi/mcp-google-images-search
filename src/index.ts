import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve } from 'node:path';
import winston, { transports } from 'winston';

import { version } from '../package.json';
import { schema as searchImageSchema, handler as searchImageHandler } from '~/tools/search_image';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.prettyPrint(),
  defaultMeta: { service: 'mcp-google-images-search' },
  transports: [new transports.File({ filename: resolve(__dirname, '..', 'logs', 'info.log') })],
});
const server = new McpServer({ name: 'Google images search', version });

server.tool('search_image', searchImageSchema, searchImageHandler);

server.connect(new StdioServerTransport()).then(() => logger.info('server connected'));
