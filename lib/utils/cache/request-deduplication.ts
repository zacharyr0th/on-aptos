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
      // Wait for the cached response data and create a new Response for this consumer
      const cachedPromise = this.pendingRequests.get(key) as Promise<any>;
      const responseData = await cachedPromise;
      
      // If it's a response data object, create a new Response
      if (responseData && typeof responseData === 'object' && 'body' in responseData) {
        return new Response(responseData.body, {
          status: responseData.status,
          statusText: responseData.statusText,
          headers: new Headers(responseData.headers),
        });
      }
      
      // Fallback for backward compatibility
      return responseData;
    }

    // Clean up cache if it gets too large
    if (this.pendingRequests.size >= this.maxCacheSize) {
      this.cleanup();
    }

    // Create the request promise that stores response data
    const requestPromise = fetch(url, options)
      .then(async (response) => {
        // Store the response data to allow multiple consumers
        const responseData = {
          body: await response.text(),
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };
        
        // Store the data, not a Response object
        return responseData;
      })
      .catch((error) => {
        // Remove from cache on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);
    this.requestCount++;

    // For the first requester, wait for the data and create a Response
    const responseData = await requestPromise;
    
    // Clean up after completion
    setTimeout(() => {
      this.pendingRequests.delete(key);
    }, 100); // Small delay to allow other consumers to get the cached data
    
    return new Response(responseData.body, {
      status: responseData.status,
      statusText: responseData.statusText,
      headers: new Headers(responseData.headers),
    });
  }

  /**
   * Deduplicates generic async functions
   */
  async dedupeFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 30000 // 30 seconds default TTL
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
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), ttl)),
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
  static async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    return dedupeAsyncCall(key, requestFn);
  }
}

// Global instance for the application
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Enhanced fetch with request deduplication
 */
export const dedupeFetch = (url: string, options?: RequestInit): Promise<Response> => {
  return requestDeduplicator.dedupeFetch(url, options);
};

/**
 * Utility to deduplicate any async function call
 */
export const dedupeAsyncCall = <T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> => {
  return requestDeduplicator.dedupeFunction(key, fn, ttl);
};

/**
 * Higher-order function to wrap API calls with deduplication
 */
export function withDeduplication<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyGenerator: (...args: TArgs) => string,
  ttl?: number
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
  ttl: number = 30000
) {
  return withDeduplication(endpoint, keyGenerator, ttl);
}
