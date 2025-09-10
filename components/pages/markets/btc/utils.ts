// Import unified formatters from centralized location
import {
  type Currency,
  convertRawTokenAmount,
  formatAmount,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/utils/format";

// Re-export common formatters for compatibility
export {
  formatAmount,
  formatCurrency,
  formatPercentage,
  formatNumber,
  convertRawTokenAmount,
  type Currency,
};

// BTC-specific amount formatters
export function formatBTCAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0 BTC";
  return `${formatNumber(amount, { maximumFractionDigits: 8 })} BTC`;
}

export function formatBTCAmountWithCommas(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  return formatNumber(amount, { maximumFractionDigits: 8 });
}

export function formatTokenSupply(supply: string, decimals: number = 8): string {
  if (!supply || typeof supply !== "string") return "0";
  try {
    const amount = convertRawTokenAmount(supply, decimals);
    return formatNumber(amount, { maximumFractionDigits: 2 });
  } catch {
    return "0";
  }
}

// BTC-specific percentage formatter (more specific than general one)
export const formatBTCPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return "0.0";
  return value >= 0.1 ? value.toFixed(1) : value.toFixed(2);
};

export const formatBTCSupply = (supply: string, decimals: number = 8): string => {
  if (!supply || typeof supply !== "string") return "0";

  try {
    return formatTokenSupply(supply, decimals);
  } catch {
    return "0";
  }
};

export const formatBTCUsdValue = (btcAmount: number, bitcoinPrice: number): string => {
  if (!Number.isFinite(btcAmount) || !Number.isFinite(bitcoinPrice)) return "$0";

  const usdValue = btcAmount * bitcoinPrice;
  return formatAmount(usdValue, "USD");
};

export const batchConvertBTCAmounts = (
  items: Array<{ supply: string; decimals: number }>,
  bitcoinPrice?: number
): Array<{ btcValue: number; usdValue?: number; formatted: string }> => {
  return items.map(({ supply, decimals }) => {
    try {
      const btcValue = convertRawTokenAmount(supply, decimals);
      const formatted = formatBTCAmount(btcValue);
      const usdValue = bitcoinPrice ? btcValue * bitcoinPrice : undefined;

      return { btcValue, usdValue, formatted };
    } catch {
      return { btcValue: 0, formatted: "0 BTC" };
    }
  });
};

export const calculateBTCMarketShare = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return 0;
  return (value / total) * 100;
};
