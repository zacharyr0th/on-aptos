/**
 * Unified token utilities - consolidates token-related functions
 * Combines functionality from token-logos.ts, token-categorization.ts, and portfolio-utils.ts
 */

import { PANORA_TOKENS } from "@/lib/config/data";
import {
  LST_TOKEN_ADDRESSES,
  STABLECOINS,
  LAYERZERO_STABLECOINS,
  WORMHOLE_STABLECOINS,
  CELER_STABLECOINS,
} from "@/lib/constants";
import { TOKEN_CATEGORY_COLORS } from "@/lib/constants/ui/colors";
import { PanoraTokenListService } from "@/lib/services/portfolio/panora-token-list";
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
  metadata?: {
    symbol?: string;
    [key: string]: unknown;
  },
): string | null {
  // Ensure assetType is a string
  if (!assetType || typeof assetType !== "string") {
    return metadata?.symbol?.toUpperCase() || null;
  }

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
  // Check native stablecoins
  const stablecoinValues = Object.values(STABLECOINS);
  if (stablecoinValues.some((value) => value === assetType)) return true;

  // Check bridged stablecoins
  const layerzeroValues = Object.values(LAYERZERO_STABLECOINS);
  if (layerzeroValues.some((value) => value === assetType)) return true;

  const wormholeValues = Object.values(WORMHOLE_STABLECOINS);
  if (wormholeValues.some((value) => value === assetType)) return true;

  const celerValues = Object.values(CELER_STABLECOINS);
  if (celerValues.some((value) => value === assetType)) return true;

  return false;
}

/**
 * Check if an asset is an LST (Liquid Staking Token)
 */
export function isLST(assetType: string): boolean {
  // Check if it's in the LST addresses object
  for (const provider of Object.values(LST_TOKEN_ADDRESSES)) {
    for (const token of Object.values(provider)) {
      if (token.coin === assetType || token.fa === assetType) {
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
export function categorizeToken(
  assetType: string,
  symbol?: string,
): TokenCategory {
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
  }>,
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
  const totalValue = Array.from(categoryMap.values()).reduce(
    (sum, val) => sum + val,
    0,
  );

  // Convert to category allocations
  const categories: CategoryAllocation[] = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: TOKEN_CATEGORY_COLORS[category],
    }))
    .sort((a, b) => b.value - a.value);

  // Get top 3 tokens by value
  const topTokens = categorizedTokens
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

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
    assetType ===
      "0x000000000000000000000000000000000000000000000000000000000000000a" ||
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

// ===== ADDITIONAL UTILITIES =====

/**
 * Copy to clipboard with error handling and toast notifications
 */
export const copyToClipboard = async (
  text: string,
  _label: string = "Address",
): Promise<void> => {
  if (!text) {
    logger.warn("Attempted to copy empty text to clipboard");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    // Note: toast import would need to be added to use this
    // toast.success(`${label} copied to clipboard`);
  } catch (error) {
    logger.error(
      `Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`,
    );
    // toast.error("Failed to copy to clipboard");
  }
};

/**
 * Truncate address for display
 */
export const truncateAddress = (
  address: string,
  startChars = 8,
  endChars = 8,
): string => {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format token amounts with proper decimal handling
 */
export const formatTokenAmount = (
  amount: string | number | bigint,
  decimals: number = 6,
  options: {
    showDecimals?: boolean;
    maxDecimals?: number;
    useGrouping?: boolean;
  } = {},
): string => {
  const { showDecimals = true, maxDecimals = 2, useGrouping = true } = options;

  try {
    let numericAmount: number;

    if (typeof amount === "bigint") {
      numericAmount = Number(amount) / Math.pow(10, decimals);
    } else if (typeof amount === "string") {
      const cleanAmount = amount.replace(/[,\s]/g, "");
      numericAmount = Number(cleanAmount) / Math.pow(10, decimals);
    } else {
      numericAmount = Number(amount);
    }

    if (!Number.isFinite(numericAmount)) {
      throw new Error(`Invalid numeric amount: ${amount}`);
    }

    const formatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: showDecimals ? maxDecimals : 0,
      useGrouping,
    });

    return formatter.format(numericAmount);
  } catch (error) {
    logger.error("Error formatting token amount:", error);
    return "0";
  }
};

