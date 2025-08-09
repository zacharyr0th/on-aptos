/**
 * DeFi Llama API Service
 * Provides live TVL, volume, and fees data for DeFi protocols
 */

import { API_ENDPOINTS, CACHE_KEYS } from "@/lib/constants/api/endpoints";
import { serviceLogger } from "@/lib/utils/logger";

export interface DeFiLlamaChain {
  name: string;
  chainId?: string;
  gecko_id?: string;
  tvl: number;
  tokenSymbol?: string;
  cmcId?: string;
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

class DeFiLlamaService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  clearCache(): void {
    this.cache.clear();
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Fetch all chains data from DeFi Llama
   */
  async getChains(): Promise<DeFiLlamaChain[]> {
    const cacheKey = CACHE_KEYS.defiProtocols() + "-chains";
    const cached = this.getCached<DeFiLlamaChain[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use v2/chains endpoint which excludes liquid staking and double counting
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/v2/chains`,
        {
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        },
      );

      if (!response.ok) {
        serviceLogger.warn(
          `DeFi Llama chains API returned ${response.status}: ${response.statusText}`,
        );
        return [];
      }

      const chains: DeFiLlamaChain[] = await response.json();
      this.setCache(cacheKey, chains);
      serviceLogger.debug(
        `Successfully fetched ${chains.length} chains from DeFi Llama`,
      );
      return chains;
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        serviceLogger.warn(
          "DeFi Llama chains API is unavailable - network or CORS issue",
        );
      } else if (error instanceof Error && error.name === "TimeoutError") {
        serviceLogger.warn("DeFi Llama chains API request timed out");
      } else {
        serviceLogger.error("Error fetching DeFi Llama chains:", error);
      }
      return [];
    }
  }

  /**
   * Get Aptos chain TVL data
   */
  async getAptosChainData(): Promise<{
    tvl: number;
    change24h?: number;
    change7d?: number;
  } | null> {
    try {
      const chains = await this.getChains();

      // If chains fetch failed, return null gracefully
      if (!chains || chains.length === 0) {
        serviceLogger.warn("No chains data available from DeFi Llama");
        return null;
      }

      const aptosChain = chains.find(
        (chain) =>
          chain.name.toLowerCase() === "aptos" || chain.gecko_id === "aptos",
      );

      if (!aptosChain) {
        serviceLogger.warn("Aptos chain not found in DeFi Llama data");
        return null;
      }

      // Get historical data for percentage changes
      try {
        const response = await fetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/v2/historicalChainTvl/Aptos`,
          {
            headers: {
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          },
        );

        if (!response.ok) {
          serviceLogger.warn(
            `Historical Aptos TVL data unavailable (${response.status}), using current TVL only`,
          );
          return { tvl: aptosChain.tvl };
        }

        const historicalData = await response.json();

        // Validate historical data structure
        if (!Array.isArray(historicalData) || historicalData.length === 0) {
          serviceLogger.warn(
            "Invalid historical data format, using current TVL only",
          );
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
          historicalError,
        );
        return { tvl: aptosChain.tvl };
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        serviceLogger.warn(
          "DeFi Llama API is unavailable - network or CORS issue",
        );
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
  async getAptosVolumeData(): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = CACHE_KEYS.defiVolume("aptos");
    const cached = this.getCached<{ volume24h: number; change24h?: number }>(
      cacheKey,
    );
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/dexs/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume`,
      );
      if (!response.ok) {
        throw new Error(`DeFi Llama volume API error: ${response.status}`);
      }

      const volumeData: DeFiLlamaVolume = await response.json();
      const result = {
        volume24h: volumeData.total24h || 0,
        change24h: volumeData.change_1d,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      serviceLogger.error("Error fetching Aptos volume data:", error);
      return null;
    }
  }

  /**
   * Get Aptos fees data
   */
  async getAptosFeesData(): Promise<{
    fees24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = CACHE_KEYS.defiVolume("aptos-fees");
    const cached = this.getCached<{ fees24h: number; change24h?: number }>(
      cacheKey,
    );
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/fees/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees`,
      );
      if (!response.ok) {
        throw new Error(`DeFi Llama fees API error: ${response.status}`);
      }

      const feesData: DeFiLlamaFees = await response.json();
      const result = {
        fees24h: feesData.total24h || 0,
        change24h: feesData.change_1d,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      serviceLogger.error("Error fetching Aptos fees data:", error);
      return null;
    }
  }

