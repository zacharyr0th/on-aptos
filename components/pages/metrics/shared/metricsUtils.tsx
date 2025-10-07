import { AlertTriangle, CheckCircle, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { MetricChangeType, MetricStatus } from "@/lib/types/metrics";
import { formatAmount, formatPercentage, formatTokenAmount } from "@/lib/utils/format/format";

// Icon utilities
export const getChangeIcon = (changeType?: MetricChangeType) => {
  switch (changeType) {
    case "increase":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "decrease":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case "stable":
      return <Minus className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};

export const getStatusIcon = (status?: MetricStatus) => {
  switch (status) {
    case "good":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "danger":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

// Formatter utilities
export const formatUSD = (amount: number): string => formatAmount(amount, "USD");
export const formatAPT = (amount: number): string =>
  formatTokenAmount(amount / 1e8, 8, { symbol: "APT" });
export const formatPercent = (percent: number): string => formatPercentage(percent);

// Badge variant utilities
export const getSourceBadgeVariant = (source: string) => {
  switch (source) {
    case "DeFiLlama":
      return "default";
    case "Aptos Indexer":
      return "secondary";
    case "Calculated":
      return "outline";
    default:
      return "secondary";
  }
};

export const getStatusBadgeVariant = (status?: MetricStatus) => {
  switch (status) {
    case "good":
      return "default";
    case "warning":
      return "secondary";
    case "danger":
      return "destructive";
    default:
      return "outline";
  }
};

// Text color utilities for changes
export const getChangeTextColor = (changeType?: MetricChangeType): string => {
  switch (changeType) {
    case "increase":
      return "text-green-500";
    case "decrease":
      return "text-red-500";
    case "stable":
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
};
