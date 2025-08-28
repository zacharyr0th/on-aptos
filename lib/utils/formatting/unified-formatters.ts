/**
 * Unified formatters - consolidates all formatting utilities
 * Eliminates duplication between btc/utils.ts, lst/utils.ts, and others
 */

import { UnifiedCache } from "../cache/unified-cache";
import {
  formatAmount,
  formatCurrency,
  formatNumber,
  convertRawTokenAmount,
  type Currency,
} from "../format";

// Shared format cache for memoization
const formatCache = new UnifiedCache<string>({ ttl: 30 * 60 * 1000 }); // 30 min cache

// Pre-computed common values for ultra-fast lookups
const commonPercentages = new Map([
  [0, "0.0%"],
  [100, "100.0%"],
  [50, "50.0%"],
  [25, "25.0%"],
  [75, "75.0%"],
  [10, "10.0%"],
  [90, "90.0%"],
]);

const commonNumbers = new Map([
  [0, "0"],
  [1, "1"],
  [100, "100"],
  [1000, "1,000"],
  [10000, "10,000"],
  [100000, "100,000"],
  [1000000, "1,000,000"],
]);

class UnifiedFormatters {
  /**
   * Generic token amount formatter with caching
   */
  static formatTokenAmount(
    value: number,
    symbol: string,
    decimals: number = 0,
    useCache: boolean = true,
  ): string {
    if (!Number.isFinite(value)) return "0";

    if (useCache) {
      const cacheKey = `${symbol.toLowerCase()}:${value.toFixed(decimals)}`;
      const cached = formatCache.get(cacheKey);
      if (cached) return cached;

      const result = formatAmount(value, symbol as Currency, { decimals });
      formatCache.set(cacheKey, result);
      return result;
    }

    return formatAmount(value, symbol as Currency, { decimals });
  }

  /**
   * Generic token amount with commas
   */
  static formatTokenAmountWithCommas(
    value: number,
    decimals: number = 0,
    useCache: boolean = true,
  ): string {
    if (!Number.isFinite(value)) return "0";

    const roundedValue = Math.round(value);

    // Check common values first
    if (decimals === 0 && commonNumbers.has(roundedValue)) {
      return commonNumbers.get(roundedValue)!;
    }

    if (useCache) {
      const cacheKey = `commas:${roundedValue}:${decimals}`;
      const cached = formatCache.get(cacheKey);
      if (cached) return cached;

      const result = formatNumber(value, { decimals, useGrouping: true });
      formatCache.set(cacheKey, result);
      return result;
    }

    return formatNumber(value, { decimals, useGrouping: true });
  }

