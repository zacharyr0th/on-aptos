export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
  stale?: boolean;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetInSeconds?: number;
  burstRemaining: number;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  lastAccessed: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  timeout?: number;
  retryCondition?: (response: Response | Error) => boolean;
}

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  retryCondition?: (response: Response) => boolean;
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface BatchRequestOptions {
  concurrency?: number;
  delayBetween?: number;
}

// Currency types
export type Currency = string;
export type FiatCurrency = string;

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public context?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetInSeconds: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public timeout: number,
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}
