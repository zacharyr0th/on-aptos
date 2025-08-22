/**
 * Request deduplication utility to prevent duplicate concurrent requests
 * This helps prevent multiple identical API calls from being made simultaneously
 */

type RequestKey = string;
type RequestPromise<T = unknown> = Promise<T>;

interface CachedResponseData {
  text: string;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
}

export class RequestDeduplicator {
  private pendingRequests = new Map<RequestKey, Promise<CachedResponseData>>();
  private pendingFunctions = new Map<string, RequestPromise>();
  private readonly maxCacheSize = 1000; // Prevent memory leaks
  private requestCount = 0;

  /**
   * Creates a unique key for a request based on URL and method
   */
  private createKey(url: string, options?: RequestInit): RequestKey {
    const method = options?.method || "GET";
    const body = options?.body ? JSON.stringify(options.body) : "";
    const headers = options?.headers ? JSON.stringify(options.headers) : "";
    return `${method}:${url}:${body}:${headers}`;
  }

  /**
   * Deduplicates fetch requests
   */
  async dedupeFetch(url: string, options?: RequestInit): Promise<Response> {
    const key = this.createKey(url, options);

    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      const cachedDataPromise = this.pendingRequests.get(key)!;
      // Wait for the cached data and create a fresh Response for this consumer
      const cachedData = await cachedDataPromise;
      return new Response(cachedData.text, {
        status: cachedData.status,
        statusText: cachedData.statusText,
        headers: new Headers(cachedData.headers),
      });
    }

    // Clean up cache if it gets too large
    if (this.pendingRequests.size >= this.maxCacheSize) {
      this.cleanup();
    }

    // Create the request promise that caches the response data
    const requestPromise = fetch(url, options).then(async (response) => {
      // Cache the response data to allow multiple consumers
      const responseData: CachedResponseData = {
        text: await response.text(),
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
        ok: response.ok,
      };

      return responseData;
    });

    // Store the promise for the cached data
    this.pendingRequests.set(key, requestPromise);
    this.requestCount++;

    // Clean up after a delay to prevent memory leaks
    requestPromise.finally(() => {
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, 100); // Keep cached for 100ms to handle rapid duplicate requests
    });

    // Wait for the data and create a Response for the first consumer
    const cachedData = await requestPromise;
    return new Response(cachedData.text, {
      status: cachedData.status,
      statusText: cachedData.statusText,
      headers: new Headers(cachedData.headers),
    });
  }

  /**
   * Deduplicates generic async functions
   */
  async dedupeFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 30000, // 30 seconds default TTL
  ): Promise<T> {
    // Check if there's already a pending request for this key
    if (this.pendingFunctions.has(key)) {
      return this.pendingFunctions.get(key) as Promise<T>;
    }

    // Clean up cache if it gets too large
    if (this.pendingFunctions.size >= this.maxCacheSize) {
      this.cleanup();
    }

    // Create the request promise with TTL
    const requestPromise = Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), ttl),
      ),
    ]).finally(() => {
      // Remove from pending requests when done
      this.pendingFunctions.delete(key);
    });

    // Store the promise
    this.pendingFunctions.set(key, requestPromise);
    this.requestCount++;

    return requestPromise;
  }

  /**
   * Clean up old requests (remove oldest half)
   */
  private cleanup(): void {
    // Clean up fetch requests
    const fetchEntries = Array.from(this.pendingRequests.entries());
    const fetchToRemove = fetchEntries.slice(
      0,
      Math.floor(fetchEntries.length / 2),
    );
    for (const [key] of fetchToRemove) {
      this.pendingRequests.delete(key);
    }

    // Clean up function requests
    const funcEntries = Array.from(this.pendingFunctions.entries());
    const funcToRemove = funcEntries.slice(
      0,
      Math.floor(funcEntries.length / 2),
    );
    for (const [key] of funcToRemove) {
      this.pendingFunctions.delete(key);
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
    this.pendingFunctions.clear();
    this.requestCount = 0;
  }

  /**
   * Get stats about the deduplicator
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      totalRequests: this.requestCount,
    };
  }

  /**
   * Static method for compatibility with services that expect the old interface
   */
  static async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
  ): Promise<T> {
    return dedupeAsyncCall(key, requestFn);
  }
}

// Global instance for the application
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Enhanced fetch with request deduplication
 */
export const dedupeFetch = (
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  return requestDeduplicator.dedupeFetch(url, options);
};

/**
 * Utility to deduplicate any async function call
 */
export const dedupeAsyncCall = <T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number,
): Promise<T> => {
  return requestDeduplicator.dedupeFunction(key, fn, ttl);
};

/**
 * Higher-order function to wrap API calls with deduplication
 */
export function withDeduplication<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyGenerator: (...args: TArgs) => string,
  ttl?: number,
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => {
    const key = keyGenerator(...args);
    return dedupeAsyncCall(key, () => fn(...args), ttl);
  };
}

/**
 * Create a deduplicated version of an API endpoint
 */
export function createDedupedEndpoint<TArgs extends unknown[], TReturn>(
  endpoint: (...args: TArgs) => Promise<TReturn>,
  keyGenerator: (...args: TArgs) => string,
  ttl: number = 30000,
) {
  return withDeduplication(endpoint, keyGenerator, ttl);
}
