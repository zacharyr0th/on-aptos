/**
 * Comprehensive types for metrics and dashboard pages
 */

// Main metrics data type used across the app
export interface MetricsData {
  totalTransactions?: number;
  totalAccounts?: number;
  totalValidators?: number;
  networkUptime?: number | string;
  totalTransactionsChange?: number;
  totalAccountsChange?: number;
  totalValidatorsChange?: number;
  totalProtocols?: number;
  totalTVL?: number;
  averageGasPrice?: number;
  // Comprehensive metrics from all 9 working queries
  dailyActiveAddresses?: number;
  dailyTransactions?: number;
  dailyGasFeesUSD?: number;
  dailyGasFeesAPT?: number;
  netGasAPT?: number;
  recentTransactionCount?: number;
  recentGasFeesAPT?: number;
  // NEW: User behavior analytics
  behaviorDailyActiveUsers?: number;
  totalSignatures?: number;
  behaviorTransactions?: number;
  // NEW: Network performance
  maxTPS?: number;
  // NEW: Protocol analytics
  totalProtocolTransactions?: number;
  totalProtocolGas?: number;
  totalExtendedTransactions?: number;
  totalExtendedGas?: number;
  protocolBreakdown?: any[];
  extendedProtocolData?: any[];

  // Activity patterns
  activityPatterns?: any;
  peakHourlyTransactions?: number;
  peakHourlyUsers?: number;
  totalSwapEvents?: number;
  uniqueSwappers?: number;
  totalTokenHolders?: number;
  swapVolume24h?: number;

  // COMPREHENSIVE DEEP ANALYTICS - All expanded categories
  enhancedProtocolAnalytics?: {
    protocolDominance: {
      topProtocol: string;
      concentrationRatio: number;
      totalProtocolVolume: number;
    };
    gasEconomics: {
      totalNetworkGasConsumed: number;
      avgGasEfficiency: number;
      gasConcentration: number;
    };
  };
  enhancedUserAnalytics?: {
    userEngagement: {
      avgTransactionsPerUser: number;
      userActivityRatio: number;
      estimatedPowerUsers: number;
    };
    transactionPatterns: {
      peakToPeakVariation: number;
      networkUtilization: number;
      avgTransactionsPerHour: number;
    };
  };
  enhancedTokenEconomics?: {
    tokenDistribution: {
      totalTokenValue: number;
      largeHolders: number;
      concentrationIndex: number;
    };
    liquidityAnalysis: {
      totalSwapEvents: number;
      liquidityProviders: number;
      avgSwapsPerHour: number;
    };
  };
  whaleAnalytics?: {
    totalLargeHolders: number;
    whaleConcentration: number;
    topHolders: Array<{
      holder: string;
      balance: number;
      tokenType: string;
    }>;
    distributionAnalysis?: {
      giniCoefficient: number;
    };
  };
  protocolRevenues?: {
    totalEcosystemRevenue: number;
    revenueDistribution: Array<{
      protocol: string;
      revenue: number;
      marketShare: number;
      efficiency: number;
    }>;
    topProtocolShare: number;
  };
  mevAnalytics?: {
    gasVolatility: {
      avgGasPrice: number;
      gasSpread: number;
      highGasPeriods: number;
      mevOpportunityScore: number;
    };
  };
  marketMicrostructure?: {
    transactionFlow: {
      transactionDensity: number;
      networkThroughputRatio: number;
      avgTransactionsPerHour: number;
    };
    liquidityMetrics: {
      totalLiquidityProvided: number;
      avgTradeSize: number;
      marketEfficiencyScore: number;
    };
  };
}

export interface TableData {
  name: string;
  value: string;
  change?: string;
  category: string;
  queryUrl?: string;
  queryId?: string;
  query?: string;
}

export interface ComprehensiveMetricsResponse {
  metrics: MetricsData;
  tableData: TableData[];
  dataSource: string;
  queriesUsed: string[];
  lastUpdated: string;
}

export interface AdvancedMetrics extends MetricsData {
  // Ensures all base properties are required for advanced metrics
  totalTransactions: number;
  totalAccounts: number;
  totalValidators: number;
}

// Base metric types
export interface MetricRow {
  category: string;
  metric: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: MetricChangeType;
  status?: MetricStatus;
  source: string;
  description?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export type MetricStatus = "good" | "warning" | "danger" | "neutral";
export type MetricChangeType = "increase" | "decrease" | "stable";

// Page-specific metric types
export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  change?: number;
  changeType?: MetricChangeType;
  status?: MetricStatus;
  sparkline?: number[];
  link?: string;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  timestamp: string | number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

// Aggregated metrics
export interface MetricSummary {
  total: number;
  average?: number;
  min?: number;
  max?: number;
  median?: number;
  percentiles?: {
    p25?: number;
    p50?: number;
    p75?: number;
    p90?: number;
    p95?: number;
    p99?: number;
  };
}

// Page layout types
export interface MetricSection {
  id: string;
  title: string;
  description?: string;
  metrics: MetricRow[];
  summary?: MetricSummary;
  isLoading?: boolean;
  error?: Error | null;
}

export interface MetricPage {
  title: string;
  subtitle?: string;
  sections: MetricSection[];
  lastUpdated?: string;
  refreshInterval?: number;
}

// Filter and sort types
export interface MetricFilter {
  category?: string[];
  status?: MetricStatus[];
  source?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface MetricSort {
  field: keyof MetricRow;
  order: "asc" | "desc";
}

// API response types
export interface MetricsResponse {
  data: MetricRow[];
  summary?: MetricSummary;
  metadata?: {
    totalCount: number;
    filteredCount: number;
    lastUpdated: string;
    sources: string[];
  };
  error?: string;
}

// Utility functions
export function getMetricStatusColor(status: MetricStatus): string {
  const colors: Record<MetricStatus, string> = {
    good: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
    neutral: "text-gray-600",
  };
  return colors[status];
}

export function getMetricChangeIcon(changeType?: MetricChangeType): string {
  if (!changeType) return "";
  const icons: Record<MetricChangeType, string> = {
    increase: "↑",
    decrease: "↓",
    stable: "→",
  };
  return icons[changeType];
}

export function formatMetricValue(
  value: string | number,
  type?: "number" | "currency" | "percentage" | "bytes"
): string {
  if (typeof value === "string") return value;

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    case "percentage":
      return `${value.toFixed(2)}%`;
    case "bytes": {
      const units = ["B", "KB", "MB", "GB", "TB"];
      let unitIndex = 0;
      let displayValue = value;
      while (displayValue >= 1024 && unitIndex < units.length - 1) {
        displayValue /= 1024;
        unitIndex++;
      }
      return `${displayValue.toFixed(2)} ${units[unitIndex]}`;
    }
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

// Additional interfaces for metrics page components
export interface MetricCardData {
  name: string;
  value: string;
  queryUrl?: string;
}

export interface CategorizedMetrics {
  "Network Activity": any[];
  "Network Performance": any[];
  "Gas Economics": any[];
  "DEX Analytics": any[];
  "Protocol Analytics": any[];
}
