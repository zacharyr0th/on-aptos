import { logger } from "@/lib/utils/logger";

type PendingRequest<T> = Promise<T>;

/**
 * Request deduplication to prevent multiple identical API calls
 */
export class RequestDeduplicator {
  private static pendingRequests = new Map<string, PendingRequest<any>>();

  /**
   * Deduplicate requests - if the same request is in flight, return the existing promise
   */
  static async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
  ): Promise<T> {
    // Check if we already have a pending request
    const pending = this.pendingRequests.get(key);
    if (pending) {
      logger.debug(`Request deduplication hit for key: ${key}`);
      return pending;
    }

    // Create new request and store it
    const request = requestFn()
      .then((result) => {
        // Clean up after successful request
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Clean up after failed request
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  static clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests
   */
  static getPendingCount(): number {
    return this.pendingRequests.size;
  }
}
