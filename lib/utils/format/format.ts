/**
 * Unified formatting utilities
 * Combines the best features from both format.ts and formatting.ts
 */

import { errorLogger, logger } from "@/lib/utils/core/logger";

// Types
export type Currency = string;
export type FiatCurrency =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CHF"
  | "CNY"
  | "HKD"
  | "SGD"
  | "INR"
  | "MXN"
  | "BRL"
  | "RUB"
  | "ZAR"
  | "TRY"
  | "NZD"
  | "KRW"
  | "SEK"
  | "NOK"
  | "DKK"
  | "PLN"
  | "THB"
  | "IDR"
  | "MYR"
  | "PHP";

// Constants
const SUPPORTED_FIATS: readonly FiatCurrency[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "HKD",
  "SGD",
  "INR",
  "MXN",
  "BRL",
  "RUB",
  "ZAR",
  "TRY",
  "NZD",
  "KRW",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "THB",
  "IDR",
  "MYR",
  "PHP",
];

// Memoization cache for expensive formatting operations
const formatCache = new Map<string, string>();
const CACHE_SIZE_LIMIT = 1000;

function getCacheKey(type: string, value: number | string, ...args: any[]): string {
  return `${type}:${value}:${JSON.stringify(args)}`;
}

function cleanupCache() {
  if (formatCache.size > CACHE_SIZE_LIMIT) {
    const entries = Array.from(formatCache.entries());
    formatCache.clear();
    entries.slice(-CACHE_SIZE_LIMIT / 2).forEach(([key, value]) => {
      formatCache.set(key, value);
    });
  }
}

/**
 * Check if a currency is a fiat currency
 */
export function isFiatCurrency(currency: string): currency is FiatCurrency {
  return (SUPPORTED_FIATS as readonly string[]).includes(currency.toUpperCase());
}

/**
 * Format numbers in compact notation (1.2B, 1.5M, etc.)
 * Optimized for financial displays
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return "$0";

  const cacheKey = getCacheKey("compact", value);
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Use Intl.NumberFormat for proper compact notation
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(value);

    // Clean up .0 from whole numbers (1.0B -> 1B)
    const cleaned = formatted.replace(/\.0([KMBT])/, "$1");

    formatCache.set(cacheKey, cleaned);
    cleanupCache();
    return cleaned;
  } catch (error) {
    errorLogger.warn("Compact number formatting failed:", error);
    return `$${value.toFixed(0)}`;
  }
}

/**
 * Enhanced currency formatting with multiple options
 */
export function formatCurrency(
  amount: number,
  currencyCode: Currency | string = "USD",
  options: {
    compact?: boolean;
    showSymbol?: boolean;
    decimals?: number;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }

  const cacheKey = getCacheKey("currency", amount, currencyCode, options);
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }

  const {
    compact = false,
    showSymbol = true,
    decimals,
    minimumFractionDigits = 0,
    maximumFractionDigits = decimals ?? 2,
  } = options;

  const code = currencyCode.toUpperCase();

  // Auto-compact for large numbers
  const absAmount = Math.abs(amount);

  // Default behavior: auto-compact for $1000+
  const shouldCompact = compact !== false && absAmount >= 1000;

  if (shouldCompact) {
    let result: string;

    if (absAmount >= 1_000_000_000) {
      const billions = amount / 1_000_000_000;
      const formatted = billions.toFixed(1).replace(/\.0$/, "");
      result = showSymbol && isFiatCurrency(code) ? `$${formatted}b` : `${formatted}b ${code}`;
    } else if (absAmount >= 1_000_000) {
      const millions = amount / 1_000_000;
      const formatted = millions.toFixed(1).replace(/\.0$/, "");
      result = showSymbol && isFiatCurrency(code) ? `$${formatted}m` : `${formatted}m ${code}`;
    } else if (absAmount >= 1_000) {
      const thousands = amount / 1_000;
      const formatted = thousands.toFixed(1).replace(/\.0$/, "");
      result = showSymbol && isFiatCurrency(code) ? `$${formatted}k` : `${formatted}k ${code}`;
    } else {
      // This shouldn't happen, but just in case
      result = formatFullNumber();
    }

    formatCache.set(cacheKey, result);
    cleanupCache();
    return result;
  }

  // For amounts under $1000 or when compact is explicitly false
  function formatFullNumber(): string {
    // Use specified decimals, or default to 2 for currency under $1000, 0 for larger amounts
    const defaultMinFrac = absAmount < 1000 ? 2 : 0;
    const defaultMaxFrac = absAmount < 1000 ? 2 : 2;

    const minFrac = minimumFractionDigits ?? (decimals !== undefined ? decimals : defaultMinFrac);
    const maxFrac = maximumFractionDigits ?? (decimals !== undefined ? decimals : defaultMaxFrac);

    if (isFiatCurrency(code) && showSymbol) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
      }).format(amount);
    } else {
      const formatted = new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
        useGrouping: true,
      }).format(amount);
      return showSymbol && code !== "USD" ? `${formatted} ${code}` : formatted;
    }
  }

  const result = formatFullNumber();

  formatCache.set(cacheKey, result);
  cleanupCache();
  return result;
}

