import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { version } from '../package.json';
import { schema as searchImageSchema, handler as searchImageHandler } from '~/tools/search_image';

const server = new McpServer({ name: 'Google images search', version });

server.tool('search_image', searchImageSchema, searchImageHandler);

server.connect(new StdioServerTransport());
