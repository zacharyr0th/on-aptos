import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { withApiEnhancements } from '@/lib/utils/server';
import { SERVICE_CONFIG } from '@/lib/config/cache';
import {
  ApiError,
  formatApiError,
  withErrorHandling,
  type ErrorContext,
} from '@/lib/utils';
import {
  parseCSVData,
  transformCSVToRWAAsset,
  filterByProtocols,
} from '../../../lib/csv-parser';

// TypeScript interfaces for proper typing
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

interface DefiLlamaProtocol {
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  url?: string;
  chains?: string[];
}

interface DefiLlamaProtocolData {
  tvl?: number;
  chainTvls?: {
    [chainName: string]: {
      tvl?: Array<{
        totalLiquidityUSD?: number;
      }>;
    };
  };
}

// Official RWA protocols as listed on RWA.xyz for Aptos network
// Based on https://app.rwa.xyz/networks/aptos official data
const APTOS_RWA_PROTOCOLS = {
  // Core RWA protocols (as per RWA.xyz official data: $343.99M total)
  'blackrock-buidl': {
    name: 'BlackRock BUIDL',
    symbol: 'BUIDL',
    category: 'treasury',
    platform: 'Securitize',
  },
  'franklin-templeton': {
    name: 'Franklin Templeton BENJI',
    symbol: 'BENJI',
    category: 'treasury',
    platform: 'Franklin Templeton',
  },
  'ondo-finance': {
    name: 'Ondo USDY',
    symbol: 'USDY',
    category: 'treasury',
    platform: 'Ondo',
  },
  'libre-capital': {
    name: 'Libre Capital',
    symbol: 'LCAP',
    category: 'credit',
    platform: 'Libre Capital',
  },
};

// Official RWA protocol slugs that should be included (from RWA.xyz)
const OFFICIAL_RWA_SLUGS = new Set([
  'blackrock-buidl',
  'franklin-templeton',
  'ondo-finance',
  'libre-capital',
  // Note: PACT and Securitize assets need to be identified by other means
  // since they may have different protocol slugs in DefiLlama
]);

// Data validation schema
interface ValidatedRWAAsset {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  website: string;
  category: string;
  aptosTvl: number;
  totalTvl: number;
  chains: string[];
  confidence: number;
  dataSource: string;
}

// Cache for API responses (simple in-memory cache)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

// Load and parse CSV data for Pact and Securitize protocols
function loadCSVData(): ValidatedRWAAsset[] {
  try {
    const csvPath = join(
      process.cwd(),
      'components/pages/rwas/data/06052025.csv'
    );
    const csvContent = readFileSync(csvPath, 'utf-8');
    const csvAssets = parseCSVData(csvContent);

    // Transform CSV data to our format
    const transformedAssets = csvAssets.map(transformCSVToRWAAsset);

    // Filter for Pact and Securitize protocols only
    const pactAndSecuritizeAssets = filterByProtocols(transformedAssets, [
      'pact',
      'securitize',
    ]);

    // Convert to ValidatedRWAAsset format
    const validatedAssets: ValidatedRWAAsset[] = pactAndSecuritizeAssets.map(
      asset => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        description: asset.description,
        logoUrl: asset.logoUrl,
        website: asset.website,
        category: asset.category,
        aptosTvl: asset.aptosTvl,
        totalTvl: asset.totalTvl,
        chains: asset.chains,
        confidence: asset.confidence,
        dataSource: asset.dataSource,
      })
    );

    return validatedAssets;
  } catch (error) {
    return [];
  }
}

// Retry logic for API calls
async function fetchWithRetry(
  url: string,
  retries: number = 3,
  delay: number = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OnAptos-RWA-Tracker/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        return response;
      }

      if (response.status === 404) {
        throw new Error(`Resource not found: ${url}`);
      }

      if (i === retries - 1) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }

  throw new Error(`Failed to fetch after ${retries} retries`);
}

