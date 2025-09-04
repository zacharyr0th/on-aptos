/**
 * Common utilities for page components
 */

import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { MetricStatus, MetricChangeType } from "@/lib/types/metrics";

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
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

// Badge variant utilities
export const getStatusBadgeVariant = (status?: MetricStatus) => {
  switch (status) {
    case "good":
      return "default" as const;
    case "warning":
      return "secondary" as const;
    case "danger":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

// Text color utilities
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

export const getStatusTextColor = (status?: MetricStatus): string => {
  switch (status) {
    case "good":
      return "text-green-600";
    case "warning":
      return "text-yellow-600";
    case "danger":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

// Pagination utilities
export const calculatePageRange = (
  currentPage: number,
  totalPages: number,
  displayRange = 5,
): number[] => {
  const halfRange = Math.floor(displayRange / 2);
  let start = Math.max(1, currentPage - halfRange);
  let end = Math.min(totalPages, currentPage + halfRange);

  if (end - start + 1 < displayRange) {
    if (start === 1) {
      end = Math.min(totalPages, start + displayRange - 1);
    } else {
      start = Math.max(1, end - displayRange + 1);
    }
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// URL utilities
export const updateQueryParams = (
  params: Record<string, string | number | boolean | undefined>,
): string => {
  const searchParams = new URLSearchParams(window.location.search);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      searchParams.delete(key);
    } else {
      searchParams.set(key, String(value));
    }
  });

  const newUrl = `${window.location.pathname}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  return newUrl;
};

export const getQueryParam = (
  key: string,
  defaultValue?: string,
): string | undefined => {
  if (typeof window === "undefined") return defaultValue;
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(key) || defaultValue;
};

// Data validation utilities
export const isValidData = (data: any): boolean => {
  return data !== null && data !== undefined;
};

export const hasData = (data: any[] | null | undefined): boolean => {
  return Array.isArray(data) && data.length > 0;
};

// Export utilities
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