/**
 * Format percentage with proper handling
 */
export function formatPercentage(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSign?: boolean;
    decimals?: number; // Shorthand for min/max fraction digits
  }
): string {
  const cacheKey = getCacheKey("percentage", value, options);
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }

  const {
    minimumFractionDigits = options?.decimals ?? 0,
    maximumFractionDigits = options?.decimals ?? 2,
    showSign = false,
  } = options || {};

  const result = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? "always" : "auto",
  }).format(value / 100);

  formatCache.set(cacheKey, result);
  cleanupCache();
  return result;
}

/**
 * Format currency for mobile display with aggressive truncation
 * Used specifically for mobile BTC values (e.g., $50000000 → $50M)
 */
export function formatCurrencyMobile(
  amount: number,
  currencyCode: Currency | string = "USD"
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }

  const absAmount = Math.abs(amount);
  const code = currencyCode.toUpperCase();

  if (absAmount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    const formatted =
      billions >= 100 ? Math.round(billions).toString() : billions.toFixed(1).replace(/\.0$/, "");
    return isFiatCurrency(code) ? `$${formatted}B` : `${formatted}B ${code}`;
  } else if (absAmount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted =
      millions >= 100 ? Math.round(millions).toString() : millions.toFixed(1).replace(/\.0$/, "");
    return isFiatCurrency(code) ? `$${formatted}M` : `${formatted}M ${code}`;
  } else if (absAmount >= 1_000) {
    const thousands = amount / 1_000;
    const formatted =
      thousands >= 100
        ? Math.round(thousands).toString()
        : thousands.toFixed(1).replace(/\.0$/, "");
    return isFiatCurrency(code) ? `$${formatted}K` : `${formatted}K ${code}`;
  } else {
    // For amounts under $1000, show with minimal decimals
    return isFiatCurrency(code)
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      : Math.round(amount).toString();
  }
}

/**
 * Format amount with currency symbol or code - COMPACT VERSION
 * This is the MAIN function for general use (cards, tables, lists)
 * Rules:
 * - Under $1000: Show full number with 2 decimals (e.g., $999.99)
 * - $1000+: Show as 1.2k
 * - $1M+: Show as 1.2m
 * - $1B+: Show as 1.2b
 */
export function formatAmount(
  amount: number,
  currencyCode: Currency | string = "USD",
  options?: {
    compact?: boolean;
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  // Default to compact=true to enforce the rules
  return formatCurrency(amount, currencyCode, {
    compact: true,
    ...options,
  });
}

/**
 * Format amount with FULL number - NO ABBREVIATIONS
 * Use this for value bars at the top of pages and important totals
 * Always shows the complete number with proper comma separators
 */
export function formatAmountFull(
  amount: number,
  currencyCode: Currency | string = "USD",
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  // Force compact=false to show full numbers
  return formatCurrency(amount, currencyCode, {
    compact: false,
    showSymbol: true,
    ...options,
  });
}

/**
 * Format large numbers with automatic abbreviation
 * Use this for any numeric display (not just currency)
 */
export function formatLargeNumber(value: number, decimals: number = 1): string {
  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return billions.toFixed(decimals).replace(/\.0$/, "") + "b";
  } else if (absValue >= 1_000_000) {
    const millions = value / 1_000_000;
    return millions.toFixed(decimals).replace(/\.0$/, "") + "m";
  } else if (absValue >= 1_000) {
    const thousands = value / 1_000;
    return thousands.toFixed(decimals).replace(/\.0$/, "") + "k";
  }

  // Under 1000, use specified decimals or default to 2
  return value.toFixed(decimals >= 0 ? decimals : 2);
}