// Simplified RWA protocol identification based on official RWA.xyz data
function isOfficialRWAProtocol(protocol: DefiLlamaProtocol): {
  isRWA: boolean;
  category: string;
  reason: string;
} {
  // Check if it's in our official list
  if (OFFICIAL_RWA_SLUGS.has(protocol.slug)) {
    const protocolData =
      APTOS_RWA_PROTOCOLS[protocol.slug as keyof typeof APTOS_RWA_PROTOCOLS];
    return {
      isRWA: true,
      category: protocolData?.category || 'rwa',
      reason: `Official RWA protocol from RWA.xyz: ${protocolData?.name || protocol.name}`,
    };
  }

  // Check for additional protocols by name matching (excluding PACT and Securitize - they come from CSV)
  const name = protocol.name?.toLowerCase() || '';
  const slug = protocol.slug?.toLowerCase() || '';

  // Skip stablecoins and bridges
  const stablecoinKeywords = ['usdt', 'usdc', 'tether', 'circle', 'stablecoin'];
  const bridgeKeywords = ['bridge', 'layerzero', 'wormhole'];

  if (
    stablecoinKeywords.some(
      keyword => name.includes(keyword) || slug.includes(keyword)
    )
  ) {
    return {
      isRWA: false,
      category: 'excluded',
      reason: 'Stablecoin protocol - excluded from RWA data',
    };
  }

  if (
    bridgeKeywords.some(
      keyword => name.includes(keyword) || slug.includes(keyword)
    )
  ) {
    return {
      isRWA: false,
      category: 'excluded',
      reason: 'Bridge protocol - excluded from RWA data',
    };
  }

  // Skip PACT and Securitize - they will be loaded from CSV
  if (name.includes('pact') || slug.includes('pact')) {
    return {
      isRWA: false,
      category: 'excluded',
      reason: 'PACT protocol - using CSV data instead',
    };
  }

  if (name.includes('securitize') || slug.includes('securitize')) {
    return {
      isRWA: false,
      category: 'excluded',
      reason: 'Securitize protocol - using CSV data instead',
    };
  }

  return {
    isRWA: false,
    category: 'non-rwa',
    reason: 'Not listed on RWA.xyz for Aptos network',
  };
}

