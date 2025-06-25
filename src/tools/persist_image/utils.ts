import { createWriteStream, promises as fs } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Logger } from 'winston';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/avif',
]);
const USER_AGENT = 'Mozilla/5.0 (compatible; MCP-GoogleImagesSearch/1.0)';

export interface DownloadResult {
  filePersistPath: string;
  mimeType: string;
  size: number;
}

export class PersistImageError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'PersistImageError';
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
    'image/avif': '.avif',
  };

  return mimeToExt[mimeType] || '.jpg';
}

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'image';

    return filename.includes('.') ? filename : 'image';
  } catch {
    return 'image';
  }
}

function getFilename(url: string, mimeType: string): string {
  const urlFilename = getFilenameFromUrl(url);
  const urlExtension = extname(urlFilename);
  const expectedExt = getExtensionFromMimeType(mimeType);

  // use URL extension if it matches the MIME type, otherwise use MIME type extension
  const finalExt = urlExtension.toLowerCase() === expectedExt ? urlExtension : expectedExt;

  return `${basename(urlFilename, urlExtension)}${finalExt}`;
}

export function getUtils(logger: Logger) {
  return {
    // validates that the target path is within project bounds, and returns the full path of the directory where the file should be saved
    async prepareTargetPath(workspacePath: string, targetPath: string): Promise<string> {
      if (targetPath.startsWith('..')) {
        throw new PersistImageError('Target path must be within the project directory', 'INVALID_PATH');
      }

      const fullTargetPath = resolve(workspacePath, targetPath);

      try {
        await fs.access(fullTargetPath);
      } catch (err) {
        logger.info('prepareTargetPath(), fs.access().fail', err);

        try {
          await fs.mkdir(fullTargetPath, { recursive: true });
        } catch (err) {
          throw new PersistImageError(
            `Failed to create directory: ${err instanceof Error ? err.message : 'Unknown error'}`,
            'DIRECTORY_CREATE_FAILED',
          );
        }
      }

      return fullTargetPath;
    },

    async fetchImage(url: string, fullTargetPath: string): Promise<DownloadResult> {
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
        });
      } catch (err) {
        throw new PersistImageError(`Failed to fetch image: ${err instanceof Error ? err.message : 'Network error'}`, 'FETCH_FAILED');
      }
      logger.info('persist_image/fetchImage()', { response });

      if (!response.ok) {
        throw new PersistImageError(`HTTP error ${response.status}: ${response.statusText}`, 'HTTP_ERROR');
      }
      if (!response.body) {
        throw new PersistImageError('No response body received', 'NO_RESPONSE_BODY');
      }

      const contentType = response.headers.get('content-type') || '';

      if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
        throw new PersistImageError(`Invalid content type: ${contentType}. Only image files are allowed.`, 'INVALID_CONTENT_TYPE');
      }

      const fileName = getFilename(url, contentType);
      const filePersistPath = resolve(fullTargetPath, fileName);

      try {
        const writeStream = createWriteStream(filePersistPath);
        await pipeline(response.body, writeStream);
      } catch (err) {
        throw new PersistImageError(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`, 'SAVE_FAILED');
      }

      let fileStats;
      try {
        fileStats = await fs.stat(filePersistPath);
      } catch (err) {
        throw new PersistImageError(`Failed to get file stats: ${err instanceof Error ? err.message : 'Unknown error'}`, 'STAT_FAILED');
      }

      return {
        filePersistPath,
        mimeType: contentType,
        size: fileStats.size,
      };
    },
  };
}
