import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  cmcCache,
  getCachedData,
  setCachedData,
  enhancedFetch,
} from '@/lib/utils';
import type {
  RawProtocolData,
  TransformedProtocolData,
  TvlHistoricalEntry,
  VolumeData,
  ProtocolsResponse,
  AllMetricsResponse,
  ProtocolMetrics,
  FeesData,
  RevenueData,
} from './schemas';

// Use centralized cache and config
const config = SERVICE_CONFIG.apiService;

/**
 * Get current TVL for Aptos ecosystem from DeFiLlama
 */
export async function fetchAptosTVL(): Promise<number> {
  const cacheKey = 'defi:aptos:tvl';

  // Try to get from cache first
  const cachedData = getCachedData<number>(cmcCache, cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  try {
    console.log('[DeFi] Fetching Aptos TVL from DeFiLlama');
    // Fetch from DeFiLlama API with production-friendly timeout
    const response = await enhancedFetch('https://api.llama.fi/tvl/aptos', {
      timeout: Math.min(config.timeout, 6000), // Cap at 6 seconds
      retries: 1, // Reduce retries for faster failure
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama TVL API error: ${response.status}`);
    }

    const tvlData = await response.json();
    const tvlValue = typeof tvlData === 'number' ? tvlData : tvlData?.tvl || 0;

    console.log('[DeFi] Aptos TVL fetched:', { tvl: tvlValue });

    // Cache the result for 5 minutes
    setCachedData(cmcCache, cacheKey, tvlValue);

    return tvlValue;
  } catch (error) {
    console.error('[DeFi] Error fetching Aptos TVL from DeFiLlama:', error);
    // Return fallback TVL value
    return 500000000; // $500M fallback
  }
}

/**
 * Get 24h spot trading volume for Aptos from DeFiLlama
 */
export async function fetchAptosSpotVolume(): Promise<VolumeData> {
  const cacheKey = 'defi:aptos:spot-volume';

  // Try to get from cache first
  const cachedData = getCachedData<VolumeData>(cmcCache, cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  try {
    console.log('[DeFi] Fetching Aptos volume from DeFiLlama');
    // Fetch from DeFiLlama volumes API for Aptos
    const response = await enhancedFetch(
      'https://api.llama.fi/overview/dexs/aptos',
      {
        timeout: Math.min(config.timeout, 6000), // Cap at 6 seconds
        retries: 1, // Reduce retries for faster failure
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DeFiLlama volume API error: ${response.status}`);
    }

    const volumeData = (await response.json()) as VolumeData;
    const spotVolume = volumeData?.total24h || volumeData?.totalVolume24h || 0;

    const result: VolumeData = {
      total24h: spotVolume,
      totalVolume24h: spotVolume,
    };

    console.log('[DeFi] Aptos volume fetched:', { volume24h: spotVolume });

    // Cache the result for 5 minutes
    setCachedData(cmcCache, cacheKey, result);

    return result;
  } catch (error) {
    console.error(
      '[DeFi] Error fetching Aptos spot volume from DeFiLlama:',
      error
    );
    // Return fallback volume data
    return {
      total24h: 50000000, // $50M fallback
      totalVolume24h: 50000000,
    };
  }
}

/**
 * Get Aptos protocols count and information from DeFiLlama
 */
export async function fetchAptosProtocols(): Promise<ProtocolsResponse> {
  const cacheKey = 'defi:aptos:protocols';

  // Try to get from cache first
  const cachedData = getCachedData<ProtocolsResponse>(cmcCache, cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  try {
    console.log('[DeFi] Fetching Aptos protocols from DeFiLlama');
    // Fetch protocols from DeFiLlama API
    const response = await enhancedFetch('https://api.llama.fi/protocols', {
      timeout: Math.min(config.timeout, 8000), // Slightly longer for protocols list
      retries: 1,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama protocols API error: ${response.status}`);
    }

    const protocolsData = (await response.json()) as RawProtocolData[];

    if (!Array.isArray(protocolsData)) {
      throw new Error('Invalid protocols data format');
    }

    // Filter for Aptos protocols
    const aptosProtocols = protocolsData
      .filter(
        (protocol: RawProtocolData) =>
          protocol.chains?.includes('Aptos') || protocol.chain === 'Aptos'
      )
      .map(
        (protocol: RawProtocolData): TransformedProtocolData => ({
          id: protocol.id,
          name: protocol.name,
          symbol: protocol.symbol || protocol.name,
          category: protocol.category,
          tvl: protocol.tvl || 0,
          change_1d: protocol.change_1d,
          change_7d: protocol.change_7d,
        })
      )
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0)); // Sort by TVL descending

    const result: ProtocolsResponse = {
      protocols: aptosProtocols,
    };

    console.log('[DeFi] Aptos protocols fetched:', {
      count: aptosProtocols.length,
    });

    // Cache the result for 10 minutes
    setCachedData(cmcCache, cacheKey, result);

    return result;
  } catch (error) {
    console.error(
      '[DeFi] Error fetching Aptos protocols from DeFiLlama:',
      error
    );
    // Return fallback protocols data
    return {
      protocols: [
        {
          id: 'pancakeswap',
          name: 'PancakeSwap',
          symbol: 'CAKE',
          category: 'Dexes',
          tvl: 100000000,
          change_1d: 0,
          change_7d: 0,
        },
        {
          id: 'liquidswap',
          name: 'Liquidswap',
          symbol: 'LSD',
          category: 'Dexes',
          tvl: 80000000,
          change_1d: 0,
          change_7d: 0,
        },
      ],
    };
  }
}

/**
 * Get all DeFi metrics in one call (aggregates TVL and volume from DeFiLlama)
 */
export async function fetchAllAptosMetrics(): Promise<AllMetricsResponse> {
  const cacheKey = 'defi:aptos:all-metrics';

  // Try to get from cache first
  const cachedData = getCachedData<AllMetricsResponse>(cmcCache, cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  try {
    console.log('[DeFi] Fetching all Aptos metrics from DeFiLlama');
    // Fetch all data in parallel with production-friendly timeouts
    const [
      tvlResponse,
      volumeResponse,
      protocolsResponse,
      feesResponse,
      revenueResponse,
    ] = await Promise.allSettled([
      // Use the correct DeFiLlama endpoint for historical chain TVL
      enhancedFetch('https://api.llama.fi/v2/historicalChainTvl/Aptos', {
        timeout: Math.min(config.timeout, 6000),
        retries: 1,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
        },
      }),
      enhancedFetch('https://api.llama.fi/overview/dexs/aptos', {
        timeout: Math.min(config.timeout, 6000),
        retries: 1,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
        },
      }),
      enhancedFetch('https://api.llama.fi/protocols', {
        timeout: Math.min(config.timeout, 8000), // Longer for protocols list
        retries: 1,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
        },
      }),
      enhancedFetch('https://api.llama.fi/overview/fees/aptos', {
        timeout: Math.min(config.timeout, 6000),
        retries: 1,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
        },
      }),
      enhancedFetch(
        'https://api.llama.fi/overview/fees/aptos?dataType=dailyRevenue',
        {
          timeout: Math.min(config.timeout, 6000),
          retries: 1,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'OnAptos-DeFi-Tracker/1.0',
          },
        }
      ),
    ]);

    // Process TVL - extract latest value from historical data
    let tvl = 0;
    if (tvlResponse.status === 'fulfilled') {
      try {
        const tvlData =
          (await tvlResponse.value.json()) as TvlHistoricalEntry[];
        // Extract the latest TVL from the historical data array
        if (Array.isArray(tvlData) && tvlData.length > 0) {
          const latestEntry = tvlData[tvlData.length - 1];
          tvl = latestEntry?.tvl || 0;
        }
      } catch (e) {
        console.error('Error parsing TVL data:', e);
      }
    }

    // Process Volume - handle the actual DeFiLlama API format
    let spotVolume = 0;
    if (volumeResponse.status === 'fulfilled') {
      try {
        const volumeData = await volumeResponse.value.json();
        // DeFiLlama returns totalDataChart array, get the latest value
        if (
          volumeData.totalDataChart &&
          Array.isArray(volumeData.totalDataChart)
        ) {
          const latestEntry =
            volumeData.totalDataChart[volumeData.totalDataChart.length - 1];
          spotVolume = latestEntry?.[1] || 0;
        } else if (volumeData.total24h) {
          spotVolume = volumeData.total24h;
        }
      } catch (e) {
        console.error('Error parsing volume data:', e);
      }
    }

    // Process Protocols
    let protocolCount = 0;
    let protocols: TransformedProtocolData[] = [];
    if (protocolsResponse.status === 'fulfilled') {
      try {
        const protocolsData =
          (await protocolsResponse.value.json()) as RawProtocolData[];
        // Filter for protocols that have Aptos in their chains array or chain property
        const aptosProtocols = protocolsData.filter(
          (protocol: RawProtocolData) => {
            const hasAptosChain = Array.isArray(protocol.chains)
              ? protocol.chains.includes('Aptos')
              : protocol.chain === 'Aptos';
            // Also filter out CEX protocols as they're not DeFi protocols
            const isDeFi = protocol.category !== 'CEX';
            return hasAptosChain && isDeFi;
          }
        );
        protocolCount = aptosProtocols.length;
        protocols = aptosProtocols.map(
          (protocol: RawProtocolData): TransformedProtocolData => ({
            id: protocol.id,
            name: protocol.name,
            symbol: protocol.symbol || protocol.name,
            category: protocol.category,
            tvl: protocol.tvl || 0,
            change_1d: protocol.change_1d,
            change_7d: protocol.change_7d,
          })
        );
      } catch (e) {
        console.error('Error parsing protocols data:', e);
      }
    }

    // Process Fees - handle the actual DeFiLlama API format
    let fees: FeesData = { total24h: 0, totalAllTime: 0 };
    if (feesResponse.status === 'fulfilled') {
      try {
        const feesData = await feesResponse.value.json();
        // DeFiLlama returns totalDataChart array, get the latest value
        if (feesData.totalDataChart && Array.isArray(feesData.totalDataChart)) {
          const latestEntry =
            feesData.totalDataChart[feesData.totalDataChart.length - 1];
          fees = {
            total24h: latestEntry?.[1] || 0,
            totalAllTime: feesData.totalAllTime || 0,
          };
        }
      } catch (e) {
        console.error('Error parsing fees data:', e);
      }
    }

    // Process Revenue - handle the actual DeFiLlama API format
    let revenue: RevenueData = { total24h: 0, totalAllTime: 0 };
    if (revenueResponse.status === 'fulfilled') {
      try {
        const revenueData = await revenueResponse.value.json();
        // DeFiLlama returns totalDataChart array, get the latest value
        if (
          revenueData.totalDataChart &&
          Array.isArray(revenueData.totalDataChart)
        ) {
          const latestEntry =
            revenueData.totalDataChart[revenueData.totalDataChart.length - 1];
          revenue = {
            total24h: latestEntry?.[1] || 0,
            totalAllTime: revenueData.totalAllTime || 0,
          };
        }
      } catch (e) {
        console.error('Error parsing revenue data:', e);
      }
    }

    const result: AllMetricsResponse = {
      tvl,
      spotVolume,
      derivativesVolume: 0, // Not available for Aptos yet
      protocolCount,
      protocols,
      fees,
      revenue,
    };

    // Cache the result for 5 minutes
    setCachedData(cmcCache, cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error fetching all DeFi metrics:', error);
    return {
      tvl: 0,
      spotVolume: 0,
      derivativesVolume: 0,
      protocolCount: 0,
      protocols: [],
      fees: { total24h: 0, totalAllTime: 0 },
      revenue: { total24h: 0, totalAllTime: 0 },
    };
  }
}

/**
 * Get 24h derivatives trading volume for Aptos (placeholder for future implementation)
 */
export async function fetchAptosDerivativesVolume(): Promise<VolumeData> {
  return {
    total24h: 0,
    totalVolume24h: 0,
  };
}

/**
 * Get protocol-specific metrics for given protocol names
 */
export async function fetchProtocolMetrics(
  protocolNames: string[]
): Promise<Record<string, ProtocolMetrics>> {
  // This would aggregate metrics from specific protocol routers
  const emptyMetrics: Record<string, ProtocolMetrics> = {};
  protocolNames.forEach(name => {
    emptyMetrics[name] = { tvl: undefined, volume24h: undefined };
  });

  return emptyMetrics;
}

/**
 * Get comprehensive protocol data for dialog display
 */
export async function fetchProtocolComprehensiveData(
  protocolNames: string[]
): Promise<Record<string, TransformedProtocolData | null>> {
  // This would aggregate comprehensive data from specific protocol routers
  const emptyData: Record<string, TransformedProtocolData | null> = {};
  protocolNames.forEach(name => {
    emptyData[name] = null;
  });

  return emptyData;
}
