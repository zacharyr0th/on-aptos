import { NextRequest, NextResponse } from 'next/server';
import { withApiEnhancements } from '@/lib/utils/server';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import { API_CONFIG } from '@/lib/config/app';
import {
  ApiError,
  formatApiError,
  withErrorHandling,
  type ErrorContext,
} from '@/lib/utils';

// RWA.xyz API configuration
const RWA_API_KEY = API_CONFIG.rwa.apiKey;
const RWA_BASE_URL = API_CONFIG.rwa.baseUrl;

// TypeScript interfaces for RWA.xyz API
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

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

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

// Transform RWA.xyz token to our protocol format
function transformRWAToken(
  token: RWAXyzToken,
  assetMetadata: Map<number, RWAXyzAsset>
): ProtocolData | null {
  if (
    !token.total_asset_value_dollar?.val ||
    token.total_asset_value_dollar.val === 0
  ) {
    return null;
  }

  // Get asset metadata
  const asset = assetMetadata.get(token.asset_id);
  if (!asset) {
    return null;
  }

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

  if (isStablecoin) {
    return null;
  }

  const protocol = asset.protocol || 'unknown';
  const assetClass = formatAssetClass(asset.asset_class);
  const description = asset.description || `${asset.name} issued on Aptos`;

  return {
    id: token.asset_id.toString(),
    name: asset.name,
    logoUrl: getProtocolLogoUrl(protocol),
    totalValue: token.total_asset_value_dollar.val,
    description,
    tokenAddress: token.address,
    assetTicker: token.asset.ticker || 'N/A',
    assetClass,
    protocol,
  };
}

// Cache for API responses (simple in-memory cache)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedData(key: string): unknown | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(
  key: string,
  data: unknown,
  ttl: number = CACHE_TTL
): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

// Fetch real-time RWA data from RWA.xyz API
async function fetchRealTimeRWAData() {
  // Circuit breaker check
  if (isCircuitBreakerOpen()) {
    throw new Error('Circuit breaker is open - too many recent API failures');
  }

  try {
    // Use Promise.all for parallel requests
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
          signal: AbortSignal.timeout(15000),
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
          signal: AbortSignal.timeout(15000),
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

    // Create asset metadata map
    const assetMetadata = new Map<number, RWAXyzAsset>();
    assetData.results.forEach(asset => {
      assetMetadata.set(asset.id, asset);
    });

    // Transform tokens to protocols
    const protocols: ProtocolData[] = [];
    for (const token of tokenData.results) {
      const protocol = transformRWAToken(token, assetMetadata);
      if (protocol) {
        protocols.push(protocol);
      }
    }

    // Sort by total value (descending)
    protocols.sort((a, b) => b.totalValue - a.totalValue);

    const totalAptosValue = protocols.reduce(
      (sum, protocol) => sum + protocol.totalValue,
      0
    );

    return {
      success: true,
      totalAptosValue,
      totalAptosValueFormatted: `$${(totalAptosValue / 1000000).toFixed(1)}M`,
      assetCount: protocols.length,
      protocols,
      timestamp: new Date().toISOString(),
      dataSource: 'RWA.xyz API',
    };
  } catch (error) {
    recordApiFailure();
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const errorContext: ErrorContext = {
    operation: 'RWA Data API',
    service: 'RWA-API',
    details: {
      endpoint: '/api/rwa',
      userAgent: request.headers.get('user-agent') || 'unknown',
    },
  };

  return withApiEnhancements(
    () =>
      withErrorHandling(async () => {
        const cacheKey = 'rwa_data';

        // Check cache first
        const cached = getCachedData(cacheKey);
        if (cached) {
          return {
            ...cached,
            cacheInfo: {
              cached: true,
              ttl: CACHE_TTL,
            },
          };
        }

        try {
          const data = await fetchRealTimeRWAData();

          // Cache the result
          setCachedData(cacheKey, data, CACHE_TTL);

          return {
            ...data,
            cacheInfo: {
              cached: false,
              ttl: CACHE_TTL,
            },
          };
        } catch (error) {
          // Return fallback data on error
          return {
            success: false,
            totalAptosValue: 0,
            totalAptosValueFormatted: '$0.0M',
            assetCount: 0,
            protocols: [],
            timestamp: new Date().toISOString(),
            dataSource: 'Error - RWA.xyz API unavailable',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }, errorContext),
    {
      customHeaders: {
        'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL / 1000)}, stale-while-revalidate=${Math.floor(CACHE_TTL / 2000)}`,
        'X-Content-Type': 'application/json',
        'X-Service': 'rwa-data',
        'X-API-Version': '3.0',
        'X-Data-Source': 'RWA.xyz',
        Vary: 'Accept-Encoding',
      },
    }
  );
}

// Add OPTIONS handler for CORS if needed
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
