// Development logger that uses console
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: any[]) => isDevelopment && console.log('[INFO]', ...args),
  debug: (...args: any[]) => isDevelopment && console.debug('[DEBUG]', ...args),
  warn: (...args: any[]) => isDevelopment && console.warn('[WARN]', ...args),
  error: (...args: any[]) => isDevelopment && console.error('[ERROR]', ...args),
  fatal: (...args: any[]) => console.error('[FATAL]', ...args),
  trace: (...args: any[]) => isDevelopment && console.trace('[TRACE]', ...args),
  child: () => logger,
};

// Create child loggers for different modules
export const createLogger = (_module: string) => {
  return logger;
};

// Specialized loggers for different parts of the application
export const apiLogger = createLogger("api");
export const serviceLogger = createLogger("service");
export const dbLogger = createLogger("database");
export const utilLogger = createLogger("util");
export const errorLogger = createLogger("error");
export const perfLogger = createLogger("performance");

// Backward compatibility exports
export const log = (...args: any[]) => {
  logger.info(args.length === 1 ? args[0] : args.join(" "));
};

export const warn = (...args: any[]) => {
  logger.warn(args.length === 1 ? args[0] : args.join(" "));
};

export const error = (...args: any[]) => {
  if (args[0] instanceof Error) {
    logger.error(args[0]);
  } else {
    logger.error(args.length === 1 ? args[0] : args.join(" "));
  }
};

// Default export
export default logger;
