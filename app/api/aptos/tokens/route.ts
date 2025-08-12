import { NextRequest, NextResponse } from "next/server";

import { STABLECOINS } from "@/lib/constants/tokens/stablecoins";
import { TETHER_RESERVES } from "@/lib/constants/tokens/addresses";
import { apiLogger } from "@/lib/utils/core/logger";
import { createErrorResponse } from "@/lib/utils/api/response-builder";

// Environment variables for API keys
const PANORA_API_KEY = process.env.PANORA_API_KEY;
const APTOS_BUILD_SECRET = process.env.APTOS_BUILD_SECRET;

if (!PANORA_API_KEY) {
  throw new Error(
    "PANORA_API_KEY environment variable is required. Please check your .env file.",
  );
}
if (!APTOS_BUILD_SECRET) {
  throw new Error(
    "APTOS_BUILD_SECRET environment variable is required. Please check your .env file.",
  );
}
const APTOS_GRAPHQL_URL = "https://api.mainnet.aptoslabs.com/v1/graphql";

interface PanoraToken {
  chainId: number;
  panoraId: string;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  usdPrice: string;
  nativePrice?: string;
  logoUrl?: string;
  panoraTags?: string[];
}

interface TokenMetadata {
  asset_type: string;
  supply_v2?: string;
  maximum_v2?: string;
  decimals?: number;
}

interface TokenMarketData {
  symbol: string;
  name: string;
  price: number;
  supply: number;
  marketCap: number;
  decimals: number;
  faAddress?: string;
  tokenAddress?: string;
  logoUrl?: string;
  priceChange24h?: number;
  volume24h?: number;
  holders?: number;
  panoraTags?: string[];
  isVerified?: boolean;
}

// Cache for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let cache: { data: any; timestamp: number } | null = null;

// Clear cache to force fresh data with verified tokens only
cache = null;

