// Shared utilities for BTC page components
import { BTC_METADATA } from "@/lib/config/tokens/btc";

// Helper function to get token icon source
export const getTokenIcon = (symbol: string, metadata?: any): string => {
  if (symbol === "WBTC") return "/icons/btc/WBTC.webp";
  return metadata?.thumbnail || "/placeholder.jpg";
};

// Truncate address utility
export const truncateAddress = (address: string, start = 6, end = 4): string => {
  if (!address || address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// Get token metadata helper
export const getTokenMetadata = (symbol: string) => {
  return BTC_METADATA[symbol] || null;
};