import winston, { Logger, LoggerOptions } from 'winston';

let loggerInstance: Logger | undefined;

export function createLogger(options: LoggerOptions) {
  loggerInstance = winston.createLogger(options);

  return loggerInstance;
}

export function getLogger(presenter?: string) {
  if (loggerInstance == null) {
    throw new Error('Logger has not been configured!');
  }

  return presenter ? loggerInstance.child({ actor: presenter }) : loggerInstance;
}
