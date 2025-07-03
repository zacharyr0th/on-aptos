// Production-safe logging utility using Pino
// Provides structured logging with proper log levels

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create the base logger
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Disable pretty transport for now due to Turbopack compatibility issues
  // TODO: Re-enable when Turbopack supports worker scripts properly

  // Redact sensitive information
  redact: {
    paths: ['*.password', '*.apiKey', '*.api_key', '*.token', '*.secret'],
    remove: true,
  },
});

// Wrapper for backward compatibility with existing code
export const logger = {
  log: (...args: any[]) => {
    pinoLogger.info(args.length === 1 ? args[0] : args);
  },
  warn: (...args: any[]) => {
    pinoLogger.warn(args.length === 1 ? args[0] : args);
  },
  error: (...args: any[]) => {
    if (args[0] instanceof Error) {
      pinoLogger.error(args[0]);
    } else {
      pinoLogger.error(args.length === 1 ? args[0] : args);
    }
  },
  info: (...args: any[]) => {
    pinoLogger.info(args.length === 1 ? args[0] : args);
  },
  debug: (...args: any[]) => {
    pinoLogger.debug(args.length === 1 ? args[0] : args);
  },
};

// For backward compatibility and easy migration
export const log = logger.log;
export const warn = logger.warn;
export const error = logger.error;

// Export the pino logger for direct use when needed
export const pinoInstance = pinoLogger;
