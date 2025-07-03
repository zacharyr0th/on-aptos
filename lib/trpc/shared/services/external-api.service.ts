/**
 * External API Service
 * Provides utilities for making external API calls with retry logic and error handling
 */

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | FormData | null;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export class ExternalApiService {
  /**
   * Make an API request with retry logic
   */
  static async request<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      retries = 3,
      retryDelay = 1000,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return {
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('status: 4')) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * GET request helper
   */
  static async get<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<T>(url, { ...options, method: 'GET' });
    return response.data;
  }

  /**
   * POST request helper
   */
  static async post<T>(
    url: string,
    body: Record<string, unknown> | string | FormData | null,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'POST',
      body,
    });
    return response.data;
  }

  /**
   * Batch requests with concurrency control
   */
  static async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const request of requests) {
      const promise = request().then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Create a URL with query parameters
   */
  static buildUrl(
    baseUrl: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }
}

// Export common API endpoints
export const ApiEndpoints = {
  // CoinMarketCap
  CMC_BASE: 'https://pro-api.coinmarketcap.com/v1',

  // Panora
  PANORA_BASE: 'https://api.panora.exchange',

  // DeFiLlama
  DEFILLAMA_BASE: 'https://api.llama.fi',

  // Add more as needed
};
