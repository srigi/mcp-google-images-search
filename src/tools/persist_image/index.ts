import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { relative } from 'node:path';
import type { Logger } from 'winston';
import { z } from 'zod';

import { PersistImageError, getUtils } from './utils.js';

export const schema = {
  url: z.string().url().describe('URL of the image'),
  targetPath: z.string().describe('Folder where to save the image (relative to the current workspace)'),
  workspacePath: z.string().describe('The current workspace absolute path'),
} as const;

export function getHandler(logger: Logger) {
  const handler: ToolCallback<typeof schema> = async ({ url, targetPath, workspacePath }) => {
    logger.info('persist_image() tool called', { url, targetPath, workspacePath });

    const { fetchImage, prepareTargetPath } = getUtils(logger);
    const _meta: Record<string, unknown> = {};

    try {
      const fullTargetPath = await prepareTargetPath(workspacePath, targetPath);
      const downloadResult = await fetchImage(url, fullTargetPath);

      _meta.success = true;
      _meta.filePersistPath = downloadResult.filePersistPath;
      _meta.size = downloadResult.size;
      _meta.mimeType = downloadResult.mimeType;

      logger.info('persist_image() success', { downloadResult, _meta });

      return {
        _meta,
        content: [
          {
            type: 'text' as const,
            text: `All done! Download result:\n- filePersistPath: ${relative(workspacePath, downloadResult.filePersistPath)}\n- size: ${Math.round((downloadResult.size / 1024) * 100) / 100}KB`,
          },
        ],
      };
    } catch (err: unknown) {
      _meta.error =
        err instanceof PersistImageError
          ? {
              type: 'PersistImageError',
              message: err.message,
              code: err.code,
            }
          : {
              type: 'UnknownError',
              message: err instanceof Error ? err.message : 'Unknown error occurred',
            };

      logger.error('persist_image() error', { error: _meta.error });

      return {
        _meta,
        content: [
          {
            type: 'text' as const,
            text: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  };

  return handler;
}
