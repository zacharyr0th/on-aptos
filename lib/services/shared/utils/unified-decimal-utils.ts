import { DECIMALS, PORTFOLIO_THRESHOLDS } from "@/lib/constants";
import { TokenRegistry } from "./token-registry";

/**
 * Unified decimal and balance conversion utilities
 * Consolidates all decimal handling logic across the portfolio services
 */

export interface ConversionOptions {
  decimals?: number;
  minDisplayThreshold?: number;
  minValueThreshold?: number;
  roundingPrecision?: number;
}

export interface FormattedBalance {
  raw: string;
  formatted: number;
  display: string;
  isAboveThreshold: boolean;
  isDust: boolean;
}

export interface TokenValue {
  balance: number;
  price: number;
  value: number;
  formattedValue: string;
  isSignificant: boolean;
}

// Cache for decimal conversions
const conversionCache = new Map<string, number>();
const CONVERSION_CACHE_SIZE = 500;

export class UnifiedDecimalUtils {
  /**
   * Convert raw amount to decimal format - OPTIMIZED
   */
  static convertToDecimal(amount: string | number, options: ConversionOptions = {}): number {
    // Early return for zero/invalid
    if (!amount || amount === "0" || amount === 0) return 0;

    const decimals = options.decimals || DECIMALS.DEFAULT;

    // Check cache
    const cacheKey = `${amount}-${decimals}`;
    const cached = conversionCache.get(cacheKey);
    if (cached !== undefined) return cached;

    // Convert to number efficiently
    const value = typeof amount === "string" ? +amount : amount;
    if (isNaN(value)) return 0;

    // Use bit shifting for power of 2 decimals when possible
    const result = decimals === 8 ? value / 100000000 : value / 10 ** decimals;

    // Cache result
    if (conversionCache.size > CONVERSION_CACHE_SIZE) {
      const firstKey = conversionCache.keys().next().value;
      if (firstKey !== undefined) {
        conversionCache.delete(firstKey);
      }
    }
    conversionCache.set(cacheKey, result);

    return result;
  }

  /**
   * Convert decimal amount back to raw format
   */
  static convertFromDecimal(amount: number, options: ConversionOptions = {}): string {
    const decimals = options.decimals || DECIMALS.DEFAULT;
    const rawValue = amount * 10 ** decimals;
    return Math.floor(rawValue).toString();
  }

  /**
   * Format balance with thresholds and display logic
   */
  static formatBalance(
    amount: string | number,
    tokenAddress?: string,
    symbol?: string,
    options: ConversionOptions = {}
  ): FormattedBalance {
    // Determine decimals from token registry or use provided/default
    const decimals =
      options.decimals ||
      (tokenAddress ? TokenRegistry.getTokenDecimals(tokenAddress, symbol) : DECIMALS.DEFAULT);

    const minDisplayThreshold =
      options.minDisplayThreshold || PORTFOLIO_THRESHOLDS.MIN_BALANCE_DISPLAY;

    const rawAmount = typeof amount === "string" ? amount : amount.toString();
    const formattedBalance = UnifiedDecimalUtils.convertToDecimal(rawAmount, { decimals });

    const isAboveThreshold = formattedBalance >= minDisplayThreshold;
    const isDust = formattedBalance > 0 && formattedBalance < minDisplayThreshold;

    // Apply threshold - show 0 if below minimum
    const displayBalance = isAboveThreshold ? formattedBalance : 0;

    return {
      raw: rawAmount,
      formatted: displayBalance,
      display: UnifiedDecimalUtils.formatNumber(displayBalance, options.roundingPrecision),
      isAboveThreshold,
      isDust,
    };
  }

  /**
   * Calculate token value (balance * price) with thresholds
   */
  static calculateTokenValue(
    balance: number,
    price: number,
    options: ConversionOptions = {}
  ): TokenValue {
    const minValueThreshold = options.minValueThreshold || PORTFOLIO_THRESHOLDS.MIN_VALUE_USD;
    const rawValue = balance * price;

    // Apply value threshold
    const value = rawValue >= minValueThreshold ? rawValue : 0;
    const isSignificant = rawValue >= minValueThreshold;

    return {
      balance,
      price,
      value,
      formattedValue: UnifiedDecimalUtils.formatUSD(value),
      isSignificant,
    };
  }

  /**
   * Format number with specified precision
   */
  static formatNumber(
    value: number,
    precision: number = 6,
    options: {
      useGrouping?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    } = {}
  ): string {
    const {
      useGrouping = true,
      minimumFractionDigits = 0,
      maximumFractionDigits = precision,
    } = options;

    // Handle very small numbers
    if (Math.abs(value) < 10 ** -precision && value !== 0) {
      return `< ${10 ** -precision}`;
    }

    // Handle very large numbers
    if (Math.abs(value) >= 1e9) {
      return UnifiedDecimalUtils.formatLargeNumber(value);
    }

    return new Intl.NumberFormat("en-US", {
      useGrouping,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }

  /**
   * Format USD currency values
   */
  static formatUSD(
    value: number,
    options: {
      showCents?: boolean;
      compact?: boolean;
      minimumValue?: number;
    } = {}
  ): string {
    const { showCents = true, compact = false, minimumValue = 0.01 } = options;

    // Handle zero and very small values
    if (value === 0) return "$0.00";
    if (Math.abs(value) < minimumValue) {
      return `< $${minimumValue}`;
    }

    // Use compact notation for large values
    if (compact && Math.abs(value) >= 1e6) {
      return UnifiedDecimalUtils.formatCompactUSD(value);
    }

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    });

    return formatter.format(value);
  }

