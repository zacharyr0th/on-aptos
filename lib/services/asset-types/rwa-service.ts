import { API_CONFIG } from "@/lib/config/app";
import { CACHE_TTL } from "@/lib/constants";
import { enhancedFetch } from "@/lib/utils/api/fetch-utils";
import { logger } from "@/lib/utils/core/logger";
import { BaseAssetService } from "../shared/utils/base-service";
import { SimpleCache } from "@/lib/utils/cache/simple-cache";

// RWA.xyz API Types
interface RWAXyzAsset {
  id: number;
  name: string;
  ticker?: string;
  description?: string;
  total_asset_value_dollar?: {
    val: number;
  };
  tokens?: Array<{
    address: string;
    network_name: string;
    symbol: string;
  }>;
  protocol?: string;
  asset_class?:
    | string
    | {
        id?: number;
        name?: string;
        slug?: string;
        icon_url?: string;
        color_hex?: string;
      };
  issuer?: string;
}

interface RWAXyzToken {
  asset_id: number;
  network_id: number;
  total_asset_value_dollar?: {
    val: number;
  };
  address: string;
  name: string;
  asset: {
    id: number;
    name: string;
    ticker: string;
  };
}

interface RWAXyzApiResponse {
  results: RWAXyzAsset[];
  pagination: {
    page: number;
    perPage: number;
    resultCount: number;
    pageCount: number;
  };
}

interface RWAXyzTokenApiResponse {
  results: RWAXyzToken[];
  pagination: {
    page: number;
    perPage: number;
    resultCount: number;
    pageCount: number;
  };
}

export interface RWAProtocol {
  id: string;
  name: string;
  logoUrl?: string;
  totalValue: number;
  description: string;
  tokenAddress: string;
  assetTicker: string;
  assetClass: string;
  protocol: string;
  issuer?: string;
}

export interface RWAResponse {
  success: boolean;
  totalAptosValue: number;
  totalAptosValueFormatted: string;
  assetCount: number;
  protocols: RWAProtocol[];
  timestamp: string;
  dataSource: string;
  error?: string;
}