async function fetchPanoraPrices(): Promise<PanoraToken[]> {
  try {
    // Fetch both verified tokens (panoraUI=true) and all tokens (panoraUI=false)
    const [verifiedResponse, allResponse] = await Promise.all([
      fetch("https://api.panora.exchange/tokenlist", {
        headers: {
          "x-api-key": PANORA_API_KEY!,
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
      }),
      fetch("https://api.panora.exchange/tokenlist?panoraUI=false", {
        headers: {
          "x-api-key": PANORA_API_KEY!,
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
      }),
    ]);

    // Parse responses
    const [verifiedResult, allResult] = await Promise.all([
      verifiedResponse.json(),
      allResponse.json(),
    ]);

    // Check if the API returned data properly
    if (!verifiedResult || !allResult) {
      throw new Error(`Panora API returned invalid data`);
    }

    // Handle both wrapped and unwrapped responses
    const verifiedTokens = verifiedResult.data || verifiedResult;
    const allTokens = allResult.data || allResult;

    apiLogger.info(
      `Fetched ${Array.isArray(verifiedTokens) ? verifiedTokens.length : 0} verified tokens and ${Array.isArray(allTokens) ? allTokens.length : 0} total tokens from Panora`,
    );

    // Create a Map to deduplicate tokens by address
    const tokenMap = new Map();

    // Add verified tokens first (they have priority)
    if (Array.isArray(verifiedTokens)) {
      verifiedTokens.forEach((token) => {
        const key = token.faAddress || token.tokenAddress || token.panoraId;
        if (key) {
          tokenMap.set(key, { ...token, isVerified: true });
        }
      });
    }

    // Add all tokens, but don't override verified ones
    if (Array.isArray(allTokens)) {
      allTokens.forEach((token) => {
        const key = token.faAddress || token.tokenAddress || token.panoraId;
        if (key && !tokenMap.has(key)) {
          tokenMap.set(key, {
            ...token,
            isVerified: token.panoraTags?.includes("Verified") || false,
          });
        }
      });
    }

    const allAvailableTokens = Array.from(tokenMap.values());

    // Keep tokens with prices for market cap calculation
    let tokensWithPrices = allAvailableTokens.filter(
      (token: any) => token.usdPrice && parseFloat(token.usdPrice) > 0,
    );

    // Also include tokens without prices but set price to 0 for display
    const tokensWithoutPrices = allAvailableTokens
      .filter(
        (token: any) => !token.usdPrice || parseFloat(token.usdPrice) <= 0,
      )
      .map((token: any) => ({
        ...token,
        usdPrice: "0",
      }));

    // Combine both arrays
    tokensWithPrices = [...tokensWithPrices, ...tokensWithoutPrices];

    // Ensure APT is included even if it's not in the Verified tag response
    // Fetch APT separately if not found in verified tokens
    const hasAPT = tokensWithPrices.some(
      (token) =>
        token.symbol === "APT" ||
        token.tokenAddress === "0x1::aptos_coin::AptosCoin",
    );

    if (!hasAPT) {
      try {
        // Fetch APT specifically
        const aptResponse = await fetch(
          "https://api.panora.exchange/tokenlist?tokenAddress=0x1::aptos_coin::AptosCoin",
          {
            headers: {
              "x-api-key": PANORA_API_KEY!,
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
            },
          },
        );

        if (aptResponse.ok) {
          const aptResult = await aptResponse.json();
          const aptTokens = aptResult.data || aptResult;
          const aptToken = (Array.isArray(aptTokens) ? aptTokens : []).find(
            (token: any) => token.symbol === "APT",
          );

          if (
            aptToken &&
            aptToken.usdPrice &&
            parseFloat(aptToken.usdPrice) > 0
          ) {
            tokensWithPrices.push(aptToken);
            apiLogger.info(
              "Added APT token separately since it was not in verified tokens",
            );
          }
        }
      } catch (aptError) {
        apiLogger.warn("Failed to fetch APT token separately", {
          error: aptError,
        });
      }
    }

    return tokensWithPrices;
  } catch (error) {
    apiLogger.error("Failed to fetch Panora prices", { error });
    throw error;
  }
}

async function fetchTokenMetadata(addresses: string[]): Promise<{
  metadataMap: Map<string, TokenMetadata>;
  usdtReserveBalance: string;
}> {
  try {
    // Check if USDT is in the batch to also fetch reserve balance
    const hasUsdt = addresses.includes(STABLECOINS.USDT);

    const query = `
      query GetTokensMetadata($addresses: [String!]!) {
        fungible_asset_metadata(
          where: {asset_type: {_in: $addresses}}
        ) {
          asset_type
          supply_v2
          maximum_v2
          decimals
        }
        ${
          hasUsdt
            ? `
        # Get USDT Tether reserve balance if USDT is in this batch
        current_fungible_asset_balances(where: {
          owner_address: {_eq: "${TETHER_RESERVES.SECONDARY}"},
          asset_type: {_eq: "${STABLECOINS.USDT}"}
        }) {
          amount
        }
        `
            : ""
        }
      }
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(APTOS_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${APTOS_BUILD_SECRET}`,
      },
      body: JSON.stringify({
        query,
        variables: { addresses },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.status}`);
    }

    const result = await response.json();
    const metadataMap = new Map<string, TokenMetadata>();

    if (result.data?.fungible_asset_metadata) {
      result.data.fungible_asset_metadata.forEach((item: TokenMetadata) => {
        metadataMap.set(item.asset_type, item);
      });
    }

    // Get USDT reserve balance
    const usdtReserveBalance =
      result.data?.current_fungible_asset_balances?.[0]?.amount || "0";

    return { metadataMap, usdtReserveBalance };
  } catch (error) {
    apiLogger.warn("Failed to fetch token metadata", {
      error: error instanceof Error ? error.message : String(error),
      addressCount: addresses.length,
    });
    return { metadataMap: new Map(), usdtReserveBalance: "0" };
  }
}

async function calculateMarketCaps(
  includeAPT = true,
  maxTokens = 0,
): Promise<{
  tokens: TokenMarketData[];
  totalMarketCap: number;
  totalMarketCapWithAPT: number;
  aptMarketCap: number;
  tokensWithSupply: number;
  totalTokensAnalyzed: number;
}> {
  // Fetch ALL prices from Panora (no limit)
  const panoraPrices = await fetchPanoraPrices();

  // Get all tokens (including those with zero prices) and separate APT
  const allValidTokens = panoraPrices;
  const aptToken = allValidTokens.find(
    (t) =>
      t.symbol === "APT" ||
      t.tokenAddress === "0x1::aptos_coin::AptosCoin" ||
      t.name?.toLowerCase().includes("aptos"),
  );

  // Get all non-APT tokens
  let nonAptTokens = allValidTokens.filter(
    (t) =>
      t.symbol !== "APT" &&
      t.tokenAddress !== "0x1::aptos_coin::AptosCoin" &&
      !t.name?.toLowerCase().includes("aptos coin"),
  );

  // Store remaining tokens for later processing
  let remainingTokens: any[] = [];

  // Apply max tokens limit - use reasonable default for supply lookups
  if (maxTokens > 0) {
    nonAptTokens = nonAptTokens.slice(0, maxTokens);
  } else {
    // Default limit for supply lookups to prevent timeouts (prioritize verified tokens)
    const verifiedTokens = nonAptTokens.filter((t) =>
      t.panoraTags?.includes("Verified"),
    );
    const unverifiedTokens = nonAptTokens.filter(
      (t) => !t.panoraTags?.includes("Verified"),
    );

    // Take first 500 verified + first 1000 unverified for supply analysis
    nonAptTokens = [
      ...verifiedTokens.slice(0, 500),
      ...unverifiedTokens.slice(0, 1000),
    ];

    // Store remaining tokens without supply data for completeness
    remainingTokens = [
      ...verifiedTokens.slice(500),
      ...unverifiedTokens.slice(1000),
    ];
  }

  apiLogger.info(
    `Processing ${nonAptTokens.length} non-APT tokens and APT separately`,
  );

  // Get FA addresses for metadata query (non-APT only)
  const faAddresses = nonAptTokens
    .filter((t) => t.faAddress && t.faAddress !== "null")
    .map((t) => t.faAddress as string);

  // Note: Legacy v1 coins (tokenAddress) are processed separately below

  // Batch fetch metadata
  const marketCapData: TokenMarketData[] = [];
  let totalMarketCap = 0;
  let tokensWithSupply = 0;

  // Process FA tokens in batches
  const batchSize = 25; // Smaller batch size for stability
  const totalBatches = Math.ceil(faAddresses.length / batchSize);

  apiLogger.info(
    `Processing ${faAddresses.length} FA tokens in ${totalBatches} batches`,
  );

  for (let i = 0; i < faAddresses.length; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1;
    const batch = faAddresses.slice(
      i,
      Math.min(i + batchSize, faAddresses.length),
    );

    if (batchNum % 10 === 0) {
      apiLogger.info(`Processing batch ${batchNum}/${totalBatches}`);
    }

    try {
      const { metadataMap, usdtReserveBalance } =
        await fetchTokenMetadata(batch);

      // Calculate market caps for this batch
      for (const token of nonAptTokens.filter((t) =>
        batch.includes(t.faAddress as string),
      )) {
        const metadata = metadataMap.get(token.faAddress as string);

        const price = parseFloat(token.usdPrice) || 0;
        const decimals = token.decimals || metadata?.decimals || 8;

        if (metadata && metadata.supply_v2) {
          let supply = parseFloat(metadata.supply_v2);

          // For USDT, subtract the reserve balance to get circulating supply
          if (
            token.faAddress === STABLECOINS.USDT &&
            usdtReserveBalance !== "0"
          ) {
            const reserveAmount = parseFloat(usdtReserveBalance);
            supply = supply - reserveAmount;
            apiLogger.info(
              `USDT: Total supply ${metadata.supply_v2}, Reserve ${usdtReserveBalance}, Circulating ${supply}`,
            );
          }

          const actualSupply = supply / Math.pow(10, decimals);
          const marketCap = actualSupply * price;

          // Filter out obvious outliers (price > $1M per token or market cap > $1T)
          // But include tokens with zero prices for display
          if (
            (price === 0 ||
              (price < 1000000 &&
                marketCap >= 0 &&
                marketCap < 1000000000000)) &&
            !isNaN(marketCap) &&
            isFinite(marketCap)
          ) {
            if (price > 0) {
              tokensWithSupply++;
              totalMarketCap += marketCap;
            }

            marketCapData.push({
              symbol: token.symbol,
              name: token.name,
              price: price,
              supply: actualSupply,
              marketCap: marketCap,
              decimals: decimals,
              faAddress: token.faAddress || undefined,
              tokenAddress: token.tokenAddress || undefined,
              logoUrl: token.logoUrl || undefined,
              panoraTags: token.panoraTags || [],
              isVerified: token.panoraTags?.includes("Verified") || false,
            });
          }
        } else {
          // Include tokens without supply data but with address info for completeness
          marketCapData.push({
            symbol: token.symbol,
            name: token.name,
            price: price,
            supply: 0,
            marketCap: 0,
            decimals: decimals,
            faAddress: token.faAddress || undefined,
            tokenAddress: token.tokenAddress || undefined,
            logoUrl: token.logoUrl || undefined,
            panoraTags: token.panoraTags || [],
            isVerified: token.panoraTags?.includes("Verified") || false,
          });
        }
      }
    } catch (error) {
      apiLogger.warn(
        `Batch ${batchNum}/${totalBatches} failed, continuing...`,
        { error },
      );
    }

    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < faAddresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced delay
    }
  }

  apiLogger.info(
    `Processed ${tokensWithSupply} tokens with supply data out of ${faAddresses.length} FA tokens`,
  );

  // Process legacy tokens (v1 coins) that only have tokenAddress
  const legacyTokens = nonAptTokens.filter(
    (t) =>
      t.tokenAddress &&
      t.tokenAddress !== "null" &&
      (!t.faAddress || t.faAddress === "null"),
  );

  apiLogger.info(
    `Processing ${legacyTokens.length} legacy tokens with tokenAddress only`,
  );

  for (const token of legacyTokens) {
    const price = parseFloat(token.usdPrice) || 0;
    const decimals = token.decimals || 8;

    marketCapData.push({
      symbol: token.symbol,
      name: token.name,
      price: price,
      supply: 0, // Legacy tokens often don't have accessible supply data
      marketCap: 0,
      decimals: decimals,
      tokenAddress: token.tokenAddress || undefined,
      logoUrl: token.logoUrl || undefined,
    });
  }

  // Process tokens that have neither FA address nor token address (rare case)
  const tokensWithoutAddresses = nonAptTokens.filter(
    (t) =>
      (!t.faAddress || t.faAddress === "null") &&
      (!t.tokenAddress || t.tokenAddress === "null"),
  );

  apiLogger.info(
    `Processing ${tokensWithoutAddresses.length} tokens without addresses`,
  );

  for (const token of tokensWithoutAddresses) {
    const price = parseFloat(token.usdPrice) || 0;
    const decimals = token.decimals || 8;

    marketCapData.push({
      symbol: token.symbol,
      name: token.name,
      price: price,
      supply: 0,
      marketCap: 0,
      decimals: decimals,
      logoUrl: token.logoUrl || undefined,
    });
  }

  // Calculate APT market cap separately
  let aptMarketCap = 0;
  if (includeAPT && aptToken) {
    const aptPrice = parseFloat(aptToken.usdPrice);
    // APT has a known supply of ~1.1B tokens
    const aptSupply = 1_100_000_000;
    aptMarketCap = aptSupply * aptPrice;

    marketCapData.push({
      symbol: "APT",
      name: "Aptos",
      price: aptPrice,
      supply: aptSupply,
      marketCap: aptMarketCap,
      decimals: 8,
      tokenAddress: "0x1::aptos_coin::AptosCoin",
      logoUrl: "/icons/apt.png",
      panoraTags: ["Native", "Verified"],
      isVerified: true,
    });

    apiLogger.info(`APT market cap: $${aptMarketCap.toLocaleString()}`);
  }

  // Add remaining tokens without supply data
  for (const token of remainingTokens) {
    const price = parseFloat(token.usdPrice) || 0;
    const decimals = token.decimals || 8;

    marketCapData.push({
      symbol: token.symbol,
      name: token.name,
      price: price,
      supply: 0,
      marketCap: 0,
      decimals: decimals,
      faAddress: token.faAddress || undefined,
      tokenAddress: token.tokenAddress || undefined,
      logoUrl: token.logoUrl || undefined,
      panoraTags: token.panoraTags || [],
      isVerified: token.panoraTags?.includes("Verified") || false,
    });
  }

  // Sort by verification status first (verified first), then by market cap
  marketCapData.sort((a, b) => {
    // First sort by verification status - verified tokens first
    if (a.isVerified !== b.isVerified) {
      return b.isVerified ? 1 : -1;
    }
    // Then sort by market cap (descending)
    return b.marketCap - a.marketCap;
  });

  return {
    tokens: marketCapData,
    totalMarketCap,
    totalMarketCapWithAPT: totalMarketCap + aptMarketCap,
    aptMarketCap,
    tokensWithSupply,
    totalTokensAnalyzed: nonAptTokens.length,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeAPT = searchParams.get("include_apt") !== "false"; // Default true
    const minMarketCap = parseFloat(searchParams.get("min_market_cap") || "0");
    const maxMarketCap = parseFloat(
      searchParams.get("max_market_cap") || "1000000000000",
    );
    const useCache = searchParams.get("no_cache") !== "true"; // Default use cache
    const maxTokens = parseInt(searchParams.get("max_tokens") || "0"); // 0 means no limit
    const offset = parseInt(searchParams.get("offset") || "0"); // For pagination
    const limit = parseInt(searchParams.get("limit") || "0"); // 0 means return all

    // Check cache
    if (useCache && cache && Date.now() - cache.timestamp < CACHE_TTL) {
      apiLogger.info("Returning cached tokens data");
      return NextResponse.json(cache.data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    apiLogger.info("Fetching Aptos tokens market data", {
      includeAPT,
      minMarketCap,
      maxMarketCap,
      maxTokens: maxTokens || "ALL",
    });

    // Calculate market caps for ALL tokens (or limited for testing)
    const {
      tokens,
      totalMarketCap,
      totalMarketCapWithAPT,
      aptMarketCap,
      tokensWithSupply,
      totalTokensAnalyzed,
    } = await calculateMarketCaps(includeAPT, maxTokens);

    // Apply filters
    const filteredTokens = tokens.filter(
      (t) => t.marketCap >= minMarketCap && t.marketCap <= maxMarketCap,
    );

    // Calculate market cap distribution
    const distribution = {
      above1B: filteredTokens.filter((t) => t.marketCap >= 1000000000).length,
      from100MTo1B: filteredTokens.filter(
        (t) => t.marketCap >= 100000000 && t.marketCap < 1000000000,
      ).length,
      from10MTo100M: filteredTokens.filter(
        (t) => t.marketCap >= 10000000 && t.marketCap < 100000000,
      ).length,
      from1MTo10M: filteredTokens.filter(
        (t) => t.marketCap >= 1000000 && t.marketCap < 10000000,
      ).length,
      from100KTo1M: filteredTokens.filter(
        (t) => t.marketCap >= 100000 && t.marketCap < 1000000,
      ).length,
      below100K: filteredTokens.filter((t) => t.marketCap < 100000).length,
    };

    // Calculate statistics
    const avgMarketCap =
      filteredTokens.length > 0
        ? filteredTokens.reduce((sum, t) => sum + t.marketCap, 0) /
          filteredTokens.length
        : 0;

    const medianMarketCap =
      filteredTokens.length > 0
        ? filteredTokens[Math.floor(filteredTokens.length / 2)]?.marketCap || 0
        : 0;

    // Find key tokens
    const keyTokens = {
      stablecoins: filteredTokens.filter((t) =>
        ["USDC", "USDT", "USDt", "USDA", "DAI", "BUSD"].includes(t.symbol),
      ),
      bitcoin: filteredTokens.filter(
        (t) =>
          t.symbol.includes("BTC") ||
          t.symbol.includes("WBTC") ||
          t.symbol === "aBTC",
      ),
      defi: filteredTokens.filter((t) =>
        ["AMI", "RION", "THL", "ECHO", "LSD", "CELL"].includes(t.symbol),
      ),
      liquid_staking: filteredTokens.filter(
        (t) =>
          t.symbol.includes("APT") &&
          (t.symbol.includes("st") || t.symbol.includes("am")),
      ),
    };

    const executionTime = Date.now() - startTime;

    // Apply pagination to tokens if requested
    let paginatedTokens = filteredTokens;
    if (limit > 0) {
      paginatedTokens = filteredTokens.slice(offset, offset + limit);
      apiLogger.info(
        `Returning paginated tokens: offset=${offset}, limit=${limit}, returned=${paginatedTokens.length}`,
      );
    }

    const responseData = {
      success: true,
      data: {
        summary: {
          total_market_cap_non_apt: totalMarketCap,
          total_market_cap_with_apt: totalMarketCapWithAPT,
          apt_market_cap: aptMarketCap,
          tokens_with_supply: tokensWithSupply,
          tokens_analyzed: totalTokensAnalyzed,
          tokens_returned: paginatedTokens.length,
          total_tokens: filteredTokens.length, // Total available tokens
          average_market_cap: avgMarketCap,
          median_market_cap: medianMarketCap,
          execution_time_ms: executionTime,
          timestamp: new Date().toISOString(),
        },
        distribution,
        categories: {
          stablecoins: {
            count: keyTokens.stablecoins.length,
            total_market_cap: keyTokens.stablecoins.reduce(
              (sum, t) => sum + t.marketCap,
              0,
            ),
            tokens: keyTokens.stablecoins.slice(0, 5),
          },
          bitcoin: {
            count: keyTokens.bitcoin.length,
            total_market_cap: keyTokens.bitcoin.reduce(
              (sum, t) => sum + t.marketCap,
              0,
            ),
            tokens: keyTokens.bitcoin.slice(0, 5),
          },
          defi: {
            count: keyTokens.defi.length,
            total_market_cap: keyTokens.defi.reduce(
              (sum, t) => sum + t.marketCap,
              0,
            ),
            tokens: keyTokens.defi.slice(0, 10),
          },
          liquid_staking: {
            count: keyTokens.liquid_staking.length,
            total_market_cap: keyTokens.liquid_staking.reduce(
              (sum, t) => sum + t.marketCap,
              0,
            ),
            tokens: keyTokens.liquid_staking.slice(0, 5),
          },
        },
        tokens: paginatedTokens, // Return paginated tokens
        hasMore: offset + limit < filteredTokens.length,
        nextOffset: offset + limit,
      },
    };

    // Update cache
    cache = {
      data: responseData,
      timestamp: Date.now(),
    };

    apiLogger.info("Tokens market data fetched successfully", {
      tokensReturned: filteredTokens.length,
      totalMarketCap,
      executionTimeMs: executionTime,
    });

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    apiLogger.error("Failed to fetch tokens data", {
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: executionTime,
    });

    return createErrorResponse(
      "Failed to fetch tokens market data",
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
}
