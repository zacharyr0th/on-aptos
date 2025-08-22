/**
 * Shared portfolio utilities for common functions
 */

/**
 * Generate daily timestamps at noon UTC
 */
export function generateDailyTimestamps(days: number): string[] {
  const timestamps: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setUTCHours(12, 0, 0, 0); // Noon UTC
    timestamps.push(date.toISOString());
  }

  return timestamps;
}

/**
 * Standard GraphQL query for historical activities
 */
export const HISTORICAL_ACTIVITIES_QUERY = `
  query GetHistoricalActivities($ownerAddress: String!, $startTime: timestamp!) {
    fungible_asset_activities(
      where: { 
        owner_address: { _eq: $ownerAddress },
        transaction_timestamp: { _gte: $startTime }
      }
      order_by: { transaction_timestamp: asc }
    ) {
      transaction_timestamp
      type
      amount
      asset_type
      is_transaction_success
    }
  }
`;

/**
 * Portfolio history data point interface
 */
export interface PortfolioHistoryPoint {
  date: string;
  totalValue: number;
  assets: Array<{
    assetType: string;
    symbol: string;
    balance: number;
    price: number;
    value: number;
  }>;
  rateLimited?: boolean;
}

/**
 * Portfolio history hook result interface
 */
export interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Retry utilities with different backoff strategies
 */
export interface RetryOptions {
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential";
  baseDelay: number;
  onRetry?: (attempt: number, error: Record<string, unknown>) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxAttempts, backoffStrategy, baseDelay, onRetry } = options;
  let lastError: Record<string, unknown>;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const delay =
          backoffStrategy === "exponential"
            ? Math.pow(2, attempt) * baseDelay
            : (attempt + 1) * baseDelay;

        await new Promise((resolve) => setTimeout(resolve, delay));
        onRetry?.(attempt + 1, lastError);
      }

      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw lastError;
}