/**
 * Format number with locale and options
 */
export function formatNumber(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    notation?: "standard" | "scientific" | "engineering" | "compact";
    compactDisplay?: "short" | "long";
    useGrouping?: boolean;
    decimals?: number; // Shorthand for min/max fraction digits
  }
): string {
  const cacheKey = getCacheKey("number", value, options);
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }

  const {
    minimumFractionDigits = options?.decimals ?? 0,
    maximumFractionDigits = options?.decimals ?? 2,
    notation = "standard",
    compactDisplay = "short",
    useGrouping = true,
  } = options || {};

  const result = new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
    compactDisplay,
    useGrouping,
  }).format(value);

  formatCache.set(cacheKey, result);
  cleanupCache();
  return result;
}

/**
 * Format token amount with appropriate decimals - OPTIMIZED
 */
export function formatTokenAmount(
  amount: number,
  decimals?: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    useCompact?: boolean;
    symbol?: string;
  }
): string {
  // Early return for zero/invalid amounts
  if (!amount || isNaN(amount)) return "0";

  // Check cache first
  const cacheKey = getCacheKey("tokenAmount", amount, decimals, options);
  const cached = formatCache.get(cacheKey);
  if (cached) return cached;

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 4,
    showSymbol = true,
    useCompact = true,
    symbol,
  } = options || {};

  let formatted: string;
  const absAmount = Math.abs(amount);

  // Optimized compact notation logic with early returns
  if (useCompact && absAmount >= 10000) {
    // Pre-calculate divisions to avoid repeated calculations
    if (absAmount >= 1e12) {
      formatted = (amount / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    } else if (absAmount >= 1e9) {
      formatted = (amount / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    } else if (absAmount >= 1e6) {
      formatted = (amount / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    } else {
      formatted = (amount / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    }
  } else {
    // For amounts under 10K, use standard formatting
    formatted = formatNumber(amount, {
      minimumFractionDigits,
      maximumFractionDigits,
      notation: "standard",
    });
  }

  const result = showSymbol && symbol ? `${formatted} ${symbol}` : formatted;

  // Cache the result
  formatCache.set(cacheKey, result);
  cleanupCache();

  return result;
}

/**
 * Format token price with compact notation for very small values
 * For prices < 0.00001, uses format like 0.0₍₃₎5 where ₍₃₎ indicates 3 zeros after decimal
 */
export function formatTokenPrice(
  price: number | string | undefined | null,
  options?: {
    showSymbol?: boolean;
    currencySymbol?: string;
  }
): string {
  const { showSymbol = true, currencySymbol = "$" } = options || {};

  // Convert to number if it's a string
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (!numPrice || numPrice <= 0 || isNaN(numPrice)) {
    return showSymbol ? `${currencySymbol}0` : "0";
  }

  // For very small prices (< 0.00001), use compact zero notation
  if (numPrice < 0.00001) {
    // Use toFixed to get precise decimal representation
    const priceStr = numPrice.toFixed(20);

    // Find decimal part and count leading zeros
    const parts = priceStr.split(".");
    if (parts.length === 2) {
      const decimalPart = parts[1];
      const leadingZeros = decimalPart.match(/^0+/)?.[0]?.length || 0;

      // Get the first significant digits after the zeros
      const significantPart = decimalPart.substring(leadingZeros);
      const significantDigits =
        significantPart.substring(0, 2).replace(/0+$/, "") || significantPart.substring(0, 1);

      if (leadingZeros > 2 && significantDigits) {
        // Only use this format for more than 2 leading zeros
        // Convert zero count to subscript
        const subscriptZeros = leadingZeros
          .toString()
          .split("")
          .map((digit) => "₀₁₂₃₄₅₆₇₈₉"[parseInt(digit)])
          .join("");

        const compactNotation = `0.0₍${subscriptZeros}₎${significantDigits}`;
        return showSymbol ? `${currencySymbol}${compactNotation}` : compactNotation;
      }
    }
  }

  // For prices < 0.01, show more decimal places
  if (numPrice < 0.01) {
    const formatted = numPrice.toFixed(6).replace(/\.?0+$/, "");
    return showSymbol ? `${currencySymbol}${formatted}` : formatted;
  }

  // For regular prices, use standard currency formatting
  return showSymbol ? formatCurrency(numPrice) : formatCurrency(numPrice).replace("$", "");
}

/**
 * Format BigInt values
 */
export function formatBigIntWithDecimals(
  value: bigint,
  decimals: number,
  displayDecimals?: number
): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  if (fractionalPart === 0n) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = displayDecimals
    ? fractionalStr.slice(0, displayDecimals)
    : fractionalStr.replace(/0+$/, "");

  return trimmedFractional ? `${integerPart}.${trimmedFractional}` : integerPart.toString();
}

/**
 * Get the correct decimals for a token based on its type
 * Some tokens have incorrect or missing decimal metadata
 */
function getTokenDecimals(assetType?: string, metadataDecimals?: number): number {
  // If we have valid metadata decimals, use them
  if (metadataDecimals !== undefined && metadataDecimals >= 0) {
    return metadataDecimals;
  }

  // Common token decimal overrides for tokens with missing/incorrect metadata
  const tokenDecimalOverrides: Record<string, number> = {
    // GUI token has 6 decimals (not 8)
    "0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c1c4cddf7e522": 6,
    // APT has 8 decimals
    "0x1::aptos_coin::AptosCoin": 8,
    // MKLP (Merkle LP) has 8 decimals
    MKLP: 8,
    // UPT (Uptos) has 8 decimals
    UPT: 8,
    UPTOS: 8,
    // Add other tokens with known decimal issues here
  };

  if (assetType && tokenDecimalOverrides[assetType]) {
    return tokenDecimalOverrides[assetType];
  }

  // Default to 8 decimals (octa) for Aptos tokens
  return 8;
}

/**
 * Convert raw token amount to human-readable format
 */
export function convertRawTokenAmount(
  rawAmount: string | bigint | number,
  decimals: number,
  assetType?: string
): number {
  try {
    // Use the correct decimals for this token
    const correctDecimals = getTokenDecimals(assetType, decimals);

    // Handle different input types
    let amount: bigint;
    if (typeof rawAmount === "string") {
      // Check if the string contains a decimal point
      if (rawAmount.includes(".")) {
        // If it's already a decimal string, parse it as a float
        const floatValue = parseFloat(rawAmount);
        if (!isNaN(floatValue)) {
          return floatValue;
        }
      }
      // Otherwise, try to convert to BigInt
      try {
        amount = BigInt(rawAmount);
      } catch {
        // If BigInt conversion fails, try parsing as float
        const floatValue = parseFloat(rawAmount);
        if (!isNaN(floatValue)) {
          return floatValue;
        }
        logger.warn("Failed to parse rawAmount:", rawAmount);
        return 0;
      }
    } else if (typeof rawAmount === "bigint") {
      amount = rawAmount;
    } else if (typeof rawAmount === "number") {
      // If it's already a number, just return it (might be already converted)
      return rawAmount;
    } else {
      logger.warn("Invalid rawAmount type:", {
        type: typeof rawAmount,
        rawAmount,
      });
      return 0;
    }

    // Ensure decimals is a valid number
    if (!Number.isFinite(correctDecimals) || correctDecimals < 0) {
      logger.warn("Invalid decimals:", correctDecimals);
      return Number(amount);
    }

    const divisor = BigInt(10) ** BigInt(correctDecimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;

    return Number(wholePart) + Number(fractionalPart) / Number(divisor);
  } catch (error) {
    errorLogger.error("Error in convertRawTokenAmount:", {
      error,
      rawAmount,
      decimals,
      assetType,
    });
    return 0;
  }
}

/**
 * Calculate and format market share percentage
 */
export function calculateMarketShare(value: bigint, total: bigint): string {
  if (total === 0n) return "0%";
  const percentage = (Number(value) / Number(total)) * 100;
  return formatPercentage(percentage);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return "just now";
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diff / year);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
}

/**
 * Format date to a localized string
 */
export function formatDate(
  date: Date | string | number,
  options?: {
    format?: "short" | "medium" | "long" | "full";
    includeTime?: boolean;
  }
): string {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  const { format = "medium", includeTime = false } = options || {};

  const dateOptions: Intl.DateTimeFormatOptions = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  }[format] as Intl.DateTimeFormatOptions;

  if (includeTime) {
    dateOptions.hour = "2-digit";
    dateOptions.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("en-US", dateOptions).format(dateObj);
}

/**
 * Legacy functions for backward compatibility - prefer formatAmount() for new code
 */
export function formatCurrencyValue(value: number): string {
  return formatAmount(value, "USD", { compact: true });
}

export function formatQuantity(
  value: number,
  symbol: string = "",
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = true, decimals = 1 } = options;

  if (!compact) {
    return formatTokenAmount(value, undefined, {
      maximumFractionDigits: decimals,
      symbol: symbol,
    });
  }

  return formatNumber(value, { notation: "compact", decimals }) + (symbol ? ` ${symbol}` : "");
}

export function formatQuantityValue(amount: bigint, unitSize: bigint = 10n ** 8n): string {
  return formatBigIntWithDecimals(amount, Number(unitSize.toString().length - 1));
}

// Re-export BigInt formatters - use formatBigIntWithDecimals directly for new code
export { formatBigIntWithDecimals as formatCurrencyBigInt };
export { formatBigIntWithDecimals as formatNumberBigInt };

// Utility functions
export function getDecimalPlaces(currencyCode: Currency | string): number {
  const code = currencyCode.toUpperCase();
  if (code === "BTC") return 8;
  if (code === "JPY") return 0;
  return isFiatCurrency(code) ? 2 : 4;
}

export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3,}$/.test(code.toUpperCase());
}

