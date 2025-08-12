/**
 * DeFi Llama API Service
 * Provides live TVL, volume, and fees data for DeFi protocols
 */

import { API_ENDPOINTS, CACHE_KEYS } from "@/lib/constants/api/endpoints";
import { serviceLogger } from "@/lib/utils/core/logger";

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

  // Protocol name mapping from our names to DeFiLlama slugs
  private readonly PROTOCOL_SLUG_MAP: Record<string, string> = {
    // Liquid Staking
    'Amnis': 'amnis-finance',
    'Thala LSD': 'thala-lsd',
    
    // Lending
    'Echelon': 'echelon-market',
    'Aries': 'aries-markets',
    'Echo': 'echo-lending',
    'Meso': 'meso-finance',
    'Joule': 'joule-finance',
    
    // DEXs
    'PancakeSwap': 'pancakeswap-amm',
    'Sushiswap': 'sushi',
    'Thala': 'thalaswap',
    'ThalaSwap': 'thalaswap',
    'ThalaSwap V2': 'thalaswap-v2',
    'Liquidswap': 'liquidswap',
    'Cetus': 'cetus-amm',
    'Superposition': 'superposition',
    'Panora': 'panora-exchange',
    
    // Yield/Strategy
    'Aptin': 'aptin-finance-v2',
    'Cellana': 'cellana-finance',
    'Echo Strategy': 'echo-strategy',
    'Kofi': 'kofi-finance',
    'Satay': 'satay-finance',
    
    // Derivatives
    'Merkle': 'merkle-trade',
    'Tsunami': 'tsunami-finance',
    
    // Others
    'Ondo': 'ondo-finance',
    'Franklin Templeton': 'franklin-templeton',
    'Thala CDP': 'thala-cdp',
    'Mole': 'mole',
    'Kana': 'kana-labs',
    'Gui Inu': 'gui-inu',
    'Emojicoin': 'emojicoin',
  };

  // Get the correct DeFiLlama slug for a protocol
  private getProtocolSlug(protocolName: string): string {
    // First check our mapping
    if (this.PROTOCOL_SLUG_MAP[protocolName]) {
      return this.PROTOCOL_SLUG_MAP[protocolName];
    }
    // Fallback to lowercase with dashes
    return protocolName.toLowerCase().replace(/\s+/g, '-');
  }

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
   * Get individual protocol volume data - APTOS SPECIFIC
   */
  async getProtocolVolume(protocolName: string): Promise<{
    volume24h: number;
    change24h?: number;
    isAptosSpecific?: boolean;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiVolume("protocol")}-${protocolName}-aptos`;
    const cached = this.getCached<{ volume24h: number; change24h?: number; isAptosSpecific?: boolean }>(
      cacheKey,
    );
    if (cached) return cached;

    try {
      // DeFi Llama uses slug format for protocol names (lowercase, spaces replaced with dashes)
      const slug = this.getProtocolSlug(protocolName);
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/dexs/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
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
      if (aptosVolume24h === 0 && data.chains && data.chains.length === 1 && data.chains[0] === "Aptos") {
        aptosVolume24h = data.total24h || 0;
        aptosChange24h = data.change_1d;
      }
      
      const result = {
        volume24h: aptosVolume24h || data.total24h || 0,
        change24h: aptosChange24h || data.change_1d,
        isAptosSpecific: aptosVolume24h > 0,
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
      const slug = this.getProtocolSlug(protocolName);
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
   * Get detailed protocol data from DeFiLlama
   */
  async getProtocolDetails(protocolSlug: string): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols()}-details-${protocolSlug}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const slug = this.getProtocolSlug(protocolSlug);
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/protocol/${slug}`,
      );

      if (!response.ok) {
        serviceLogger.debug(`No detailed data for ${protocolSlug}, tried slug: ${slug}, status: ${response.status}`);
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
        latestAptosTvl = aptosTvl.tvl && aptosTvl.tvl.length > 0 
          ? aptosTvl.tvl[aptosTvl.tvl.length - 1].totalLiquidityUSD 
          : 0;
      }
        
      // Calculate Aptos-specific changes
      let aptosChange1d, aptosChange7d;
      if (data.chainTvls && data.chainTvls.Aptos && data.chainTvls.Aptos.tvl && data.chainTvls.Aptos.tvl.length > 1) {
        const aptosTvl = data.chainTvls.Aptos;
        const oneDayAgo = aptosTvl.tvl[Math.max(0, aptosTvl.tvl.length - 2)];
        const sevenDaysAgo = aptosTvl.tvl[Math.max(0, aptosTvl.tvl.length - 8)];
        
        if (oneDayAgo) {
          aptosChange1d = ((latestAptosTvl - oneDayAgo.totalLiquidityUSD) / oneDayAgo.totalLiquidityUSD) * 100;
        }
        if (sevenDaysAgo) {
          aptosChange7d = ((latestAptosTvl - sevenDaysAgo.totalLiquidityUSD) / sevenDaysAgo.totalLiquidityUSD) * 100;
        }
      }
      
      // Override with Aptos-specific data
      data.aptosTvl = latestAptosTvl;
      data.aptosChange1d = aptosChange1d;
      data.aptosChange7d = aptosChange7d;
      
      serviceLogger.debug(`Protocol ${protocolSlug} (${slug}): Aptos TVL = ${latestAptosTvl}, chains = ${data.chains?.join(',')}`);
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      serviceLogger.debug(`Error fetching details for ${protocolSlug}:`, error);
      return null;
    }
  }

  /**
   * Get yields data for a protocol
   */
  async getProtocolYields(protocolName: string): Promise<any[] | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols()}-yields`;
    const cached = this.getCached<any[]>(cacheKey);
    
    try {
      let pools: any[];
      if (cached) {
        pools = cached;
      } else {
        const response = await fetch(
          `${API_ENDPOINTS.DEFILLAMA_BASE}/pools`,
        );

        if (!response.ok) {
          serviceLogger.debug(`No yields data available`);
          return null;
        }

        const data = await response.json();
        pools = data.data || [];
        this.setCache(cacheKey, pools);
      }

      // Filter for the specific protocol AND Aptos chain only
      const protocolPools = pools.filter(
        (pool: any) => 
          (pool.project?.toLowerCase() === protocolName.toLowerCase() ||
           pool.symbol?.toLowerCase().includes(protocolName.toLowerCase())) &&
          pool.chain?.toLowerCase() === 'aptos'
      );

      return protocolPools.length > 0 ? protocolPools : null;
    } catch (error) {
      serviceLogger.debug(`Error fetching yields for ${protocolName}:`, error);
      return null;
    }
  }

  /**
   * Get stablecoin data
   */
  async getStablecoinMetrics(): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols()}-stablecoins`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/stablecoins`,
      );

      if (!response.ok) {
        serviceLogger.debug(`No stablecoin data available`);
        return null;
      }

      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      serviceLogger.debug(`Error fetching stablecoin metrics:`, error);
      return null;
    }
  }

  /**
   * Get options volume for a protocol
   */
  async getProtocolOptionsVolume(protocolName: string): Promise<{
    volume24h: number;
    change24h?: number;
  } | null> {
    const cacheKey = `${CACHE_KEYS.defiVolume("options")}-${protocolName}`;
    const cached = this.getCached<{ volume24h: number; change24h?: number }>(
      cacheKey,
    );
    if (cached) return cached;

    try {
      const slug = this.getProtocolSlug(protocolName);
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/options/${slug}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
      );

      if (!response.ok) {
        serviceLogger.debug(`No options volume data for ${protocolName}`);
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
      serviceLogger.debug(`Error fetching options volume for ${protocolName}:`, error);
      return null;
    }
  }

  /**
   * Get COMPREHENSIVE protocol data including ALL DeFiLlama metrics
   */
  async getProtocolMetrics(protocolName: string): Promise<{
    volume?: { daily: string; change24h?: string };
    fees?: { daily: string; change24h?: string; revenue?: string };
    tvl?: { current: number; change24h?: number; change7d?: number; tokens?: any };
    yields?: any[];
    optionsVolume?: { daily: string; change24h?: string };
    derivativesVolume?: { daily: string; change24h?: string; openInterest?: string };
    mcap?: number;
    tokenPrice?: number;
    fdv?: number;
    staking?: number;
    borrowRates?: any[];
    supplyRates?: any[];
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
        this.getProtocolVolume(protocolName),
        this.getProtocolFees(protocolName),
        this.getProtocolDetails(protocolName),
        this.getProtocolYields(protocolName),
        this.getProtocolOptionsVolume(protocolName),
        this.getProtocolDerivatives(protocolName),
        this.getComprehensivePoolData(),
      ]);

      const volume =
        volumeData.status === "fulfilled" ? volumeData.value : null;
      const fees = feesData.status === "fulfilled" ? feesData.value : null;
      const details = detailsData.status === "fulfilled" ? detailsData.value : null;
      const yields = yieldsData.status === "fulfilled" ? yieldsData.value : null;
      const options = optionsData.status === "fulfilled" ? optionsData.value : null;
      const derivatives = derivativesData.status === "fulfilled" ? derivativesData.value : null;
      const pools = poolsData.status === "fulfilled" ? poolsData.value : null;

      if (!volume && !fees && !details && !yields && !options && !derivatives && !pools) return null;

      // Extract COMPREHENSIVE metrics from details - APTOS SPECIFIC
      let tvl, mcap, tokenPrice, fdv, staking, historicalTvl, tokenBreakdown;
      if (details) {
        // Use Aptos-specific TVL if available
        tvl = {
          current: details.aptosTvl || (details.currentChainTvls?.Aptos) || 0,
          change24h: details.aptosChange1d,
          change7d: details.aptosChange7d,
          tokens: undefined,
        };
        
        // Extract token breakdown from Aptos chain data
        if (details.chainTvls?.Aptos?.tokens && details.chainTvls.Aptos.tokens.length > 0) {
          const latestTokens = details.chainTvls.Aptos.tokens[details.chainTvls.Aptos.tokens.length - 1];
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
        const protocolPools = pools.lending.filter((p: any) => 
          p.project?.toLowerCase() === protocolName.toLowerCase()
        );
        
        if (protocolPools.length > 0) {
          borrowRates = protocolPools.map((p: any) => ({
            symbol: p.symbol,
            apyBorrow: p.apyBorrow,
            apyBaseBorrow: p.apyBaseBorrow,
            totalBorrowUsd: p.totalBorrowUsd,
            ltv: p.ltv,
          })).filter((p: any) => p.apyBorrow);
          
          supplyRates = protocolPools.map((p: any) => ({
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
  async getTokenPrices(addresses: string[]): Promise<any | null> {
    try {
      const coins = addresses.map(addr => `aptos:${addr}`).join(',');
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/prices/current/${coins}`,
      );
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
  async getTokenChart(address: string, period = '30d'): Promise<any | null> {
    try {
      const coin = `aptos:${address}`;
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/chart/${coin}?period=${period}`,
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
  async getTokenPercentageChanges(addresses: string[]): Promise<any | null> {
    try {
      const coins = addresses.map(addr => `aptos:${addr}`).join(',');
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/percentage/${coins}`,
      );
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
  async getAptosStablecoins(): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols()}-stablecoins-aptos`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      // Get all stablecoins
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/stablecoins`,
      );
      if (!response.ok) return null;
      
      const data = await response.json();
      
      // Filter for Aptos stablecoins
      const aptosStables = data.peggedAssets?.filter((stable: any) => 
        stable.chainCirculating?.Aptos || 
        stable.chains?.includes('Aptos')
      ) || [];
      
      this.setCache(cacheKey, aptosStables);
      return aptosStables;
    } catch (error) {
      serviceLogger.debug(`Error fetching Aptos stablecoins:`, error);
      return null;
    }
  }

  /**
   * Get stablecoin charts for Aptos
   */
  async getAptosStablecoinCharts(): Promise<any | null> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/stablecoincharts/Aptos`,
      );
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
  async getAptosDerivativesOverview(): Promise<any | null> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/overview/derivatives/Aptos`,
      );
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
  async getProtocolDerivatives(protocol: string): Promise<any | null> {
    try {
      const slug = this.getProtocolSlug(protocol);
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/summary/derivatives/${slug}`,
      );
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
  async getAptosOverview(): Promise<any | null> {
    try {
      const [dexData, optionsData, feesData] = await Promise.allSettled([
        fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/dexs/Aptos`),
        fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/options/Aptos`),
        fetch(`${API_ENDPOINTS.DEFILLAMA_BASE}/overview/fees/Aptos`),
      ]);

      const dex = dexData.status === 'fulfilled' && dexData.value.ok 
        ? await dexData.value.json() : null;
      const options = optionsData.status === 'fulfilled' && optionsData.value.ok
        ? await optionsData.value.json() : null;
      const fees = feesData.status === 'fulfilled' && feesData.value.ok
        ? await feesData.value.json() : null;

      return { dex, options, fees };
    } catch (error) {
      serviceLogger.debug(`Error fetching Aptos overview:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive pool data including borrow rates
   */
  async getComprehensivePoolData(): Promise<any | null> {
    const cacheKey = `${CACHE_KEYS.defiProtocols()}-all-pools`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_ENDPOINTS.DEFILLAMA_BASE}/pools`,
      );
      if (!response.ok) return null;
      
      const data = await response.json();
      
      // Filter and organize Aptos pools
      const aptosPools = data.data?.filter((pool: any) => 
        pool.chain?.toLowerCase() === 'aptos'
      ) || [];
      
      // Group by protocol and pool type
      const organized = {
        lending: aptosPools.filter((p: any) => p.category === 'Lending'),
        dex: aptosPools.filter((p: any) => p.category === 'DEX'),
        yield: aptosPools.filter((p: any) => p.category === 'Yield'),
        other: aptosPools.filter((p: any) => 
          !['Lending', 'DEX', 'Yield'].includes(p.category)
        ),
      };
      
      this.setCache(cacheKey, organized);
      return organized;
    } catch (error) {
      serviceLogger.debug(`Error fetching comprehensive pool data:`, error);
      return null;
    }
  }
}

export const defiLlamaService = new DeFiLlamaService();
