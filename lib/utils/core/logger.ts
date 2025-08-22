// Stub logger that does nothing
const noop = (..._args: unknown[]) => {};

export const logger = {
  info: noop,
  debug: noop,
  warn: noop,
  error: noop,
  fatal: noop,
  trace: noop,
  child: () => logger,
};

// Create child loggers for different modules
export const createLogger = (_module: string) => {
  return logger;
};

// Specialized loggers for different parts of the application
export const dbLogger = createLogger("database");
export const utilLogger = createLogger("util");
export const errorLogger = createLogger("error");
export const perfLogger = createLogger("performance");

// Backward compatibility exports
export const log = (...args: unknown[]) => {
  logger.info(args.length === 1 ? args[0] : args.join(" "));
};

export const warn = (...args: unknown[]) => {
  logger.warn(args.length === 1 ? args[0] : args.join(" "));
};

export const error = (...args: unknown[]) => {
  if (args[0] instanceof Error) {
    logger.error(args[0]);
  } else {
    logger.error(args.length === 1 ? args[0] : args.join(" "));
  }
};

// Default export
export default logger;
