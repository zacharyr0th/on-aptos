/**
 * Enterprise-grade error handling utilities
 */

const isProduction = process.env.NODE_ENV === 'production';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    // In production, use generic message for security
    super(isProduction ? 'An error occurred' : message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'API_ERROR'
  ) {
    super(message, code, statusCode, true);
  }
}

/**
 * Sanitize error for client response
 */
export function sanitizeError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  // In production, never expose internal error details
  if (isProduction) {
    if (error instanceof AppError && error.isOperational) {
      return {
        message: 'Service temporarily unavailable',
        code: error.code,
        statusCode: error.statusCode,
      };
    }
    
    // Generic error for non-operational errors
    return {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  // In development, show more details
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
      statusCode: error instanceof AppError ? error.statusCode : 500,
    };
  }

  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

/**
 * Log error with appropriate detail level
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  // Always log full details server-side
  console.error('Error occurred:', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  });
}