  /**
   * Ultra-fast percentage formatting with pre-computed values
   */
  static formatPercentageFast(value: number, decimals: number = 1): string {
    if (!Number.isFinite(value)) return "0.0%";

    const rounded =
      Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // Check pre-computed common values
    if (decimals === 1 && commonPercentages.has(rounded)) {
      return commonPercentages.get(rounded)!;
    }

    const cacheKey = `pct:${rounded}:${decimals}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const result = `${rounded.toFixed(decimals)}%`;
    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format market cap with appropriate scaling
   */
  static formatMarketCap(
    value: number,
    compact: boolean = true,
    currency: Currency = "USD",
  ): string {
    if (!Number.isFinite(value) || value <= 0)
      return formatCurrency(0, currency);

    const cacheKey = `mcap:${Math.round(value / 1000)}:${compact}:${currency}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const result = formatCurrency(value, currency, { compact });
    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format token supply with appropriate scaling
   */
  static formatTokenSupply(
    supply: string | number,
    decimals: number = 8,
  ): string {
    const numericSupply =
      typeof supply === "string" ? parseFloat(supply) : supply;

    if (!Number.isFinite(numericSupply)) return "0";

    const adjustedSupply = numericSupply / Math.pow(10, decimals);
    const cacheKey = `supply:${Math.round(adjustedSupply)}:${decimals}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const result = formatNumber(adjustedSupply, {
      notation: "compact",
      maximumFractionDigits: 2,
    });
    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format balance with proper decimal handling
   */
  static formatBalance(
    amount: string | number,
    decimals: number,
    displayDecimals: number = 4,
    symbol?: string,
  ): string {
    const balance = convertRawTokenAmount(amount, decimals);

    if (balance === 0) return symbol ? `0 ${symbol}` : "0";

    const cacheKey = `balance:${balance}:${displayDecimals}:${symbol || ""}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    let result: string;
    if (balance < 0.001) {
      result = balance.toExponential(2);
    } else {
      result = formatNumber(balance, {
        maximumFractionDigits: displayDecimals,
      });
    }

    if (symbol) result += ` ${symbol}`;

    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format dollar amount with proper scaling
   */
  static formatDollarAmount(
    value: number,
    compact: boolean = false,
    minDisplayValue: number = 0.01,
  ): string {
    if (!Number.isFinite(value)) return "$0.00";

    if (Math.abs(value) < minDisplayValue && value !== 0) {
      return value > 0 ? `<$${minDisplayValue}` : `-<$${minDisplayValue}`;
    }

    const cacheKey = `dollar:${Math.round(value * 100)}:${compact}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const result = formatCurrency(value, "USD", { compact });
    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Format APY/percentage with proper bounds
   */
  static formatAPY(
    value: number,
    decimals: number = 2,
    suffix: string = "%",
  ): string {
    if (!Number.isFinite(value)) return `0.00${suffix}`;

    // Cap extreme values for display
    const cappedValue = Math.min(Math.max(value, -999), 9999);

    const cacheKey = `apy:${cappedValue}:${decimals}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    const result = `${cappedValue.toFixed(decimals)}${suffix}`;
    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Smart price formatting based on value magnitude
   */
  static formatSmartPrice(value: number, currency: Currency = "USD"): string {
    if (!Number.isFinite(value) || value <= 0)
      return formatCurrency(0, currency);

    const cacheKey = `smart:${value}:${currency}`;
    const cached = formatCache.get(cacheKey);
    if (cached) return cached;

    let result: string;
    if (value >= 1000) {
      // Large amounts - compact format
      result = formatCurrency(value, currency, { compact: true });
    } else if (value >= 1) {
      // Normal amounts - 2 decimal places
      result = formatCurrency(value, currency, { decimals: 2 });
    } else if (value >= 0.01) {
      // Small amounts - 4 decimal places
      result = formatCurrency(value, currency, { decimals: 4 });
    } else {
      // Very small amounts - 6 decimal places
      result = formatCurrency(value, currency, { decimals: 6 });
    }

    formatCache.set(cacheKey, result);
    return result;
  }

  /**
   * Clear formatting cache
   */
  static clearCache(): void {
    formatCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return formatCache.getStats();
  }
}

// Asset-specific formatters using the unified system
class AssetFormatters {
  // BTC formatters
  static formatBTCAmount = (value: number) =>
    UnifiedFormatters.formatTokenAmount(value, "BTC", 0);

  static formatBTCAmountWithCommas = (value: number) =>
    UnifiedFormatters.formatTokenAmountWithCommas(value, 0);

  // APT formatters
  static formatAPTAmount = (value: number) =>
    UnifiedFormatters.formatTokenAmount(value, "APT", 0);

  static formatAPTAmountWithCommas = (value: number) =>
    UnifiedFormatters.formatTokenAmountWithCommas(value, 0);

  // Generic token formatters
  static formatTokenAmount = (
    value: number,
    symbol: string,
    decimals: number = 0,
  ) => UnifiedFormatters.formatTokenAmount(value, symbol, decimals);

  static formatTokenAmountWithCommas = (value: number, decimals: number = 0) =>
    UnifiedFormatters.formatTokenAmountWithCommas(value, decimals);
}

// Convenience exports for backward compatibility
export const formatBTCAmount = AssetFormatters.formatBTCAmount;
export const formatBTCAmountWithCommas =
  AssetFormatters.formatBTCAmountWithCommas;
export const formatAPTAmount = AssetFormatters.formatAPTAmount;
export const formatAPTAmountWithCommas =
  AssetFormatters.formatAPTAmountWithCommas;

// New unified exports
export const {
  formatTokenAmount,
  formatTokenAmountWithCommas,
  formatPercentageFast,
  formatMarketCap,
  formatTokenSupply,
  formatBalance,
  formatDollarAmount,
  formatAPY,
  formatSmartPrice,
  clearCache: clearFormatCache,
  getCacheStats: getFormatCacheStats,
} = UnifiedFormatters;

// Export the classes for direct use (single export)
export { UnifiedFormatters, AssetFormatters };

// Re-export base formatting utilities for compatibility
export {
  formatAmount,
  formatCurrency,
  formatNumber,
  convertRawTokenAmount,
  type Currency,
} from "../format";
