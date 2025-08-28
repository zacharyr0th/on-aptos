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

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetInSeconds?: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
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

// Re-export currency types from consolidated
export type { Currency, FiatCurrency } from "@/lib/types/consolidated";

// Error types - use errors.ts for error classes
