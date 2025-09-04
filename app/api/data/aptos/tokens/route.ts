import { LRUCache } from "lru-cache";
import { NextRequest } from "next/server";

import {
  extractParams,
  errorResponse,
  successResponse,
  validateRequiredParams,
  CACHE_DURATIONS,
  parseNumericParam,
  getAptosAuthHeaders,
} from "@/lib/utils/api/common";
import { fetchFromPanora } from "@/lib/utils/api/panora-client";
import { withRateLimit, RATE_LIMIT_TIERS } from "@/lib/utils/api/rate-limiter";
import { apiLogger } from "@/lib/utils/core/logger";

// Constants
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 5000; // Increased to handle all 3000+ tokens
const CACHE_NAMESPACE = "tokens-api";
const PANORA_API_URL = "https://api.panora.exchange";
const GRAPHQL_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

// Token interfaces
interface TokenInfo {
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  price?: string;
  usdPrice?: string;
  priceChange24H?: number;
  logoUrl?: string;
  panoraSymbol?: string;
  panoraTags?: string[];
  panoraUI?: boolean;
  websiteUrl?: string;
  bridge?: string | null;
  coinGeckoId?: string;
  coinMarketCapId?: number;
}

interface TokenMarketData extends TokenInfo {
  supply?: number;
  marketCap?: number;
  fullyDilutedValuation?: number;
  priceChangePercentage24h?: number;
  priceChange24H?: number;
  category?: string;
  rank?: number;
  isVerified?: boolean;
}

interface TokensResponse {
  tokens: TokenMarketData[];
  totalMarketCap: number;
  aptPrice: number;
  totalTokens: number;
  categories: {
    native: number;
    emojicoin: number;
    meme: number;
    bridged: number;
    other: number;
  };
  distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  lastUpdated: string;
}

// Initialize cache with larger capacity for 3000+ tokens
const tokenCache = new LRUCache<string, any>({
  max: 500, // Increased cache size
  ttl: 1000 * 60 * 10, // 10 minutes cache for stability
});

// Use unified Panora client instead of local implementation

/**
 * Fetch token prices from Panora
 */
async function fetchPanoraPrices(): Promise<Map<string, string>> {
  const cacheKey = `${CACHE_NAMESPACE}:prices`;
  const cached = tokenCache.get(cacheKey);
  if (cached) return cached;

  try {
    const pricesResponse = await fetchFromPanora("/prices");
    const prices =
      pricesResponse?.data && Array.isArray(pricesResponse.data)
        ? pricesResponse.data
        : [];
    const priceMap = new Map<string, string>();

    prices.forEach((token: any) => {
      if (token.usdPrice) {
        if (token.tokenAddress) {
          priceMap.set(token.tokenAddress.toLowerCase(), token.usdPrice);
        }
        if (token.faAddress) {
          priceMap.set(token.faAddress.toLowerCase(), token.usdPrice);
        }
      }
    });

    tokenCache.set(cacheKey, priceMap);
    return priceMap;
  } catch (error) {
    apiLogger.error("Failed to fetch Panora prices", { error });
    return new Map();
  }
}

/**
 * Process tokens from Panora - no mock data, only real tokens from Panora's list
 */
function processTokensFromPanora(tokens: TokenInfo[]): TokenInfo[] {
  // Only use real tokens from Panora - no mock/fallback data
  // APT should be included naturally from Panora's token list
  const APT_ADDRESS = "0x1::aptos_coin::AptosCoin";

  // Ensure APT has the correct address format if it exists
  const aptToken = tokens.find(
    (t) =>
      t.symbol === "APT" ||
      t.tokenAddress?.toLowerCase() === APT_ADDRESS.toLowerCase(),
  );

  if (aptToken && !aptToken.tokenAddress) {
    // If APT is found but missing the standard address, add it
    aptToken.tokenAddress = APT_ADDRESS;
  }

  return tokens;
}

/**
 * Fetch comprehensive token supply data from GraphQL for all tokens
 */
