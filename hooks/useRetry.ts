import { useState, useCallback, useRef } from "react";
import { logger } from "@/lib/utils/core/logger";

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: "linear" | "exponential";
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  attempt: number;
  retry: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing async operations with automatic retry logic
 * Supports exponential backoff and customizable retry strategies
 */
export function useRetry<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {},
): RetryState<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = "exponential",
    onRetry,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setAttempt(0);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const execute = useCallback(
    async (attemptNumber: number = 1): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setAttempt(attemptNumber);

      // Create new abort controller for this attempt
      abortControllerRef.current = new AbortController();

      try {
        const result = await asyncFn();

        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        setData(result);
        setError(null);
      } catch (err) {
        const error = err as Error;

        // Don't retry if manually aborted
        if (error.name === "AbortError") {
          return;
        }

        logger.warn(`Attempt ${attemptNumber} failed:`, error);

        if (attemptNumber < maxAttempts) {
          // Calculate delay based on backoff strategy
          const retryDelay =
            backoff === "exponential"
              ? delay * Math.pow(2, attemptNumber - 1)
              : delay * attemptNumber;

          // Call onRetry callback if provided
          onRetry?.(attemptNumber, error);

          // Schedule retry
          timeoutRef.current = setTimeout(() => {
            execute(attemptNumber + 1);
          }, retryDelay);
        } else {
          // Max attempts reached
          setError(error);
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [asyncFn, maxAttempts, delay, backoff, onRetry],
  );

  const retry = useCallback(() => execute(1), [execute]);

  return {
    data,
    error,
    isLoading,
    attempt,
    retry,
    reset,
  };
}

/**
 * Hook for simple retry without state management
 * Returns a function that retries the given async function
 */
export function useRetryFn<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {},
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { maxAttempts = 3, delay = 1000, backoff = "exponential" } = options;

  return useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          lastError = error as Error;

          if (attempt < maxAttempts) {
            const retryDelay =
              backoff === "exponential"
                ? delay * Math.pow(2, attempt - 1)
                : delay * attempt;

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      throw lastError;
    },
    [fn, maxAttempts, delay, backoff],
  );
}
