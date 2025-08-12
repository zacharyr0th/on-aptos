import { cacheFirst } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";

const PANORA_TOKEN_LIST_ENDPOINT = "https://api.panora.exchange/tokenlist";
const PANORA_API_KEY = process.env.PANORA_API_KEY!;

if (!process.env.PANORA_API_KEY) {
  throw new Error("PANORA_API_KEY environment variable is required");
}

export interface PanoraToken {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string | null;
  panoraSymbol: string;
  usdPrice: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  panoraUI: boolean;
  panoraTags: string[];
  panoraIndex: number;
  coinGeckoId: string | null;
  coinMarketCapId: number | null;
  isInPanoraTokenList: boolean;
  isBanned: boolean;
}

export class PanoraTokenListService {
  private static tokenMap: Map<string, PanoraToken> | null = null;

  /**
   * Fetch the complete Panora token list
   */
  static async getTokenList(): Promise<PanoraToken[]> {
    const cacheKey = "panora:token-list";

    const response = await cacheFirst({
      namespace: "prices",
      cacheKey,
      startTime: Date.now(),
      fetchFn: async () => {
        logger.info("Fetching token list from Panora API");

        const response = await fetch(PANORA_TOKEN_LIST_ENDPOINT, {
          method: "GET",
          headers: {
            "x-api-key": PANORA_API_KEY,
            "Accept-Encoding": "gzip",
          },
        });

        if (!response.ok) {
          throw new Error(`Panora Token List API error: ${response.status}`);
        }

        const data = await response.json();
        const result = Array.isArray(data) ? data : [];

        logger.info(`Retrieved ${result.length} tokens from Panora Token List`);

        // Build the token map for quick lookups
        this.tokenMap = new Map();
        result.forEach((token: PanoraToken) => {
          // Index by symbol
          this.tokenMap!.set(token.symbol.toUpperCase(), token);

          // Index by faAddress if available
          if (token.faAddress) {
            this.tokenMap!.set(token.faAddress.toLowerCase(), token);
          }

          // Index by tokenAddress if available
          if (token.tokenAddress) {
            this.tokenMap!.set(token.tokenAddress.toLowerCase(), token);
          }
        });

        return result;
      },
    });

    return response.data;
  }

  /**
   * Get token info by symbol, faAddress, or tokenAddress
   */
  static async getTokenInfo(identifier: string): Promise<PanoraToken | null> {
    // Ensure token map is loaded
    if (!this.tokenMap) {
      await this.getTokenList();
    }

    if (!this.tokenMap) {
      return null;
    }

    // Try uppercase symbol first
    let token = this.tokenMap.get(identifier.toUpperCase());
    if (token) return token;

    // Try lowercase address
    token = this.tokenMap.get(identifier.toLowerCase());
    if (token) return token;

    return null;
  }

  /**
   * Get logo URL for a token
   */
  static async getTokenLogoUrl(identifier: string): Promise<string | null> {
    const token = await this.getTokenInfo(identifier);
    return token?.logoUrl || null;
  }
}
