import pino, { type Logger } from 'pino';
import fs from 'fs';
import { logger as loggerEnv } from '@lib/env';

export function initLogger(logFile?: string, logLevel?: string): Logger {
  if (logFile) {
    return pino(fs.createWriteStream(logFile));
  }

  return pino({
    level: logLevel || 'warn',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  });
}

function initLoggerFromEnv(): Logger {
  return initLogger(loggerEnv.file, loggerEnv.level);
}

export const logger = initLoggerFromEnv();