  /**
   * Format percentage values
   */
  static formatPercentage(
    value: number,
    options: {
      precision?: number;
      showSign?: boolean;
      showPlusSign?: boolean;
    } = {}
  ): string {
    const { precision = 2, showSign = true, showPlusSign = true } = options;

    const sign = showSign ? (value >= 0 && showPlusSign ? "+" : "") : "";
    const formattedValue = UnifiedDecimalUtils.formatNumber(value, precision);

    return `${sign}${formattedValue}%`;
  }

  /**
   * Round to specified number of decimal places
   */
  static roundToDecimals(value: number, decimals: number = 6): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  /**
   * Check if value is considered "dust" (above 0 but below display threshold)
   */
  static isDustValue(
    balance: number,
    price: number = 0,
    thresholds: {
      minBalance?: number;
      minValue?: number;
    } = {}
  ): boolean {
    const minBalance = thresholds.minBalance || PORTFOLIO_THRESHOLDS.MIN_BALANCE_DISPLAY;
    const minValue = thresholds.minValue || PORTFOLIO_THRESHOLDS.MIN_VALUE_USD;

    const value = balance * price;

    return (balance > 0 && balance < minBalance) || (value > 0 && value < minValue);
  }

  /**
   * Batch format multiple balances efficiently
   */
  static batchFormatBalances(
    balances: Array<{
      amount: string | number;
      tokenAddress?: string;
      symbol?: string;
      price?: number;
    }>,
    options: ConversionOptions = {}
  ): Array<FormattedBalance & { value?: TokenValue }> {
    return balances.map(({ amount, tokenAddress, symbol, price }) => {
      const formattedBalance = UnifiedDecimalUtils.formatBalance(
        amount,
        tokenAddress,
        symbol,
        options
      );

      const result = { ...formattedBalance } as FormattedBalance & {
        value?: TokenValue;
      };

      if (price !== undefined && price > 0) {
        result.value = UnifiedDecimalUtils.calculateTokenValue(
          formattedBalance.formatted,
          price,
          options
        );
      }

      return result;
    });
  }

  /**
   * Get appropriate decimal places for a token
   */
  static getOptimalPrecision(value: number, _tokenAddress?: string, _symbol?: string): number {
    // Very small values need more precision
    if (Math.abs(value) < 0.001) return 8;
    if (Math.abs(value) < 0.01) return 6;
    if (Math.abs(value) < 1) return 4;
    if (Math.abs(value) < 1000) return 2;

    // Large values need less precision
    return 0;
  }

  /**
   * Parse user input to decimal amount
   */
  static parseUserInput(
    input: string,
    tokenAddress?: string,
    symbol?: string
  ): {
    isValid: boolean;
    value: number;
    rawAmount: string;
    error?: string;
  } {
    try {
      // Clean input
      const cleaned = input.replace(/,/g, "").trim();

      if (!cleaned || cleaned === ".") {
        return {
          isValid: false,
          value: 0,
          rawAmount: "0",
          error: "Invalid input",
        };
      }

      const value = parseFloat(cleaned);

      if (isNaN(value) || value < 0) {
        return {
          isValid: false,
          value: 0,
          rawAmount: "0",
          error: "Invalid number",
        };
      }

      const decimals = tokenAddress
        ? TokenRegistry.getTokenDecimals(tokenAddress, symbol)
        : DECIMALS.DEFAULT;
      const rawAmount = UnifiedDecimalUtils.convertFromDecimal(value, { decimals });

      return {
        isValid: true,
        value,
        rawAmount,
      };
    } catch {
      return {
        isValid: false,
        value: 0,
        rawAmount: "0",
        error: "Parse error",
      };
    }
  }

  /**
   * Format large numbers with K/M/B notation
   */
  private static formatLargeNumber(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (abs >= 1e12) {
      return `${sign}${(abs / 1e12).toFixed(1)}T`;
    } else if (abs >= 1e9) {
      return `${sign}${(abs / 1e9).toFixed(1)}B`;
    } else if (abs >= 1e6) {
      return `${sign}${(abs / 1e6).toFixed(1)}M`;
    } else if (abs >= 1e3) {
      return `${sign}${(abs / 1e3).toFixed(1)}K`;
    }

    return UnifiedDecimalUtils.formatNumber(value, 2);
  }

  /**
   * Format compact USD notation
   */
  private static formatCompactUSD(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (abs >= 1e12) {
      return `${sign}$${(abs / 1e12).toFixed(1)}T`;
    } else if (abs >= 1e9) {
      return `${sign}$${(abs / 1e9).toFixed(1)}B`;
    } else if (abs >= 1e6) {
      return `${sign}$${(abs / 1e6).toFixed(1)}M`;
    }

    return UnifiedDecimalUtils.formatUSD(value);
  }

  /**
   * Compare two decimal values with tolerance
   */
  static isEqual(a: number, b: number, tolerance: number = 1e-8): boolean {
    return Math.abs(a - b) < tolerance;
  }

  /**
   * Clamp value between min and max
   */
  static clamp(
    value: number,
    min: number = Number.MIN_SAFE_INTEGER,
    max: number = Number.MAX_SAFE_INTEGER
  ): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get formatted range string (e.g., "1.234 - 5.678")
   */
  static formatRange(min: number, max: number, precision: number = 3): string {
    if (UnifiedDecimalUtils.isEqual(min, max)) {
      return UnifiedDecimalUtils.formatNumber(min, precision);
    }

    const formattedMin = UnifiedDecimalUtils.formatNumber(min, precision);
    const formattedMax = UnifiedDecimalUtils.formatNumber(max, precision);

    return `${formattedMin} - ${formattedMax}`;
  }
}