// Data validation and transformation
function validateAndTransformAsset(
  protocol: DefiLlamaProtocol,
  protocolData: DefiLlamaProtocolData,
  aptosValue: number
): ValidatedRWAAsset | null {
  try {
    // Basic validation
    if (!protocol.name || !protocol.slug || aptosValue <= 0) {
      return null;
    }

    const rwaCheck = isOfficialRWAProtocol(protocol);

    // Only include official RWA protocols
    if (!rwaCheck.isRWA) {
      return null;
    }

    // Enhanced symbol generation
    const generateSymbol = (name: string, slug: string): string => {
      const knownProtocol = Object.values(APTOS_RWA_PROTOCOLS).find(p =>
        name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (knownProtocol) {
        return knownProtocol.symbol;
      }

      // Special cases for known protocols
      if (name.toLowerCase().includes('pact')) return 'PACT';
      if (name.toLowerCase().includes('securitize')) return 'SCRT';

      // Extract meaningful parts from name
      const words = name
        .replace(/[^a-zA-Z\s]/g, '')
        .split(/\s+/)
        .filter(
          word =>
            word.length > 2 &&
            !['the', 'and', 'for', 'fund'].includes(word.toLowerCase())
        );

      if (words.length >= 2) {
        return (
          words
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase() + words[0].slice(1, 3).toUpperCase()
        );
      }

      return (
        words[0]?.substring(0, 4).toUpperCase() ||
        slug.substring(0, 4).toUpperCase()
      );
    };

    return {
      id: protocol.slug,
      name: protocol.name,
      symbol: generateSymbol(protocol.name, protocol.slug),
      description:
        protocol.description || `${protocol.name} deployed on Aptos network`,
      logoUrl: protocol.logo || '',
      website: protocol.url || '',
      category: rwaCheck.category,
      aptosTvl: aptosValue,
      totalTvl: protocolData.tvl || 0,
      chains: protocol.chains || [],
      confidence: 10, // All included protocols are confirmed RWA
      dataSource: 'DefiLlama',
    };
  } catch (error) {
    return null;
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
        // Step 1: Get all protocols from DefiLlama with retry logic
        const protocolsResponse = await fetchWithRetry(
          'https://api.llama.fi/protocols'
        );
        const allProtocols: DefiLlamaProtocol[] =
          await protocolsResponse.json();

        // Step 2: Enhanced filtering for RWA protocols with Aptos support
        const candidateProtocols = allProtocols.filter(
          (protocol: DefiLlamaProtocol) => {
            // Must have Aptos chain
            const hasAptos =
              protocol.chains && protocol.chains.includes('Aptos');
            if (!hasAptos) return false;

            // Check if it's an official RWA protocol
            const rwaCheck = isOfficialRWAProtocol(protocol);

            // Include only official RWA protocols
            if (rwaCheck.isRWA) {
              return true;
            }

            return false;
          }
        );

        // Step 3: Load CSV data for Pact and Securitize protocols
        const csvAssets = loadCSVData();

        // Step 4: Fetch detailed data for each candidate (excluding Pact and Securitize)
        const validatedAssets: ValidatedRWAAsset[] = [...csvAssets];
        const failedFetches: string[] = [];

        for (const protocol of candidateProtocols) {
          try {
            const protocolResponse = await fetchWithRetry(
              `https://api.llama.fi/protocol/${protocol.slug}`,
              2, // Fewer retries for individual protocols
              500
            );

            const protocolData: DefiLlamaProtocolData =
              await protocolResponse.json();

            // Extract Aptos-specific TVL with better error handling
            let aptosValue = 0;

            if (protocolData.chainTvls?.Aptos?.tvl) {
              const aptosTvlData = protocolData.chainTvls.Aptos.tvl;
              if (Array.isArray(aptosTvlData) && aptosTvlData.length > 0) {
                // Get the most recent value
                const latestTvl = aptosTvlData[aptosTvlData.length - 1];
                aptosValue = latestTvl.totalLiquidityUSD || 0;
              }
            }

            // Validate and transform the asset
            const validatedAsset = validateAndTransformAsset(
              protocol,
              protocolData,
              aptosValue
            );

            if (validatedAsset) {
              validatedAssets.push(validatedAsset);
            }
          } catch (error) {
            failedFetches.push(protocol.name);
          }
        }

        // Sort by Aptos TVL and confidence
        validatedAssets.sort((a, b) => {
          // Primary sort: TVL (descending)
          const tvlDiff = b.aptosTvl - a.aptosTvl;
          if (Math.abs(tvlDiff) > 1000) return tvlDiff;

          // Secondary sort: Confidence (descending)
          return b.confidence - a.confidence;
        });

        const totalAptosValue = validatedAssets.reduce(
          (sum, asset) => sum + asset.aptosTvl,
          0
        );

        return {
          success: true,
          dataSource: 'Enhanced DefiLlama API + CSV Export',
          dataSources: {
            csv: csvAssets.length,
            defiLlama: validatedAssets.length - csvAssets.length,
          },
          totalAptosValue,
          totalAptosValueFormatted: `$${(totalAptosValue / 1000000).toFixed(1)}M`,
          assetCount: validatedAssets.length,
          assets: validatedAssets,
          failedFetches,
          timestamp: new Date().toISOString(),
          cacheInfo: {
            cached: false,
            ttl: SERVICE_CONFIG.rwa.ttl,
          },
          note: 'Enhanced data with Pact and Securitize protocols from CSV export',
        };
      }, errorContext),
    {
      cacheKey: 'aptos-rwa-data',
      cacheName: 'apiService',
      customHeaders: {
        'Cache-Control': `public, max-age=${Math.floor(SERVICE_CONFIG.rwa.ttl / 1000)}, stale-while-revalidate=${Math.floor(SERVICE_CONFIG.rwa.ttl / 2000)}`,
        'X-Content-Type': 'application/json',
        'X-Service': 'rwa-data',
        'X-API-Version': '2.0',
        'X-Data-Source': 'DefiLlama+CSV',
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
