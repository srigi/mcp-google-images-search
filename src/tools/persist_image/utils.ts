import { createWriteStream, promises as fs } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { tryCatch } from '~/utils/tryCatch.js';
import { getLogger } from '~/logger';

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

const logger = () => getLogger('[🛠️ persist_image/utils]');

export interface FetchResult {
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

export async function prepareTargetPath(workspacePath: string, targetPath: string): Promise<string> {
  logger().info('prepareTargetPath()', { workspacePath, targetPath });

  // validates that the target path is within project bounds, and returns the full path of the directory where the file should be saved
  if (targetPath.startsWith('..')) {
    throw new PersistImageError('Target path must be within the project directory', 'INVALID_PATH');
  }

  const fullTargetPath = resolve(workspacePath, targetPath);
  const [fsAccessErr] = await tryCatch(fs.access(fullTargetPath));
  logger().debug('prepareTargetPath() resolve & fs.access', { fullTargetPath, fsAccessErr });

  if (fsAccessErr == null) {
    logger().info('prepareTargetPath() existing directory found');
    return fullTargetPath;
  }

  const [fsMkdirErr] = await tryCatch(fs.mkdir(fullTargetPath, { recursive: true }));
  logger().debug('prepareTargetPath() fs.mkdir', { fsMkdirErr });

  if (fsMkdirErr == null) {
    logger().info('prepareTargetPath() directory created successfully');
    return fullTargetPath;
  }

  throw new PersistImageError(`Failed to create directory: ${fsAccessErr.message}`, 'DIRECTORY_CREATE_FAILED');
}

export async function fetchImage(url: string, fullTargetPath: string): Promise<FetchResult> {
  logger().info('fetchImage()', { url, fullTargetPath });

  const [fetchErr, response] = await tryCatch(fetch(url, { headers: { 'User-Agent': USER_AGENT } }));
  logger().info('fetchImage() response', { fetchErr, response });

  if (fetchErr != null) {
    throw new PersistImageError(`Failed to fetch image: ${fetchErr.message}`, 'FETCH_FAILED');
  }
  if (!response.ok) {
    throw new PersistImageError(`HTTP error ${response.status}: ${response.statusText}`, 'HTTP_ERROR');
  }
  if (response.body == null) {
    throw new PersistImageError('No response body received', 'NO_RESPONSE_BODY');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new PersistImageError(`Invalid content type: ${contentType}. Only image files are allowed.`, 'INVALID_CONTENT_TYPE');
  }

  const fileName = getFilename(url, contentType);
  const filePersistPath = resolve(fullTargetPath, fileName);
  const writeStream = createWriteStream(filePersistPath);
  logger().info('fetchImage() fileName', { fileName, filePersistPath, writeStream });

  const [pipelineErr] = await tryCatch(pipeline(response.body, writeStream));
  logger().info('fetchImage() pipeline', { pipelineErr });

  if (pipelineErr != null) {
    throw new PersistImageError(`Failed to save file: ${pipelineErr.message}`, 'SAVE_FAILED');
  }

  const [fsStatErr, fileStats] = await tryCatch(fs.stat(filePersistPath));
  logger().info('fetchImage() fs.stat', { fsStatErr, fileStats });
  if (fsStatErr != null) {
    throw new PersistImageError(`Failed to get file stats: ${fsStatErr.message}`, 'STAT_FAILED');
  }

  return {
    filePersistPath,
    mimeType: contentType,
    size: fileStats.size,
  };
}
