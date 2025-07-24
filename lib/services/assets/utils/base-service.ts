import { getCachedData, setCachedData } from '@/lib/utils/cache-manager';
import { logger } from '@/lib/utils/logger';

import { CACHE_TTL, RETRY_CONFIG, SERVICE_DEFAULTS } from '../constants';
import type { ServiceConfig } from '../types';

export abstract class BaseAssetService {
  protected static config: ServiceConfig = {
    cacheEnabled: SERVICE_DEFAULTS.CACHE_ENABLED,
    cacheTTL: CACHE_TTL.DEFAULT,
    fallbackEnabled: SERVICE_DEFAULTS.FALLBACK_ENABLED,
    retryAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
    timeout: SERVICE_DEFAULTS.TIMEOUT,
  };

  /**
   * Get data with caching support
   */
  protected static async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (this.config.cacheEnabled) {
      try {
        // Use 'apiService' as the default cache instance for asset services
        const cached = getCachedData<T>('apiService', cacheKey);
        if (cached) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return cached;
        }
      } catch (error) {
        logger.warn('Cache read error:', error);
      }
    }

    // Fetch fresh data
    const data = await this.retryWithBackoff(fetchFn);

    // Cache the result
    if (this.config.cacheEnabled && data) {
      try {
        setCachedData('apiService', cacheKey, data);
      } catch (error) {
        logger.warn('Cache write error:', error);
      }
    }

    return data;
  }

  /**
   * Retry a function with exponential backoff
   */
  protected static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.config.retryAttempts) {
        throw error;
      }

      const delay = Math.min(
        RETRY_CONFIG.BASE_DELAY *
          Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1),
        RETRY_CONFIG.MAX_DELAY
      );

      logger.warn(
        `Retry attempt ${attempt}/${this.config.retryAttempts} after ${delay}ms`
      );
      await this.sleep(delay);

      return this.retryWithBackoff(fn, attempt + 1);
    }
  }

  /**
   * Execute with timeout
   */
  protected static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.config.timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Execute multiple operations with fallback
   */
  protected static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await primary();
    } catch (primaryError) {
      if (!this.config.fallbackEnabled) {
        throw primaryError;
      }

      logger.warn('Primary operation failed, trying fallback:', primaryError);

      try {
        return await fallback();
      } catch (fallbackError) {
        logger.error('Both primary and fallback failed:', {
          primary: primaryError,
          fallback: fallbackError,
        });
        throw primaryError; // Throw original error
      }
    }
  }

  /**
   * Batch process items with rate limiting
   */
  protected static async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize = 10,
    delayMs = 100
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      if (i + batchSize < items.length) {
        await this.sleep(delayMs);
      }
    }

    return results;
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log service metrics
   */
  protected static logMetrics(
    operation: string,
    startTime: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const duration = Date.now() - startTime;

    logger.info('Service operation completed', {
      service: this.name,
      operation,
      success,
      duration,
      ...metadata,
    });
  }
}