async function fetchTokenMetadata(
  addresses: string[],
): Promise<Map<string, any>> {
  const metadataMap = new Map();
  const batchSize = 30; // Reduced batch size to avoid overwhelming the API
  const maxBatches = 20; // Limit to 600 tokens for metadata to keep it reasonable

  apiLogger.info(
    `Fetching supply data for up to ${Math.min(addresses.length, batchSize * maxBatches)} of ${addresses.length} tokens`,
  );

  const addressesToFetch = addresses.slice(0, batchSize * maxBatches);

  for (let i = 0; i < addressesToFetch.length; i += batchSize) {
    const batch = addressesToFetch.slice(i, i + batchSize);

    // Add a small delay between batches to avoid rate limiting
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      const queries = batch
        .map((address, index) => {
          if (address.includes("::")) {
            // Coin standard tokens (like APT)
            return `
            coin_${index}: coin_supply(
              where: {coin_type: {_eq: "${address}"}}
              limit: 1
            ) {
              coin_type
              supply
              coin_info {
                decimals
                name
                symbol
              }
            }
          `;
          } else {
            // Fungible Asset tokens - use supply_v2 from metadata
            return `
            fa_metadata_${index}: fungible_asset_metadata(
              where: {
                asset_type: {_eq: "${address}"}
              }
              limit: 1
            ) {
              asset_type
              decimals
              name
              symbol
              supply_v2
            }
          `;
          }
        })
        .join("\n");

      const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: getAptosAuthHeaders(),
        body: JSON.stringify({
          query: `query GetTokenSupplies { ${queries} }`,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        Object.entries(data.data || {}).forEach(
          ([key, value]: [string, any]) => {
            const parts = key.split("_");
            const index = parseInt(parts[parts.length - 1]); // Get last part as index
            const address = batch[index];

            if (key.startsWith("coin_") && Array.isArray(value) && value[0]) {
              metadataMap.set(address, {
                supply: value[0].supply,
                decimals: value[0].coin_info?.decimals || 0,
                name: value[0].coin_info?.name,
                symbol: value[0].coin_info?.symbol,
              });
            } else if (
              key.startsWith("fa_metadata_") &&
              Array.isArray(value) &&
              value[0]
            ) {
              // For Fungible Assets, get supply_v2 directly from metadata
              metadataMap.set(address, {
                supply: value[0].supply_v2 || "0",
                decimals: value[0].decimals || 0,
                name: value[0].name,
                symbol: value[0].symbol,
              });
            }
          },
        );
      } else {
        apiLogger.warn(
          `GraphQL request failed with status: ${response.status}`,
        );
      }
    } catch (error) {
      apiLogger.error("Failed to fetch token metadata batch", {
        error,
        batchSize: batch.length,
      });
    }
  }

  apiLogger.info(
    `Successfully fetched metadata for ${metadataMap.size} tokens`,
  );
  return metadataMap;
}

/**
 * Sort tokens by market cap and apply pagination
 */
function sortAndPaginateTokens(
  tokens: TokenInfo[],
  limit: number,
  offset: number,
): TokenInfo[] {
  // Don't sort here - we'll sort after calculating market caps
  return tokens.slice(offset, offset + limit);
}

/**
 * Create token market data
 */
function createTokenMarketData(
  token: TokenInfo,
  price: number | undefined,
  supply: number | undefined,
  rank?: number,
): TokenMarketData {
  const marketCap = price && supply ? price * supply : undefined;

  // Determine if token is verified based on panoraTags
  // Only consider "Verified" tag as truly verified
  const isVerified =
    token.panoraTags?.some((tag) => tag === "Verified") || false;

  return {
    ...token,
    price: price?.toString(),
    supply,
    marketCap,
    fullyDilutedValuation: marketCap,
    priceChange24H: token.priceChange24H,
    rank,
    category: categorizeToken(token),
    isVerified,
  };
}

/**
 * Categorize token based on tags
 */
function categorizeToken(token: TokenInfo): string {
  if (!token.panoraTags) return "other";

  if (token.panoraTags.includes("Emojicoin")) return "emojicoin";
  if (token.panoraTags.includes("Meme")) return "meme";
  if (token.panoraTags.includes("Bridged")) return "bridged";
  if (token.panoraTags.includes("Native")) return "native";

  return "other";
}

/**
 * Process tokens with real data from Panora prices and on-chain supplies
 */
async function processTokensBatch(
  tokens: TokenInfo[],
  metadataMap: Map<string, any>,
): Promise<TokenMarketData[]> {
  return tokens.map((token, index) => {
    // Use real USD price from Panora
    const price = token.usdPrice ? parseFloat(token.usdPrice) : 0;

    // Get real supply data from on-chain
    const metadata = metadataMap.get(
      token.faAddress || token.tokenAddress || "",
    );
    const rawSupply = metadata?.supply;
    const decimals =
      metadata?.decimals !== undefined ? metadata.decimals : token.decimals;

    // Convert raw supply to human-readable format
    let supply: number | undefined = undefined;
    if (rawSupply) {
      try {
        const supplyBN = BigInt(rawSupply);
        const divisor = BigInt(10 ** decimals);
        supply = Number(supplyBN) / Number(divisor);
      } catch (error) {
        apiLogger.warn(
          `Failed to parse supply for ${token.symbol}: ${rawSupply}`,
          { error },
        );
        // Fallback to simpler parsing
        supply = parseInt(rawSupply) / Math.pow(10, decimals);
      }
    }

    return createTokenMarketData(token, price, supply, index + 1);
  });
}

