import { toast } from "sonner";
import { logger } from "@/lib/utils/core/logger";

/**
 * Common dialog utilities for copying, formatting, and interactions
 */

/**
 * Copy text to clipboard with optional toast notification
 */
export const copyToClipboard = async (
  text: string,
  label?: string,
  showToast = true
): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    if (showToast) {
      const message = label ? `${label} copied to clipboard` : "Copied to clipboard";
      toast.success(message);
    }
  } catch (error) {
    logger.error("Failed to copy to clipboard", { error, text, label });
    if (showToast) {
      toast.error("Failed to copy to clipboard");
    }
  }
};

/**
 * Truncate address for display with customizable length
 */
export const truncateAddress = (address: string, startLength = 8, endLength = 8): string => {
  if (!address) return "";
  if (address.length <= startLength + endLength + 3) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Format token name with additional context (e.g., "bridged" label)
 */
export const formatTokenName = (
  name: string,
  context?: {
    protocol?: string;
    standards?: string;
    isBridged?: boolean;
    t?: (key: string, fallback?: string) => string;
  }
): string => {
  if (!context) return name;

  const { protocol, standards, isBridged, t } = context;

  // Check for bridged tokens
  if (isBridged || (protocol === "ondo" && standards === "ERC-20")) {
    const bridgedLabel = t?.("common:labels.bridged", "bridged") || "bridged";
    return `${name} (${bridgedLabel})`;
  }

  return name;
};

/**
 * Format general text fields with fallback and proper casing
 */
export const formatDisplayText = (
  text: string | undefined | null,
  fallback = "Not Specified"
): string => {
  if (
    !text ||
    typeof text !== "string" ||
    text.toLowerCase() === "unknown" ||
    text.toLowerCase() === "null"
  ) {
    return fallback;
  }

  // Replace hyphens with spaces and format as proper noun
  return text
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Check if field has valid data
 */
export const hasValidData = (text: string | undefined | null): boolean => {
  return !(
    !text ||
    typeof text !== "string" ||
    text.toLowerCase() === "unknown" ||
    text.toLowerCase() === "null" ||
    text.trim() === ""
  );
};

/**
 * Get explorer URL for a given address
 */
export const getExplorerUrl = (address: string, network = "mainnet"): string => {
  return `https://explorer.aptoslabs.com/account/${address}?network=${network}`;
};

/**
 * Safe parse number with fallback
 */
export const safeParseFloat = (value: string | number, fallback = 0): number => {
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Format percentage with proper precision
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  if (!Number.isFinite(value)) return "0.00%";
  return `${value.toFixed(decimals)}%`;
};

/**
 * Generate protocol logo URL with fallback
 */
export const getProtocolLogoUrl = (
  protocol: string,
  logoMap: Record<string, string>,
  fallback = "/icons/aptos.png"
): string => {
  const normalizedProtocol = protocol.toLowerCase();
  return logoMap[normalizedProtocol] || fallback;
};

/**
 * Performance measurement utility for dialog operations
 */
export const measurePerformance = <T>(fn: () => T, label?: string): T => {
  if (process.env.NODE_ENV !== "development") {
    return fn(); // Skip performance measurement in production
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const logLabel = label ? `${label}: ` : "Dialog operation: ";
  logger.debug(`${logLabel}${end - start}ms`);
  return result;
};

/**
 * Debounce function for dialog interactions
 */
export function debounceDialogAction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create copy handler with consistent behavior
 */
export const createCopyHandler = (showToast = true) => {
  return (text: string, label?: string) => {
    copyToClipboard(text, label, showToast);
  };
};

/**
 * Validate required dialog props
 */
export const validateDialogProps = (
  props: Record<string, any>,
  requiredFields: string[]
): boolean => {
  for (const field of requiredFields) {
    if (!props[field]) {
      logger.warn(`Missing required dialog prop: ${field}`);
      return false;
    }
  }
  return true;
};
