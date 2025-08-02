import { resolve, isAbsolute } from 'node:path';

export type DebugConfig = { enabled: false } | { enabled: true; mode: 'default' } | { enabled: true; mode: 'path'; path: string };

export function parseDebugArgs(): DebugConfig {
  const argv = Array.isArray(process.argv) ? process.argv : [];
  const debugIndex = argv.indexOf('--debug');

  // disable logging if --debug flag is not present
  if (debugIndex === -1) {
    return { enabled: false };
  }

  // check if --debug flag has an argument
  const nextArg = argv[debugIndex + 1];

  // no argument for --debug or another flag follows -> default directory mode
  if (nextArg == null || nextArg.startsWith('-')) {
    return { enabled: true, mode: 'default' };
  }

  // accept only absolute paths
  if (isAbsolute(nextArg) && resolve(nextArg) === nextArg) {
    return { enabled: true, mode: 'path', path: nextArg };
  }

  throw new Error(`Invalid debug path: "${nextArg}". Debug path must be an absolute path.`);
}
