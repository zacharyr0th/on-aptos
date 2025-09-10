import { toast } from "sonner";
import { logger } from "@/lib/utils/core/logger";

// Common utility functions for all asset pages

/**
 * Truncate address for display
 */
export const truncateAddress = (address: string): string => {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

/**
 * Copy text to clipboard with toast notification
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch (error) {
    logger.error("Failed to copy to clipboard", { error });
    toast.error("Failed to copy");
  }
};

/**
 * Performance measurement utility
 */
export const measurePerformance = <T>(fn: () => T, label?: string): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const logLabel = label ? `${label}: ` : "Performance: ";
  logger.debug(`${logLabel}${end - start}ms`);
  return result;
};

/**
 * Format market share percentage
 */
export const formatMarketShare = (value: number, total: number): string => {
  if (total === 0) return "0.00";
  const percentage = (value / total) * 100;
  return percentage < 0.01 ? "<0.01" : percentage.toFixed(2);
};

/**
 * Safe parse number with fallback
 */
export const safeParseFloat = (value: string | number, fallback = 0): number => {
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * 2 ** i;
        logger.debug(`Retry attempt ${i + 1} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format token value with proper decimals
 */
export const formatTokenValue = (
  value: string | number,
  decimals: number,
  displayDecimals = 2
): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "0";

  const adjustedValue = numValue / 10 ** decimals;

  if (adjustedValue < 0.01 && adjustedValue > 0) {
    return "<0.01";
  }

  return adjustedValue.toFixed(displayDecimals);
};

/**
 * Sort tokens by market share
 */
export const sortByMarketShare = <T extends { value: number }>(items: T[]): T[] => {
  return [...items].sort((a, b) => b.value - a.value);
};

/**
 * Calculate total value from array of items
 */
export const calculateTotal = <T extends { value: number }>(items: T[]): number => {
  return items.reduce((sum, item) => sum + item.value, 0);
};
