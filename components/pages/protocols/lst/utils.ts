// Use unified formatters - import only what we need
import {
  type Currency,
  convertRawTokenAmount,
  formatAmount,
  formatCurrency,
  formatNumber,
} from "@/lib/utils/format";

// APT-specific amount formatters
export function formatAPTAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0 APT";
  return `${formatNumber(amount, { maximumFractionDigits: 8 })} APT`;
}

export function formatAPTAmountWithCommas(amount: number): string {
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

export function formatAPY(apy: number): string {
  if (!Number.isFinite(apy)) return "0.0%";
  return `${apy.toFixed(2)}%`;
}

// LST-specific utilities
export const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) return "0.0";
  return value >= 0.1 ? value.toFixed(1) : value.toFixed(2);
};

export const formatLSTSupply = (supply: string, decimals: number = 8): string => {
  if (!supply || typeof supply !== "string") return "0";

  try {
    return formatTokenSupply(supply, decimals);
  } catch {
    return "0";
  }
};

export const formatAPTUsdValue = (aptAmount: number, aptPrice: number): string => {
  if (!Number.isFinite(aptAmount) || !Number.isFinite(aptPrice)) return "$0";

  const usdValue = aptAmount * aptPrice;
  return formatCurrency(usdValue, "USD");
};

export const batchConvertAPTAmounts = (
  items: Array<{ supply: string; decimals: number }>,
  aptPrice?: number
): Array<{ aptValue: number; usdValue?: number; formatted: string }> => {
  return items.map(({ supply, decimals }) => {
    try {
      const aptValue = convertRawTokenAmount(supply, decimals);
      const formatted = formatAPTAmount(aptValue);
      const usdValue = aptPrice ? aptValue * aptPrice : undefined;

      return { aptValue, usdValue, formatted };
    } catch {
      return { aptValue: 0, formatted: "0 APT" };
    }
  });
};

export const calculateAPTMarketShare = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return 0;
  return (value / total) * 100;
};

export const formatStakingRewards = (
  rewards: number,
  apy: number
): { formatted: string; apyFormatted: string } => {
  return {
    formatted: formatCurrency(rewards, "USD"),
    apyFormatted: formatAPY(apy),
  };
};
