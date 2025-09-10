/**
 * Unified error handling and retry logic
 * Consolidates all error handling patterns across the application
 */

import { apiLogger, errorLogger, serviceLogger } from "../core/logger";

// Error types and interfaces
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

export interface TimeoutOptions {
  timeout?: number;
  timeoutMessage?: string;
}

export interface ErrorContext {
  service?: string;
  operation?: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  status?: number;
  missingParams?: string[];
}

export class UnifiedError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly context?: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    status?: number,
    context?: ErrorContext,
    isRetryable: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = "UnifiedError";
    this.code = code;
    this.status = status;
    this.context = context;
    this.isRetryable = isRetryable;
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnifiedError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      context: this.context,
      isRetryable: this.isRetryable,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

// Standard error categories
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  DNS_RESOLUTION: "DNS_RESOLUTION",

  // HTTP errors
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_ERROR: "SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // API errors
  API_ERROR: "API_ERROR",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  PANORA_ERROR: "PANORA_ERROR",
  APTOS_INDEXER_ERROR: "APTOS_INDEXER_ERROR",

  // Business logic errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  BUSINESS_RULE_ERROR: "BUSINESS_RULE_ERROR",
  DATA_NOT_FOUND: "DATA_NOT_FOUND",

  // System errors
  DATABASE_ERROR: "DATABASE_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryCondition: (error: any, attempt: number) => {
    // Default retry conditions
    if (error instanceof UnifiedError) {
      return error.isRetryable && attempt < 3;
    }

    // Retry on network errors
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error.status === 429 || error.status === 503 || error.status >= 500) {
      return true;
    }

    return false;
  },
  onRetry: (error: any, attempt: number, delay: number) => {
    serviceLogger.warn(`Retry attempt ${attempt} after ${delay}ms`, {
      error: error.message,
      code: error.code,
      status: error.status,
    });
  },
};

