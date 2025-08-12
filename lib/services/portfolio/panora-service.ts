import { PANORA_TOKENS } from "@/lib/config/data";
import { TOKEN_REGISTRY, NATIVE_TOKENS, STABLECOINS } from "@/lib/constants";
import { cacheFirst } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";

const PANORA_API_ENDPOINT = "https://api.panora.exchange/prices";
// Use environment variable for API key
const PANORA_API_KEY = process.env.PANORA_API_KEY!;

if (!process.env.PANORA_API_KEY) {
  throw new Error("PANORA_API_KEY environment variable is required");
}

export interface PanoraPriceResponse {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: string;
  nativePrice: string;
  iconUrl?: string;
}

interface TokenPriceData {
  price: number;
  change24h: number;
  symbol: string;
  decimals: number;
}

export class PanoraService {
  /**
   * Fetch prices for all tokens with liquidity
   */
  static async getAllPrices(): Promise<PanoraPriceResponse[]> {
    const cacheKey = "panora:all-prices";

    const response = await cacheFirst({
      namespace: "prices",
      cacheKey,
      startTime: Date.now(),
      fetchFn: async () => {
        logger.info("Fetching all prices from Panora API");

        const response = await fetch(PANORA_API_ENDPOINT, {
          method: "GET",
          headers: {
            "x-api-key": PANORA_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`Panora API error: ${response.status}`);
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data : [];

        logger.info(`Retrieved ${result.length} prices from Panora API`);
        return result;
      },
    });

    return response.data;
  }

  /**
   * Fetch prices for specific token addresses
   */
  static async getTokenPrices(
    tokenAddresses: string[],
  ): Promise<PanoraPriceResponse[]> {
    if (tokenAddresses.length === 0) return [];

    // Sort addresses to ensure consistent cache key
    const sortedAddresses = [...tokenAddresses].sort();
    const cacheKey = `panora:token-prices:${sortedAddresses.join(",")}`;

    const response = await cacheFirst({
      namespace: "prices",
      cacheKey,
      startTime: Date.now(),
      fetchFn: async () => {
        logger.info(
          `Fetching prices for specific tokens: ${tokenAddresses.join(", ")}`,
        );

        const queryParams = new URLSearchParams({
          tokenAddress: tokenAddresses.join(","),
        });

        const response = await fetch(`${PANORA_API_ENDPOINT}?${queryParams}`, {
          method: "GET",
          headers: {
            "x-api-key": PANORA_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`Panora API error: ${response.status}`);
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data : [];

        logger.info(
          `Retrieved ${result.length} specific token prices from Panora API`,
        );
        return result;
      },
    });

    return response.data;
  }

  /**
   * Get price data for a specific asset type, trying Panora first, then CMC as fallback
   */
  static async getAssetPrice(
    assetType: string,
    symbol: string,
  ): Promise<TokenPriceData> {
    try {
      // Try Panora first
      const panoraPrices = await this.getAllPrices();
      const panoraMatch = panoraPrices.find(
        (price) =>
          price.faAddress === assetType || price.tokenAddress === assetType,
      );

      if (panoraMatch) {
        return {
          price: parseFloat(panoraMatch.usdPrice),
          change24h: 0, // Panora doesn't provide 24h change, set to 0
          symbol: panoraMatch.symbol,
          decimals: panoraMatch.decimals,
        };
      }

      // Fallback - throw error instead of returning 0
      logger.info(
        `Asset ${assetType} not found in Panora, no fallback available for ${symbol}`,
      );

      // Throw error to indicate price not available
      throw new Error(`Price not available for token ${assetType} (${symbol})`);

      // TODO: Implement CMC fallback here when API key is available
      // try {
      //   const cmcPrice = await CoinMarketCapService.getPrice(_symbol);
      //   return {
      //     price: cmcPrice.price,
      //     change24h: cmcPrice.change24h,
      //     symbol: symbol,
      //     decimals: 8,
      //   };
      // } catch (cmcError) {
      //   logger.warn(`CMC fallback failed for ${symbol}:`, cmcError);
      //   throw new Error(`No price data available for ${symbol}`);
      // }
    } catch (error) {
      logger.error(`Failed to get price for ${assetType}:`, error);
      // Re-throw the error to let the caller handle it
      throw error;
    }
  }

  /**
   * Map asset types to their corresponding symbols for CMC fallback
   * Uses the comprehensive token registry from aptos-constants.ts
   */
  static getSymbolForAssetType(assetType: string): string {
    // First check native tokens
    if (assetType === NATIVE_TOKENS.APT || assetType === NATIVE_TOKENS.APT_FA) {
      return "APT";
    }

    // Check stablecoins
    for (const [symbol, address] of Object.entries(STABLECOINS)) {
      if (address === assetType) {
        return symbol;
      }
    }

    // Check liquid staking tokens (all map to APT for pricing)
    for (const token of Object.values(PANORA_TOKENS)) {
      if (token.asset_type === assetType) {
        return "APT";
      }
    }

    // Check token registry
    for (const [symbol, address] of Object.entries(TOKEN_REGISTRY)) {
      if (address === assetType) {
        return symbol;
      }
    }

    // Extended asset mapping for common variants
    const extendedAssetMap: Record<string, string> = {
      // LayerZero bridged tokens
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC":
        "USDC",
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT":
        "USDT",
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH":
        "ETH",
      "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC":
        "BTC",

      // Common coin store formats
      "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>": "APT",

      // Known tokens not in registry
      "0xe4ccb6d39136469f376242c31b34d10515c8eaaa38092f804db8e08a8f53c5b2::assets_v1::EchoCoin002":
        "GUI",
    };

    return extendedAssetMap[assetType] || "UNKNOWN";
  }
}
