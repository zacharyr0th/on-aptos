/**
 * Utility functions for mapping token addresses to logo URLs using Panora Token List
 */

import { PanoraTokenListService } from "@/lib/services/portfolio/panora-token-list";
import { logger } from "@/lib/utils/core/logger";

// List of allowed image domains configured in next.config.js
const ALLOWED_IMAGE_DOMAINS = [
  "raw.githubusercontent.com",
  "assets.panora.exchange",
  "coin-images.coingecko.com",
  "s2.coinmarketcap.com",
  "aptos.dev",
  "ipfs.io",
  "cloudflare-ipfs.com",
  "imgur.com",
  "i.imgur.com",
  "cdn.discordapp.com",
  "icons.llama.fi",
  "cdn.rwa.xyz",
  "assets.coingecko.com",
  "cryptologos.cc",
  "tether.to",
  "app.kofi.finance",
];

/**
 * Check if a URL's hostname is allowed in Next.js image config
 */
function isAllowedImageDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    return ALLOWED_IMAGE_DOMAINS.some((domain) => {
      // Handle wildcard domains
      if (domain.startsWith("**.")) {
        const baseDomain = domain.substring(3);
        return hostname.endsWith(baseDomain);
      }
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}

/**
 * Extracts the token symbol from an asset type or metadata
 */
export function getTokenSymbol(
  assetType: string,
  metadata?: {
    symbol?: string;
    [key: string]: unknown;
  },
): string | null {
  // Try to get symbol from metadata first
  if (metadata?.symbol) {
    return metadata.symbol.toUpperCase();
  }

  // Extract symbol from asset type
  // Asset types are typically in format: 0x...::coin::TokenName
  const parts = assetType.split("::");
  if (parts.length >= 3) {
    const tokenName = parts[parts.length - 1];
    return tokenName.toUpperCase();
  }

  // Handle special cases like 0x1::aptos_coin::AptosCoin
  if (assetType.includes("aptos_coin")) {
    return "APT";
  }

  return null;
}

/**
 * Gets the logo URL for a token using Panora Token List
 */
export async function getTokenLogoUrl(
  assetType: string,
  metadata?: {
    symbol?: string;
    [key: string]: unknown;
  },
): Promise<string | null> {
  try {
    // First try to get from Panora by address
    let tokenInfo = await PanoraTokenListService.getTokenInfo(assetType);

    // Try by symbol if we didn't find by address
    if (!tokenInfo) {
      const symbol = getTokenSymbol(assetType, metadata);
      if (symbol) {
        tokenInfo = await PanoraTokenListService.getTokenInfo(symbol);
      }
    }

    if (tokenInfo?.logoUrl) {
      // Check if the logo URL domain is allowed
      if (isAllowedImageDomain(tokenInfo.logoUrl)) {
        return tokenInfo.logoUrl;
      } else {
        logger.debug(
          `Logo URL domain not allowed: ${tokenInfo.logoUrl}, using placeholder`,
        );
        return "/placeholder.jpg";
      }
    }

    // Special case overrides for local assets
    const symbolLower = getTokenSymbol(assetType, metadata)?.toLowerCase();
    if (symbolLower === "apt" || symbolLower === "aptos") {
      return "/icons/apt.png";
    } else if (symbolLower === "usdc") {
      return "/icons/stables/usdc.png";
    } else if (symbolLower === "usdt") {
      return "/icons/stables/usdt.png";
    } else if (symbolLower === "wbtc" || symbolLower === "btc") {
      return "/icons/btc/bitcoin.png";
    } else if (symbolLower === "stapt" || symbolLower === "st-apt") {
      return "/icons/lst/amnis-stAPT.jpeg";
    } else if (symbolLower === "amnis" || symbolLower === "amapt") {
      return "/icons/protocols/amnis.avif";
    } else if (symbolLower === "thapt" || symbolLower === "th-apt") {
      return "/icons/lst/thala-thAPT.png";
    }

    return null;
  } catch (error) {
    logger.error("Error fetching token logo URL:", error);
    return null;
  }
}

/**
 * Synchronous version that uses cached data or falls back to GitHub URL construction
 */
export function getTokenLogoUrlSync(
  assetType: string,
  metadata?: {
    symbol?: string;
    [key: string]: unknown;
  },
): string | null {
  const symbol = getTokenSymbol(assetType, metadata);

  if (!symbol) {
    return null;
  }

  // Special case overrides for local assets
  const symbolLower = symbol.toLowerCase();
  if (symbolLower === "apt" || symbolLower === "aptos") {
    return "/icons/apt.png";
  } else if (symbolLower === "usdc") {
    return "/icons/stables/usdc.png";
  } else if (symbolLower === "usdt") {
    return "/icons/stables/usdt.png";
  } else if (symbolLower === "wbtc" || symbolLower === "btc") {
    return "/icons/btc/bitcoin.png";
  } else if (symbolLower === "stapt" || symbolLower === "st-apt") {
    return "/icons/lst/amnis-stAPT.jpeg";
  } else if (symbolLower === "amnis" || symbolLower === "amapt") {
    return "/icons/protocols/amnis.avif";
  } else if (symbolLower === "thapt" || symbolLower === "th-apt") {
    return "/icons/lst/thala-thAPT.png";
  }

  return null;
}

/**
 * Gets the logo URL with multiple fallback strategies
 */
export async function getTokenLogoUrlWithFallback(
  assetType: string,
  metadata?: {
    icon_uri?: string;
    symbol?: string;
    [key: string]: unknown;
  },
): Promise<string> {
  // First try metadata icon_uri if it's a valid URL
  if (
    metadata?.icon_uri &&
    typeof metadata.icon_uri === "string" &&
    metadata.icon_uri.trim() !== ""
  ) {
    const iconUri = metadata.icon_uri.trim();

    try {
      if (iconUri.startsWith("http://") || iconUri.startsWith("https://")) {
        new URL(iconUri); // This will throw if invalid
        // Skip data: URLs and invalid image URLs
        if (!iconUri.startsWith("data:") && !iconUri.includes("undefined")) {
          // Check if domain is allowed
          if (isAllowedImageDomain(iconUri)) {
            return iconUri;
          } else {
            logger.debug(
              `Metadata icon_uri domain not allowed: ${iconUri}, using placeholder`,
            );
            return "/placeholder.jpg";
          }
        }
      } else if (iconUri.startsWith("/") && !iconUri.includes("undefined")) {
        // It's a relative path
        return iconUri;
      }
    } catch {
      // Invalid URL, fall through to other options
    }
  }

  // Try async Panora lookup
  const panoraLogo = await getTokenLogoUrl(assetType, metadata);
  if (panoraLogo) {
    return panoraLogo;
  }

  // Construct GitHub URL as fallback based on symbol
  const symbol = getTokenSymbol(assetType, metadata);
  if (symbol && symbol.length > 0 && symbol !== "Unknown") {
    // Clean up symbol - remove special characters that might break URLs
    const cleanSymbol = symbol.replace(/[^a-zA-Z0-9-]/g, "");
    if (cleanSymbol.length > 0) {
      // GitHub raw URLs are allowed, so we can use them
      return `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${cleanSymbol}.svg`;
    }
  }

  // Final fallback to placeholder
  return "/placeholder.jpg";
}

/**
 * Synchronous version for components that can't use async
 */
export function getTokenLogoUrlWithFallbackSync(
  assetType: string,
  metadata?: {
    icon_uri?: string;
    symbol?: string;
    [key: string]: unknown;
  },
): string {
  // First try metadata icon_uri if it's a valid URL
  if (
    metadata?.icon_uri &&
    typeof metadata.icon_uri === "string" &&
    metadata.icon_uri.trim() !== ""
  ) {
    const iconUri = metadata.icon_uri.trim();

    try {
      if (iconUri.startsWith("http://") || iconUri.startsWith("https://")) {
        new URL(iconUri); // This will throw if invalid
        // Skip data: URLs and invalid image URLs
        if (!iconUri.startsWith("data:") && !iconUri.includes("undefined")) {
          // Check if domain is allowed
          if (isAllowedImageDomain(iconUri)) {
            return iconUri;
          } else {
            return "/placeholder.jpg";
          }
        }
      } else if (iconUri.startsWith("/") && !iconUri.includes("undefined")) {
        // It's a relative path
        return iconUri;
      }
    } catch {
      // Invalid URL, fall through to other options
    }
  }

  // Try sync version
  const localLogo = getTokenLogoUrlSync(assetType, metadata);
  if (localLogo) {
    return localLogo;
  }

  // Construct GitHub URL as fallback based on symbol
  const symbol = getTokenSymbol(assetType, metadata);
  if (symbol && symbol.length > 0 && symbol !== "Unknown") {
    // Clean up symbol - remove special characters that might break URLs
    const cleanSymbol = symbol.replace(/[^a-zA-Z0-9-]/g, "");
    if (cleanSymbol.length > 0) {
      // GitHub raw URLs are allowed
      return `https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/main/logos/${cleanSymbol}.svg`;
    }
  }

  // Final fallback to placeholder
  return "/placeholder.jpg";
}

/**
 * Preload token list to speed up lookups
 */
export async function preloadTokenList(): Promise<void> {
  try {
    await PanoraTokenListService.getTokenList();
    logger.info("Token list preloaded successfully");
  } catch (error) {
    logger.error("Failed to preload token list:", error);
  }
}
