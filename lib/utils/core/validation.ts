/**
 * Unified validation utilities
 * Consolidates validation functions from api-response.ts, portfolio-utils.ts, and other files
 */

/**
 * Validate Aptos address format
 * Consolidated from api-response.ts and portfolio-utils.ts
 */
export function validateAptosAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
}

/**
 * Comprehensive wallet address validation with detailed error messages
 */
export async function validateWalletAddress(address: string | null): Promise<{
  isValid: boolean;
  error?: string;
}> {
  if (!address) {
    return { isValid: false, error: "Wallet address is required" };
  }

  // Basic validation - check if it's a valid Aptos address format
  // Aptos addresses are 64 character hex strings (with or without 0x prefix)
  const addressRegex = /^(0x)?[a-fA-F0-9]{64}$/;

  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

  if (!addressRegex.test(address) && !addressRegex.test(cleanAddress)) {
    return { isValid: false, error: "Invalid wallet address format" };
  }

  return { isValid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: string | null,
  limit?: string | null,
  maxLimit: number = 100,
): { page: number; limit: number; offset: number } {
  const parsedPage = Math.max(1, parseInt(page || "1", 10));
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit || "30", 10)),
  );
  const offset = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset,
  };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate HTTP/HTTPS URL format
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate email format (basic)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: string | number): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: string | number): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0;
}

/**
 * Validate integer
 */
export function isInteger(value: string | number): boolean {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isInteger(num);
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  minLength: number = 0,
  maxLength: number = Infinity,
): boolean {
  return value.length >= minLength && value.length <= maxLength;
}

/**
 * Validate required field
 */
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

/**
 * Sanitize string input by removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"'&]/g, "") // Remove potentially dangerous HTML/XSS characters
    .trim();
}

/**
 * Validate and sanitize query parameter
 */
export function validateQueryParam(
  param: string | string[] | undefined,
  required: boolean = false,
  maxLength: number = 1000,
): string | null {
  if (!param) {
    return required ? null : "";
  }

  // Handle array case - take first element
  const value = Array.isArray(param) ? param[0] : param;

  if (!value || value.length > maxLength) {
    return null;
  }

  return sanitizeString(value);
}