/**
 * Format token supply with currency-like display
 */
export const formatTokenSupply = (
  amount: string | number | bigint,
  symbol: string,
  decimals: number = 6,
  options: {
    showSymbol?: boolean;
    maxDecimals?: number;
  } = {},
): string => {
  const { showSymbol = true, maxDecimals = 0 } = options;

  try {
    const formattedAmount = formatTokenAmount(amount, decimals, {
      showDecimals: maxDecimals > 0,
      maxDecimals,
      useGrouping: true,
    });

    return showSymbol ? `${formattedAmount} ${symbol}` : formattedAmount;
  } catch (error) {
    logger.error("Error formatting token supply:", error);
    return showSymbol ? `0 ${symbol}` : "0";
  }
};

/**
 * Format USD values with proper scaling
 */
export const formatUSDValue = (
  amount: number | string,
  options: {
    decimals?: number;
    compact?: boolean;
  } = {},
): string => {
  const { decimals = 0, compact = true } = options;

  try {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (!Number.isFinite(numAmount)) {
      throw new Error(`Invalid USD amount: ${amount}`);
    }

    if (compact) {
      if (numAmount >= 1_000_000_000) {
        return `$${(numAmount / 1_000_000_000).toFixed(1)}B`;
      } else if (numAmount >= 1_000_000) {
        return `$${(numAmount / 1_000_000).toFixed(1)}M`;
      } else if (numAmount >= 1_000) {
        return `$${(numAmount / 1_000).toFixed(1)}K`;
      } else {
        return `$${numAmount.toFixed(decimals)}`;
      }
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: decimals,
    }).format(numAmount);
  } catch (error) {
    logger.error("Error formatting USD value:", error);
    return "$0";
  }
};

/**
 * Validate token data structure
 */
export const validateTokenData = (token: {
  symbol: string;
  supply: string;
  supply_raw?: string;
  decimals?: number;
}): boolean => {
  try {
    if (!token.symbol || typeof token.symbol !== "string") {
      logger.warn("Invalid token symbol:", token.symbol);
      return false;
    }

    if (!token.supply || typeof token.supply !== "string") {
      logger.warn("Invalid token supply:", token.supply);
      return false;
    }

    // Try to parse supply as BigInt to validate format
    BigInt(token.supply.replace(/[,\s]/g, ""));

    return true;
  } catch (error) {
    logger.warn("Token data validation failed:", error);
    return false;
  }
};

/**
 * Sort tokens by supply (descending)
 */
export const sortTokensBySupply = <
  T extends { symbol: string; supply: string },
>(
  tokens: T[],
): T[] => {
  return tokens.filter(validateTokenData).sort((a, b) => {
    try {
      const supplyA = BigInt(a.supply.replace(/[,\s]/g, ""));
      const supplyB = BigInt(b.supply.replace(/[,\s]/g, ""));
      return supplyB > supplyA ? 1 : supplyB < supplyA ? -1 : 0;
    } catch {
      return 0;
    }
  });
};

// Error types for token operations
export class TokenFormattingError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TokenFormattingError";
  }
}

export class TokenValidationError extends Error {
  constructor(
    message: string,
    public readonly token?: unknown,
  ) {
    super(message);
    this.name = "TokenValidationError";
  }
}

// Constants
export const DEFAULT_TOKEN_DECIMALS = 6;
export const BTC_DECIMALS = 8;
export const STABLECOIN_DECIMALS = 6;
export const MAX_DISPLAY_DECIMALS = 8;

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
