/**
 * Comprehensive types for metrics and dashboard pages
 */

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
  type?: "number" | "currency" | "percentage" | "bytes",
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
    case "bytes":
      const units = ["B", "KB", "MB", "GB", "TB"];
      let unitIndex = 0;
      let displayValue = value;
      while (displayValue >= 1024 && unitIndex < units.length - 1) {
        displayValue /= 1024;
        unitIndex++;
      }
      return `${displayValue.toFixed(2)} ${units[unitIndex]}`;
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}