// Circuit breaker for API resilience
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 3;
  private readonly timeout = 5 * 60 * 1000; // 5 minutes

  isOpen(): boolean {
    if (this.failureCount < this.maxFailures) return false;
    return Date.now() - this.lastFailureTime < this.timeout;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

export class RWAService extends BaseAssetService {
  private static circuitBreaker = new CircuitBreaker();
  private static cache = new SimpleCache<RWAResponse>(24 * 60 * 60 * 1000);
  private static readonly APTOS_NETWORK_ID = 38;
  private static readonly CACHE_KEY = "rwa:aptos:data";
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Protocol logo mapping
  private static readonly protocolLogos: Record<string, string> = {
    pact: "/icons/rwas/pact.webp",
    securitize: "/icons/rwas/securitize.webp",
    blackrock: "/icons/rwas/blackrock.webp",
    "franklin-templeton-benji-investments": "/icons/rwas/ft.webp",
    "libre-capital": "/icons/rwas/libre.webp",
    ondo: "/icons/rwas/ondo.webp",
  };

  /**
   * Get RWA data for Aptos
   */
  static async getRWAData(forceRefresh = false): Promise<RWAResponse> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(this.CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      logger.warn("RWA circuit breaker is open, returning fallback");
      return this.getFallbackResponse("Circuit breaker is open - too many recent failures");
    }

    try {
      const data = await this.fetchRealTimeRWAData();
      
      // Cache successful response
      this.cache.set(this.CACHE_KEY, data, this.CACHE_TTL);
      this.circuitBreaker.reset();
      
      return data;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      logger.error("Failed to fetch RWA data", error);
      
      // Try to return cached data even if expired
      const stale = this.cache.get<RWAResponse>(this.CACHE_KEY);
      if (stale) {
        return { ...stale, dataSource: "RWA.xyz API (cached - stale)" };
      }
      
      return this.getFallbackResponse(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Fetch real-time RWA data from RWA.xyz API
   */
  private static async fetchRealTimeRWAData(): Promise<RWAResponse> {
    const startTime = Date.now();
    const apiKey = API_CONFIG.rwa.apiKey;
    const baseUrl = API_CONFIG.rwa.baseUrl;

    if (!apiKey) {
      logger.warn("RWA API key not configured");
    }

    try {
      // Parallel fetch for tokens and assets
      const [tokenResponse, assetResponse] = await Promise.all([
        // Fetch Aptos tokens
        enhancedFetch(
          `${baseUrl.replace("/assets", "/tokens")}?query=${encodeURIComponent(
            JSON.stringify({
              pagination: { page: 1, perPage: 100 },
              filter: {
                operator: "and" as const,
                filters: [
                  { field: "network_id", operator: "equals" as const, value: this.APTOS_NETWORK_ID },
                ],
              },
            })
          )}`,
          {
            headers: {
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
              "Content-Type": "application/json",
            },
            timeout: 15000,
            retries: 2,
          }
        ),
        // Fetch asset metadata
        enhancedFetch(
          `${baseUrl}?query=${encodeURIComponent(
            JSON.stringify({
              pagination: { page: 1, perPage: 100 },
              filter: {
                operator: "and" as const,
                filters: [
                  {
                    field: "network_ids",
                    operator: "includes" as const,
                    value: this.APTOS_NETWORK_ID,
                  },
                ],
              },
            })
          )}`,
          {
            headers: {
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
              "Content-Type": "application/json",
            },
            timeout: 15000,
            retries: 2,
          }
        ),
      ]);

      if (!tokenResponse.ok || !assetResponse.ok) {
        throw new Error(
          `RWA API error: Token ${tokenResponse.status}, Asset ${assetResponse.status}`
        );
      }

      const [tokenData, assetData] = await Promise.all([
        tokenResponse.json() as Promise<RWAXyzTokenApiResponse>,
        assetResponse.json() as Promise<RWAXyzApiResponse>,
      ]);

      // Process the data
      const protocols = this.processRWAData(tokenData.results, assetData.results);
      const totalValue = protocols.reduce((sum, p) => sum + p.totalValue, 0);

      this.logMetrics("fetchRealTimeRWAData", startTime, true, {
        assetCount: protocols.length,
        totalValue,
      });

      return {
        success: true,
        totalAptosValue: totalValue,
        totalAptosValueFormatted: `$${(totalValue / 1000000).toFixed(1)}M`,
        assetCount: protocols.length,
        protocols,
        timestamp: new Date().toISOString(),
        dataSource: "RWA.xyz API",
      };
    } catch (error) {
      this.logMetrics("fetchRealTimeRWAData", startTime, false);
      throw error;
    }
  }

  /**
   * Process RWA tokens and assets into protocol format
   */
  private static processRWAData(
    tokens: RWAXyzToken[],
    assets: RWAXyzAsset[]
  ): RWAProtocol[] {
    // Create asset metadata map
    const assetMap = new Map<number, RWAXyzAsset>();
    assets.forEach((asset) => assetMap.set(asset.id, asset));

    const protocols: RWAProtocol[] = [];

    for (const token of tokens) {
      // Skip tokens without value
      if (!token.total_asset_value_dollar?.val || token.total_asset_value_dollar.val === 0) {
        continue;
      }

      const asset = assetMap.get(token.asset_id);
      if (!asset) continue;

      // Filter out stablecoins (but keep USDY as it's yield-bearing)
      if (this.isStablecoin(token.asset.ticker, token.asset.name)) {
        continue;
      }

      const protocol = this.transformToProtocol(token, asset);
      if (protocol) {
        protocols.push(protocol);
      }
    }

    // Sort by total value descending
    return protocols.sort((a, b) => b.totalValue - a.totalValue);
  }

  /**
   * Transform RWA token to protocol format
   */
  private static transformToProtocol(
    token: RWAXyzToken,
    asset: RWAXyzAsset
  ): RWAProtocol {
    const protocol = asset.protocol || "unknown";
    const assetClass = this.formatAssetClass(asset.asset_class);

    return {
      id: token.asset_id.toString(),
      name: asset.name,
      logoUrl: this.protocolLogos[protocol] || "/icons/rwas/rwa.webp",
      totalValue: token.total_asset_value_dollar?.val || 0,
      description: asset.description || `${asset.name} issued on Aptos`,
      tokenAddress: token.address,
      assetTicker: token.asset.ticker || "N/A",
      assetClass,
      protocol,
      issuer: asset.issuer,
    };
  }

  /**
   * Format asset class from API response
   */
  private static formatAssetClass(
    assetClass?: string | { name?: string; slug?: string }
  ): string {
    if (!assetClass) return "rwa";

    if (typeof assetClass === "object") {
      return assetClass.name || assetClass.slug || "rwa";
    }

    const classMap: Record<string, string> = {
      "us-treasury-debt": "us-treasury-debt",
      "private-credit": "private-credit",
      "institutional-alternative-funds": "institutional-alternative-funds",
    };

    return classMap[assetClass] || assetClass;
  }

  /**
   * Check if token is a stablecoin
   */
  private static isStablecoin(ticker?: string, name?: string): boolean {
    const tickerLower = ticker?.toLowerCase() || "";
    const nameLower = name?.toLowerCase() || "";

    const stableTokens = ["usdc", "usdt", "usd coin", "tether"];
    
    return stableTokens.some(
      (stable) => tickerLower.includes(stable) || nameLower.includes(stable)
    );
  }

  /**
   * Get fallback response for errors
   */
  private static getFallbackResponse(error: string): RWAResponse {
    return {
      success: false,
      totalAptosValue: 0,
      totalAptosValueFormatted: "$0.0M",
      assetCount: 0,
      protocols: [],
      timestamp: new Date().toISOString(),
      dataSource: "Error - RWA.xyz API unavailable",
      error,
    };
  }

  /**
   * Get RWA assets by asset class
   */
  static async getRWAAssetsByClass(assetClass: string): Promise<RWAProtocol[]> {
    const data = await this.getRWAData();
    return data.protocols.filter(
      (protocol) => protocol.assetClass.toLowerCase() === assetClass.toLowerCase()
    );
  }

  /**
   * Get RWA assets by issuer
   */
  static async getRWAAssetsByIssuer(issuer: string): Promise<RWAProtocol[]> {
    const data = await this.getRWAData();
    return data.protocols.filter((protocol) =>
      protocol.issuer?.toLowerCase().includes(issuer.toLowerCase())
    );
  }
}