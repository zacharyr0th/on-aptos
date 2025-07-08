import { router, publicProcedure } from '../core/server';
import {
  cmcCache,
  getCachedData,
  setCachedData,
  enhancedFetch,
} from '@/lib/utils';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { API_CONFIG } from '@/lib/config/app';

const config = SERVICE_CONFIG.apiService;

// RWA.xyz API configuration
const RWA_API_KEY = API_CONFIG.rwa.apiKey;
const RWA_BASE_URL = API_CONFIG.rwa.baseUrl;

// Enhanced cache configuration
const CACHE_CONFIG = {
  ttl: 10 * 60 * 1000, // 10 minutes TTL
  staleTime: 15 * 60 * 1000, // 15 minutes stale time
  maxAge: 30 * 60 * 1000, // 30 minutes max age
  revalidateTime: 5 * 60 * 1000, // 5 minutes revalidate
} as const;

// Circuit breaker for external API calls
let apiFailureCount = 0;
let lastFailureTime = 0;
const MAX_FAILURES = 3;
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

function isCircuitBreakerOpen(): boolean {
  if (apiFailureCount < MAX_FAILURES) return false;
  return Date.now() - lastFailureTime < CIRCUIT_BREAKER_TIMEOUT;
}

function recordApiFailure(): void {
  apiFailureCount++;
  lastFailureTime = Date.now();
}

function resetCircuitBreaker(): void {
  apiFailureCount = 0;
  lastFailureTime = 0;
}

// Interface for RWA.xyz API response
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
  asset_class?: string;
  issuer?: string;
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

// Interface for RWA.xyz Token API response
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

interface RWAXyzTokenApiResponse {
  results: RWAXyzToken[];
  pagination: {
    page: number;
    perPage: number;
    resultCount: number;
    pageCount: number;
  };
}

// Interface for our transformed RWA asset
interface ProtocolData {
  id: string;
  name: string;
  logoUrl?: string;
  totalValue: number;
  description: string;
  tokenAddress: string;
  assetTicker: string;
  assetClass: string;
  protocol: string;
}

interface RWAApiResponse {
  success: boolean;
  totalAptosValue: number;
  totalAptosValueFormatted: string;
  assetCount: number;
  protocols: ProtocolData[];
  timestamp: string;
  dataSource: string;
}

// Helper function to get protocol logo URL
function getProtocolLogoUrl(protocol: string): string {
  const protocolLogos: Record<string, string> = {
    pact: '/logos/pact.png',
    securitize: '/logos/securitize.png',
    blackrock: '/logos/blackrock.png',
    'franklin-templeton-benji-investments': '/logos/franklin-templeton.png',
    'libre-capital': '/logos/libre.png',
    ondo: '/logos/ondo.png',
  };

  return protocolLogos[protocol] || '/logos/default.png';
}

// Helper function to format asset class
function formatAssetClass(assetClass?: string): string {
  if (!assetClass) return 'rwa';

  const classMap: Record<string, string> = {
    'us-treasury-debt': 'us-treasury-debt',
    'private-credit': 'private-credit',
    'institutional-alternative-funds': 'institutional-alternative-funds',
  };

  return classMap[assetClass] || assetClass;
}

// Transform RWA.xyz token to our protocol format using Aptos-specific values
function transformRWAToken(
  token: RWAXyzToken,
  assetMetadata: Map<number, RWAXyzAsset>
): ProtocolData | null {
  if (
    !token.total_asset_value_dollar?.val ||
    token.total_asset_value_dollar.val === 0
  )
    return null;

  // Get asset metadata
  const asset = assetMetadata.get(token.asset_id);
  if (!asset) return null;

  // Filter out stablecoins (but keep USDY as it's a yield-bearing RWA token)
  const ticker = token.asset.ticker?.toLowerCase() || '';
  const name = token.asset.name?.toLowerCase() || '';
  const isStablecoin =
    ticker.includes('usdc') ||
    ticker.includes('usdt') ||
    name.includes('usdc') ||
    name.includes('usdt') ||
    name.includes('usd coin') ||
    name.includes('tether');

  if (isStablecoin) return null;

  const protocol = asset.protocol || 'unknown';
  const assetClass = formatAssetClass(asset.asset_class);
  const description = asset.description || `${asset.name} issued on Aptos`;

  return {
    id: token.asset_id.toString(),
    name: asset.name,
    logoUrl: getProtocolLogoUrl(protocol),
    totalValue: token.total_asset_value_dollar.val, // ✅ Aptos-specific value
    description,
    tokenAddress: token.address,
    assetTicker: token.asset.ticker || 'N/A',
    assetClass,
    protocol,
  };
}

