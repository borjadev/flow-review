import pino, { type Logger } from 'pino';
import type { AppConfig } from '../../config/config.js';

export type { Logger };

/**
 * Creates the structured application logger. Sensitive fields are redacted, and
 * pretty-printing is used only outside production. The classifier API key is
 * never logged.
 */
export function createLogger(config: AppConfig): Logger {
  return pino({
    level: config.nodeEnv === 'test' ? 'silent' : 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-user-id"]',
        'apiKey',
        'openaiApiKey',
        'password',
      ],
      remove: true,
    },
    transport: config.isProduction
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
  });
}
