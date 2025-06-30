import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { relative } from 'node:path';
import type { Logger } from 'winston';
import { z } from 'zod';

import { FetchResult, PersistImageError, getUtils } from './utils.js';
import { tryCatch } from '~/utils/tryCatch.js';

export const schema = {
  url: z.string().url().describe('URL of the image'),
  targetPath: z.string().describe('Folder where to save the image (relative to the current workspace)'),
  workspacePath: z.string().describe('The current workspace absolute path'),
} as const;

export function getHandler(logger: Logger) {
  const { fetchImage, prepareTargetPath } = getUtils(logger);

  const handler: ToolCallback<typeof schema> = async ({ url, targetPath, workspacePath }) => {
    logger.info('[persist_image] handler called', { url, targetPath, workspacePath });

    const [prepareTargetPathErr, fullTargetPath] = await tryCatch<PersistImageError, string>(prepareTargetPath(workspacePath, targetPath));
    if (prepareTargetPathErr != null) {
      logger.error('persist_image() error', { error: prepareTargetPathErr });

      return {
        _meta: {
          error: {
            type: 'PersistImageError',
            message: prepareTargetPathErr.message,
            code: prepareTargetPathErr.code,
          },
        },
        content: [
          {
            type: 'text' as const,
            text: `Error: ${prepareTargetPathErr.message}`,
          },
        ],
      };
    }

    const [fetchImageErr, fetchResult] = await tryCatch<PersistImageError, FetchResult>(fetchImage(url, fullTargetPath));
    if (fetchImageErr != null) {
      logger.error('persist_image() error', { error: fetchImageErr });

      return {
        _meta: {
          error: {
            type: 'PersistImageError',
            message: fetchImageErr.message,
            code: fetchImageErr.code,
          },
        },
        content: [
          {
            type: 'text' as const,
            text: `Error: ${fetchImageErr.message}`,
          },
        ],
      };
    }

    const _meta = {
      success: true,
      filePersistPath: fetchResult.filePersistPath,
      size: fetchResult.size,
      mimeType: fetchResult.mimeType,
    };
    logger.info('persist_image() success', { fetchResult, _meta });

    return {
      _meta,
      content: [
        {
          type: 'text' as const,
          text: `All done! Download result:\n- filePersistPath: ${relative(workspacePath, fetchResult.filePersistPath)}\n- size: ${Math.round((fetchResult.size / 1024) * 100) / 100}KB`,
        },
      ],
    };
  };

  return handler;
}
