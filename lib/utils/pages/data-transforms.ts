/**
 * Data transformation utilities for page components
 */

import type { MetricRow, ChartData, TimeSeriesData } from "@/lib/types/metrics";

// Group data by a specific key
export function groupBy<T>(data: T[], key: keyof T): Record<string, T[]> {
  return data.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}

// Aggregate metrics by category
export function aggregateMetrics(
  metrics: MetricRow[],
): Record<string, MetricRow[]> {
  return groupBy(metrics, "category");
}

// Transform data for charts
export function toChartData(
  data: any[],
  labelField: string,
  valueField: string,
  colorField?: string,
): ChartData[] {
  return data.map((item) => ({
    label: item[labelField],
    value: Number(item[valueField]) || 0,
    color: colorField ? item[colorField] : undefined,
    metadata: item,
  }));
}

// Transform to time series data
export function toTimeSeriesData(
  data: any[],
  timestampField: string,
  valueField: string,
  labelField?: string,
): TimeSeriesData[] {
  return data.map((item) => ({
    timestamp: item[timestampField],
    value: Number(item[valueField]) || 0,
    label: labelField ? item[labelField] : undefined,
    metadata: item,
  }));
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Normalize data values
export function normalizeValues(data: number[], min = 0, max = 100): number[] {
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const range = dataMax - dataMin;

  if (range === 0) return data.map(() => (min + max) / 2);

  return data.map((value) => {
    const normalized = (value - dataMin) / range;
    return min + normalized * (max - min);
  });
}

// Get top N items by value
export function getTopItems<T>(data: T[], valueField: keyof T, n: number): T[] {
  return [...data]
    .sort((a, b) => Number(b[valueField]) - Number(a[valueField]))
    .slice(0, n);
}

// Aggregate summary statistics
export function calculateSummary(values: number[]): {
  total: number;
  average: number;
  min: number;
  max: number;
  median: number;
} {
  if (values.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return { total, average, min, max, median };
}

// Format large numbers with abbreviations
export function abbreviateNumber(value: number): string {
  const suffixes = ["", "K", "M", "B", "T"];
  const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);

  if (suffixIndex === 0) return value.toString();

  const scaledValue = value / Math.pow(1000, suffixIndex);
  return `${scaledValue.toFixed(1)}${suffixes[suffixIndex]}`;
}

// Parse and validate numeric values
export function parseNumericValue(value: any): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Merge and deduplicate data
export function mergeData<T>(data1: T[], data2: T[], keyField: keyof T): T[] {
  const map = new Map<any, T>();

  [...data1, ...data2].forEach((item) => {
    map.set(item[keyField], item);
  });

  return Array.from(map.values());
}

// Calculate moving average
export function movingAverage(data: number[], windowSize: number): number[] {
  if (windowSize <= 0 || windowSize > data.length) return data;

  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const end = i + 1;
    const window = data.slice(start, end);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }

  return result;
}

// Convert flat data to tree structure
export function toTreeStructure<T extends { id: string; parentId?: string }>(
  data: T[],
): T[] {
  const map = new Map<string, T & { children?: T[] }>();
  const roots: T[] = [];

  // Create map of all items
  data.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // Build tree
  data.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
