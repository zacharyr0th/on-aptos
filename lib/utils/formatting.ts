import { Currency, FiatCurrency } from './types';

// Constants for decimal precision
const CRYPTO_DECIMALS = 8;
const FIAT_DECIMALS = 2;
const DISPLAY_DECIMALS = 4;

// Supported fiat currencies
const SUPPORTED_FIATS = [
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
] as const;

/**
 * Type guard to check if a currency is a fiat currency
 */
export const isFiatCurrency = (
  currency: Currency
): currency is FiatCurrency => {
  return (SUPPORTED_FIATS as readonly string[]).includes(currency);
};

/**
 * Enhanced currency formatting with multiple options
 */
export function formatCurrency(
  amount: number,
  currencyCode: Currency | string,
  options: {
    compact?: boolean;
    showSymbol?: boolean;
    decimals?: number;
  } = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const { compact = false, showSymbol = true, decimals } = options;
  const code = currencyCode.toUpperCase();
  const isLargeAmount = Math.abs(amount) >= 1_000_000;
  const isBTC = code === 'BTC';

  // Determine decimal places
  let maxDecimals: number;
  if (decimals !== undefined) {
    maxDecimals = decimals;
  } else if (isFiatCurrency(code)) {
    maxDecimals = isLargeAmount ? 0 : code === 'USD' ? 2 : DISPLAY_DECIMALS;
  } else {
    maxDecimals = isBTC ? 0 : isLargeAmount ? 0 : DISPLAY_DECIMALS;
  }

  // Handle compact notation
  if (compact && Math.abs(amount) >= 1000) {
    const units = ['', 'K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(Math.abs(amount)) / 3);
    const scaledNumber = amount / Math.pow(1000, unitIndex);
    const formatted = scaledNumber.toFixed(unitIndex > 0 ? 1 : maxDecimals);

    if (isFiatCurrency(code) && showSymbol) {
      return `$${formatted}${units[unitIndex]}`;
    }
    return `${formatted}${units[unitIndex]}${showSymbol ? ' ' + code : ''}`;
  }

  // Standard formatting
  if (isFiatCurrency(code) && showSymbol) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
      currencyDisplay: 'symbol',
    }).format(amount);
  }

  const formatted = new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
    useGrouping: true,
  }).format(amount);

  return showSymbol ? `${formatted} ${code}` : formatted;
}

/**
 * Legacy formatCurrencyValue function (for backward compatibility)
 */
export function formatCurrencyValue(value: number): string {
  return formatCurrency(value, 'USD', { compact: true });
}

/**
 * Format quantity with appropriate scaling and units
 */
export function formatQuantity(
  value: number,
  symbol: string = '',
  options: {
    compact?: boolean;
    decimals?: number;
  } = {}
): string {
  const { compact = true, decimals = 1 } = options;

  if (!compact) {
    const formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: decimals,
    }).format(value);
    return symbol ? `${formatted} ${symbol}` : formatted;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M${symbol ? ' ' + symbol : ''}`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K${symbol ? ' ' + symbol : ''}`;
  }
  return `${value.toFixed(0)}${symbol ? ' ' + symbol : ''}`;
}

/**
 * Legacy formatQuantityValue function (for backward compatibility)
 */
export function formatQuantityValue(
  value: number,
  symbol: string = ''
): string {
  return formatQuantity(value, symbol, { compact: true });
}

/**
 * Format numbers with flexible options
 */
export function formatNumber(
  num: number,
  options: {
    decimals?: number;
    compact?: boolean;
    currency?: string;
    notation?: 'standard' | 'compact' | 'scientific' | 'engineering';
    useGrouping?: boolean;
  } = {}
): string {
  const {
    decimals = 2,
    compact = false,
    currency,
    notation = 'standard',
    useGrouping = true,
  } = options;

  if (currency) {
    return formatCurrency(num, currency, { compact, decimals });
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : notation,
    useGrouping,
  }).format(num);
}

/**
 * Format BigInt currency values (for stablecoins with specific decimals)
 */
export function formatCurrencyBigInt(
  value: bigint,
  decimals: number = 6,
  options: {
    compact?: boolean;
    currency?: string;
  } = {}
): string {
  const { compact = true, currency = 'USD' } = options;
  const numberValue = Number(value) / Math.pow(10, decimals);
  return formatCurrency(numberValue, currency, { compact });
}

/**
 * Format BigInt numbers without currency symbol
 */
export function formatNumberBigInt(
  value: bigint,
  decimals: number = 6,
  options: {
    compact?: boolean;
    maxFractionDigits?: number;
  } = {}
): string {
  const { compact = true, maxFractionDigits = 1 } = options;
  const numberValue = Number(value) / Math.pow(10, decimals);

  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: maxFractionDigits,
  }).format(numberValue);
}

/**
 * Format BigInt with proper decimal places as string
 */
export function formatBigIntWithDecimals(
  value: bigint,
  decimals: number
): string {
  const str = value.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, -decimals) || '0';
  const decimalPartStr = str.slice(-decimals);
  return `${intPart}.${decimalPartStr}`;
}

/**
 * Convert raw token amount to actual value
 */
export function convertRawTokenAmount(
  amount: string,
  decimals: number
): number {
  const cleanAmount = amount.replace(/,/g, '');

  if (cleanAmount.includes('.')) {
    return parseFloat(cleanAmount);
  } else {
    return Number(BigInt(cleanAmount)) / Math.pow(10, decimals);
  }
}

/**
 * Calculate market share percentage
 */
export function calculateMarketShare(value: bigint, total: bigint): string {
  if (total === BigInt(0)) return '0';
  return ((value * BigInt(100)) / total).toString();
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number,
  options: {
    decimals?: number;
    showSign?: boolean;
  } = {}
): string {
  const { decimals = 2, showSign = false } = options;
  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return targetDate.toLocaleDateString();
}

/**
 * Get decimal places for a currency
 */
export function getDecimalPlaces(currencyCode: Currency | string): number {
  return isFiatCurrency(currencyCode.toUpperCase())
    ? FIAT_DECIMALS
    : CRYPTO_DECIMALS;
}

/**
 * Validate currency code
 */
export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z0-9]{2,10}$/.test(code.toUpperCase());
}

/**
 * Get supported fiat currencies
 */
export function getSupportedFiatCurrencies(): string[] {
  return [...SUPPORTED_FIATS];
}

// Legacy exports for backward compatibility
export const formatAmount = formatCurrency;