// Fetch real-time RWA data from RWA.xyz API with enhanced error handling
async function fetchRealTimeRWAData(): Promise<RWAApiResponse> {
  // Circuit breaker check
  if (isCircuitBreakerOpen()) {
    throw new Error('Circuit breaker is open - too many recent API failures');
  }

  try {
    // 1️⃣ Use Promise.all for parallel requests instead of sequential
    const [tokenResponse, assetResponse] = await Promise.all([
      // Token data request
      fetch(
        `${RWA_BASE_URL.replace('/assets', '/tokens')}?query=${encodeURIComponent(
          JSON.stringify({
            pagination: { page: 1, perPage: 100 },
            filter: {
              operator: 'and' as const,
              filters: [
                { field: 'network_id', operator: 'equals' as const, value: 38 },
              ],
            },
          })
        )}`,
        {
          headers: {
            Authorization: `Bearer ${RWA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000), // Reduced timeout
        }
      ),

      // Asset metadata request
      fetch(
        `${RWA_BASE_URL}?query=${encodeURIComponent(
          JSON.stringify({
            pagination: { page: 1, perPage: 100 },
            filter: {
              operator: 'and' as const,
              filters: [
                {
                  field: 'network_ids',
                  operator: 'includes' as const,
                  value: 38,
                },
              ],
            },
          })
        )}`,
        {
          headers: {
            Authorization: `Bearer ${RWA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(15000), // Reduced timeout
        }
      ),
    ]);

    if (!tokenResponse.ok || !assetResponse.ok) {
      throw new Error(
        `RWA.xyz API error: ${tokenResponse.status} or ${assetResponse.status}`
      );
    }

    const [tokenData, assetData] = await Promise.all([
      tokenResponse.json() as Promise<RWAXyzTokenApiResponse>,
      assetResponse.json() as Promise<RWAXyzApiResponse>,
    ]);

    // Reset circuit breaker on success
    resetCircuitBreaker();

    // 2️⃣ Get unique asset IDs that need metadata
    const assetIds = [
      ...new Set(tokenData.results.map(token => token.asset_id)),
    ];
    console.log('📈 Found', assetIds.length, 'unique assets on Aptos');

    // 3️⃣ Create asset metadata map (only for assets we actually have tokens for)
    const assetMetadata = new Map<number, RWAXyzAsset>();
    assetData.results.forEach(asset => {
      if (assetIds.includes(asset.id)) {
        assetMetadata.set(asset.id, asset);
      }
    });

    // 4️⃣ Transform tokens to protocols using Aptos-specific values (stablecoins filtered in transform function)
    const protocols = tokenData.results
      .map(token => transformRWAToken(token, assetMetadata))
      .filter((protocol): protocol is ProtocolData => protocol !== null)
      .sort((a, b) => b.totalValue - a.totalValue);

    const totalValue = protocols.reduce(
      (sum, protocol) => sum + protocol.totalValue,
      0
    );

    return {
      success: true,
      totalAptosValue: totalValue,
      totalAptosValueFormatted: `$${(totalValue / 1000000).toFixed(1)}M`,
      assetCount: protocols.length,
      protocols,
      timestamp: new Date().toISOString(),
      dataSource: 'RWA.xyz API (Aptos-only)',
    };
  } catch (error) {
    recordApiFailure();
    console.error('Error fetching RWA.xyz data:', error);
    throw new Error(
      `Failed to fetch RWA data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Enhanced cache utility with stale-while-revalidate
async function getOrFetchWithSWR<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_CONFIG.ttl
): Promise<{ data: T; cached: boolean; stale?: boolean }> {
  const cachedData = getCachedData<T>(cmcCache, cacheKey);

  if (cachedData !== null) {
    // Check if data is stale but within max age
    const cacheTimestamp = getCachedData<number>(
      cmcCache,
      `${cacheKey}:timestamp`
    );
    const isStale = cacheTimestamp && Date.now() - cacheTimestamp > ttl;

    if (isStale && Date.now() - cacheTimestamp < CACHE_CONFIG.maxAge) {
      // Return stale data immediately and revalidate in background
      fetchFn()
        .then(freshData => {
          setCachedData(cmcCache, cacheKey, freshData);
          setCachedData(cmcCache, `${cacheKey}:timestamp`, Date.now());
        })
        .catch(error =>
          console.error('Background revalidation failed:', error)
        );

      return { data: cachedData, cached: true, stale: true };
    }

    return { data: cachedData, cached: true };
  }

  // No cached data, fetch fresh
  const freshData = await fetchFn();
  setCachedData(cmcCache, cacheKey, freshData);
  setCachedData(cmcCache, `${cacheKey}:timestamp`, Date.now());

  return { data: freshData, cached: false };
}

export const rwaRouter = router({
  /**
   * Get real-time RWA assets for Aptos from RWA.xyz API
   */
  getRealTimeAssets: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'rwa:aptos:realtime-assets';

    try {
      const result = await getOrFetchWithSWR(
        cacheKey,
        fetchRealTimeRWAData,
        CACHE_CONFIG.ttl
      );

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: result.cached ? 1 : 0,
          cacheMisses: result.cached ? 0 : 1,
          apiCalls: result.cached ? 0 : 1,
        },
        cache: {
          cached: result.cached,
          stale: result.stale,
        },
        data: result.data,
      };
    } catch (error) {
      console.error('Error in getRealTimeAssets:', error);

      // Try to return stale data even if it's very old
      const staleData = getCachedData<RWAApiResponse>(cmcCache, cacheKey);
      if (staleData) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
            stale: true,
            fallback: true,
          },
          data: staleData,
        };
      }

      // Last resort fallback
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
          error: true,
        },
        data: {
          success: false,
          totalAptosValue: 0,
          totalAptosValueFormatted: '$0M',
          assetCount: 0,
          protocols: [],
          timestamp: new Date().toISOString(),
          dataSource: 'Fallback (API Error)',
        } as RWAApiResponse,
      };
    }
  }),

  /**
   * Get all RWA assets for Aptos from our API endpoint (legacy - kept for backward compatibility)
   */
  getAllAssets: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'rwa:aptos:all-assets';

    try {
      // Try to get from cache first
      const cachedData = getCachedData<unknown>(cmcCache, cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
          },
          data: cachedData,
        };
      }

      // Fetch from our RWA API endpoint
      const baseUrl = API_CONFIG.rwa.baseUrl.includes('localhost')
        ? 'http://localhost:3000'
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const response = await enhancedFetch(`${baseUrl}/api/rwa`, {
        timeout: config.timeout,
        retries: config.retries,
      });

      const rwaData = await response.json();

      // Cache the result for 10 minutes (RWA data changes less frequently)
      setCachedData(cmcCache, cacheKey, rwaData);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: rwaData,
      };
    } catch (error) {
      console.error('Error fetching RWA data:', error);

      // Return fallback data
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: {
          success: false,
          totalAptosValue: 0,
          totalAptosValueFormatted: '$0M',
          assetCount: 0,
          assets: [],
          timestamp: new Date().toISOString(),
          dataSource: 'Fallback',
          dataSources: {
            csv: 0,
            defiLlama: 0,
          },
        },
      };
    }
  }),

  /**
   * Get RWA metrics summary (using real-time data)
   */
  getMetrics: publicProcedure.query(async () => {
    const startTime = Date.now();
    const cacheKey = 'rwa:aptos:realtime-metrics';

    try {
      // Try to get from cache first
      const cachedData = getCachedData<unknown>(cmcCache, cacheKey);
      if (cachedData !== null) {
        return {
          timestamp: new Date().toISOString(),
          performance: {
            responseTimeMs: Date.now() - startTime,
            cacheHits: 1,
            cacheMisses: 0,
            apiCalls: 0,
          },
          cache: {
            cached: true,
          },
          data: cachedData,
        };
      }

      // Fetch fresh data from RWA.xyz API
      const rwaData = await fetchRealTimeRWAData();

      // Transform to metrics format
      const metrics = {
        rwaValue: rwaData.totalAptosValue,
        rwaValueChange: 0, // Not available from API, could be calculated with historical data
        rwaHolders: 0, // Not available from API, will be hardcoded
        rwaHoldersChange: 0, // Not available from API, will be hardcoded
        rwaAssetCount: rwaData.assetCount,
        timestamp: rwaData.timestamp,
        dataSource: rwaData.dataSource,
      };

      // Cache the result for 5 minutes
      setCachedData(cmcCache, cacheKey, metrics);

      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: metrics,
      };
    } catch (error) {
      console.error('Error fetching RWA metrics:', error);

      // Return fallback data
      return {
        timestamp: new Date().toISOString(),
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHits: 0,
          cacheMisses: 1,
          apiCalls: 1,
        },
        cache: {
          cached: false,
        },
        data: {
          rwaValue: 0,
          rwaValueChange: 0,
          rwaHolders: 0,
          rwaHoldersChange: 0,
          rwaAssetCount: 0,
          timestamp: new Date().toISOString(),
          dataSource: 'Fallback',
        },
      };
    }
  }),
});

export type RWARouter = typeof rwaRouter;
