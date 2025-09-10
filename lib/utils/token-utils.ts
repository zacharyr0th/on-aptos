/**
 * Unified token utilities - consolidates token-related functions
 * Combines functionality from token-logos.ts, token-categorization.ts, and portfolio-utils.ts
 */

import { PANORA_TOKENS } from "@/lib/config/data";
import { LST_TOKEN_ADDRESSES } from "@/lib/constants";
import { ALL_STABLECOINS, LEGITIMATE_STABLECOINS } from "@/lib/constants/tokens/stablecoins";
import { PanoraTokenListService } from "@/lib/utils/api/panora-token-list";
import { logger } from "@/lib/utils/core/logger";

// ===== TYPES =====

export type TokenCategory = "Stablecoins" | "LSTs" | "DeFi" | "Other";

export interface CategorizedToken {
  category: TokenCategory;
  symbol: string;
  value: number;
  percentage: number;
  assetType: string;
}

export interface CategoryAllocation {
  category: TokenCategory;
  value: number;
  percentage: number;
  color: string;
}

// ===== CONSTANTS =====

const CATEGORY_COLORS: Record<TokenCategory, string> = {
  Stablecoins: "#22c55e", // Green
  LSTs: "#8b5cf6", // Purple
  DeFi: "#3b82f6", // Blue
  Other: "#6b7280", // Gray
};

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

// ===== SYMBOL EXTRACTION =====

/**
 * Extracts the token symbol from an asset type or metadata
 * Consolidated from token-logos.ts and portfolio-utils.ts
 */
export function getTokenSymbol(
  assetType: string,
  metadata?: { symbol?: string; icon_uri?: string; logo_url?: string }
): string | null {
  // Try to get symbol from metadata first
  if (metadata?.symbol) {
    return metadata.symbol.toUpperCase();
  }

  // Handle special cases first
  if (assetType === "0x1::aptos_coin::AptosCoin" || assetType === "0xa") {
    return "APT";
  }
  if (assetType.includes("USDC")) return "USDC";
  if (assetType.includes("USDT")) return "USDT";
  if (assetType.includes("aptos_coin")) return "APT";

  // Extract symbol from asset type
  // Asset types are typically in format: 0x...::coin::TokenName
  const parts = assetType.split("::");
  if (parts.length >= 3) {
    const tokenName = parts[parts.length - 1];
    return tokenName.replace(/[<>]/g, "").toUpperCase();
  }

  return null;
}

/**
 * Backward compatible alias for portfolio-utils.ts
 */
export function getSymbolFromAssetType(assetType: string): string {
  const symbol = getTokenSymbol(assetType);
  return symbol || "Unknown";
}

// ===== TOKEN CATEGORIZATION =====

/**
 * Check if an asset is a stablecoin
 */
export function isStablecoin(assetType: string): boolean {
  // Check against the unified stablecoin registry
  return LEGITIMATE_STABLECOINS.has(assetType);
}

/**
 * Check if an asset is an LST (Liquid Staking Token)
 */
export function isLST(assetType: string): boolean {
  // Check if it's in the LST addresses object
  for (const provider of Object.values(LST_TOKEN_ADDRESSES)) {
    for (const token of Object.values(provider)) {
      if (("coin" in token && token.coin === assetType) || token.fa === assetType) {
        return true;
      }
    }
  }

  // Also check the token objects
  for (const token of Object.values(PANORA_TOKENS)) {
    if (token.asset_type === assetType) return true;
  }

  return false;
}

/**
 * Categorize a single token
 */
export function categorizeToken(assetType: string, symbol?: string): TokenCategory {
  // Check if it's explicitly marked as DeFi
  if (assetType === "DeFi Positions" || symbol === "DEFI") {
    return "DeFi";
  }

  // Check stablecoins
  if (isStablecoin(assetType)) {
    return "Stablecoins";
  }

  // Check LSTs
  if (isLST(assetType)) {
    return "LSTs";
  }

  // Default to Other
  return "Other";
}

/**
 * Process allocation data to get categories and top tokens
 */
