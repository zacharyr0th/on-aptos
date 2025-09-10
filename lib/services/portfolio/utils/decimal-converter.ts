import { DECIMALS, THRESHOLDS } from "../constants";

export function convertToDecimal(
  amount: string | number,
  decimals: number = DECIMALS.DEFAULT
): number {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return value / 10 ** decimals;
}

export function convertFromDecimal(amount: number, decimals: number = DECIMALS.DEFAULT): string {
  return (amount * 10 ** decimals).toFixed(0);
}

export function formatBalance(
  amount: string | number,
  decimals: number = DECIMALS.DEFAULT
): number {
  const balance = convertToDecimal(amount, decimals);
  return balance < THRESHOLDS.MIN_BALANCE_DISPLAY ? 0 : balance;
}

export function calculateValue(balance: number, price: number): number {
  const value = balance * price;
  return value < THRESHOLDS.MIN_VALUE_USD ? 0 : value;
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
