import { logger } from "@/lib/utils/core/logger";

/**
 * Sanitizes text content to prevent XSS attacks
 * Removes dangerous characters and HTML tags while preserving safe text
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";

  // Convert to string if needed
  const str = String(text);

  // Remove any HTML tags
  const withoutTags = str.replace(/<[^>]*>/g, "");

  // Remove dangerous characters that could be used for XSS
  const sanitized = withoutTags
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers like onclick=
    .replace(/['"]/g, (match) => {
      // Replace quotes with safe HTML entities
      return match === '"' ? "&quot;" : "&#39;";
    })
    .trim();

  return sanitized;
}

/**
 * Sanitizes NFT metadata for safe display
 */
export interface NFTMetadata {
  token_name?: string | null;
  collection_name?: string | null;
  description?: string | null;
  [key: string]: any;
}

export function sanitizeNFTMetadata<T extends NFTMetadata>(metadata: T): T {
  if (!metadata) return metadata;

  const sanitized = { ...metadata };

  // Sanitize common NFT text fields
  if (sanitized.token_name) {
    sanitized.token_name = sanitizeText(sanitized.token_name);
  }

  if (sanitized.collection_name) {
    sanitized.collection_name = sanitizeText(sanitized.collection_name);
  }

  if (sanitized.description) {
    sanitized.description = sanitizeText(sanitized.description);
  }

  return sanitized;
}

/**
 * Validates and sanitizes URLs for safe external navigation
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      logger.warn(
        `Blocked invalid URL protocol: ${parsed.protocol} in URL: ${url}`,
      );
      return false;
    }

    // Block javascript: and data: URLs (additional safety check)
    if (
      url.toLowerCase().includes("javascript:") ||
      url.toLowerCase().includes("data:")
    ) {
      logger.warn(`Blocked dangerous URL: ${url}`);
      return false;
    }

    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Safe window.open wrapper that validates URLs
 */
export function safeWindowOpen(
  url: string | null | undefined,
  target: string = "_blank",
  features?: string,
): Window | null {
  if (!url) {
    logger.warn("Attempted to open null/undefined URL");
    return null;
  }

  if (!isValidUrl(url)) {
    logger.error(`Blocked attempt to open invalid URL: ${url}`);
    return null;
  }

  try {
    // Add rel=noopener for security
    const newWindow = window.open(url, target, features);
    if (newWindow && target === "_blank") {
      newWindow.opener = null;
    }
    return newWindow;
  } catch (error) {
    logger.error(`Failed to open URL: ${url}`, error);
    return null;
  }
}

/**
 * Validates image URLs for safe rendering
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return true; // Allow empty URLs (will use placeholder)

  // Allow relative URLs for local images
  if (url.startsWith("/")) return true;

  // Validate absolute URLs
  if (!isValidUrl(url)) return false;

  try {
    const parsed = new URL(url);

    // Optional: Add domain whitelist for extra security
    const trustedDomains = [
      "arweave.net",
      "ipfs.io",
      "cloudflare-ipfs.com",
      "nftstorage.link",
      "aptoslabs.com",
      "aptos.dev",
      // Add more trusted NFT/image hosting domains as needed
    ];

    // Check if the domain is in the trusted list (optional, can be disabled)
    const hostname = parsed.hostname.toLowerCase();
    const isTrusted = trustedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isTrusted) {
      logger.debug(`Image URL from untrusted domain: ${hostname}`);
      // You can choose to block or just log untrusted domains
      // return false; // Uncomment to enforce whitelist
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes an image URL for safe rendering
 */
export function sanitizeImageUrl(
  url: string | null | undefined,
  fallback: string = "/placeholder.jpg",
): string {
  if (!url) return fallback;

  // Remove any potentially dangerous characters from the URL
  const cleaned = url.trim();

  if (isValidImageUrl(cleaned)) {
    return cleaned;
  }

  logger.warn(`Invalid image URL sanitized: ${url}`);
  return fallback;
}
