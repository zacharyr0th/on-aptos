/**
 * Unified Panora API service
 * Consolidates all Panora API interactions into a single service
 */

import { getPanoraAuthHeaders } from "@/lib/utils/api/common";
import { UnifiedCache } from "@/lib/utils/cache/unified-cache";
import { serviceLogger } from "@/lib/utils/core/logger";

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

export interface EnrichedAsset {
  asset_type: string;
  amount: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
  price?: number;
  value?: number;
  balance?: number;
  isVerified?: boolean;
  logoUrl?: string;
  panoraTags?: string[];
  protocolInfo?: any;
  [key: string]: any;
}

export class UnifiedPanoraService {
  /**
   * Generic fetch method for Panora API
   */
  private static async fetchFromPanora<T = any>(
    endpoint: string,
    params?: Record<string, string>
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
      throw new Error(`Panora API error: ${response.status} ${response.statusText}`);
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
      const params = panoraUI !== undefined ? { panoraUI: panoraUI.toString() } : {};
      const tokens = await UnifiedPanoraService.fetchFromPanora<PanoraToken[]>(
        "/tokenlist",
        params
      );

      // Ensure tokens have isVerified flag
      const processedTokens = Array.isArray(tokens)
        ? tokens.map((token) => ({
            ...token,
            isVerified: token.panoraTags?.includes("Verified") || false,
          }))
        : [];

      tokenCache.set(cacheKey, processedTokens);
      serviceLogger.info(`Fetched ${processedTokens.length} tokens from Panora`);

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
    return UnifiedPanoraService.getAllTokens(true);
  }

