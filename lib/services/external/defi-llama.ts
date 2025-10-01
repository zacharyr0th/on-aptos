/**
 * DeFi Llama API Service
 * Provides live TVL, volume, and fees data for DeFi protocols
 */

import { z } from "zod";
import { CACHE_KEYS } from "@/lib/constants/api/endpoints";
import { ENDPOINTS as API_ENDPOINTS } from "@/lib/constants/endpoints";
import { PROTOCOLS } from "@/lib/constants/protocols/protocol-registry";
import { BaseAssetService } from "@/lib/services/shared/utils/base-service";
import type { ProtocolType } from "@/lib/types/defi";
import { cacheInstances } from "@/lib/utils/cache/unified-cache";
import { serviceLogger } from "@/lib/utils/core/logger";

// Error types for better error handling
export class DeFiLlamaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = "DeFiLlamaError";
  }
}

export class DeFiLlamaTimeoutError extends DeFiLlamaError {
  constructor(endpoint?: string) {
    super("Request timed out", undefined, endpoint);
    this.name = "DeFiLlamaTimeoutError";
  }
}

export class DeFiLlamaRateLimitError extends DeFiLlamaError {
  constructor(endpoint?: string) {
    super("Rate limit exceeded", 429, endpoint);
    this.name = "DeFiLlamaRateLimitError";
  }
}

export class DeFiLlamaNetworkError extends DeFiLlamaError {
  constructor(endpoint?: string) {
    super("Network error", undefined, endpoint);
    this.name = "DeFiLlamaNetworkError";
  }
}

// Zod schemas for response validation
export const DeFiLlamaChainSchema = z.object({
  name: z.string().optional(),
  chainId: z.string().optional(),
  gecko_id: z.string().optional(),
  tvl: z.number().optional(),
  tokenSymbol: z.string().optional(),
  cmcId: z.number().optional(),
});

export const DeFiLlamaProtocolSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional(),
  symbol: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  chain: z.string(),
  logo: z.string().optional(),
  category: z.string(),
  chains: z.array(z.string()),
  slug: z.string(),
  tvl: z.number(),
  chainTvls: z.record(z.string(), z.number()),
  change_1h: z.number().optional(),
  change_1d: z.number().optional(),
  change_7d: z.number().optional(),
  mcap: z.number().optional(),
});

export const DeFiLlamaVolumeSchema = z.object({
  total24h: z.number(),
  total7d: z.number().optional(),
  total30d: z.number().optional(),
  totalAllTime: z.number().optional(),
  change_1d: z.number().optional(),
  change_7d: z.number().optional(),
  change_1m: z.number().optional(),
});

export const DeFiLlamaPoolSchema = z.object({
  pool: z.string(),
  project: z.string(),
  symbol: z.string(),
  chain: z.string(),
  tvlUsd: z.number(),
  apy: z.number(),
  apyBase: z.number().optional(),
  apyReward: z.number().optional(),
  category: z.string().optional(),
  url: z.string().optional(),
});

export interface DeFiLlamaChain {
  name?: string;
  chainId?: string;
  gecko_id?: string;
  tvl?: number;
  tokenSymbol?: string;
  cmcId?: number;
}

export interface DeFiLlamaPool {
  pool: string;
  project: string;
  symbol: string;
  chain: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  apyBorrow?: number;
  category?: string;
  exposure?: string;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  poolMeta?: string;
  url?: string;
  apyMean30d?: number;
  volumeUsd1d?: number;
  volumeUsd7d?: number;
}

export interface DeFiLlamaBorrowRate {
  pool: string;
  project: string;
  symbol: string;
  chain: string;
  apyBorrow: number;
  apyBaseBorrow?: number;
  apyBase?: number;
  apyReward?: number;
  tvlUsd: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  ltv?: number;
  poolMeta?: string;
}

export interface DeFiLlamaSupplyRate {
  pool: string;
  project: string;
  symbol: string;
  chain: string;
  apy: number;
  tvlUsd: number;
  totalSupplyUsd: number;
  poolMeta?: string;
}

export interface DeFiLlamaProtocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url?: string;
  description?: string;
  chain: string;
  logo?: string;
  audits?: string;
  audit_note?: string;
  gecko_id?: string;
  cmcId?: string;
  category: string;
  chains: string[];
  module?: string;
  twitter?: string;
  forkedFrom?: string[];
  oracles?: string[];
  listedAt?: number;
  methodology?: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  tokenBreakdowns?: Record<string, Record<string, number>>;
  mcap?: number;
}

export interface DeFiLlamaOverview {
  totalLiquidityUSD: number;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<string, Array<{ date: number; totalLiquidityUSD: number }>>;
  protocols: DeFiLlamaProtocol[];
}

