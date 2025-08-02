import winston, { Logger } from 'winston';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { Writable } from 'node:stream';

import type { DebugConfig } from '~/utils/cli/parseDebugArgs';

let loggerInstance: Logger | undefined;

type CreateLoggerOptions = {
  debugConfig: DebugConfig;
  prettyPrint: boolean;
};

export function createLogger({ debugConfig, prettyPrint }: CreateLoggerOptions) {
  const format = winston.format.json({ ...(prettyPrint ? { space: 2 } : {}) });

  if (!debugConfig.enabled) {
    // blackhole stream that implements .write() as expected by winston Stream transport
    const stream = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    const nullTransport = new winston.transports.Stream({ stream });

    loggerInstance = winston.createLogger({ level: 'silent', transports: [nullTransport] });

    return loggerInstance;
  }

  // When debug logging is enabled, decide destination by mode
  const transports: winston.transport[] =
    debugConfig.mode === 'path'
      ? [new winston.transports.File({ filename: debugConfig.path })]
      : [new winston.transports.File({ filename: resolve(cwd(), 'debug.log') })]; // current folder

  loggerInstance = winston.createLogger({ format, level: 'debug', transports });

  return loggerInstance;
}

export function getLogger(presenter?: string) {
  if (loggerInstance == null) {
    throw new Error('Logger has not been configured!');
  }

  return presenter ? loggerInstance.child({ actor: presenter }) : loggerInstance;
}