  /**
   * Get Aptos perp volume data
   */
  async getAptosPerpVolumeData(): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = CACHE_KEYS.defiVolume("aptos-perps");
    const cached = this.getCached<{ volume24h: number; change24h?: number }>(
      cacheKey,
    );
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/derivatives/Aptos?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume`,
      );
      if (!response.ok) {
        throw new Error(`DeFi Llama perps API error: ${response.status}`);
      }

      const volumeData: DeFiLlamaVolume = await response.json();
      const result = {
        volume24h: volumeData.total24h || 0,
        change24h: volumeData.change_1d,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      serviceLogger.error("Error fetching Aptos perp volume data:", error);
      return null;
    }
  }

  /**
   * Get comprehensive Aptos DeFi metrics
   */
  async getAptosDefiMetrics(): Promise<AptosDefiMetrics | null> {
    const cacheKey = CACHE_KEYS.defiTVL() + "-aptos-metrics";
    const cached = this.getCached<AptosDefiMetrics>(cacheKey);
    if (cached) return cached;

    try {
      const [chainData, volumeData, feesData] = await Promise.allSettled([
        this.getAptosChainData(),
        this.getAptosVolumeData(),
        this.getAptosFeesData(),
      ]);

      const tvlResult =
        chainData.status === "fulfilled" ? chainData.value : null;
      const volResult =
        volumeData.status === "fulfilled" ? volumeData.value : null;
      const feesResult =
        feesData.status === "fulfilled" ? feesData.value : null;

      if (!tvlResult && !volResult && !feesResult) {
        return null;
      }

      const metrics: AptosDefiMetrics = {
        tvl: tvlResult?.tvl || 0,
        tvlChange24h: tvlResult?.change24h,
        tvlChange7d: tvlResult?.change7d,
        spotVolume: volResult?.volume24h || 0,
        volumeChange24h: volResult?.change24h,
        fees: {
          total24h: feesResult?.fees24h || 0,
          change24h: feesResult?.change24h,
        },
        protocols: 0, // Will be updated from protocols endpoint
        lastUpdated: new Date().toISOString(),
      };

      serviceLogger.debug("DeFi metrics compiled:", {
        tvlChange: tvlResult?.change24h,
        volumeChange: volResult?.change24h,
        feesChange: feesResult?.change24h,
      });

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      serviceLogger.error("Error fetching Aptos DeFi metrics:", error);
      return null;
    }
  }

  /**
   * Get protocols on Aptos
   */
  async getAptosProtocols(): Promise<DeFiLlamaProtocol[]> {
    const cacheKey = CACHE_KEYS.defiProtocols() + "-aptos";
    const cached = this.getCached<DeFiLlamaProtocol[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/protocols`);
      if (!response.ok) {
        throw new Error(`DeFi Llama protocols API error: ${response.status}`);
      }

      const allProtocols: DeFiLlamaProtocol[] = await response.json();
      const aptosProtocols = allProtocols.filter(
        (protocol) =>
          protocol.chains.includes("Aptos") || protocol.chain === "Aptos",
      );

      this.setCache(cacheKey, aptosProtocols);
      return aptosProtocols;
    } catch (error) {
      serviceLogger.error("Error fetching Aptos protocols:", error);
      return [];
    }
  }

  /**
   * Get individual protocol volume data
   */
  async getProtocolVolume(protocolName: string): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiVolume("protocol")}-${protocolName}`;
    const cached = this.getCached<{ volume24h: number; change24h?: number }>(
      cacheKey,
    );
    if (cached) return cached;

    try {
      // DeFi Llama uses slug format for protocol names (lowercase, spaces replaced with dashes)
      const slug = protocolName.toLowerCase().replace(/\s+/g, "-");
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/dexs/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
      );

      if (!response.ok) {
        serviceLogger.debug(`No DEX volume data for ${protocolName}`);
        return null;
      }

      const data = await response.json();
      const result = {
        volume24h: data.total24h || 0,
        change24h: data.change_1d,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      serviceLogger.debug(`Error fetching volume for ${protocolName}:`, error);
      return null;
    }
  }

  /**
   * Get individual protocol fees data
   */
  async getProtocolFees(protocolName: string): Promise<{
    fees24h: number;
    revenue24h?: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiVolume("protocol-fees")}-${protocolName}`;
    const cached = this.getCached<{
      fees24h: number;
      revenue24h?: number;
      change24h?: number;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const slug = protocolName.toLowerCase().replace(/\s+/g, "-");
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/fees/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
      );

      if (!response.ok) {
        serviceLogger.debug(`No fees data for ${protocolName}`);
        return null;
      }

      const data = await response.json();
      const result = {
        fees24h: data.total24h || 0,
        revenue24h: data.totalRevenue24h,
        change24h: data.change_1d,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      serviceLogger.debug(`Error fetching fees for ${protocolName}:`, error);
      return null;
    }
  }

  /**
   * Get protocol data including volume and fees
   */
  async getProtocolMetrics(protocolName: string): Promise<{
    volume?: { daily: string; change24h?: string };
    fees?: { daily: string; change24h?: string; revenue?: string };
  } | null> {
    try {
      const [volumeData, feesData] = await Promise.allSettled([
        this.getProtocolVolume(protocolName),
        this.getProtocolFees(protocolName),
      ]);

      const volume =
        volumeData.status === "fulfilled" ? volumeData.value : null;
      const fees = feesData.status === "fulfilled" ? feesData.value : null;

      if (!volume && !fees) return null;

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
      };
    } catch (error) {
      serviceLogger.error(`Error fetching metrics for ${protocolName}:`, error);
      return null;
    }
  }
}

export const defiLlamaService = new DeFiLlamaService();