export interface DeFiLlamaVolume {
  totalDataChart: Array<{ date: string; totalVolume: number }>;
  totalDataChartBreakdown: Array<{
    date: string;
    Derivatives?: number;
    Dexes?: number;
    Options?: number;
  }>;
  total24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
}

export interface DeFiLlamaFees {
  totalDataChart: Array<{
    date: string;
    timestamp: number;
    totalFees: number;
    totalRevenue?: number;
  }>;
  totalDataChartBreakdown: Array<{
    date: string;
    timestamp: number;
    [key: string]: number | string;
  }>;
  total24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
}

export interface AptosDefiMetrics {
  tvl: number;
  tvlChange24h?: number;
  tvlChange7d?: number;
  spotVolume: number;
  volumeChange24h?: number;
  dexVolume?: number;
  dexVolumeChange24h?: number;
  perpVolume?: number;
  perpVolumeChange24h?: number;
  fees: {
    total24h: number;
    total7d?: number;
    change24h?: number;
  };
  protocols: number;
  lastUpdated: string;
}

class DeFiLlamaService extends BaseAssetService {
  private static readonly cache = cacheInstances.defillama;
  private static readonly rateLimiter = {
    requests: [] as number[],
    maxRequests: 300, // DeFiLlama allows ~300 requests per 5 minutes
    windowMs: 5 * 60 * 1000, // 5 minutes
  };

  // Protocol name mapping from our names to DeFiLlama slugs
  private static readonly PROTOCOL_SLUG_MAP: Record<string, string> = {
    // Use protocol registry names where possible
    [PROTOCOLS.AMNIS_FINANCE.name]: "amnis-finance",
    [PROTOCOLS.THALA_LSD.name]: "thala-lsd",
    [PROTOCOLS.ARIES_MARKETS.name]: "aries-markets",
    [PROTOCOLS.MERKLE_TRADE.name]: "merkle-trade",

    // Legacy mappings for protocols not in registry yet
    Echelon: "echelon-market",
    Echo: "echo-lending",
    Meso: "meso-finance",
    Joule: "joule-finance",
    PancakeSwap: "pancakeswap-amm",
    Sushiswap: "sushi",
    Thala: "thalaswap",
    ThalaSwap: "thalaswap",
    "ThalaSwap V2": "thalaswap-v2",
    Liquidswap: "liquidswap",
    Cetus: "cetus-amm",
    Superposition: "superposition",
    Panora: "panora-exchange",
    Cellana: "cellana-finance",
    "Echo Strategy": "echo-strategy",
    Kofi: "kofi-finance",
    Satay: "satay-finance",
    Ondo: "ondo-finance",
    "Franklin Templeton": "franklin-templeton",
    "Thala CDP": "thala-cdp",
    Mole: "mole",
    Kana: "kana-labs",
    "Gui Inu": "gui-inu",
  };

  // Get the correct DeFiLlama slug for a protocol
  private static getProtocolSlug(protocolName: string): string {
    // First check our mapping
    if (DeFiLlamaService.PROTOCOL_SLUG_MAP[protocolName]) {
      return DeFiLlamaService.PROTOCOL_SLUG_MAP[protocolName];
    }
    // Fallback to lowercase with dashes
    return protocolName.toLowerCase().replace(/\s+/g, "-");
  }

  static clearCache(): void {
    DeFiLlamaService.cache.clear();
  }

