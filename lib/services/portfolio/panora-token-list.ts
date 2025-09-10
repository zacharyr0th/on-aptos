import { cacheFirst } from "@/lib/utils";
import { logger } from "@/lib/utils/core/logger";

const PANORA_TOKEN_LIST_ENDPOINT = "https://api.panora.exchange/tokenlist";

// Public API key from CLAUDE.md - safe for client-side usage
const PUBLIC_PANORA_API_KEY = "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi";

// Use environment variable if available (server-side), otherwise use public key
const PANORA_API_KEY =
  typeof window === "undefined"
    ? process.env.PANORA_API_KEY || PUBLIC_PANORA_API_KEY
    : PUBLIC_PANORA_API_KEY;

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
  private static cachedTokenList: PanoraToken[] | null = null;
  private static lastFetchTime: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch the complete Panora token list
   */
  static async getTokenList(): Promise<PanoraToken[]> {
    // Check if we're on client-side and have a recent cache
    if (typeof window !== "undefined") {
      const now = Date.now();
      if (
        PanoraTokenListService.cachedTokenList &&
        now - PanoraTokenListService.lastFetchTime < PanoraTokenListService.CACHE_TTL
      ) {
        return PanoraTokenListService.cachedTokenList;
      }
    }

    // Server-side caching with cacheFirst
    if (typeof window === "undefined") {
      const cacheKey = "panora:token-list";

      const response = await cacheFirst({
        namespace: "prices",
        cacheKey,
        startTime: Date.now(),
        fetchFn: async () => {
          return await PanoraTokenListService.fetchTokenList();
        },
      });

      return response.data;
    }

    // Client-side direct fetch with simple caching
    const result = await PanoraTokenListService.fetchTokenList();
    PanoraTokenListService.cachedTokenList = result;
    PanoraTokenListService.lastFetchTime = Date.now();
    return result;
  }

  private static async fetchTokenList(): Promise<PanoraToken[]> {
    if (typeof window === "undefined") {
      logger.info("Fetching token list from Panora API");
    }

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

    if (typeof window === "undefined") {
      logger.info(`Retrieved ${result.length} tokens from Panora Token List`);
    }

    // Build the token map for quick lookups
    PanoraTokenListService.tokenMap = new Map();
    result.forEach((token: PanoraToken) => {
      // Index by symbol
      PanoraTokenListService.tokenMap!.set(token.symbol.toUpperCase(), token);

      // Index by faAddress if available
      if (token.faAddress) {
        PanoraTokenListService.tokenMap!.set(token.faAddress.toLowerCase(), token);
      }

      // Index by tokenAddress if available
      if (token.tokenAddress) {
        PanoraTokenListService.tokenMap!.set(token.tokenAddress.toLowerCase(), token);
      }
    });

    return result;
  }

  /**
   * Get token info by symbol, faAddress, or tokenAddress
   */
  static async getTokenInfo(identifier: string): Promise<PanoraToken | null> {
    // Ensure token map is loaded
    if (!PanoraTokenListService.tokenMap) {
      await PanoraTokenListService.getTokenList();
    }

    if (!PanoraTokenListService.tokenMap) {
      return null;
    }

    // Try uppercase symbol first
    let token = PanoraTokenListService.tokenMap.get(identifier.toUpperCase());
    if (token) return token;

    // Try lowercase address
    token = PanoraTokenListService.tokenMap.get(identifier.toLowerCase());
    if (token) return token;

    return null;
  }

  /**
   * Get logo URL for a token
   */
  static async getTokenLogoUrl(identifier: string): Promise<string | null> {
    const token = await PanoraTokenListService.getTokenInfo(identifier);
    return token?.logoUrl || null;
  }
}