export class UnifiedErrorHandler {
  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    backoffFactor: number,
    maxDelay: number
  ): number {
    const delay = baseDelay * backoffFactor ** (attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Categorize and wrap errors with context
   */
  static wrapError(
    error: any,
    context: ErrorContext = {},
    defaultMessage: string = "An error occurred"
  ): UnifiedError {
    if (error instanceof UnifiedError) {
      // Already wrapped, just add context
      return new UnifiedError(
        error.message,
        error.code,
        error.status,
        { ...error.context, ...context },
        error.isRetryable,
        error.originalError || error
      );
    }

    let code: string = ERROR_CODES.UNKNOWN_ERROR;
    let status: number | undefined;
    let isRetryable = false;
    const message = error?.message || defaultMessage;

    // Categorize by error type/status
    if (error?.code === "ENOTFOUND") {
      code = ERROR_CODES.DNS_RESOLUTION;
      isRetryable = true;
    } else if (error?.code === "ECONNREFUSED") {
      code = ERROR_CODES.CONNECTION_REFUSED;
      isRetryable = true;
    } else if (error?.name === "AbortError" || error?.code === "ETIMEDOUT") {
      code = ERROR_CODES.TIMEOUT;
      isRetryable = true;
    } else if (error?.status) {
      status = error.status;

      if (status === 400) {
        code = ERROR_CODES.BAD_REQUEST;
      } else if (status === 401) {
        code = ERROR_CODES.UNAUTHORIZED;
      } else if (status === 403) {
        code = ERROR_CODES.FORBIDDEN;
      } else if (status === 404) {
        code = ERROR_CODES.NOT_FOUND;
      } else if (status === 429) {
        code = ERROR_CODES.RATE_LIMITED;
        isRetryable = true;
      } else if (status >= 500) {
        code = ERROR_CODES.SERVER_ERROR;
        isRetryable = true;
      }
    }

    // Special handling for external APIs
    if (context.service?.includes("panora")) {
      code = ERROR_CODES.PANORA_ERROR;
    } else if (context.service?.includes("indexer")) {
      code = ERROR_CODES.APTOS_INDEXER_ERROR;
    } else if (context.service?.includes("external")) {
      code = ERROR_CODES.EXTERNAL_API_ERROR;
    }

    return new UnifiedError(message, code, status, context, isRetryable, error);
  }

  /**
   * Execute function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
    context: ErrorContext = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = UnifiedErrorHandler.wrapError(error, context);

        // Check if we should retry
        if (attempt === config.maxAttempts || !config.retryCondition(lastError, attempt)) {
          throw lastError;
        }

        // Calculate delay
        const delay = UnifiedErrorHandler.calculateDelay(
          attempt,
          config.baseDelay,
          config.backoffFactor,
          config.maxDelay
        );

        // Call retry callback
        config.onRetry(lastError, attempt, delay);

        // Wait before retry
        await UnifiedErrorHandler.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute function with timeout
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    options: TimeoutOptions = {},
    context: ErrorContext = {}
  ): Promise<T> {
    const { timeout = 30000, timeoutMessage = "Operation timed out" } = options;

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new UnifiedError(timeoutMessage, ERROR_CODES.TIMEOUT, 408, context, true)),
          timeout
        )
      ),
    ]);
  }

  /**
   * Execute function with both timeout and retry
   */
  static async withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    retryOptions: RetryOptions = {},
    timeoutOptions: TimeoutOptions = {},
    context: ErrorContext = {}
  ): Promise<T> {
    return UnifiedErrorHandler.withRetry(
      () => UnifiedErrorHandler.withTimeout(fn, timeoutOptions, context),
      retryOptions,
      context
    );
  }

  /**
   * Execute function with error boundary and fallback
   */
  static async withFallback<T>(
    fn: () => Promise<T>,
    fallback: T | (() => Promise<T>),
    context: ErrorContext = {}
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const wrappedError = UnifiedErrorHandler.wrapError(error, context);

      serviceLogger.warn("Function failed, using fallback", {
        error: wrappedError.message,
        code: wrappedError.code,
        context,
      });

      if (typeof fallback === "function") {
        return await (fallback as () => Promise<T>)();
      }

      return fallback;
    }
  }

  /**
   * Validate required parameters
   */
  static validateRequired(
    params: Record<string, any>,
    required: string[],
    context: ErrorContext = {}
  ): void {
    const missing = required.filter((key) => {
      const value = params[key];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new UnifiedError(
        `Missing required parameters: ${missing.join(", ")}`,
        ERROR_CODES.VALIDATION_ERROR,
        400,
        { ...context, missingParams: missing }
      );
    }
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: UnifiedError | Error, context: ErrorContext = {}): void {
    const errorObj =
      error instanceof UnifiedError ? error : UnifiedErrorHandler.wrapError(error, context);

    const logData = {
      code: errorObj.code,
      status: errorObj.status,
      context: errorObj.context,
      isRetryable: errorObj.isRetryable,
      stack: errorObj.stack,
    };

    if (errorObj.status && errorObj.status < 500) {
      // Client errors - warn level
      apiLogger.warn(errorObj.message, logData);
    } else {
      // Server errors - error level
      errorLogger.error(errorObj.message, logData);
    }
  }

  /**
   * Handle different types of fetch errors consistently
   */
  static handleFetchError(
    response: Response | null,
    error: any,
    context: ErrorContext = {}
  ): UnifiedError {
    if (response) {
      return UnifiedErrorHandler.wrapError(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        {
          ...context,
          status: response.status,
        }
      );
    }

    return UnifiedErrorHandler.wrapError(error, context);
  }
}

// Convenience functions for common patterns
export const sleep = (ms: number) => UnifiedErrorHandler["sleep"](ms);
export const withRetry = UnifiedErrorHandler.withRetry;
export const withTimeout = UnifiedErrorHandler.withTimeout;
export const withRetryAndTimeout = UnifiedErrorHandler.withRetryAndTimeout;
export const withFallback = UnifiedErrorHandler.withFallback;
export const validateRequired = UnifiedErrorHandler.validateRequired;
export const wrapError = UnifiedErrorHandler.wrapError;
export const logError = UnifiedErrorHandler.logError;

// Export types with unique names to avoid conflicts
export type {
  RetryOptions as UnifiedRetryOptions,
  TimeoutOptions as UnifiedTimeoutOptions,
  ErrorContext as UnifiedErrorContext,
};
