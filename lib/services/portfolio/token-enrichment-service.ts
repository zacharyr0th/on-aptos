import { logger } from "@/lib/utils/core/logger";

interface PanoraToken {
  faAddress?: string | null;
  tokenAddress?: string | null;
  symbol: string;
  name: string;
  usdPrice: string;
  logoUrl?: string;
  panoraTags?: string[];
  decimals: number;
  isVerified?: boolean;
}

interface EnrichedAsset {
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

class TokenEnrichmentService {
  private static panoraTokenCache: Map<string, PanoraToken> = new Map();
  private static lastFetchTime = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch all tokens from Panora API
   */
  private static async fetchPanoraTokens(): Promise<Map<string, PanoraToken>> {
    // Check cache
    if (
      Date.now() - this.lastFetchTime < this.CACHE_TTL &&
      this.panoraTokenCache.size > 0
    ) {
      return this.panoraTokenCache;
    }

    try {
      // Use Panora API to get all 3000+ tokens
      const response = await fetch(
        "https://api.panora.exchange/tokenlist?panoraUI=false",
        {
          headers: {
            "x-api-key":
              "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Panora tokens: ${response.status}`);
      }

      const panoraResponse = await response.json();
      logger.debug("[TokenEnrichmentService] Raw Panora response structure:", {
        type: typeof panoraResponse,
        isArray: Array.isArray(panoraResponse),
        hasData: "data" in panoraResponse,
        keys:
          typeof panoraResponse === "object"
            ? Object.keys(panoraResponse)
            : null,
        firstFewItems: Array.isArray(panoraResponse)
          ? panoraResponse.slice(0, 2)
          : null,
      });

      // Extract tokens array from the response structure
      let tokens;
      if (Array.isArray(panoraResponse)) {
        // Direct array response
        tokens = panoraResponse;
      } else if (panoraResponse?.data && Array.isArray(panoraResponse.data)) {
        // Wrapped in data property
        tokens = panoraResponse.data;
      } else {
        // Fallback to empty array and log the issue
        logger.error(
          "[TokenEnrichmentService] Unexpected Panora response format:",
          {
            type: typeof panoraResponse,
            response: panoraResponse,
          },
        );
        tokens = [];
      }

      // Validate that tokens is an array
      if (!Array.isArray(tokens)) {
        logger.error(
          "[TokenEnrichmentService] Expected tokens array but got:",
          typeof tokens,
        );
        throw new Error(`Expected tokens array but got ${typeof tokens}`);
      }

      // Clear and rebuild cache
      this.panoraTokenCache.clear();

      tokens.forEach((token: any) => {
        // Special handling for APT
        const isAPT =
          token.symbol === "APT" ||
          token.tokenAddress === "0x1::aptos_coin::AptosCoin" ||
          token.name?.toLowerCase().includes("aptos");

        // Map by both faAddress and tokenAddress for comprehensive lookup
        if (token.faAddress && token.faAddress !== "null") {
          this.panoraTokenCache.set(token.faAddress, {
            ...token,
            usdPrice: token.price?.toString() || token.usdPrice || "0",
            isVerified: isAPT
              ? true
              : token.isVerified || token.panoraTags?.includes("Verified"),
          });
        }
        if (token.tokenAddress && token.tokenAddress !== "null") {
          this.panoraTokenCache.set(token.tokenAddress, {
            ...token,
            usdPrice: token.price?.toString() || token.usdPrice || "0",
            isVerified: isAPT
              ? true
              : token.isVerified || token.panoraTags?.includes("Verified"),
          });
        }

        // Also map APT by its standard address
        if (isAPT) {
          this.panoraTokenCache.set("0x1::aptos_coin::AptosCoin", {
            ...token,
            tokenAddress: "0x1::aptos_coin::AptosCoin",
            usdPrice: token.price?.toString() || token.usdPrice || "0",
            isVerified: true,
            symbol: "APT",
            name: "Aptos",
          });
        }
      });

      this.lastFetchTime = Date.now();

      // Check if UPTOS is in the cache
      let uptosFound = false;
      this.panoraTokenCache.forEach((value, key) => {
        if (
          value.symbol === "UPTOS" ||
          value.symbol === "Uptos" ||
          key.toLowerCase().includes("uptos")
        ) {
          logger.info(`[UPTOS Debug] Found UPTOS in Panora cache:`, {
            key,
            symbol: value.symbol,
            name: value.name,
            price: value.usdPrice,
            isVerified: value.isVerified,
            logoUrl: value.logoUrl,
            faAddress: value.faAddress,
            tokenAddress: value.tokenAddress,
          });
          uptosFound = true;
        }
      });

      if (!uptosFound) {
        logger.info(`[UPTOS Debug] UPTOS NOT found in Panora cache`);
      }

      logger.info(
        `[TokenEnrichmentService] Cached ${this.panoraTokenCache.size} tokens from Panora`,
      );

      return this.panoraTokenCache;
    } catch (error) {
      logger.error(
        "[TokenEnrichmentService] Failed to fetch Panora tokens:",
        error,
      );
      return this.panoraTokenCache; // Return existing cache on error
    }
  }

  /**
   * Enrich wallet assets with Panora token data
   */
  static async enrichAssetsWithPanoraData(
    assets: any[],
  ): Promise<EnrichedAsset[]> {
    if (!assets || assets.length === 0) return [];

    // Fetch Panora token data
    const panoraTokens = await this.fetchPanoraTokens();

    logger.info(
      `[TokenEnrichmentService] Enriching ${assets.length} assets with Panora data`,
    );

    return assets.map((asset) => {
      // Special handling for APT
      const isAPT =
        asset.asset_type === "0x1::aptos_coin::AptosCoin" ||
        asset.metadata?.symbol === "APT" ||
        asset.metadata?.name?.toLowerCase().includes("aptos");

      // Look up token in Panora cache
      const panoraToken = panoraTokens.get(asset.asset_type);

      // Debug logging for UPTOS
      if (asset.metadata?.symbol === "UPTOS") {
        logger.info(`[UPTOS Debug] Found UPTOS in wallet:`, {
          asset_type: asset.asset_type,
          hasPanoraData: !!panoraToken,
          panoraData: panoraToken
            ? {
                symbol: panoraToken.symbol,
                price: panoraToken.usdPrice,
                isVerified: panoraToken.isVerified,
                logoUrl: panoraToken.logoUrl,
              }
            : null,
          originalPrice: asset.price,
          originalValue: asset.value,
        });
      }

      if (panoraToken || isAPT) {
        // For APT, ensure we have proper data even if not in cache
        const tokenData =
          panoraToken ||
          (isAPT
            ? {
                symbol: "APT",
                name: "Aptos",
                logoUrl: "/icons/apt.png",
                isVerified: true,
                panoraTags: ["Native", "Verified"],
                decimals: 8,
                usdPrice: asset.price?.toString() || "0",
              }
            : null);

        if (tokenData) {
          // Merge Panora data with existing asset data
          const enrichedAsset: EnrichedAsset = {
            ...asset,
            // Use Panora price if available and greater than 0
            price: parseFloat(tokenData.usdPrice) || asset.price || 0,
            // Use Panora logo URL
            logoUrl: tokenData.logoUrl || asset.logoUrl,
            // Add verification status (APT is always verified)
            isVerified: isAPT ? true : tokenData.isVerified || false,
            // Add Panora tags
            panoraTags: tokenData.panoraTags || [],
            // Update metadata with Panora data if missing
            metadata: {
              ...asset.metadata,
              name: asset.metadata?.name || tokenData.name,
              symbol: asset.metadata?.symbol || tokenData.symbol,
              decimals: asset.metadata?.decimals || tokenData.decimals,
              icon_uri: asset.metadata?.icon_uri || tokenData.logoUrl,
            },
          };

          // Recalculate value with Panora price
          if (enrichedAsset.balance && enrichedAsset.price) {
            enrichedAsset.value = enrichedAsset.balance * enrichedAsset.price;
          }

          logger.debug(
            `[TokenEnrichmentService] Enriched ${enrichedAsset.metadata?.symbol || asset.asset_type} with Panora data`,
          );

          return enrichedAsset;
        }
      }

      // Return original asset if not found in Panora
      return {
        ...asset,
        isVerified: false,
        panoraTags: [],
      };
    });
  }

  /**
   * Get a single token's Panora data
   */
  static async getPanoraTokenData(
    assetType: string,
  ): Promise<PanoraToken | null> {
    const panoraTokens = await this.fetchPanoraTokens();
    return panoraTokens.get(assetType) || null;
  }

  /**
   * Clear the cache (useful for forcing refresh)
   */
  static clearCache(): void {
    this.panoraTokenCache.clear();
    this.lastFetchTime = 0;
    logger.info("[TokenEnrichmentService] Cache cleared");
  }
}

export { TokenEnrichmentService, type EnrichedAsset, type PanoraToken };
