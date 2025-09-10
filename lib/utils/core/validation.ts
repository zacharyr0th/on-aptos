/**
 * Core validation utilities for the application
 */

import { z } from "zod";

/**
 * Validates an Aptos wallet address
 */
export function validateAptosAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
}

/**
 * Alias for validateAptosAddress
 */
export function validateWalletAddress(address: string): boolean {
  return validateAptosAddress(address);
}

/**
 * Validates pagination parameters
 */
export function validatePagination(params: { page?: number; limit?: number }): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  return { page, limit };
}

/**
 * Checks if a string is a valid URL
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
 * Checks if a string is a valid HTTP/HTTPS URL
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
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if a value is a positive number
 */
export function isPositiveNumber(value: unknown): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Checks if a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Checks if a value is an integer
 */
export function isInteger(value: unknown): boolean {
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num);
}

/**
 * Validates string length
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Checks if a value is required (not null, undefined, or empty string)
 */
export function isRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

/**
 * Sanitizes a string by removing dangerous characters
 */
export function sanitizeString(str: string): string {
  if (typeof str !== "string") return "";
  // Remove HTML tags and script content
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Validates and sanitizes query parameters
 */
export function validateQueryParam(
  param: unknown,
  type: "string" | "number" | "boolean" = "string"
): unknown {
  if (param === null || param === undefined) return undefined;

  switch (type) {
    case "number": {
      const num = Number(param);
      return isNaN(num) ? undefined : num;
    }
    case "boolean": {
      if (typeof param === "boolean") return param;
      if (param === "true") return true;
      if (param === "false") return false;
      return undefined;
    }
    case "string":
    default:
      return sanitizeString(String(param));
  }
}