export function getSupportedFiatCurrencies(): string[] {
  return [...SUPPORTED_FIATS];
}

// Token-specific utility functions
export function formatTokenAmountFromRaw(amount: string | number, decimals: number = 8): number {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return value / 10 ** decimals;
}

export function normalizeTokenSymbol(symbol: string): string {
  // Handle common variations
  const symbolMap: Record<string, string> = {
    "WRAPPED-BTC": "wBTC",
    "WRAPPED BTC": "wBTC",
    WBTC: "wBTC",
    "CELAR-WBTC": "ceWBTC",
    ZBTC: "zBTC",
    "Z-BTC": "zBTC",
    AMAPT: "amAPT",
    "AM-APT": "amAPT",
    STAPT: "stAPT",
    "ST-APT": "stAPT",
    THAPT: "thAPT",
    "TH-APT": "thAPT",
  };

  const upperSymbol = symbol.toUpperCase();
  return symbolMap[upperSymbol] || symbol;
}

export function getTokenIcon(symbol: string, iconUri?: string): string {
  if (iconUri) return iconUri;

  // Fallback to placeholder based on symbol
  const iconMap: Record<string, string> = {
    BTC: "/icons/btc.svg",
    wBTC: "/icons/wbtc.svg",
    APT: "/icons/apt.svg",
    USDC: "/icons/usdc.svg",
    USDT: "/icons/usdt.svg",
  };

  return iconMap[symbol] || "/placeholder.jpg";
}

export function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

export function sortBySupply<T extends { supply: number }>(items: T[], descending = true): T[] {
  return [...items].sort((a, b) => (descending ? b.supply - a.supply : a.supply - b.supply));
}

export function sortByStringSupply<T extends { supply: string }>(
  items: T[],
  descending = true
): T[] {
  return [...items].sort((a, b) => {
    const aSupply = parseFloat(a.supply) || 0;
    const bSupply = parseFloat(b.supply) || 0;
    return descending ? bSupply - aSupply : aSupply - bSupply;
  });
}

export function aggregateDuplicateTokens<T extends { symbol: string; supply: number }>(
  tokens: T[]
): T[] {
  const aggregated = new Map<string, T>();

  tokens.forEach((token) => {
    const existing = aggregated.get(token.symbol);
    if (existing) {
      // Combine supplies
      existing.supply += token.supply;
    } else {
      aggregated.set(token.symbol, { ...token });
    }
  });

  return Array.from(aggregated.values());
}