  /**
   * Get all token prices as a Map for easy lookup
   */
  static async getTokenPrices(tokenAddresses?: string[]): Promise<Map<string, number>> {
    const cacheKey = tokenAddresses ? `prices:${tokenAddresses.sort().join(",")}` : "prices:all";

    const cached = priceCache.get(cacheKey);
    if (cached) return cached;

    const priceMap = new Map<string, number>();

    try {
      const params = tokenAddresses ? { tokenAddress: tokenAddresses.join(",") } : {};
      const prices = await UnifiedPanoraService.fetchFromPanora<PanoraToken[]>("/prices", params);

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
        await UnifiedPanoraService.handleSpecialTokenPrices(tokenAddresses, priceMap);
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
    const prices = await UnifiedPanoraService.getTokenPrices([tokenAddress]);
    return prices.get(tokenAddress) || 0;
  }

  /**
   * Get price data for a specific asset type with fallback handling
   */
  static async getAssetPrice(assetType: string, symbol: string): Promise<TokenPriceData> {
    try {
      const prices = await UnifiedPanoraService.getTokenPrices([assetType]);
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
    priceMap: Map<string, number>
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
            const modPrice = await UnifiedPanoraService.getSpecialTokenPrice(
              "0x6f986d146e4a90b828d8c12c14b6f4e003fdff11a8eecceceb63744363eaac01::mod_coin::MOD",
              0.5
            );
            priceMap.set(address, modPrice);
          }
          // THL token
          else if (address.includes("thala_token::THL")) {
            const thlPrice = await UnifiedPanoraService.getSpecialTokenPrice(
              "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL",
              0.02
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
    fallbackPrice: number
  ): Promise<number> {
    try {
      const prices = await UnifiedPanoraService.fetchFromPanora<PanoraToken[]>("/prices", {
        tokenAddress,
      });

      if (Array.isArray(prices) && prices.length > 0) {
        const price = parseFloat(prices[0].usdPrice);
        return isNaN(price) ? fallbackPrice : price;
      }

      return fallbackPrice;
    } catch (error) {
      serviceLogger.warn(`Special token price fetch failed for ${tokenAddress}`, { error });
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
   * Enrich assets with Panora data (token metadata, prices, verification status)
   */
  static async enrichAssetsWithPanoraData(assets: any[]): Promise<EnrichedAsset[]> {
    if (!assets || assets.length === 0) {
      return [];
    }

    serviceLogger.info(`Enriching ${assets.length} assets with Panora data`);

    // Debug: Log sample of assets before enrichment
    if (assets.length > 0) {
      serviceLogger.debug("Sample asset before enrichment:", {
        symbol: assets[0].metadata?.symbol,
        value: assets[0].value,
        price: assets[0].price,
        balance: assets[0].balance,
      });
    }

    try {
      // Get all tokens for enrichment
      const tokens = await UnifiedPanoraService.getAllTokens(false); // Get all tokens, not just UI ones
      const tokenMap = new Map<string, PanoraToken>();

      // Build lookup map
      tokens.forEach((token) => {
        if (token.faAddress) {
          tokenMap.set(token.faAddress, token);
        }
        if (token.tokenAddress) {
          tokenMap.set(token.tokenAddress, token);
        }
      });

      // Special handling for APT - handle all possible identifiers
      const aptToken = tokens.find((t) => t.symbol === "APT");
      const enrichedAptToken = {
        ...(aptToken ||
          ({
            chainId: 1,
            panoraId: "apt",
            tokenAddress: "0x1::aptos_coin::AptosCoin",
            faAddress: "0xa",
            name: "Aptos",
            symbol: "APT",
            decimals: 8,
            usdPrice: "0",
            logoUrl: "https://assets.panora.exchange/tokens/aptos/APT.svg",
          } as PanoraToken)),
        isVerified: true,
      };

      // Add APT to map with all possible identifiers
      tokenMap.set("0x1::aptos_coin::AptosCoin", enrichedAptToken);
      tokenMap.set("0xa", enrichedAptToken);
      // Also add in case assets come with different casing/format
      tokenMap.set("0xA", enrichedAptToken);

      // Enrich each asset
      const enrichedAssets: EnrichedAsset[] = [];

      for (const asset of assets) {
        const panoraToken = tokenMap.get(asset.asset_type);
        const enrichedAsset: EnrichedAsset = { ...asset };

        if (panoraToken) {
          // Enrich with Panora data, but preserve existing calculated values if Panora price is 0
          const panoraPrice = parseFloat(panoraToken.usdPrice) || 0;

          // Only override price if Panora has a valid price, otherwise keep existing
          if (panoraPrice > 0) {
            enrichedAsset.price = panoraPrice;
          } else if (!enrichedAsset.price) {
            enrichedAsset.price = 0;
          }

          enrichedAsset.isVerified =
            panoraToken.isVerified || panoraToken.panoraTags?.includes("Verified") || false;
          enrichedAsset.logoUrl = panoraToken.logoUrl || undefined;
          enrichedAsset.panoraTags = panoraToken.panoraTags || [];

          // Update metadata if present
          if (enrichedAsset.metadata) {
            enrichedAsset.metadata.name = panoraToken.name || enrichedAsset.metadata.name;
            enrichedAsset.metadata.symbol = panoraToken.symbol || enrichedAsset.metadata.symbol;
            enrichedAsset.metadata.decimals =
              panoraToken.decimals || enrichedAsset.metadata.decimals;
            if (panoraToken.logoUrl && !enrichedAsset.metadata.icon_uri) {
              enrichedAsset.metadata.icon_uri = panoraToken.logoUrl;
            }
          } else {
            // Create metadata if not present
            enrichedAsset.metadata = {
              name: panoraToken.name,
              symbol: panoraToken.symbol,
              decimals: panoraToken.decimals,
              icon_uri: panoraToken.logoUrl || undefined,
            };
          }

          // Only recalculate values if we don't already have them or if Panora has better data
          if (!enrichedAsset.balance || panoraPrice > 0) {
            const balance =
              enrichedAsset.balance || parseFloat(asset.amount) / 10 ** panoraToken.decimals;
            enrichedAsset.balance = balance;

            // Only recalculate value if Panora has a price, otherwise keep existing value
            if (panoraPrice > 0) {
              enrichedAsset.value = balance * panoraPrice;
            } else if (!enrichedAsset.value) {
              enrichedAsset.value = 0;
            }
          }

          serviceLogger.debug(
            `Enriched ${enrichedAsset.metadata?.symbol || asset.asset_type} with Panora data`
          );
        } else {
          // Asset not found in Panora, preserve existing data
          // Only calculate balance if we don't have it already
          if (!enrichedAsset.balance && asset.metadata) {
            const balance = parseFloat(asset.amount) / 10 ** (asset.metadata.decimals || 8);
            enrichedAsset.balance = balance;
          }
          // Keep existing price and value if they exist, don't overwrite with 0
          // The asset service already calculated these values
        }

        enrichedAssets.push(enrichedAsset);
      }

      serviceLogger.info(`Successfully enriched ${enrichedAssets.length} assets with Panora data`);

      // Debug: Log sample of assets after enrichment
      if (enrichedAssets.length > 0) {
        const totalValue = enrichedAssets.reduce((sum, a) => sum + (a.value || 0), 0);
        serviceLogger.debug("Sample asset after enrichment:", {
          symbol: enrichedAssets[0].metadata?.symbol,
          value: enrichedAssets[0].value,
          price: enrichedAssets[0].price,
          balance: enrichedAssets[0].balance,
          totalPortfolioValue: totalValue,
        });
      }

      return enrichedAssets;
    } catch (error) {
      serviceLogger.error("Failed to enrich assets with Panora data:", error);
      return assets.map((asset) => ({
        ...asset,
        price: 0,
        value: 0,
        isVerified: false,
      }));
    }
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
