/**
 * Request deduplication utility to prevent duplicate concurrent requests
 * This helps prevent multiple identical API calls from being made simultaneously
 */

type RequestKey = string;
type RequestPromise<T = unknown> = Promise<T>;

export class RequestDeduplicator {
  private pendingRequests = new Map<RequestKey, RequestPromise>();
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
      return this.pendingRequests.get(key) as Promise<Response>;
    }

    // Clean up cache if it gets too large
    if (this.pendingRequests.size >= this.maxCacheSize) {
      this.cleanup();
    }

    // Create the request promise
    const requestPromise = fetch(url, options)
      .then(async (response) => {
        // For successful responses, cache the body content
        if (response.ok) {
          const responseText = await response.text();
          // Create a new Response with the cached body for each consumer
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        // For error responses, just clone as before
        return response.clone();
      })
      .finally(() => {
        // Remove from pending requests when done
        this.pendingRequests.delete(key);
      });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);
    this.requestCount++;

    return requestPromise;
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
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Clean up cache if it gets too large
    if (this.pendingRequests.size >= this.maxCacheSize) {
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
      this.pendingRequests.delete(key);
    });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);
    this.requestCount++;

    return requestPromise;
  }

  /**
   * Clean up old requests (remove oldest half)
   */
  private cleanup(): void {
    const entries = Array.from(this.pendingRequests.entries());
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));

    for (const [key] of toRemove) {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
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
