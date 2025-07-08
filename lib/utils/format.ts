/**
 * Unified formatting utilities
 * Combines the best features from both format.ts and formatting.ts
 */

// Types
export type Currency = string;
export type FiatCurrency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'CNY'
  | 'HKD'
  | 'SGD'
  | 'INR'
  | 'MXN'
  | 'BRL'
  | 'RUB'
  | 'ZAR'
  | 'TRY'
  | 'NZD'
  | 'KRW'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'THB'
  | 'IDR'
  | 'MYR'
  | 'PHP';

// Constants
const SUPPORTED_FIATS: readonly FiatCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'HKD',
  'SGD',
  'INR',
  'MXN',
  'BRL',
  'RUB',
  'ZAR',
  'TRY',
  'NZD',
  'KRW',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'THB',
  'IDR',
  'MYR',
  'PHP',
];

// Memoization cache for expensive formatting operations
const formatCache = new Map<string, string>();
const CACHE_SIZE_LIMIT = 1000;

function getCacheKey(
  type: string,
  value: number | string,
  ...args: any[]
): string {
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
  return (SUPPORTED_FIATS as readonly string[]).includes(
    currency.toUpperCase()
  );
}

/**
 * Enhanced currency formatting with multiple options
 */
export function formatCurrency(
  amount: number,
  currencyCode: Currency | string = 'USD',
  options: {
    compact?: boolean;
    showSymbol?: boolean;
    decimals?: number;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const cacheKey = getCacheKey('currency', amount, currencyCode, options);
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
  const isLargeAmount = Math.abs(amount) >= 1_000_000;

  // Auto-compact for large numbers
  const absAmount = Math.abs(amount);

  // Default behavior: auto-compact for $1000+
  const shouldCompact = compact !== false && absAmount >= 1000;

  if (shouldCompact) {
    let result: string;

    if (absAmount >= 1_000_000_000) {
      const billions = amount / 1_000_000_000;
      const formatted = billions.toFixed(1).replace(/\.0$/, '');
      result =
        showSymbol && isFiatCurrency(code)
          ? `$${formatted}b`
          : `${formatted}b ${code}`;
    } else if (absAmount >= 1_000_000) {
      const millions = amount / 1_000_000;
      const formatted = millions.toFixed(1).replace(/\.0$/, '');
      result =
        showSymbol && isFiatCurrency(code)
          ? `$${formatted}m`
          : `${formatted}m ${code}`;
    } else if (absAmount >= 1_000) {
      const thousands = amount / 1_000;
      const formatted = thousands.toFixed(1).replace(/\.0$/, '');
      result =
        showSymbol && isFiatCurrency(code)
          ? `$${formatted}k`
          : `${formatted}k ${code}`;
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

    const minFrac =
      minimumFractionDigits ??
      (decimals !== undefined ? decimals : defaultMinFrac);
    const maxFrac =
      maximumFractionDigits ??
      (decimals !== undefined ? decimals : defaultMaxFrac);

    if (isFiatCurrency(code) && showSymbol) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
      }).format(amount);
    } else {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
        useGrouping: true,
      }).format(amount);
      return showSymbol && code !== 'USD' ? `${formatted} ${code}` : formatted;
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
  const cacheKey = getCacheKey('percentage', value, options);
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }

  const {
    minimumFractionDigits = options?.decimals ?? 0,
    maximumFractionDigits = options?.decimals ?? 2,
    showSign = false,
  } = options || {};

  const result = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? 'always' : 'auto',
  }).format(value / 100);

  formatCache.set(cacheKey, result);
  cleanupCache();
  return result;
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
  currencyCode: Currency | string = 'USD',
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
  currencyCode: Currency | string = 'USD',
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
    return billions.toFixed(decimals).replace(/\.0$/, '') + 'b';
  } else if (absValue >= 1_000_000) {
    const millions = value / 1_000_000;
    return millions.toFixed(decimals).replace(/\.0$/, '') + 'm';
  } else if (absValue >= 1_000) {
    const thousands = value / 1_000;
    return thousands.toFixed(decimals).replace(/\.0$/, '') + 'k';
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
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    compactDisplay?: 'short' | 'long';
    useGrouping?: boolean;
    decimals?: number; // Shorthand for min/max fraction digits
  }
): string {
  const cacheKey = getCacheKey('number', value, options);
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }

  const {
    minimumFractionDigits = options?.decimals ?? 0,
    maximumFractionDigits = options?.decimals ?? 2,
    notation = 'standard',
    compactDisplay = 'short',
    useGrouping = true,
  } = options || {};

  const result = new Intl.NumberFormat('en-US', {
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
 * Format compact number (legacy support)
 */
export function formatCompactNumber(value: number): string {
  return formatNumber(value, { notation: 'compact' });
}

/**
 * Format token amount with appropriate decimals
 */
export function formatTokenAmount(
  amount: number,
  symbol?: string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    useCompact?: boolean;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 4,
    showSymbol = true,
    useCompact = false,
  } = options || {};

  // Use compact notation for amounts >= 1000 (like 550k instead of 550,000)
  const shouldUseCompact = useCompact || amount >= 1000;

  const formatted = formatNumber(amount, {
    minimumFractionDigits: shouldUseCompact ? 0 : minimumFractionDigits,
    maximumFractionDigits: shouldUseCompact ? 1 : maximumFractionDigits,
    notation: shouldUseCompact ? 'compact' : 'standard',
  });

  return showSymbol && symbol ? `${formatted} ${symbol}` : formatted;
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

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = displayDecimals
    ? fractionalStr.slice(0, displayDecimals)
    : fractionalStr.replace(/0+$/, '');

  return trimmedFractional
    ? `${integerPart}.${trimmedFractional}`
    : integerPart.toString();
}

/**
 * Get the correct decimals for a token based on its type
 * Some tokens have incorrect or missing decimal metadata
 */
function getTokenDecimals(
  assetType?: string,
  metadataDecimals?: number
): number {
  // If we have valid metadata decimals, use them
  if (metadataDecimals !== undefined && metadataDecimals >= 0) {
    return metadataDecimals;
  }

  // Common token decimal overrides for tokens with missing/incorrect metadata
  const tokenDecimalOverrides: Record<string, number> = {
    // GUI token has 6 decimals (not 8)
    '0x6f4b2376e61b7493774d6a4a1c07797622be14f5af6e8c1cd0c1c4cddf7e522': 6,
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
    if (typeof rawAmount === 'string') {
      // Check if the string contains a decimal point
      if (rawAmount.includes('.')) {
        // If it's already a decimal string, parse it as a float
        const floatValue = parseFloat(rawAmount);
        if (!isNaN(floatValue)) {
          return floatValue;
        }
      }
      // Otherwise, try to convert to BigInt
      try {
        amount = BigInt(rawAmount);
      } catch (e) {
        // If BigInt conversion fails, try parsing as float
        const floatValue = parseFloat(rawAmount);
        if (!isNaN(floatValue)) {
          return floatValue;
        }
        console.warn('Failed to parse rawAmount:', rawAmount);
        return 0;
      }
    } else if (typeof rawAmount === 'bigint') {
      amount = rawAmount;
    } else if (typeof rawAmount === 'number') {
      // If it's already a number, just return it (might be already converted)
      return rawAmount;
    } else {
      console.warn('Invalid rawAmount type:', typeof rawAmount, rawAmount);
      return 0;
    }

    // Ensure decimals is a valid number
    if (!Number.isFinite(correctDecimals) || correctDecimals < 0) {
      console.warn('Invalid decimals:', correctDecimals);
      return Number(amount);
    }

    const divisor = BigInt(10) ** BigInt(correctDecimals);
    const wholePart = amount / divisor;
    const fractionalPart = amount % divisor;

    return Number(wholePart) + Number(fractionalPart) / Number(divisor);
  } catch (error) {
    console.error('Error in convertRawTokenAmount:', error, {
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
  if (total === 0n) return '0%';
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
    return 'just now';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diff / year);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Legacy functions for backward compatibility
 */
export function formatCurrencyValue(value: number): string {
  return formatCurrency(value, 'USD', { compact: true });
}

export function formatQuantity(
  value: number,
  symbol: string = '',
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = true, decimals = 1 } = options;

  if (!compact) {
    return formatTokenAmount(value, symbol, {
      maximumFractionDigits: decimals,
    });
  }

  return (
    formatNumber(value, { notation: 'compact', decimals }) +
    (symbol ? ` ${symbol}` : '')
  );
}

export function formatQuantityValue(
  amount: bigint,
  unitSize: bigint = 10n ** 8n
): string {
  return formatBigIntWithDecimals(
    amount,
    Number(unitSize.toString().length - 1)
  );
}

// Re-export BigInt formatters
export { formatBigIntWithDecimals as formatCurrencyBigInt };
export { formatBigIntWithDecimals as formatNumberBigInt };

// Utility functions
export function getDecimalPlaces(currencyCode: Currency | string): number {
  const code = currencyCode.toUpperCase();
  if (code === 'BTC') return 8;
  if (code === 'JPY') return 0;
  return isFiatCurrency(code) ? 2 : 4;
}

export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3,}$/.test(code.toUpperCase());
}

export function getSupportedFiatCurrencies(): string[] {
  return [...SUPPORTED_FIATS];
}
