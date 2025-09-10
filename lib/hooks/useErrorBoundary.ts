import { useCallback, useEffect, useState } from "react";
import { errorLogger } from "@/lib/utils/core/logger";

interface ErrorBoundaryState {
  error: Error | null;
  resetErrorBoundary: () => void;
  throwError: (error: Error) => void;
}

/**
 * Hook for implementing error boundaries in functional components
 * Provides error state management and automatic error logging
 */
export function useErrorBoundary(): ErrorBoundaryState {
  const [error, setError] = useState<Error | null>(null);

  const resetErrorBoundary = useCallback(() => {
    setError(null);
  }, []);

  const throwError = useCallback((error: Error) => {
    errorLogger.error("Error boundary caught:", error);
    setError(error);
  }, []);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { error, resetErrorBoundary, throwError };
}

/**
 * Hook for async error handling with retry logic
 */
export function useAsyncError() {
  const { throwError } = useErrorBoundary();

  return useCallback(
    (error: Error) => {
      throwError(error);
    },
    [throwError]
  );
}
