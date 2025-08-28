/**
 * Unified Panora API service
 * Consolidates all Panora API interactions into a single service
 */

import { serviceLogger } from "@/lib/utils/core/logger";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";
import { getPanoraAuthHeaders } from "@/lib/utils/api/common";

const PANORA_BASE_URL = "https://api.panora.exchange";
const priceCache = new UnifiedCache<Map<string, number>>({
  ttl: 5 * 60 * 1000,
}); // 5 minutes
const tokenCache = new UnifiedCache<PanoraToken[]>({ ttl: 10 * 60 * 1000 }); // 10 minutes

export interface PanoraToken {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: string;
  nativePrice?: string;
  logoUrl?: string;
  panoraTags?: string[];
  websiteUrl?: string;
  panoraUI?: boolean;
  coinGeckoId?: string;
  coinMarketCapId?: number;
  isVerified?: boolean;
}

export interface TokenPriceData {
  price: number;
  change24h: number;
  symbol: string;
  decimals: number;
}

export class UnifiedPanoraService {
  /**
   * Generic fetch method for Panora API
   */
  private static async fetchFromPanora<T = any>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${PANORA_BASE_URL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...getPanoraAuthHeaders(),
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Panora API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get all tokens from token list
   */
  static async getAllTokens(panoraUI?: boolean): Promise<PanoraToken[]> {
    const cacheKey = `tokens:${panoraUI ?? "all"}`;
    const cached = tokenCache.get(cacheKey);
    if (cached) return cached;

    try {
      const params =
        panoraUI !== undefined ? { panoraUI: panoraUI.toString() } : {};
      const tokens = await this.fetchFromPanora<PanoraToken[]>(
        "/tokenlist",
        params,
      );

      // Ensure tokens have isVerified flag
      const processedTokens = Array.isArray(tokens)
        ? tokens.map((token) => ({
            ...token,
            isVerified: token.panoraTags?.includes("Verified") || false,
          }))
        : [];

      tokenCache.set(cacheKey, processedTokens);
      serviceLogger.info(
        `Fetched ${processedTokens.length} tokens from Panora`,
      );

      return processedTokens;
    } catch (error) {
      serviceLogger.error("Failed to fetch tokens from Panora", { error });
      return [];
    }
  }

  /**
   * Get verified tokens only
   */
  static async getVerifiedTokens(): Promise<PanoraToken[]> {
    return this.getAllTokens(true);
  }

  /**
   * Get all token prices as a Map for easy lookup
   */
  static async getTokenPrices(
    tokenAddresses?: string[],
  ): Promise<Map<string, number>> {
    const cacheKey = tokenAddresses
      ? `prices:${tokenAddresses.sort().join(",")}`
      : "prices:all";

    const cached = priceCache.get(cacheKey);
    if (cached) return cached;

    const priceMap = new Map<string, number>();

    try {
      const params = tokenAddresses
        ? { tokenAddress: tokenAddresses.join(",") }
        : {};
      const prices = await this.fetchFromPanora<PanoraToken[]>(
        "/prices",
        params,
      );

      // Build price map
      if (Array.isArray(prices)) {
        for (const priceData of prices) {
          const price = parseFloat(priceData.usdPrice) || 0;

          // Map by both FA address and token address
          if (priceData.faAddress) {
            priceMap.set(priceData.faAddress, price);
          }
          if (priceData.tokenAddress) {
            priceMap.set(priceData.tokenAddress, price);
          }
        }
      }

      // Handle special cases for tokens not in Panora
      if (tokenAddresses) {
        await this.handleSpecialTokenPrices(tokenAddresses, priceMap);
      }

      priceCache.set(cacheKey, priceMap);
      serviceLogger.info(`Fetched prices for ${priceMap.size} tokens`);

      return priceMap;
    } catch (error) {
      serviceLogger.error("Failed to fetch token prices", { error });
      return priceMap;
    }
  }

  /**
   * Get price for a single token
   */
  static async getTokenPrice(tokenAddress: string): Promise<number> {
    const prices = await this.getTokenPrices([tokenAddress]);
    return prices.get(tokenAddress) || 0;
  }

  /**
   * Get price data for a specific asset type with fallback handling
   */
  static async getAssetPrice(
    assetType: string,
    symbol: string,
  ): Promise<TokenPriceData> {
    try {
      const prices = await this.getTokenPrices([assetType]);
      const price = prices.get(assetType);

      if (price !== undefined && price > 0) {
        return {
          price,
          change24h: 0, // Panora doesn't provide 24h change
          symbol,
          decimals: 8, // Default decimals
        };
      }

      // If not found, throw error for caller to handle
      throw new Error(`Price not available for token ${assetType} (${symbol})`);
    } catch (error) {
      serviceLogger.error(`Failed to get price for ${assetType}`, { error });
      throw error;
    }
  }

  /**
   * Handle special token prices for tokens not in main Panora API
   */
  private static async handleSpecialTokenPrices(
    tokenAddresses: string[],
    priceMap: Map<string, number>,
  ): Promise<void> {
    for (const address of tokenAddresses) {
      if (!priceMap.has(address)) {
        try {
          // MKLP tokens - approximately 1:1 with USDC
          if (address.includes("house_lp::MKLP")) {
            priceMap.set(address, 1.0);
          }
          // MOD token
          else if (address.includes("mod_coin::MOD")) {
            const modPrice = await this.getSpecialTokenPrice(
              "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
              0.5,
            );
            priceMap.set(address, modPrice);
          }
          // THL token
          else if (address.includes("thala_token::THL")) {
            const thlPrice = await this.getSpecialTokenPrice(
              "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
              0.02,
            );
            priceMap.set(address, thlPrice);
          }
        } catch (error) {
          serviceLogger.warn(`Failed to get special price for ${address}`, {
            error,
          });
        }
      }
    }
  }

  /**
   * Get price for special tokens with fallback
   */
  private static async getSpecialTokenPrice(
    tokenAddress: string,
    fallbackPrice: number,
  ): Promise<number> {
    try {
      const prices = await this.fetchFromPanora<PanoraToken[]>("/prices", {
        tokenAddress,
      });

      if (Array.isArray(prices) && prices.length > 0) {
        const price = parseFloat(prices[0].usdPrice);
        return isNaN(price) ? fallbackPrice : price;
      }

      return fallbackPrice;
    } catch (error) {
      serviceLogger.warn(
        `Special token price fetch failed for ${tokenAddress}`,
        { error },
      );
      return fallbackPrice;
    }
  }

  /**
   * Clear all caches (useful for testing or forced refresh)
   */
  static clearCache(): void {
    priceCache.clear();
    tokenCache.clear();
    serviceLogger.info("Panora service caches cleared");
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    priceCache: { size: number; ttl: number };
    tokenCache: { size: number; ttl: number };
  } {
    return {
      priceCache: { size: priceCache.size, ttl: priceCache.ttl },
      tokenCache: { size: tokenCache.size, ttl: tokenCache.ttl },
    };
  }
}
