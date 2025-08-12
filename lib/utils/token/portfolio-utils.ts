/**
 * Shared portfolio utilities for common functions
 */

/**
 * Extract symbol from asset type
 */
export function getSymbolFromAssetType(assetType: string): string {
  if (assetType === "0x1::aptos_coin::AptosCoin" || assetType === "0xa")
    return "APT";
  if (assetType.includes("USDC")) return "USDC";
  if (assetType.includes("USDT")) return "USDT";

  const parts = assetType.split("::");
  return parts[parts.length - 1]?.replace(/[<>]/g, "") || "Unknown";
}

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
 * Get proper decimals for asset types
 */
export function getAssetDecimals(assetType: string): number {
  if (assetType.includes("USDC")) return 6;
  if (assetType.includes("USDT")) return 6;
  return 8; // Default for APT and most tokens
}

/**
 * Check if asset type is APT
 */
export function isAptAsset(assetType: string): boolean {
  return (
    assetType === "0x1::aptos_coin::AptosCoin" ||
    assetType === "0xa" ||
    assetType ===
      "0x000000000000000000000000000000000000000000000000000000000000000a" ||
    assetType.toLowerCase().includes("aptos") ||
    assetType.toLowerCase().includes("apt")
  );
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
    coin_activities(
      where: { 
        owner_address: { _eq: $ownerAddress },
        transaction_timestamp: { _gte: $startTime }
      }
      order_by: { transaction_timestamp: asc }
    ) {
      transaction_timestamp
      activity_type
      amount
      coin_type
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

// Duplicate exports removed - use from core modules instead
// - RetryOptions and withRetry: use from core/types
// - validateWalletAddress: use from core/validation  
// - createErrorResponse/createSuccessResponse: use from api/response-builder
