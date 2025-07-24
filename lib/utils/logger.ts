import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const isProduction = process.env.NODE_ENV === 'production'

// Create pino logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : isDevelopment ? 'debug' : 'info'),
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
      return { level: label }
    },
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  base: {
    env: process.env.NODE_ENV,
    ...(process.env.VERCEL_ENV && { vercelEnv: process.env.VERCEL_ENV }),
  },
  // Redact sensitive information
  redact: {
    paths: ['*.password', '*.apiKey', '*.api_key', '*.token', '*.secret'],
    remove: true,
  },
})

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module })
}

// Specialized loggers for different parts of the application
export const apiLogger = createLogger('api')
export const serviceLogger = createLogger('service')
export const dbLogger = createLogger('database')
export const utilLogger = createLogger('util')
export const errorLogger = createLogger('error')
export const perfLogger = createLogger('performance')

// Backward compatibility exports
export const log = (...args: any[]) => {
  logger.info(args.length === 1 ? args[0] : args.join(' '))
}

export const warn = (...args: any[]) => {
  logger.warn(args.length === 1 ? args[0] : args.join(' '))
}

export const error = (...args: any[]) => {
  if (args[0] instanceof Error) {
    logger.error(args[0])
  } else {
    logger.error(args.length === 1 ? args[0] : args.join(' '))
  }
}

// Default export
export default logger