export function processAllocationData(
  allocationData: Array<{
    assetType: string;
    symbol: string;
    value: number;
    percentage: number;
  }>
): {
  categories: CategoryAllocation[];
  topTokens: CategorizedToken[];
} {
  // Group by category
  const categoryMap = new Map<TokenCategory, number>();
  const categorizedTokens: CategorizedToken[] = [];

  allocationData.forEach((asset) => {
    const category = categorizeToken(asset.assetType, asset.symbol);
    const currentValue = categoryMap.get(category) || 0;
    categoryMap.set(category, currentValue + asset.value);

    categorizedTokens.push({
      category,
      symbol: asset.symbol,
      value: asset.value,
      percentage: asset.percentage,
      assetType: asset.assetType,
    });
  });

  // Calculate total value
  const totalValue = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

  // Convert to category allocations
  const categories: CategoryAllocation[] = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: CATEGORY_COLORS[category],
    }))
    .sort((a, b) => b.value - a.value);

  // Get top 3 tokens by value
  const topTokens = categorizedTokens.sort((a, b) => b.value - a.value).slice(0, 3);

  return { categories, topTokens };
}

// ===== ASSET DECIMALS & VALIDATION =====

/**
 * Get proper decimals for asset types
 */
export function getAssetDecimals(assetType: string): number {
  if (assetType.includes("USDC")) return 6;
  if (assetType.includes("USDT")) return 6;
  return 8; // Default for APT and most tokens
}

/**
 * Check if asset type is APT
 */
export function isAptAsset(assetType: string): boolean {
  return (
    assetType === "0x1::aptos_coin::AptosCoin" ||
    assetType === "0xa" ||
    assetType === "0x000000000000000000000000000000000000000000000000000000000000000a" ||
    assetType.toLowerCase().includes("aptos") ||
    assetType.toLowerCase().includes("apt")
  );
}

// ===== TOKEN LOGOS =====

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
 * Gets the logo URL for a token using Panora Token List
 */
export async function getTokenLogoUrl(
  assetType: string,
  metadata?: { symbol?: string; icon_uri?: string; logo_url?: string }
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
        logger.debug(`Logo URL domain not allowed: ${tokenInfo.logoUrl}, using placeholder`);
        return "/placeholder.jpg";
      }
    }

    // Special case overrides for local assets
    const symbolLower = getTokenSymbol(assetType, metadata)?.toLowerCase();
    if (symbolLower === "apt" || symbolLower === "aptos") {
      return "/icons/apt.png";
    } else if (symbolLower === "usdc") {
      return "/icons/stables/usdc.webp";
    } else if (symbolLower === "usdt") {
      return "/icons/stables/usdt.webp";
    } else if (symbolLower === "wbtc" || symbolLower === "btc") {
      return "/icons/btc/bitcoin.webp";
    } else if (symbolLower === "stapt" || symbolLower === "st-apt") {
      return "/icons/lst/amnis-stAPT.jpeg";
    } else if (symbolLower === "amnis" || symbolLower === "amapt") {
      return "/icons/protocols/amnis.avif";
    } else if (symbolLower === "thapt" || symbolLower === "th-apt") {
      return "/icons/lst/thala-thAPT.png";
    }

    return null;
  } catch (error) {
    logger.error({ error }, "Error fetching token logo URL:");
    return null;
  }
}

/**
 * Synchronous version that uses cached data or falls back to GitHub URL construction
 */
export function getTokenLogoUrlSync(
  assetType: string,
  metadata?: { symbol?: string; icon_uri?: string; logo_url?: string }
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
    return "/icons/stables/usdc.webp";
  } else if (symbolLower === "usdt") {
    return "/icons/stables/usdt.webp";
  } else if (symbolLower === "wbtc" || symbolLower === "btc") {
    return "/icons/btc/bitcoin.webp";
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
  metadata?: { symbol?: string; icon_uri?: string; logo_url?: string }
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
            logger.debug(`Metadata icon_uri domain not allowed: ${iconUri}, using placeholder`);
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
  metadata?: { symbol?: string; icon_uri?: string; logo_url?: string }
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
    logger.error({ error }, "Failed to preload token list");
  }
}
