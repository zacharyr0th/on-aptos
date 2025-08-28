import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

// Create pino logger instance
const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (isTest
      ? "silent"
      : isDevelopment
        ? "debug"
        : isProduction
          ? "silent"
          : "info"),
  // Disable pretty transport due to Next.js/Turbopack compatibility issues
  // transport: isDevelopment ? {
  //   target: 'pino-pretty',
  //   options: {
  //     colorize: true,
  //     ignore: 'pid,hostname',
  //     translateTime: 'SYS:standard',
  //   },
  // } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  base: {
    env: process.env.NODE_ENV,
    ...(process.env.VERCEL_ENV && { vercelEnv: process.env.VERCEL_ENV }),
  },
  // Redact sensitive information
  redact: {
    paths: ["*.password", "*.apiKey", "*.api_key", "*.token", "*.secret"],
    remove: true,
  },
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Specialized loggers for different parts of the application
export const dbLogger = createLogger("database");
export const utilLogger = createLogger("util");
export const errorLogger = createLogger("error");
export const perfLogger = createLogger("performance");
export const securityLogger = createLogger("security");
export const performanceLogger = createLogger("performance");

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
export { logger };