  /**
   * Batch multiple API calls for better performance
   */
  static async batchRequests<T>(
    requests: Array<{
      key: string;
      url: string;
      schema?: z.ZodSchema<T>;
      transform?: (data: any) => T;
    }>
  ): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    // Process requests in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const promises = batch.map(async ({ key, url, schema, transform }) => {
        try {
          const response = await DeFiLlamaService.enhancedFetch(url);
          const rawData = await response.json();

          let processedData: T;
          if (schema) {
            processedData = DeFiLlamaService.validateResponse(rawData, schema, url);
          } else if (transform) {
            processedData = transform(rawData);
          } else {
            processedData = rawData as T;
          }

          return { key, data: processedData };
        } catch (error) {
          serviceLogger.warn(`Batch request failed for ${key}:`, error);
          return { key, data: null };
        }
      });

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          results[result.value.key] = result.value.data;
        }
      });

      // Add delay between batches to be respectful to the API
      if (i + batchSize < requests.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  /**
   * Get comprehensive protocol data in a single batch call
   */
  static async getProtocolDataBatch(protocolNames: string[]): Promise<
    Record<
      string,
      {
        volume?: any;
        fees?: any;
        details?: any;
        yields?: any;
      }
    >
  > {
    const requests = protocolNames.flatMap((name) => {
      const slug = DeFiLlamaService.getProtocolSlug(name);
      return [
        {
          key: `${name}-volume`,
          url: `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/dexs/${slug}?excludeTotalDataChart=true`,
          schema: DeFiLlamaVolumeSchema,
        },
        {
          key: `${name}-fees`,
          url: `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/fees/${slug}?excludeTotalDataChart=true`,
        },
        {
          key: `${name}-details`,
          url: `${API_ENDPOINTS.DEFILLAMA_BASE}/protocol/${slug}`,
        },
      ];
    });

    const results = await DeFiLlamaService.batchRequests(requests);

    // Group results by protocol
    const groupedResults: Record<string, any> = {};

    protocolNames.forEach((name) => {
      groupedResults[name] = {
        volume: results[`${name}-volume`],
        fees: results[`${name}-fees`],
        details: results[`${name}-details`],
      };
    });

    return groupedResults;
  }

  /**
   * Rate limiting check before making API calls
   */
  private static async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Clean up old requests outside the window
    DeFiLlamaService.rateLimiter.requests = DeFiLlamaService.rateLimiter.requests.filter(
      (timestamp) => now - timestamp < DeFiLlamaService.rateLimiter.windowMs
    );

    if (DeFiLlamaService.rateLimiter.requests.length >= DeFiLlamaService.rateLimiter.maxRequests) {
      const oldestRequest = Math.min(...DeFiLlamaService.rateLimiter.requests);
      const waitTime = DeFiLlamaService.rateLimiter.windowMs - (now - oldestRequest);

      serviceLogger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return DeFiLlamaService.checkRateLimit(); // Recheck after waiting
    }

    DeFiLlamaService.rateLimiter.requests.push(now);
  }

  /**
   * Validate response data using Zod schemas
   */
  private static validateResponse<T>(data: unknown, schema: z.ZodSchema<T>, endpoint: string): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        serviceLogger.warn(`Response validation failed for ${endpoint}:`, {
          errors: error.issues,
          data: typeof data === "object" ? Object.keys(data || {}) : typeof data,
        });
        throw new DeFiLlamaError(
          `Invalid response format: ${error.issues.map((e) => e.message).join(", ")}`,
          undefined,
          endpoint
        );
      }
      throw error;
    }
  }

  /**
   * Enhanced fetch with proper error handling and rate limiting
   */
  private static async enhancedFetch(url: string, options?: RequestInit): Promise<Response> {
    await DeFiLlamaService.checkRateLimit();

    try {
      const response = await DeFiLlamaService.withTimeout(
        fetch(url, {
          headers: { Accept: "application/json" },
          ...options,
        })
      );

      if (response.status === 429) {
        throw new DeFiLlamaRateLimitError(url);
      }

      if (!response.ok) {
        throw new DeFiLlamaError(
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          url
        );
      }

      return response;
    } catch (error) {
      if (error instanceof DeFiLlamaError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes("timeout") || error.name === "TimeoutError") {
          throw new DeFiLlamaTimeoutError(url);
        }
        if (error.message === "Failed to fetch") {
          throw new DeFiLlamaNetworkError(url);
        }
      }

      throw new DeFiLlamaError(`Unknown error: ${error}`, undefined, url);
    }
  }

  /**
   * Fetch all chains data from DeFi Llama
   */
  static async getChains(): Promise<DeFiLlamaChain[]> {
    const cacheKey = CACHE_KEYS.defiProtocols + "-chains";

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      const response = await DeFiLlamaService.enhancedFetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/v2/chains`,
        {
          signal: AbortSignal.timeout(10000),
        }
      );

      const rawData = await response.json();
      const chains = DeFiLlamaService.validateResponse(
        rawData,
        z.array(DeFiLlamaChainSchema),
        `${API_ENDPOINTS.DEFILLAMA_BASE}/v2/chains`
      );

      serviceLogger.debug(`Successfully fetched ${chains.length} chains from DeFi Llama`);
      return chains;
    }).catch((error) => {
      if (error instanceof DeFiLlamaError) {
        serviceLogger.warn(`DeFi Llama error: ${error.message}`, {
          endpoint: error.endpoint,
          statusCode: error.statusCode,
        });
      } else {
        serviceLogger.error("Unexpected error fetching DeFi Llama chains:", error);
      }
      return [];
    });
  }

  /**
   * Get Aptos chain TVL data
   */
  static async getAptosChainData(): Promise<{
    tvl: number;
    change24h?: number;
    change7d?: number;
  } | null> {
    try {
      const chains = await DeFiLlamaService.getChains();

      // If chains fetch failed, return null gracefully
      if (!chains || chains.length === 0) {
        serviceLogger.warn("No chains data available from DeFi Llama");
        return null;
      }

      const aptosChain = chains.find(
        (chain) => chain.name.toLowerCase() === "aptos" || chain.gecko_id === "aptos"
      );

      if (!aptosChain) {
        serviceLogger.warn("Aptos chain not found in DeFi Llama data");
        return null;
      }

      // Get historical data for percentage changes
      try {
        const response = await DeFiLlamaService.enhancedFetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/v2/historicalChainTvl/Aptos`
        );

        if (!response.ok) {
          serviceLogger.warn(
            `Historical Aptos TVL data unavailable (${response.status}), using current TVL only`
          );
          return { tvl: aptosChain.tvl };
        }

        const historicalData = await response.json();

        // Validate historical data structure
        if (!Array.isArray(historicalData) || historicalData.length === 0) {
          serviceLogger.warn("Invalid historical data format, using current TVL only");
          return { tvl: aptosChain.tvl };
        }

        // v2 endpoint returns array of {date, tvl} objects
        const dayAgo = historicalData[historicalData.length - 2];
        const weekAgo = historicalData[Math.max(0, historicalData.length - 8)];

        // Use the chains endpoint TVL as the source of truth
        const currentTvl = aptosChain.tvl;

        // Calculate percentage changes based on historical data
        // v2 endpoint uses 'tvl' field instead of 'totalLiquidityUSD'
        const change24h =
          dayAgo && currentTvl && dayAgo.tvl
            ? ((currentTvl - dayAgo.tvl) / dayAgo.tvl) * 100
            : undefined;
        const change7d =
          weekAgo && currentTvl && weekAgo.tvl
            ? ((currentTvl - weekAgo.tvl) / weekAgo.tvl) * 100
            : undefined;

        return {
          tvl: currentTvl,
          change24h,
          change7d,
        };
      } catch (historicalError) {
        serviceLogger.warn(
          "Failed to fetch historical TVL data, using current TVL only:",
          historicalError
        );
        return { tvl: aptosChain.tvl };
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        serviceLogger.warn("DeFi Llama API is unavailable - network or CORS issue");
      } else if (error instanceof Error && error.name === "TimeoutError") {
        serviceLogger.warn("DeFi Llama API request timed out");
      } else {
        serviceLogger.error("Error fetching Aptos chain data:", error);
      }
      return null;
    }
  }

  /**
   * Get Aptos volume data
   */
  static async getAptosVolumeData(): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-volume-aptos`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      const response = await DeFiLlamaService.enhancedFetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/dexs/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume`
      );

      if (!response.ok) {
        throw new Error(`DeFi Llama volume API error: ${response.status}`);
      }

      const volumeData: DeFiLlamaVolume = await response.json();
      return {
        volume24h: volumeData.total24h || 0,
        change24h: volumeData.change_1d,
      };
    }).catch((error) => {
      serviceLogger.error("Error fetching Aptos volume data:", error);
      return null;
    });
  }

  /**
   * Get Aptos fees data
   */
  static async getAptosFeesData(): Promise<{
    fees24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-volume-aptos-fees`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await DeFiLlamaService.enhancedFetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/fees/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees`
        );
        if (!response.ok) {
          throw new Error(`DeFi Llama fees API error: ${response.status}`);
        }

        const feesData: DeFiLlamaFees = await response.json();
        return {
          fees24h: feesData.total24h || 0,
          change24h: feesData.change_1d,
        };
      } catch (error) {
        serviceLogger.error("Error fetching Aptos fees data:", error);
        return null;
      }
    });
  }

  /**
   * Get Aptos perp volume data
   */
  static async getAptosPerpVolumeData(): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-volume-aptos-perps`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/derivatives/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume`
        );
        if (!response.ok) {
          throw new Error(`DeFi Llama perps API error: ${response.status}`);
        }

        const volumeData: DeFiLlamaVolume = await response.json();
        return {
          volume24h: volumeData.total24h || 0,
          change24h: volumeData.change_1d,
        };
      } catch (error) {
        serviceLogger.error("Error fetching Aptos perp volume data:", error);
        return null;
      }
    });
  }

  /**
   * Get comprehensive Aptos DeFi metrics
   */
  static async getAptosDefiMetrics(): Promise<AptosDefiMetrics | null> {
    const cacheKey = `${CACHE_KEYS.defiTVL()}-aptos-metrics`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        // Use API route to avoid CORS issues
        const response = await fetch("/api/defi/metrics");
        
        if (!response.ok) {
          // Fallback to direct API calls (for server-side rendering)
          const [chainData, volumeData, feesData] = await Promise.allSettled([
            DeFiLlamaService.getAptosChainData(),
            DeFiLlamaService.getAptosVolumeData(),
            DeFiLlamaService.getAptosFeesData(),
          ]);

          const tvlResult = chainData.status === "fulfilled" ? chainData.value : null;
          const volResult = volumeData.status === "fulfilled" ? volumeData.value : null;
          const feesResult = feesData.status === "fulfilled" ? feesData.value : null;

          if (!tvlResult && !volResult && !feesResult) {
            return null;
          }

          return {
            tvl: tvlResult?.tvl || 0,
            tvlChange24h: tvlResult?.change24h,
            tvlChange7d: tvlResult?.change7d,
            spotVolume: volResult?.volume24h || 0,
            volumeChange24h: volResult?.change24h,
            fees: {
              total24h: feesResult?.fees24h || 0,
              change24h: feesResult?.change24h,
            },
            protocols: 0,
            lastUpdated: new Date().toISOString(),
          };
        }

        const metrics = await response.json();
        
        serviceLogger.debug("DeFi metrics fetched from API route:", {
          tvl: metrics.tvl,
          volume: metrics.spotVolume,
          fees: metrics.fees?.total24h,
        });

        return metrics;
      } catch (error) {
        serviceLogger.error("Error fetching Aptos DeFi metrics:", error);
        return null;
      }
    }).catch((error) => {
      serviceLogger.error("Error in cached Aptos DeFi metrics fetch:", error);
      return null;
    });
  }

  /**
   * Get protocols on Aptos
   */
  static async getAptosProtocols(): Promise<DeFiLlamaProtocol[]> {
    const cacheKey = CACHE_KEYS.defiProtocols + "-aptos";

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/protocols`);
        if (!response.ok) {
          throw new Error(`DeFi Llama protocols API error: ${response.status}`);
        }

        const allProtocols: DeFiLlamaProtocol[] = await response.json();
        const aptosProtocols = allProtocols.filter(
          (protocol) => protocol.chains.includes("Aptos") || protocol.chain === "Aptos"
        );

        return aptosProtocols;
      } catch (error) {
        serviceLogger.error("Error fetching Aptos protocols:", error);
        return [];
      }
    }).catch((error) => {
      serviceLogger.error("Error in cached Aptos protocols fetch:", error);
      return [];
    });
  }

  /**
   * Get individual protocol volume data - APTOS SPECIFIC
   */
  static async getProtocolVolume(protocolName: string): Promise<{
    volume24h: number;
    change24h?: number;
    isAptosSpecific?: boolean;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-volume-protocol-${protocolName}-aptos`;

    try {
      // DeFi Llama uses slug format for protocol names (lowercase, spaces replaced with dashes)
      const slug = DeFiLlamaService.getProtocolSlug(protocolName);
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/dexs/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`
      );

      if (!response.ok) {
        serviceLogger.debug(`No DEX volume data for ${protocolName}`);
        return null;
      }

      const data = await response.json();

      // Try to get Aptos-specific volume from chain breakdown
      let aptosVolume24h = 0;
      let aptosChange24h;

      // Check if there's chain-specific volume data
      if (data.totalDataChartBreakdown && data.totalDataChartBreakdown.length > 0) {
        const latestData = data.totalDataChartBreakdown[data.totalDataChartBreakdown.length - 1];
        if (latestData && latestData.Aptos) {
          aptosVolume24h = latestData.Aptos;
        }
      }

      // If no Aptos-specific data, check if protocol is Aptos-only
      if (
        aptosVolume24h === 0 &&
        data.chains &&
        data.chains.length === 1 &&
        data.chains[0] === "Aptos"
      ) {
        aptosVolume24h = data.total24h || 0;
        aptosChange24h = data.change_1d;
      }

      return {
        volume24h: aptosVolume24h || data.total24h || 0,
        change24h: aptosChange24h || data.change_1d,
        isAptosSpecific: aptosVolume24h > 0,
      };
    } catch (error) {
      serviceLogger.debug(`Error fetching volume for ${protocolName}:`, error);
      return null;
    }
  }

  /**
   * Get individual protocol fees data
   */
  static async getProtocolFees(protocolName: string): Promise<{
    fees24h: number;
    revenue24h?: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-volume-protocol-fees-${protocolName}`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const slug = DeFiLlamaService.getProtocolSlug(protocolName);
        const response = await fetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/fees/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`
        );

        if (!response.ok) {
          serviceLogger.debug(`No fees data for ${protocolName}`);
          return null;
        }

        const data = await response.json();
        return {
          fees24h: data.total24h || 0,
          revenue24h: data.totalRevenue24h,
          change24h: data.change_1d,
        };
      } catch (error) {
        serviceLogger.debug(`Error fetching fees for ${protocolName}:`, error);
        return null;
      }
    });
  }

  /**
   * Get detailed protocol data from DeFiLlama
   */
  static async getProtocolDetails(protocolSlug: string): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-details-${protocolSlug}`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const slug = DeFiLlamaService.getProtocolSlug(protocolSlug);
        const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/protocol/${slug}`);

        if (!response.ok) {
          serviceLogger.debug(
            `No detailed data for ${protocolSlug}, tried slug: ${slug}, status: ${response.status}`
          );
          return null;
        }

        const data = await response.json();

        // Extract Aptos-specific data
        // First try currentChainTvls for current TVL
        let latestAptosTvl = 0;
        if (data.currentChainTvls && data.currentChainTvls.Aptos) {
          latestAptosTvl = data.currentChainTvls.Aptos;
        } else if (data.chainTvls && data.chainTvls.Aptos) {
          // Fall back to historical data
          const aptosTvl = data.chainTvls.Aptos;
          latestAptosTvl =
            aptosTvl.tvl && aptosTvl.tvl.length > 0
              ? aptosTvl.tvl[aptosTvl.tvl.length - 1].totalLiquidityUSD
              : 0;
        }

        // Calculate Aptos-specific changes
        let aptosChange1d, aptosChange7d;
        if (
          data.chainTvls &&
          data.chainTvls.Aptos &&
          data.chainTvls.Aptos.tvl &&
          data.chainTvls.Aptos.tvl.length > 1
        ) {
          const aptosTvl = data.chainTvls.Aptos;
          const oneDayAgo = aptosTvl.tvl[Math.max(0, aptosTvl.tvl.length - 2)];
          const sevenDaysAgo = aptosTvl.tvl[Math.max(0, aptosTvl.tvl.length - 8)];

          if (oneDayAgo) {
            aptosChange1d =
              ((latestAptosTvl - oneDayAgo.totalLiquidityUSD) / oneDayAgo.totalLiquidityUSD) * 100;
          }
          if (sevenDaysAgo) {
            aptosChange7d =
              ((latestAptosTvl - sevenDaysAgo.totalLiquidityUSD) / sevenDaysAgo.totalLiquidityUSD) *
              100;
          }
        }

        // Override with Aptos-specific data
        data.aptosTvl = latestAptosTvl;
        data.aptosChange1d = aptosChange1d;
        data.aptosChange7d = aptosChange7d;

        serviceLogger.debug(
          `Protocol ${protocolSlug} (${slug}): Aptos TVL = ${latestAptosTvl}, chains = ${data.chains?.join(",")}`
        );

        return data;
      } catch (error) {
        serviceLogger.debug(`Error fetching details for ${protocolSlug}:`, error);
        return null;
      }
    }).catch((error) => {
      serviceLogger.debug(`Error in cached protocol details fetch for ${protocolSlug}:`, error);
      return null;
    });
  }

  /**
   * Get yields data for a protocol
   */
  static async getProtocolYields(protocolName: string): Promise<DeFiLlamaPool[] | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-yields-${protocolName}`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await DeFiLlamaService.enhancedFetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/pools`
        );

        if (!response.ok) {
          serviceLogger.debug(`No yields data available`);
          return null;
        }

        const data = await response.json();
        const pools = data.data || [];

        // Filter for the specific protocol AND Aptos chain only
        const protocolPools = pools.filter(
          (pool: DeFiLlamaPool) =>
            (pool.project?.toLowerCase() === protocolName.toLowerCase() ||
              pool.symbol?.toLowerCase().includes(protocolName.toLowerCase())) &&
            pool.chain?.toLowerCase() === "aptos"
        );

        return protocolPools.length > 0 ? protocolPools : null;
      } catch (error) {
        serviceLogger.debug(`Error fetching yields for ${protocolName}:`, error);
        return null;
      }
    }).catch((error) => {
      serviceLogger.debug(`Error in cached yields fetch for ${protocolName}:`, error);
      return null;
    });
  }

  /**
   * Get stablecoin data
   */
  static async getStablecoinMetrics(): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-stablecoins`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/stablecoins`);

        if (!response.ok) {
          serviceLogger.debug(`No stablecoin data available`);
          return null;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        serviceLogger.debug(`Error fetching stablecoin metrics:`, error);
        return null;
      }
    }).catch((error) => {
      serviceLogger.debug(`Error in cached stablecoin metrics fetch:`, error);
      return null;
    });
  }

  /**
   * Get options volume for a protocol
   */
  static async getProtocolOptionsVolume(protocolName: string): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-volume-options-${protocolName}`;
    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const slug = DeFiLlamaService.getProtocolSlug(protocolName);
        const response = await fetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/options/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`
        );

        if (!response.ok) {
          serviceLogger.debug(`No options volume data for ${protocolName}`);
          return null;
        }

        const data = await response.json();
        return {
          volume24h: data.total24h || 0,
          change24h: data.change_1d,
        };
      } catch (error) {
        serviceLogger.debug(`Error fetching options volume for ${protocolName}:`, error);
        return null;
      }
    });
  }

  /**
   * Get COMPREHENSIVE protocol data including ALL DeFiLlama metrics
   */
  static async getProtocolMetrics(protocolName: string): Promise<{
    volume?: { daily: string; change24h?: string };
    fees?: { daily: string; change24h?: string; revenue?: string };
    tvl?: {
      current: number;
      change24h?: number;
      change7d?: number;
      tokens?: any;
    };
    yields?: any[];
    optionsVolume?: { daily: string; change24h?: string };
    derivativesVolume?: {
      daily: string;
      change24h?: string;
      openInterest?: string;
    };
    mcap?: number;
    tokenPrice?: number;
    fdv?: number;
    staking?: number;
    borrowRates?: DeFiLlamaBorrowRate[];
    supplyRates?: DeFiLlamaSupplyRate[];
    stablecoinExposure?: any;
    historicalTvl?: any[];
    priceChanges?: any;
  } | null> {
    try {
      const [
        volumeData,
        feesData,
        detailsData,
        yieldsData,
        optionsData,
        derivativesData,
        poolsData,
      ] = await Promise.allSettled([
        DeFiLlamaService.getProtocolVolume(protocolName),
        DeFiLlamaService.getProtocolFees(protocolName),
        DeFiLlamaService.getProtocolDetails(protocolName),
        DeFiLlamaService.getProtocolYields(protocolName),
        DeFiLlamaService.getProtocolOptionsVolume(protocolName),
        DeFiLlamaService.getProtocolDerivatives(protocolName),
        DeFiLlamaService.getComprehensivePoolData(),
      ]);

      const volume = volumeData.status === "fulfilled" ? volumeData.value : null;
      const fees = feesData.status === "fulfilled" ? feesData.value : null;
      const details = detailsData.status === "fulfilled" ? detailsData.value : null;
      const yields = yieldsData.status === "fulfilled" ? yieldsData.value : null;
      const options = optionsData.status === "fulfilled" ? optionsData.value : null;
      const derivatives = derivativesData.status === "fulfilled" ? derivativesData.value : null;
      const pools = poolsData.status === "fulfilled" ? poolsData.value : null;

      if (!volume && !fees && !details && !yields && !options && !derivatives && !pools)
        return null;

      // Extract COMPREHENSIVE metrics from details - APTOS SPECIFIC
      let tvl, mcap, tokenPrice, fdv, staking, historicalTvl, tokenBreakdown;
      if (details) {
        // Use Aptos-specific TVL if available
        tvl = {
          current: details.aptosTvl || details.currentChainTvls?.Aptos || 0,
          change24h: details.aptosChange1d,
          change7d: details.aptosChange7d,
          tokens: undefined,
        };

        // Extract token breakdown from Aptos chain data
        if (details.chainTvls?.Aptos?.tokens && details.chainTvls.Aptos.tokens.length > 0) {
          const latestTokens =
            details.chainTvls.Aptos.tokens[details.chainTvls.Aptos.tokens.length - 1];
          tokenBreakdown = latestTokens.tokens;
          tvl.tokens = tokenBreakdown;
        }

        // Historical TVL for Aptos
        if (details.chainTvls?.Aptos?.tvl) {
          historicalTvl = details.chainTvls.Aptos.tvl.slice(-30); // Last 30 days
        }

        // Token data
        mcap = details.mcap;
        tokenPrice = details.tokenPrice;
        fdv = details.fdv;
        staking = details.staking;
      }

      // Extract lending/borrowing rates from pools
      let borrowRates, supplyRates;
      if (pools && pools.lending) {
        const protocolPools = pools.lending.filter(
          (p: DeFiLlamaBorrowRate) => p.project?.toLowerCase() === protocolName.toLowerCase()
        );

        if (protocolPools.length > 0) {
          borrowRates = protocolPools
            .map((p: DeFiLlamaBorrowRate) => ({
              symbol: p.symbol,
              apyBorrow: p.apyBorrow,
              apyBaseBorrow: p.apyBaseBorrow,
              totalBorrowUsd: p.totalBorrowUsd,
              ltv: p.ltv,
            }))
            .filter((p: DeFiLlamaBorrowRate) => p.apyBorrow);

          supplyRates = protocolPools.map((p: DeFiLlamaBorrowRate) => ({
            symbol: p.symbol,
            apyBase: p.apyBase,
            apyReward: p.apyReward,
            totalSupplyUsd: p.totalSupplyUsd,
          }));
        }
      }

      return {
        volume: volume
          ? {
              daily: volume.volume24h.toString(),
              change24h: volume.change24h?.toString(),
            }
          : undefined,
        fees: fees
          ? {
              daily: fees.fees24h.toString(),
              change24h: fees.change24h?.toString(),
              revenue: fees.revenue24h?.toString(),
            }
          : undefined,
        tvl,
        yields: yields || undefined,
        optionsVolume: options
          ? {
              daily: options.volume24h.toString(),
              change24h: options.change24h?.toString(),
            }
          : undefined,
        derivativesVolume: derivatives
          ? {
              daily: derivatives.total24h?.toString(),
              change24h: derivatives.change_1d?.toString(),
              openInterest: derivatives.openInterest?.toString(),
            }
          : undefined,
        mcap,
        tokenPrice,
        fdv,
        staking,
        borrowRates,
        supplyRates,
        historicalTvl,
      };
    } catch (error) {
      serviceLogger.error(`Error fetching metrics for ${protocolName}:`, error);
      return null;
    }
  }

  /**
   * Get historical prices for a token
   */
  static async getTokenPrices(addresses: string[]): Promise<any | null> {
    try {
      const coins = addresses.map((addr) => `aptos:${addr}`).join(",");
      const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/prices/current/${coins}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      serviceLogger.debug(`Error fetching token prices:`, error);
      return null;
    }
  }

  /**
   * Get price chart data for a token
   */
  static async getTokenChart(address: string, period = "30d"): Promise<any | null> {
    try {
      const coin = `aptos:${address}`;
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/chart/${coin}?period=${period}`
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      serviceLogger.debug(`Error fetching token chart:`, error);
      return null;
    }
  }

  /**
   * Get percentage changes for tokens
   */
  static async getTokenPercentageChanges(addresses: string[]): Promise<any | null> {
    try {
      const coins = addresses.map((addr) => `aptos:${addr}`).join(",");
      const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/percentage/${coins}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      serviceLogger.debug(`Error fetching percentage changes:`, error);
      return null;
    }
  }

  /**
   * Get stablecoin data for Aptos
   */
  static async getAptosStablecoins(): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-stablecoins-aptos`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        // Get all stablecoins
        const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/stablecoins`);
        if (!response.ok) return null;

        const data = await response.json();

        // Filter for Aptos stablecoins
        const aptosStables =
          data.peggedAssets?.filter(
            (stable: any) => stable.chainCirculating?.Aptos || stable.chains?.includes("Aptos")
          ) || [];

        return aptosStables;
      } catch (error) {
        serviceLogger.debug(`Error fetching Aptos stablecoins:`, error);
        return null;
      }
    }).catch((error) => {
      serviceLogger.debug(`Error in cached Aptos stablecoins fetch:`, error);
      return null;
    });
  }

  /**
   * Get stablecoin charts for Aptos
   */
  static async getAptosStablecoinCharts(): Promise<any | null> {
    try {
      const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/stablecoincharts/Aptos`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      serviceLogger.debug(`Error fetching stablecoin charts:`, error);
      return null;
    }
  }

  /**
   * Get derivatives overview for Aptos
   */
  static async getAptosDerivativesOverview(): Promise<any | null> {
    try {
      const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/derivatives/Aptos`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      serviceLogger.debug(`Error fetching derivatives overview:`, error);
      return null;
    }
  }

  /**
   * Get protocol derivatives data
   */
  static async getProtocolDerivatives(protocol: string): Promise<any | null> {
    try {
      const slug = DeFiLlamaService.getProtocolSlug(protocol);
      const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/summary/derivatives/${slug}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      serviceLogger.debug(`Error fetching protocol derivatives:`, error);
      return null;
    }
  }

  /**
   * Get all DeFi overview data for Aptos
   */
  static async getAptosOverview(): Promise<any | null> {
    try {
      const [dexData, optionsData, feesData] = await Promise.allSettled([
        fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/dexs/Aptos`),
        fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/options/Aptos`),
        fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/fees/Aptos`),
      ]);

      const dex =
        dexData.status === "fulfilled" && dexData.value.ok ? await dexData.value.json() : null;
      const options =
        optionsData.status === "fulfilled" && optionsData.value.ok
          ? await optionsData.value.json()
          : null;
      const fees =
        feesData.status === "fulfilled" && feesData.value.ok ? await feesData.value.json() : null;

      return { dex, options, fees };
    } catch (error) {
      serviceLogger.debug(`Error fetching Aptos overview:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive pool data including borrow rates
   */
  static async getComprehensivePoolData(): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols}-all-pools`;

    return DeFiLlamaService.getCachedOrFetch(cacheKey, async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/pools`);
        if (!response.ok) return null;

        const data = await response.json();

        // Filter and organize Aptos pools
        const aptosPools =
          data.data?.filter((pool: DeFiLlamaPool) => pool.chain?.toLowerCase() === "aptos") || [];

        // Group by protocol and pool type
        const organized = {
          lending: aptosPools.filter((p: DeFiLlamaPool) => p.category === "Lending"),
          dex: aptosPools.filter((p: DeFiLlamaPool) => p.category === "DEX"),
          yield: aptosPools.filter((p: DeFiLlamaPool) => p.category === "Yield"),
          other: aptosPools.filter(
            (p: DeFiLlamaPool) => !["Lending", "DEX", "Yield"].includes(p.category)
          ),
        };

        return organized;
      } catch (error) {
        serviceLogger.debug(`Error fetching comprehensive pool data:`, error);
        return null;
      }
    }).catch((error) => {
      serviceLogger.debug(`Error in cached pool data fetch:`, error);
      return null;
    });
  }
}

export const defiLlamaService = DeFiLlamaService;
