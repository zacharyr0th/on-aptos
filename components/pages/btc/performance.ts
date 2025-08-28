import { logger } from "@/lib/utils/core/logger";

import { PerformanceMetrics } from "./types";

// Performance measurement utilities
export const measurePerformance = <T>(fn: () => T, label?: string): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (label && process.env.NODE_ENV === "development") {
    logger.debug(`${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

// Async performance measurement
export const measureAsync = async <T>(
  fn: () => Promise<T>,
  label?: string,
): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (label && process.env.NODE_ENV === "development") {
    logger.debug(`${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
};

export type { PerformanceMetrics };