/**
 * Calculate market cap distribution
 */
function calculateDistribution(tokens: TokenMarketData[]): any[] {
  const ranges = [
    { min: 1000000000, label: "> $1B" },
    { min: 100000000, max: 1000000000, label: "$100M - $1B" },
    { min: 10000000, max: 100000000, label: "$10M - $100M" },
    { min: 1000000, max: 10000000, label: "$1M - $10M" },
    { min: 100000, max: 1000000, label: "$100K - $1M" },
    { min: 0, max: 100000, label: "< $100K" },
  ];

  const distribution = ranges.map((range) => {
    const count = tokens.filter((t) => {
      if (!t.marketCap) return false;
      if (range.max) {
        return t.marketCap >= range.min && t.marketCap < range.max;
      }
      return t.marketCap >= range.min;
    }).length;

    return {
      range: range.label,
      count,
      percentage: tokens.length > 0 ? (count / tokens.length) * 100 : 0,
    };
  });

  return distribution;
}

/**
 * Calculate market caps for all tokens
 */
async function calculateMarketCaps(
  limit: number,
  offset: number,
  fetchAll: boolean = false,
): Promise<TokensResponse> {
  try {
    // Fetch UI tokens first (has most verified tokens)
    const uiTokensResponse = await fetchFromPanora("/tokenlist", {
      panoraUI: "true", // Get UI tokens (verified ones)
    });
    const uiTokens = uiTokensResponse?.data || uiTokensResponse || [];

    // Fetch ALL tokens for completeness
    const allTokensResponse = await fetchFromPanora("/tokenlist", {
      panoraUI: "false", // Get ALL tokens including emojicoins
    });
    const allTokens = allTokensResponse?.data || allTokensResponse || [];

    // Create a Set of addresses from UI tokens to avoid duplicates
    const uiAddresses = new Set(
      uiTokens.map((t: any) => t.faAddress || t.tokenAddress).filter(Boolean),
    );

    // Filter out UI tokens from the all tokens list to avoid duplicates
    const additionalTokens = allTokens.filter(
      (token: any) =>
        !uiAddresses.has(token.faAddress) &&
        !uiAddresses.has(token.tokenAddress),
    );

    // Combine: UI tokens first (verified), then additional tokens
    const combinedTokens = [...uiTokens, ...additionalTokens];

    apiLogger.info(
      `Fetched ${combinedTokens.length} tokens from Panora (${uiTokens.length} UI + ${additionalTokens.length} additional)`,
    );

    // Process tokens from Panora - no mock data, only real tokens
    const tokens = processTokensFromPanora(combinedTokens);

    // For sorting by FDV, we need to fetch supplies for all tokens first
    // Then sort and paginate
    if (!fetchAll) {
      // Fetch metadata for a reasonable batch to sort properly
      // For the portfolio page, we want to return all requested tokens
      // But only fetch metadata for the first 600 for performance
      const metadataLimit = 600;
      const tokensForMetadata = tokens.slice(0, metadataLimit);
      const addresses = tokensForMetadata
        .map((t) => t.faAddress || t.tokenAddress)
        .filter(Boolean) as string[];
      const metadataMap = await fetchTokenMetadata(addresses);

      // Process tokens with metadata
      const tokensWithMetadata = await processTokensBatch(
        tokensForMetadata,
        metadataMap,
      );

      // For remaining tokens, just use basic data without supply/FDV
      const remainingTokens = tokens.slice(metadataLimit).map((token, index) =>
        createTokenMarketData(
          token,
          token.usdPrice ? parseFloat(token.usdPrice) : 0,
          undefined, // No supply data for these
          metadataLimit + index + 1,
        ),
      );

      // Combine all tokens
      const allProcessedTokens = [...tokensWithMetadata, ...remainingTokens];

      // Sort by FDV/market cap descending (tokens with FDV will be at top)
      allProcessedTokens.sort((a, b) => {
        // First, sort by verification status (verified tokens first)
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;

        // Then sort by FDV within each group
        const aFdv = a.fullyDilutedValuation || a.marketCap || 0;
        const bFdv = b.fullyDilutedValuation || b.marketCap || 0;
        return bFdv - aFdv;
      });

      // Apply pagination after sorting
      const processedTokens = allProcessedTokens.slice(offset, offset + limit);

      // Re-rank based on position
      processedTokens.forEach((token, index) => {
        token.rank = offset + index + 1;
      });

      return {
        tokens: processedTokens,
        totalMarketCap: allProcessedTokens.reduce(
          (sum, t) => sum + (t.marketCap || 0),
          0,
        ),
        aptPrice: allProcessedTokens.find((t) => t.symbol === "APT")?.price
          ? parseFloat(
              allProcessedTokens.find((t) => t.symbol === "APT")!.price!,
            )
          : 0,
        totalTokens: tokens.length,
        categories: {
          native: allProcessedTokens.filter((t) => t.category === "native")
            .length,
          emojicoin: allProcessedTokens.filter(
            (t) => t.category === "emojicoin",
          ).length,
          meme: allProcessedTokens.filter((t) => t.category === "meme").length,
          bridged: allProcessedTokens.filter((t) => t.category === "bridged")
            .length,
          other: allProcessedTokens.filter((t) => t.category === "other")
            .length,
        },
        distribution: calculateDistribution(allProcessedTokens),
        lastUpdated: new Date().toISOString(),
      };
    }

    // If fetchAll is true, process all tokens
    const selectedTokens = tokens;
    const addresses = selectedTokens
      .map((t) => t.faAddress || t.tokenAddress)
      .filter(Boolean) as string[];
    const metadataMap = await fetchTokenMetadata(addresses);
    const processedTokens = await processTokensBatch(
      selectedTokens,
      metadataMap,
    );

    // Calculate totals and distribution
    const totalMarketCap = processedTokens.reduce(
      (sum, t) => sum + (t.marketCap || 0),
      0,
    );

    const aptToken = processedTokens.find((t) => t.symbol === "APT");
    const aptPrice = aptToken?.price ? parseFloat(aptToken.price) : 0;

    const categories = {
      native: processedTokens.filter((t) => t.category === "native").length,
      emojicoin: processedTokens.filter((t) => t.category === "emojicoin")
        .length,
      meme: processedTokens.filter((t) => t.category === "meme").length,
      bridged: processedTokens.filter((t) => t.category === "bridged").length,
      other: processedTokens.filter((t) => t.category === "other").length,
    };

    const distribution = calculateDistribution(processedTokens);

    return {
      tokens: processedTokens,
      totalMarketCap,
      aptPrice,
      totalTokens: tokens.length,
      categories,
      distribution,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    apiLogger.error("Failed to calculate market caps", { error });
    throw error;
  }
}

/**
 * Parse and validate request parameters
 */
function parseTokensParams(request: NextRequest) {
  const params = extractParams(request);

  return {
    limit: parseNumericParam(
      request.nextUrl.searchParams.get("limit"),
      DEFAULT_LIMIT,
      1,
      MAX_LIMIT,
    ),
    offset: parseNumericParam(
      request.nextUrl.searchParams.get("offset"),
      0,
      0,
      10000,
    ),
    fetchAll: request.nextUrl.searchParams.get("all") === "true",
  };
}

/**
 * Main handler function
 */
async function handleTokensRequest(request: NextRequest) {
  const { limit, offset, fetchAll } = parseTokensParams(request);

  // Check cache
  const cacheKey = `${CACHE_NAMESPACE}:${limit}:${offset}:${fetchAll}`;
  const cached = tokenCache.get(cacheKey);

  if (cached) {
    apiLogger.debug("Returning cached token data");
    return successResponse(cached, CACHE_DURATIONS.MEDIUM);
  }

  try {
    const data = await calculateMarketCaps(limit, offset, fetchAll);

    // Cache the result
    tokenCache.set(cacheKey, data);

    return successResponse(
      {
        success: true,
        data,
      },
      CACHE_DURATIONS.MEDIUM,
      {
        "X-Total-Tokens": data.totalTokens.toString(),
        "X-APT-Price": data.aptPrice.toString(),
      },
    );
  } catch (error) {
    return errorResponse(
      "Failed to fetch token data",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

// Export with rate limiting
export const GET = withRateLimit(handleTokensRequest, {
  name: "tokens-api",
  ...RATE_LIMIT_TIERS.STANDARD,
});
