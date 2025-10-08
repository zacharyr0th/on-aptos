/**
 * @deprecated Use UnifiedError from @/lib/utils/error-handling/unified-error-handler instead
 * This file is kept for backward compatibility only
 */

import {
  ERROR_CODES,
  UnifiedError,
  UnifiedErrorHandler,
} from "@/lib/utils/error-handling/unified-error-handler";

const isProduction = process.env.NODE_ENV === "production";

/**
 * @deprecated Use UnifiedError instead
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(isProduction ? "An error occurred" : message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @deprecated Use UnifiedError with code: ERROR_CODES.API_ERROR instead
 */
export class ApiError extends AppError {
  constructor(message: string, statusCode: number = 500, code: string = "API_ERROR") {
    super(message, code, statusCode, true);
  }
}

/**
 * @deprecated Use UnifiedError with code: ERROR_CODES.RATE_LIMITED instead
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    public resetInSeconds: number
  ) {
    super(message, "RATE_LIMITED", 429, true);
  }
}

/**
 * @deprecated Use UnifiedError with code: ERROR_CODES.TIMEOUT instead
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    public timeout: number
  ) {
    super(message, "TIMEOUT", 408, true);
  }
}

/**
 * @deprecated Use UnifiedErrorHandler.sanitizeError instead
 */
export function sanitizeError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof UnifiedError) {
    return {
      message: isProduction ? "Service temporarily unavailable" : error.message,
      code: error.code,
      statusCode: error.status || 500,
    };
  }

  if (isProduction) {
    if (error instanceof AppError && error.isOperational) {
      return {
        message: "Service temporarily unavailable",
        code: error.code,
        statusCode: error.statusCode,
      };
    }

    return {
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: error instanceof AppError ? error.code : "UNKNOWN_ERROR",
      statusCode: error instanceof AppError ? error.statusCode : 500,
    };
  }

  return {
    message: String(error),
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * @deprecated Use UnifiedErrorHandler.logError instead
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  if (error instanceof Error || error instanceof UnifiedError) {
    UnifiedErrorHandler.logError(error, context);
  } else {
    UnifiedErrorHandler.logError(new Error(String(error)), context);
  }
}

// Re-export for migration path
export { UnifiedError, ERROR_CODES, UnifiedErrorHandler };
